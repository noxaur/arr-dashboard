import { mockQueue, mockHealth, mockActivity } from "@/lib/mock-data";
import { serviceOrder } from "@/lib/services";

const totalQueue = mockQueue.length;
const activeDownloads = mockQueue.filter((q) => q.status === "downloading").length;
const healthAlerts = Object.values(mockHealth).filter(
  (h) => h.status === "warning" || h.status === "error"
).length;

export function TopBar() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md" style={{ backgroundColor: "var(--lime)" }}>
            <span className="text-sm font-semibold" style={{ color: "var(--primary)" }}>*arr</span>
          </div>
          <h1 className="text-base font-semibold text-text-primary">
            Ecosystem Dashboard
          </h1>
        </div>

        <nav className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <MetricPill
              label="Queue"
              value={totalQueue.toString()}
              accent={activeDownloads > 0}
            />
            <MetricPill
              label="Downloading"
              value={activeDownloads.toString()}
              accent={activeDownloads > 0}
            />
            <MetricPill
              label="Alerts"
              value={healthAlerts.toString()}
              variant={healthAlerts > 0 ? "warning" : "default"}
            />
          </div>

          <div className="h-5 w-px bg-[var(--border)]" />

          <span className="text-xs text-text-muted">
            {serviceOrder.length} services
          </span>
        </nav>
      </div>
    </header>
  );
}

function MetricPill({
  label,
  value,
  variant = "default",
  accent = false,
}: {
  label: string;
  value: string;
  variant?: "default" | "warning";
  accent?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      {accent && <span className="status-dot healthy" />}
      {variant === "warning" && healthAlerts > 0 && (
        <span className="status-dot warning" />
      )}
      <span className="text-xs text-text-muted">{label}</span>
      <span className="metric-value text-sm font-medium text-text-primary">
        {value}
      </span>
    </div>
  );
}
