import { serviceOrder, services } from "@/lib/services";
import { checkHealth, getQueue, getActivity, getDiskSpace, getSystemInfo } from "@/lib/api";
import { getJellyfinSystemInfo, getJellyfinSessions } from "@/lib/jellyfin";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { ServiceActions } from "@/components/service-actions";
import { RadarrIcon, SonarrIcon, ProwlarrIcon, BazarrIcon, JellyseerrIcon, JellyfinIcon } from "@/components/service-icons";

const serviceIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  radarr: RadarrIcon,
  sonarr: SonarrIcon,
  prowlarr: ProwlarrIcon,
  bazarr: BazarrIcon,
  jellyseerr: JellyseerrIcon,
  jellyfin: JellyfinIcon,
};

export const revalidate = 30;

function formatTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(iso).toLocaleDateString();
}

const typeIcons: Record<string, string> = {
  download: "↓",
  import: "✓",
  search: "⌕",
  refresh: "↻",
  error: "!",
  request: "+",
};

export default async function DashboardPage() {
  const healthResults = await Promise.allSettled(
    serviceOrder.map((id) => checkHealth(id))
  );
  const queueResults = await Promise.allSettled(
    serviceOrder.map((id) => getQueue(id))
  );
  const diskResults = await Promise.allSettled(
    serviceOrder.map((id) => getDiskSpace(id))
  );
  const activityResults = await Promise.allSettled(
    serviceOrder.map((id) => getActivity(id))
  );
  const systemResults = await Promise.allSettled(
    serviceOrder.map((id) => getSystemInfo(id))
  );

  const jellyfinInfo = await getJellyfinSystemInfo();
  const activeStreams = await getJellyfinSessions();

  const healthMap: Record<string, any> = {};
  const queueMap: Record<string, any[]> = {};
  const diskMap: Record<string, any> = {};
  const activityMap: Record<string, any[]> = {};
  const systemMap: Record<string, any> = {};

  serviceOrder.forEach((id, i) => {
    healthMap[id] = healthResults[i].status === "fulfilled" ? healthResults[i].value : { status: "offline", message: "Failed to connect", version: "unknown", responseTime: 0 };
    queueMap[id] = queueResults[i].status === "fulfilled" ? queueResults[i].value : [];
    diskMap[id] = diskResults[i].status === "fulfilled" ? diskResults[i].value : { used: "0 MB", total: "N/A", percent: 0 };
    activityMap[id] = activityResults[i].status === "fulfilled" ? activityResults[i].value : [];
    systemMap[id] = systemResults[i].status === "fulfilled" ? systemResults[i].value : { os: "unknown", docker: false, uptime: "N/A" };
  });

  const totalQueue = Object.values(queueMap).flat().length;
  const activeDownloads = Object.values(queueMap).flat().filter((q: any) => q.status === "downloading").length;
  const healthAlerts = Object.values(healthMap).filter((h: any) => h.status === "warning" || h.status === "error").length;
  const totalDiskUsed = Object.values(diskMap).reduce((acc: number, d: any) => {
    return acc + (d.usedBytes || 0);
  }, 0);

  const allActivity = Object.entries(activityMap)
    .flatMap(([service, events]) => events.map((e: any) => ({ ...e, service })))
    .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 15);

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-[1152px] items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-bg)]">
              <span className="text-sm font-semibold" style={{ color: "var(--accent)" }}>⬡</span>
            </div>
            <h1 className="text-base font-semibold">
              *arr Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="status-dot healthy" />
              <span className="text-xs text-[var(--text-muted)]">Queue</span>
              <span className="metric-value text-sm font-medium">
                {totalQueue}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="status-dot healthy" />
              <span className="text-xs text-[var(--text-muted)]">Downloading</span>
              <span className="metric-value text-sm font-medium">
                {activeDownloads}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {healthAlerts > 0 && <span className="status-dot warning" />}
              <span className="text-xs text-[var(--text-muted)]">Alerts</span>
              <span
                className={`metric-value text-sm font-medium ${healthAlerts > 0 ? "text-[var(--error)]" : ""}`}
              >
                {healthAlerts}
              </span>
            </div>
            <div className="h-5 w-px bg-[var(--border)]" />
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--text-muted)]">Disk</span>
              <span className="metric-value text-sm font-medium">
                {totalDiskUsed === 0 ? "—" : totalDiskUsed >= 1099511627776 ? `${(totalDiskUsed / 1099511627776).toFixed(2)} TB` : `${(totalDiskUsed / 1073741824).toFixed(1)} GB`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--text-muted)]">
                Updated {new Date().toLocaleTimeString()}
              </span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1152px] px-6 py-8">
        {/* Section header */}
        <div className="mb-8">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
            System Overview
          </p>
          <h2 className="mt-1 text-xl font-semibold">
            Services
          </h2>
        </div>

        {/* Service cards grid */}
        <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {jellyfinInfo && (
            <article className="card p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent-bg)]">
                    <JellyfinIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Host System</h3>
                    <p className="text-xs text-[var(--text-muted)]">{jellyfinInfo.serverName}</p>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--text-muted)]">
                <span className="font-mono text-[11px]">v{jellyfinInfo.version}</span>
                <span>{jellyfinInfo.os}</span>
                <span>{jellyfinInfo.architecture}</span>
                {activeStreams > 0 && (
                  <span className="rounded-md bg-[var(--success-bg)] px-1.5 py-0.5 text-[10px] font-medium" style={{ color: "var(--success)" }}>
                    {activeStreams} stream{activeStreams > 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </article>
          )}

          {serviceOrder.map((id) => {
            const service = services[id];
            const health = healthMap[id];
            const queue = queueMap[id] || [];
            const disk = diskMap[id];
            const activity = activityMap[id] || [];

            if (!service) return null;
            const statusKey = health.status as "healthy" | "warning" | "error" | "offline";
            const healthColor = {
              healthy: "var(--success)",
              warning: "var(--warning)",
              error: "var(--error)",
              offline: "var(--text-muted)",
            }[statusKey];

            return (
              <article
                key={id}
                className="card flex flex-col gap-3 p-5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-lg"
                      style={{
                        backgroundColor: `${service.color}14`,
                        color: service.color,
                        border: `1px solid ${service.color}22`,
                      }}
                    >
                      {(() => {
                        const IconComponent = serviceIconMap[id];
                        return IconComponent ? <IconComponent className="h-5 w-5" /> : <span className="text-sm font-semibold font-mono">{service.icon}</span>;
                      })()}
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">
                        {service.name}
                      </h3>
                      <p className="text-xs text-[var(--text-muted)]">
                        {service.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="status-dot"
                      style={{
                        backgroundColor: healthColor,
                        boxShadow: `0 0 6px ${healthColor}`,
                      }}
                    />
                    <span className="text-xs text-[var(--text-muted)]">
                      {health.responseTime}ms
                    </span>
                  </div>
                </div>

                {health.message !== "All systems operational" && health.status !== "healthy" && (
                  <div className="rounded-lg border border-[var(--warning-bg)] bg-[var(--warning-bg)] px-3 py-2">
                    <p className="text-xs text-[var(--warning)]">
                      {health.message}
                    </p>
                  </div>
                )}

                {health.status === "offline" && (
                  <div className="rounded-lg border border-[var(--error-bg)] bg-[var(--error-bg)] px-3 py-2">
                    <p className="text-xs text-[var(--error)]">
                      {health.message}
                    </p>
                  </div>
                )}

                {/* System info row */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--text-muted)]">
                  {health.version !== "unknown" && (
                    <span className="font-mono text-[11px]">v{health.version}</span>
                  )}
                  {systemMap[id].os !== "unknown" && (
                    <span>{systemMap[id].os}</span>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  {queue.length > 0 && (
                    <div className="flex items-baseline gap-1.5">
                      <span className="metric-value text-lg font-semibold">
                        {queue.length}
                      </span>
                      <span className="text-xs text-[var(--text-muted)]">in queue</span>
                    </div>
                  )}
                  {disk.total !== "N/A" && disk.percent > 0 ? (
                    <div className="flex flex-1 items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--bg-elevated)]">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${disk.percent}%`,
                            backgroundColor:
                              disk.percent > 80
                                ? "var(--error)"
                                : disk.percent > 60
                                  ? "var(--warning)"
                                  : "var(--success)",
                          }}
                        />
                      </div>
                      <span className="whitespace-nowrap text-xs text-[var(--text-muted)]">
                        {disk.percent}% · {disk.used}
                      </span>
                    </div>
                  ) : disk.total === "N/A" ? (
                    <span className="text-xs text-[var(--text-muted)]">—</span>
                  ) : null}
                </div>

                <ServiceActions serviceId={id} hasQueue={queue.length > 0} />

                <div className="flex items-center justify-between border-t border-[var(--border)] pt-3">
                  <span className="text-xs text-[var(--text-muted)]">
                    {activity.length > 0
                      ? `${activity.length} recent events`
                      : "No recent activity"}
                  </span>
                  <Link href={`/${id}`} className="btn-ghost text-xs">
                    Open ↗
                  </Link>
                </div>
              </article>
            );
          })}
        </div>

        {/* Activity feed */}
        <section className="card flex flex-col">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3">
            <h2 className="text-sm font-medium">
              Activity Feed
            </h2>
            <span className="text-xs text-[var(--text-muted)]">
              {allActivity.length} events
            </span>
          </div>
          {allActivity.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-[var(--text-muted)]">
              No activity to show
            </div>
          ) : (
            <ul className="divide-y divide-[var(--border)]" role="list">
              {allActivity.map((event: any, index: number) => {
                const service = services[event.service];
                const icon = typeIcons[event.type] || "·";
                const colorMap: Record<string, string> = {
                  download: "var(--success)",
                  import: "var(--success)",
                  search: "var(--accent)",
                  refresh: "var(--text-muted)",
                  error: "var(--error)",
                  request: "oklch(62% 0.14 340)",
                };
                const color = colorMap[event.type] || "var(--text-muted)";
                return (
                  <li
                    key={`${event.service}-${event.timestamp}-${event.title}-${event.message}-${index}`}
                    className="flex items-start gap-3 px-5 py-3"
                  >
                    <div
                      className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-xs font-medium"
                      style={{
                        backgroundColor: `${typeof color === 'string' && color.startsWith('var') ? 'rgba(100,160,220,0.12)' : color + '15'}`,
                        color,
                      }}
                    >
                      {icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-medium" style={{ color: service?.color }}>
                          {service?.name}
                        </span>
                        <span className="text-xs text-[var(--text-muted)]">
                          {event.title}
                        </span>
                      </div>
                      <p className="truncate text-xs text-[var(--text-muted)]">
                        {event.message}
                      </p>
                    </div>
                    <time
                      className="flex-shrink-0 text-xs text-[var(--text-muted)]"
                      dateTime={event.timestamp}
                    >
                      {formatTime(event.timestamp)}
                    </time>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
