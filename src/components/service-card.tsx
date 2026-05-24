"use client";
import Link from "next/link";
import { ServiceActions } from "@/components/service-actions";
import { Tooltip } from "@/components/tooltip";
import { services as serviceConfig } from "@/lib/services";
import {
  RadarrIcon,
  SonarrIcon,
  ProwlarrIcon,
  BazarrIcon,
  JellyseerrIcon,
} from "@/components/service-icons";
import type { DashboardServiceData } from "@/lib/types";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  radarr: RadarrIcon,
  sonarr: SonarrIcon,
  prowlarr: ProwlarrIcon,
  bazarr: BazarrIcon,
  jellyseerr: JellyseerrIcon,
};

const healthColorMap: Record<string, string> = {
  healthy: "oklch(72% 0.16 145)",
  warning: "oklch(78% 0.16 85)",
  error: "oklch(62% 0.22 25)",
  offline: "oklch(48% 0.008 175)",
};

export function ServiceCard({ data, loading }: { data: DashboardServiceData; loading: boolean }) {
  const service = serviceConfig[data.id];
  const health = data.health;
  const queue = data.queue;
  const disk = data.disk;
  const healthColor = health ? (healthColorMap[health.status] || healthColorMap.offline) : healthColorMap.offline;
  const ServiceIcon = iconMap[data.id];

  return (
    <article className="card flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between">
        <Link href={`/${data.id}`} className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md" style={{ backgroundColor: `${service.color.slice(0, -1)} / 0.18)` }}>
            {ServiceIcon && <ServiceIcon className="h-5 w-5" />}
          </div>
          <div>
            <h3 className="text-sm font-medium text-text-primary">{service.name}</h3>
            <p className="text-xs text-text-muted">{service.description}</p>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <Tooltip content={`Status: ${health?.status ?? "unknown"}`}>
            <span className="status-dot" style={{ backgroundColor: healthColor, boxShadow: `0 0 6px ${healthColor}40` }} />
          </Tooltip>
          <span className="text-xs text-text-muted">{loading ? "—" : `${health?.responseTime ?? 0}ms`}</span>
        </div>
      </div>

      {health?.message && health.message !== "All systems operational" ? (
        <div className="rounded-md border border-[var(--warning)]/20 bg-[var(--warning)]/5 px-3 py-2">
          <p className="text-xs text-[var(--warning)]">{health.message}</p>
        </div>
      ) : null}

      <div className="flex items-center gap-4">
        {queue.length > 0 && (
          <Tooltip content="Items in queue">
            <div className="flex items-baseline gap-1.5">
              <span className="metric-value text-lg font-semibold text-text-primary">{queue.length}</span>
              <span className="text-xs text-text-muted">in queue</span>
            </div>
          </Tooltip>
        )}
        {data.id !== "radarr" && data.id !== "sonarr" && disk?.total !== "N/A" && disk?.percent > 0 && (
          <div className="flex flex-1 items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--surface-hover)]">
              <div className="h-full rounded-full transition-all duration-300" style={{ width: `${disk.percent}%`, backgroundColor: disk!.percent > 80 ? "oklch(62% 0.22 25)" : disk!.percent > 60 ? "oklch(78% 0.16 85)" : "oklch(72% 0.16 145)" }} />
            </div>
            <span className="text-xs text-text-muted">{disk.used}</span>
          </div>
        )}
      </div>

      <ServiceActions serviceId={data.id} hasQueue={queue.length > 0} />

      <div className="flex items-center justify-between border-t border-[var(--border)] pt-3">
        <span className="text-xs text-text-muted">
          {data.activity?.length ? `${data.activity.length} recent events` : "No recent activity"}
        </span>
        <Link href={`/${data.id}`} className="btn-ghost" aria-label={`Open ${service.name} settings`}>
          Open Settings
        </Link>
      </div>
    </article>
  );
}
