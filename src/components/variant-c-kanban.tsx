import {
  mockQueue,
  mockActivity,
  mockServiceStatuses,
  mockHealth,
} from "@/lib/mock-data";
import { services } from "@/lib/services";
import { ThemeToggle } from "@/components/theme-toggle";

const statusColors: Record<string, string> = {
  healthy: "var(--success)",
  warning: "var(--warning)",
  error: "var(--error)",
  offline: "var(--text-muted)",
};

const columns = [
  { key: "queued", label: "Queued", color: "var(--text-muted)" },
  {
    key: "downloading",
    label: "Downloading",
    color: "var(--success)",
  },
  { key: "importing", label: "Importing", color: "var(--accent)" },
  { key: "failed", label: "Failed", color: "var(--error)" },
];

export function VariantC() {
  const totalQueue = mockQueue.length;
  const activeDownloads = mockQueue.filter(
    (q) => q.status === "downloading",
  ).length;
  const healthAlerts = Object.values(mockHealth).filter(
    (h) => h.status === "warning" || h.status === "error",
  ).length;

  const recentActivity = [...mockActivity]
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )
    .slice(0, 8);

  function formatTime(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return new Date(iso).toLocaleDateString();
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Top bar */}
      <header className="flex h-14 flex-shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--bg)]/90 px-6 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-bg)]">
            <span className="text-sm font-semibold" style={{ color: "var(--accent)" }}>⬡</span>
          </div>
          <h1 className="text-base font-semibold">
            Download Board
          </h1>
        </div>
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <span className="status-dot healthy" />
            <span className="text-xs text-[var(--text-muted)]">Queue</span>
            <span className="metric-value text-sm font-medium">
              {totalQueue}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="status-dot healthy" />
            <span className="text-xs text-[var(--text-muted)]">Active</span>
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
          <ThemeToggle />
        </div>
      </header>

      {/* Board */}
      <div className="flex flex-1 overflow-x-auto p-4 gap-4">
        {columns.map((col) => {
          const items = mockQueue.filter((q) => q.status === col.key);
          return (
            <div
              key={col.key}
              className="flex w-72 flex-shrink-0 flex-col"
            >
              {/* Column header */}
              <div className="mb-3 flex items-center gap-2 px-1">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: col.color }}
                />
                <h3 className="text-sm font-medium">
                  {col.label}
                </h3>
                <span className="ml-auto rounded-full bg-[var(--bg-elevated)] px-2 py-0.5 text-xs font-medium text-[var(--text-muted)]">
                  {items.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
                {items.length === 0 ? (
                  <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-[var(--border)] text-xs text-[var(--text-muted)]">
                    No items
                  </div>
                ) : (
                  items.map((item) => {
                    const svc = services[item.service];
                    const svcStatus = mockServiceStatuses[item.service];
                    return (
                      <div
                        key={item.id}
                        className="card p-3"
                        style={{
                          borderTop: `2px solid ${svc.color}`,
                        }}
                      >
                        {/* Service badge */}
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="flex h-5 w-5 items-center justify-center rounded-lg font-mono text-xs font-semibold"
                              style={{
                                backgroundColor: `${svc.color}14`,
                                color: svc.color,
                              }}
                            >
                              {svc.icon}
                            </div>
                            <span className="text-xs font-medium" style={{ color: svc.color }}>
                              {svc.name}
                            </span>
                          </div>
                          <span
                            className="status-dot"
                            style={{
                              backgroundColor:
                                statusColors[svcStatus.health.status],
                            }}
                          />
                        </div>

                        {/* Title */}
                        <p className="mb-2 text-sm font-medium">
                          {item.title}
                        </p>

                        {/* Progress */}
                        <div className="mb-2">
                          <div className="mb-1 flex items-center justify-between text-xs">
                            <span className="text-[var(--text-muted)]">
                              {item.size}
                            </span>
                            <span className="font-medium metric-value">
                              {item.progress}%
                            </span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-elevated)]">
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{ width: `${item.progress}%`, backgroundColor: svc.color }}
                            />
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                          <span>ETA: {item.eta}</span>
                          <span>{item.sizeLeft} left</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}

        {/* Activity sidebar */}
        <div className="ml-4 flex w-72 flex-shrink-0 flex-col">
          <div className="mb-3 px-1">
            <h3 className="text-sm font-medium">
              Recent Events
            </h3>
          </div>
          <div className="flex flex-1 flex-col gap-1 overflow-y-auto">
            {recentActivity.map((event) => {
              const svc = services[event.service];
              return (
                <div
                  key={event.id}
                  className="card p-3"
                >
                  <div className="mb-1 flex items-center gap-2">
                    <div
                      className="flex h-5 w-5 items-center justify-center rounded-lg font-mono text-xs font-semibold"
                      style={{
                        backgroundColor: `${svc.color}14`,
                        color: svc.color,
                      }}
                    >
                      {svc.icon}
                    </div>
                    <span className="text-xs font-medium" style={{ color: svc.color }}>
                      {svc.name}
                    </span>
                    <span className="ml-auto text-xs text-[var(--text-muted)]">
                      {formatTime(event.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs">{event.title}</p>
                  <p className="truncate text-xs text-[var(--text-muted)]">
                    {event.message}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
