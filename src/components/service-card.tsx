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
  healthy: "var(--success)",
  warning: "var(--warning)",
  error: "var(--error)",
  offline: "oklch(48% 0.008 175)",
};

export function ServiceCard({ data, loading }: { data: DashboardServiceData; loading: boolean }) {
  const service = serviceConfig[data.id];
  const health = data.health;
  const queue = data.queue;
  const disk = data.disk;
  const healthStatus = health?.status ?? "offline";
  const healthColor = healthColorMap[healthStatus] || healthColorMap.offline;
  const ServiceIcon = iconMap[data.id];

  return (
    <article className="card flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between">
        <Link href={`/${data.id}`} className="flex items-center gap-3 rounded-sm focus-visible:outline-2 focus-visible:outline-[var(--ring)] focus-visible:outline-offset-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md">
            {ServiceIcon && <ServiceIcon className="h-5 w-5" />}
          </div>
          <div>
            <h3 className="text-sm font-medium text-text-primary">{service.name}</h3>
            <p className="text-xs text-text-muted">{service.description}</p>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <Tooltip content={`Status: ${healthStatus}`}>
            <span className={`status-dot ${healthStatus}`} style={{ backgroundColor: healthColor }} />
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
              <div className="h-full rounded-full transition-all duration-300" style={{ width: `${disk.percent}%`, backgroundColor: disk!.percent > 80 ? "var(--error)" : disk!.percent > 60 ? "var(--warning)" : "var(--success)" }} />
            </div>
            <span className="text-xs text-text-muted">{disk.used}</span>
          </div>
        )}
      </div>

      <ServiceActions serviceId={data.id} hasQueue={queue.length > 0} />

      <div className="flex items-center justify-between border-t border-[var(--border)] pt-3 min-h-[2.5rem]">
        {data.activity?.length ? (
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-1.5">
              {(["download", "import", "search", "refresh", "error", "request"] as const).map((t) => {
                const count = data.activity.filter((e) => e.type === t).length;
                if (count === 0) return null;
                const tc: Record<string, string> = {
                  download: "var(--success)",
                  import: "var(--success)",
                  search: "var(--accent)",
                  refresh: "var(--text-muted)",
                  error: "var(--error)",
                  request: "var(--accent)",
                };
                const tl: Record<string, string> = {
                  download: "\u2193", import: "\u2713", search: "\u2295", refresh: "\u21BB", error: "!", request: "+",
                };
                const label: Record<string, string> = {
                  download: "downloads", import: "imports", search: "searches", refresh: "refreshes", error: "errors", request: "requests",
                };
                return (
                  <Tooltip key={t} content={`${count} ${label[t]}`}>
                    <span className="inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[10px] font-medium" style={{ backgroundColor: "var(--surface-hover)", color: tc[t] }}>
                      {tl[t]} {count}
                    </span>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        ) : (
          <span className="text-xs text-text-muted">No recent events</span>
        )}
        <Link href={`/${data.id}`} className="btn-ghost text-xs flex-shrink-0" aria-label={`Open ${service.name} settings`}>
          Settings
        </Link>
      </div>
    </article>
  );
}
