"use client";

import { useState } from "react";
import {
  mockServiceStatuses,
  mockQueue,
  mockActivity,
  mockHealth,
} from "@/lib/mock-data";
import { serviceOrder, services } from "@/lib/services";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

function formatTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(iso).toLocaleDateString();
}

const statusColors: Record<string, string> = {
  healthy: "var(--success)",
  warning: "var(--warning)",
  error: "var(--error)",
  offline: "var(--text-muted)",
};

export function VariantB() {
  const [selected, setSelected] = useState("radarr");
  const status = mockServiceStatuses[selected];
  const service = services[selected];
  const serviceQueue = mockQueue.filter((q) => q.service === selected);
  const serviceActivity = mockActivity
    .filter((a) => a.service === selected)
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

  const totalAlerts = Object.values(mockHealth).filter(
    (h) => h.status === "warning" || h.status === "error",
  ).length;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="flex w-64 flex-shrink-0 flex-col border-r border-[var(--border)] bg-[var(--bg-elevated)]">
        {/* Logo */}
        <div className="flex h-14 items-center gap-3 border-b border-[var(--border)] px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-bg)]">
            <span className="text-sm font-semibold" style={{ color: "var(--accent)" }}>⬡</span>
          </div>
          <span className="text-sm font-semibold">
            Dashboard
          </span>
        </div>

        {/* Service list */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="mb-2 px-2 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
            Services
          </p>
          <ul className="space-y-1">
            {serviceOrder.map((id) => {
              const s = services[id];
              const st = mockServiceStatuses[id];
              const isActive = id === selected;
              return (
                <li key={id}>
                  <button
                    onClick={() => setSelected(id)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                      isActive
                        ? "bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border)]"
                        : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    <div
                      className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg font-mono text-xs font-semibold"
                      style={{
                        backgroundColor: `${s.color}14`,
                        color: s.color,
                      }}
                    >
                      {s.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {s.name}
                      </div>
                      <div className="truncate text-xs text-[var(--text-muted)]">
                        {s.description}
                      </div>
                    </div>
                    <span
                      className="status-dot flex-shrink-0"
                      style={{
                        backgroundColor: statusColors[st.health.status],
                        boxShadow: `0 0 6px ${statusColors[st.health.status]}`,
                      }}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sidebar footer */}
        <div className="border-t border-[var(--border)] px-4 py-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--text-muted)]">Alerts</span>
            <span
              className={`font-medium ${totalAlerts > 0 ? "text-[var(--error)]" : ""}`}
            >
              {totalAlerts}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-[var(--text-muted)]">Total Queue</span>
            <span className="font-medium">
              {mockQueue.length}
            </span>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex min-w-0 flex-1 flex-col overflow-y-auto bg-[var(--bg)]">
        {/* Top bar */}
        <header className="flex h-14 flex-shrink-0 items-center justify-between border-b border-[var(--border)] px-6">
          <div className="flex items-center gap-3">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg font-mono text-sm font-semibold"
              style={{
                backgroundColor: `${service.color}14`,
                color: service.color,
                border: `1px solid ${service.color}22`,
              }}
            >
              {service.icon}
            </div>
            <div>
              <h2 className="text-sm font-semibold">
                {service.name}
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                {service.description}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span
                className="status-dot"
                style={{
                  backgroundColor: statusColors[status.health.status],
                  boxShadow: `0 0 6px ${statusColors[status.health.status]}`,
                }}
              />
              <span className="text-xs text-[var(--text-muted)]">
                {status.health.status}
              </span>
            </div>
            <span className="text-xs text-[var(--text-muted)]">
              v{status.health.version}
            </span>
            <span className="text-xs text-[var(--text-muted)]">
              {status.health.responseTime}ms
            </span>
            <Link href={`/${selected}`} className="btn-ghost">
              Open {service.name}
            </Link>
            <ThemeToggle />
          </div>
        </header>

        {/* Content area */}
        <div className="flex-1 p-6">
          {/* Health message */}
          {status.health.message !== "All systems operational" && (
            <div className="mb-4 rounded-lg border border-[var(--warning-bg)] bg-[var(--warning-bg)] px-4 py-3">
              <p className="text-sm text-[var(--warning)]">
                {status.health.message}
              </p>
            </div>
          )}

          {/* Stats row */}
          <div className="mb-6 grid grid-cols-3 gap-4">
            <div className="card p-5">
              <p className="text-xs text-[var(--text-muted)]">Queue Items</p>
              <p className="mt-1 text-2xl font-semibold metric-value">
                {status.queueCount}
              </p>
            </div>
            <div className="card p-5">
              <p className="text-xs text-[var(--text-muted)]">Disk Used</p>
              <p className="mt-1 text-2xl font-semibold">
                {status.diskSpace.used}
              </p>
              {status.diskSpace.total !== "N/A" && (
                <div className="mt-2">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-elevated)]">
                    <div
                      className="h-full rounded-full"
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
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    of {status.diskSpace.total}
                  </p>
                </div>
              )}
            </div>
            <div className="card p-5">
              <p className="text-xs text-[var(--text-muted)]">Recent Events</p>
              <p className="mt-1 text-2xl font-semibold metric-value">
                {serviceActivity.length}
              </p>
            </div>
          </div>

          {/* Queue section */}
          {serviceQueue.length > 0 && (
            <section className="mb-6">
              <h3 className="mb-3 text-sm font-medium">
                Active Queue
              </h3>
              <div className="card divide-y divide-[var(--border)]">
                {serviceQueue.map((item) => (
                  <div key={item.id} className="px-5 py-3">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {item.title}
                        </p>
                        <p className="text-xs text-[var(--text-muted)]">
                          {item.size} · ETA: {item.eta}
                        </p>
                      </div>
                      <div className="ml-4 flex items-center gap-3">
                        <div className="w-24">
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-elevated)]">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${item.progress}%`, backgroundColor: service.color }}
                            />
                          </div>
                        </div>
                        <span className="w-10 text-right text-xs font-medium metric-value">
                          {item.progress}%
                        </span>
                        <span
                          className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                            item.status === "downloading"
                              ? "bg-[var(--success-bg)] text-[var(--success)]"
                              : item.status === "queued"
                                ? "bg-[var(--bg-elevated)] text-[var(--text-muted)]"
                                : item.status === "importing"
                                  ? "bg-[var(--accent-bg)] text-[var(--accent)]"
                                  : "bg-[var(--error-bg)] text-[var(--error)]"
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Activity section */}
          <section>
            <h3 className="mb-3 text-sm font-medium">
              Recent Activity
            </h3>
            <div className="card divide-y divide-[var(--border)]">
              {serviceActivity.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-[var(--text-muted)]">
                  No recent activity
                </div>
              ) : (
                serviceActivity.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 px-5 py-3"
                  >
                    <div
                      className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-xs font-medium"
                      style={{
                        backgroundColor: `${statusColors[status.health.status]}15`,
                        color: statusColors[status.health.status],
                      }}
                    >
                      {event.type === "download"
                        ? "↓"
                        : event.type === "import"
                          ? "✓"
                          : event.type === "error"
                            ? "!"
                            : event.type === "request"
                              ? "+"
                              : "↻"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        {event.title}
                      </p>
                      <p className="truncate text-xs text-[var(--text-muted)]">
                        {event.message}
                      </p>
                    </div>
                    <time className="flex-shrink-0 text-xs text-[var(--text-muted)]">
                      {formatTime(event.timestamp)}
                    </time>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
