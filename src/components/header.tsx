"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { formatBytes } from "@/lib/api";
import { useDashboardStore } from "@/lib/dashboard-store";
import { useVisibilityPoll } from "@/lib/use-visibility-poll";

export function Header() {
  const pathname = usePathname();
  const isDashboard = pathname === "/";
  const isEvents = pathname.startsWith("/events");

  const data = useDashboardStore((s) => s.data);
  const loading = useDashboardStore((s) => s.loading);
  const lastUpdated = useDashboardStore((s) => s.lastUpdated);
  const fetchData = useDashboardStore((s) => s.fetchData);

  useVisibilityPoll(fetchData, 30000);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-[1152px] items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center rounded-md p-1" style={{ backgroundColor: "var(--accent-bg)" }}>
            <pre className="font-mono text-[4.5px] leading-[4px] text-[var(--text-primary)]" style={{ margin: 0 }}>
{`     .oo
    .P 8
   .P  8 oPYo. oPYo.
  oPooo8 8  \`' 8  \`'
 .P    8 8     8
.P     8 8     8
..:::::....::::..::::
:::::::::::::::::::::
:::::::::::::::::::::`}
            </pre>
          </div>
          <h1 className="text-base font-semibold">*arr Dashboard</h1>
          <nav className="ml-4 flex items-center gap-1">
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>/</span>
            <Link
              href="/"
              className="rounded px-2 py-1 text-xs font-medium transition-all"
              style={{
                color: isDashboard ? "var(--accent)" : "var(--text-muted)",
                backgroundColor: isDashboard ? "var(--accent-bg)" : "transparent",
              }}
              onMouseEnter={(e) => { if (!isDashboard) e.currentTarget.style.backgroundColor = "var(--surface-hover)"; }}
              onMouseLeave={(e) => { if (!isDashboard) e.currentTarget.style.backgroundColor = "transparent"; }}
            >Dashboard</Link>
            <Link
              href="/events"
              className="rounded px-2 py-1 text-xs font-medium transition-all"
              style={{
                color: isEvents ? "var(--accent)" : "var(--text-muted)",
                backgroundColor: isEvents ? "var(--accent-bg)" : "transparent",
              }}
              onMouseEnter={(e) => { if (!isEvents) e.currentTarget.style.backgroundColor = "var(--surface-hover)"; }}
              onMouseLeave={(e) => { if (!isEvents) e.currentTarget.style.backgroundColor = "transparent"; }}
            >Events</Link>
          </nav>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 lg:gap-6">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className={`status-dot ${data?.healthAlerts === 0 ? "healthy" : "warning"}`} />
            <span className="text-xs text-[var(--text-muted)] hidden sm:inline">Queue</span>
            <span className="metric-value text-sm font-medium">{loading ? "—" : (data?.totalQueue ?? 0)}</span>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <span className="status-dot healthy" />
            <span className="text-xs text-[var(--text-muted)]">Downloading</span>
            <span className="metric-value text-sm font-medium">{loading ? "—" : (data?.activeDownloads ?? 0)}</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            {(data?.healthAlerts ?? 0) > 0 && <span className="status-dot warning" />}
            <span className="text-xs text-[var(--text-muted)] hidden sm:inline">Alerts</span>
            <span className={`metric-value text-sm font-medium ${(data?.healthAlerts ?? 0) > 0 ? "text-[var(--error)]" : ""}`}>
              {loading ? "—" : (data?.healthAlerts ?? 0)}
            </span>
          </div>
          <div className="hidden lg:block h-5 w-px bg-[var(--border)]" />
          <div className="hidden lg:flex items-center gap-2">
            <span className="text-xs text-[var(--text-muted)]">Disk</span>
            <span className="metric-value text-sm font-medium">
              {loading ? "—" : !data?.totalDiskSize ? "—" : `${formatBytes(data.totalDiskUsed)} / ${formatBytes(data.totalDiskSize)}`}
            </span>
          </div>
          <div className="hidden xl:flex items-center gap-2">
            <span className="text-xs text-[var(--text-muted)]">Updated {lastUpdated?.toLocaleTimeString() ?? "—"}</span>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
