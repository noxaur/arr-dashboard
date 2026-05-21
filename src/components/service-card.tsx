import Link from "next/link";
import { services } from "@/lib/services";
import type { ServiceStatus } from "@/lib/mock-data";
import {
  RadarrIcon,
  SonarrIcon,
  ProwlarrIcon,
  BazarrIcon,
  JellyseerrIcon,
} from "@/components/service-icons";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  radarr: RadarrIcon,
  sonarr: SonarrIcon,
  prowlarr: ProwlarrIcon,
  bazarr: BazarrIcon,
  jellyseerr: JellyseerrIcon,
};

interface ServiceCardProps {
  status: ServiceStatus;
}

export function ServiceCard({ status }: ServiceCardProps) {
  const service = services[status.id];
  if (!service) return null;

  const ServiceIcon = iconMap[status.id];

  const healthColor = {
    healthy: "oklch(72% 0.16 145)",
    warning: "oklch(78% 0.16 85)",
    error: "oklch(62% 0.22 25)",
    offline: "oklch(48% 0.008 175)",
  }[status.health.status];

  return (
    <article className="card flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-md"
            style={{
              backgroundColor: `${service.color}18`,
            }}
          >
            {ServiceIcon && <ServiceIcon className="h-5 w-5" />}
          </div>
          <div>
            <h3 className="text-sm font-medium text-text-primary">
              {service.name}
            </h3>
            <p className="text-xs text-text-muted">{service.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className="status-dot"
            style={{
              backgroundColor: healthColor,
              boxShadow: `0 0 6px ${healthColor}40`,
            }}
          />
          <span className="text-xs text-text-muted">
            {status.health.responseTime}ms
          </span>
        </div>
      </div>

      {status.health.message !== "All systems operational" && (
        <div className="rounded-md border border-[var(--warning)]/20 bg-[var(--warning)]/5 px-3 py-2">
          <p className="text-xs text-[var(--warning)]">{status.health.message}</p>
        </div>
      )}

      <div className="flex items-center gap-4">
        {status.queueCount > 0 && (
          <div className="flex items-baseline gap-1.5">
            <span className="metric-value text-lg font-semibold text-text-primary">
              {status.queueCount}
            </span>
            <span className="text-xs text-text-muted">in queue</span>
          </div>
        )}

        {status.diskSpace.total !== "N/A" && status.diskSpace.percent > 0 && (
          <div className="flex flex-1 items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--surface-hover)]">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${status.diskSpace.percent}%`,
                  backgroundColor:
                    status.diskSpace.percent > 80
                      ? "oklch(62% 0.22 25)"
                      : status.diskSpace.percent > 60
                        ? "oklch(78% 0.16 85)"
                        : "oklch(72% 0.16 145)",
                }}
              />
            </div>
            <span className="text-xs text-text-muted">
              {status.diskSpace.used}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        {status.queueCount > 0 && (
          <button className="btn-ghost" aria-label="Pause queue">
            Pause
          </button>
        )}
        <button className="btn-ghost" aria-label="Refresh monitored">
          Refresh
        </button>
        {(status.id === "radarr" || status.id === "sonarr") && (
          <button className="btn-ghost" aria-label="Search for missing">
            Search
          </button>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-[var(--border)] pt-3">
        <span className="text-xs text-text-muted">
          {status.recentActivity.length > 0
            ? `${status.recentActivity.length} recent events`
            : "No recent activity"}
        </span>
        <Link
          href={`/${status.id}`}
          className="btn-ghost"
          aria-label={`Open ${service.name} settings`}
        >
          Open Settings
        </Link>
      </div>
    </article>
  );
}
