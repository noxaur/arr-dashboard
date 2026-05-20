import {
  mockServiceStatuses,
  mockQueue,
  mockActivity,
  mockHealth,
} from "@/lib/mock-data";
import { serviceOrder, services } from "@/lib/services";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

const totalQueue = mockQueue.length;
const activeDownloads = mockQueue.filter(
  (q) => q.status === "downloading",
).length;
const healthAlerts = Object.values(mockHealth).filter(
  (h) => h.status === "warning" || h.status === "error",
).length;
const totalDiskUsed = Object.values(mockServiceStatuses).reduce(
  (acc, s) => {
    const num = parseFloat(s.diskSpace.used);
    if (s.diskSpace.used.includes("TB")) return acc + num * 1000;
    if (s.diskSpace.used.includes("GB")) return acc + num;
    return acc;
  },
  0,
);

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

export function VariantA() {
  const statuses = serviceOrder.map((id) => mockServiceStatuses[id]).filter(
    Boolean,
  );
  const allActivity = [...mockActivity].sort(
    (a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

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
                {totalDiskUsed > 1000 ? `${(totalDiskUsed / 1000).toFixed(1)} TB` : `${totalDiskUsed.toFixed(0)} GB`}
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
          {statuses.map((status) => {
            const service = services[status.id];
            if (!service) return null;
            const healthColor = {
              healthy: "var(--success)",
              warning: "var(--warning)",
              error: "var(--error)",
              offline: "var(--text-muted)",
            }[status.health.status];

            return (
              <article
                key={status.id}
                className="card flex flex-col gap-3 p-5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-lg font-mono text-sm font-semibold"
                      style={{
                        backgroundColor: `${service.color}14`,
                        color: service.color,
                        border: `1px solid ${service.color}22`,
                      }}
                    >
                      {service.icon}
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
                      {status.health.responseTime}ms
                    </span>
                  </div>
                </div>

                {status.health.message !== "All systems operational" && (
                  <div className="rounded-lg border border-[var(--warning-bg)] bg-[var(--warning-bg)] px-3 py-2">
                    <p className="text-xs text-[var(--warning)]">
                      {status.health.message}
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-4">
                  {status.queueCount > 0 && (
                    <div className="flex items-baseline gap-1.5">
                      <span className="metric-value text-lg font-semibold">
                        {status.queueCount}
                      </span>
                      <span className="text-xs text-[var(--text-muted)]">in queue</span>
                    </div>
                  )}
                  {status.diskSpace.total !== "N/A" &&
                    status.diskSpace.percent > 0 && (
                      <div className="flex flex-1 items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--bg-elevated)]">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${status.diskSpace.percent}%`,
                              backgroundColor:
                                status.diskSpace.percent > 80
                                  ? "var(--error)"
                                  : status.diskSpace.percent > 60
                                    ? "var(--warning)"
                                    : "var(--success)",
                            }}
                          />
                        </div>
                        <span className="text-xs text-[var(--text-muted)]">
                          {status.diskSpace.used}
                        </span>
                      </div>
                    )}
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {status.queueCount > 0 && (
                    <button className="btn-ghost">Pause</button>
                  )}
                  <button className="btn-ghost">Refresh</button>
                  {(status.id === "radarr" || status.id === "sonarr") && (
                    <button className="btn-ghost">Search</button>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-[var(--border)] pt-3">
                  <span className="text-xs text-[var(--text-muted)]">
                    {status.recentActivity.length > 0
                      ? `${status.recentActivity.length} recent events`
                      : "No recent activity"}
                  </span>
                  <Link href={`/${status.id}`} className="btn-ghost">
                    Open Settings
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
          <ul className="divide-y divide-[var(--border)]" role="list">
            {allActivity.slice(0, 10).map((event, index) => {
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
                  key={event.id}
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
        </section>
      </main>
    </div>
  );
}
