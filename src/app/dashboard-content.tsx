"use client";
import { useEffect, useState } from "react";
import { services, serviceOrder } from "@/lib/services";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { ServiceActions } from "@/components/service-actions";
import {
  RadarrIcon,
  SonarrIcon,
  ProwlarrIcon,
  BazarrIcon,
  JellyseerrIcon,
  JellyfinIcon,
} from "@/components/service-icons";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  radarr: RadarrIcon,
  sonarr: SonarrIcon,
  prowlarr: ProwlarrIcon,
  bazarr: BazarrIcon,
  jellyseerr: JellyseerrIcon,
};

const typeIcons: Record<string, string> = {
  download: "↓",
  import: "✓",
  search: "⌕",
  refresh: "↻",
  error: "!",
  request: "+",
};

function formatTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(iso).toLocaleDateString();
}

export function DashboardContent() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/dashboard", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setError(null);
        setLastUpdated(new Date());
      } else {
        setError(`Failed to load: ${res.status}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") fetchData();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatDisk = (bytes: number) => {
    if (bytes === 0) return "—";
    if (bytes >= 1099511627776) return `${(bytes / 1099511627776).toFixed(2)} TB`;
    return `${(bytes / 1073741824).toFixed(1)} GB`;
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-[1152px] items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md" style={{ backgroundColor: "var(--lime)" }}>
              <JellyfinIcon className="h-5 w-5" />
            </div>
            <h1 className="text-base font-semibold">*arr Dashboard</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 lg:gap-6">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className={`status-dot ${data?.healthAlerts === 0 ? "healthy" : "warning"}`} />
              <span className="text-xs text-[var(--text-muted)] hidden sm:inline">Queue</span>
              <span className="metric-value text-sm font-medium">{loading ? "—" : data?.totalQueue ?? 0}</span>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <span className="status-dot healthy" />
              <span className="text-xs text-[var(--text-muted)]">Downloading</span>
              <span className="metric-value text-sm font-medium">{loading ? "—" : data?.activeDownloads ?? 0}</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              {(data?.healthAlerts ?? 0) > 0 && <span className="status-dot warning" />}
              <span className="text-xs text-[var(--text-muted)] hidden sm:inline">Alerts</span>
              <span className={`metric-value text-sm font-medium ${(data?.healthAlerts ?? 0) > 0 ? "text-[var(--error)]" : ""}`}>
                {loading ? "—" : data?.healthAlerts ?? 0}
              </span>
            </div>
            <div className="hidden lg:block h-5 w-px bg-[var(--border)]" />
            <div className="hidden lg:flex items-center gap-2">
              <span className="text-xs text-[var(--text-muted)]">Disk</span>
              <span className="metric-value text-sm font-medium">{loading ? "—" : formatDisk(data?.totalDiskUsed ?? 0)}</span>
            </div>
            <div className="hidden xl:flex items-center gap-2">
              <span className="text-xs text-[var(--text-muted)]">
                Updated {lastUpdated?.toLocaleTimeString() ?? "—"}
              </span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1152px] px-6 py-8">
        {error && (
          <div className="mb-6 rounded-md border border-[var(--error)]/20 bg-[var(--error)]/5 px-4 py-3">
            <p className="text-sm text-[var(--error)]">{error}</p>
            <button onClick={fetchData} className="mt-2 text-sm underline">Retry</button>
          </div>
        )}

        <section className="mb-8">
          <h2 className="eyebrow mb-4">Host System</h2>
          <article className="card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md" style={{ backgroundColor: "oklch(62% 0.14 340)18" }}>
                <JellyfinIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-text-primary">{data?.jellyfin?.serverName || "Jellyfin"}</h3>
                <p className="text-xs text-text-muted">{data?.jellyfin?.os || "Loading..."} · {data?.jellyfin?.architecture || ""}</p>
              </div>
              <div className="ml-auto flex items-center gap-4">
                <div className="flex items-baseline gap-1.5">
                  <span className="metric-value text-lg font-semibold text-text-primary">{data?.activeStreams ?? 0}</span>
                  <span className="text-xs text-text-muted">active streams</span>
                </div>
                <span className="text-xs text-text-muted">v{data?.jellyfin?.version || "—"}</span>
              </div>
            </div>
          </article>
        </section>

        <section className="mb-8">
          <h2 className="eyebrow mb-4">Services</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {serviceOrder.map((id) => {
              const service = services[id];
              const svcData = data?.services?.find((s: any) => s.id === id);
              const health = svcData?.health;
              const queue = svcData?.queue || [];
              const disk = svcData?.disk;
              const healthColorMap: Record<string, string> = {
                healthy: "oklch(72% 0.16 145)",
                warning: "oklch(78% 0.16 85)",
                error: "oklch(62% 0.22 25)",
                offline: "oklch(48% 0.008 175)",
              };
              const healthColor = health ? (healthColorMap[health.status] || "oklch(48% 0.008 175)") : "oklch(48% 0.008 175)";
              const ServiceIcon = iconMap[id];

              return (
                <article key={id} className="card flex flex-col gap-3 p-4">
                  <div className="flex items-start justify-between">
                    <Link href={`/${id}`} className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md" style={{ backgroundColor: `${service.color}18` }}>
                        {ServiceIcon && <ServiceIcon className="h-5 w-5" />}
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-text-primary">{service.name}</h3>
                        <p className="text-xs text-text-muted">{service.description}</p>
                      </div>
                    </Link>
                    <div className="flex items-center gap-2">
                      <span className="status-dot" style={{ backgroundColor: healthColor, boxShadow: `0 0 6px ${healthColor}40` }} />
                      <span className="text-xs text-text-muted">{loading ? "—" : `${health?.responseTime ?? 0}ms`}</span>
                    </div>
                  </div>

                  {loading ? (
                    <div className="h-6 animate-pulse rounded-md bg-[var(--surface-hover)]" />
                  ) : health?.message && health.message !== "All systems operational" ? (
                    <div className="rounded-md border border-[var(--warning)]/20 bg-[var(--warning)]/5 px-3 py-2">
                      <p className="text-xs text-[var(--warning)]">{health.message}</p>
                    </div>
                  ) : null}

                  <div className="flex items-center gap-4">
                    {queue.length > 0 && (
                      <div className="flex items-baseline gap-1.5">
                        <span className="metric-value text-lg font-semibold text-text-primary">{queue.length}</span>
                        <span className="text-xs text-text-muted">in queue</span>
                      </div>
                    )}
                    {disk?.total !== "N/A" && disk?.percent > 0 && (
                      <div className="flex flex-1 items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--surface-hover)]">
                          <div className="h-full rounded-full transition-all duration-300" style={{ width: `${disk.percent}%`, backgroundColor: disk.percent > 80 ? "oklch(62% 0.22 25)" : disk.percent > 60 ? "oklch(78% 0.16 85)" : "oklch(72% 0.16 145)" }} />
                        </div>
                        <span className="text-xs text-text-muted">{disk.used}</span>
                      </div>
                    )}
                  </div>

                  <ServiceActions serviceId={id} hasQueue={queue.length > 0} />

                  <div className="flex items-center justify-between border-t border-[var(--border)] pt-3">
                    <span className="text-xs text-text-muted">
                      {svcData?.activity?.length > 0 ? `${svcData.activity.length} recent events` : "No recent activity"}
                    </span>
                    <Link href={`/${id}`} className="btn-ghost" aria-label={`Open ${service.name} settings`}>
                      Open Settings
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="eyebrow mb-4">Recent Activity</h2>
          <div className="card divide-y divide-[var(--border)]">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 px-5 py-3">
                  <div className="h-5 w-5 animate-pulse rounded bg-[var(--surface-hover)]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-24 animate-pulse rounded bg-[var(--surface-hover)]" />
                    <div className="h-3 w-48 animate-pulse rounded bg-[var(--surface-hover)]" />
                  </div>
                </div>
              ))
            ) : data?.allActivity?.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-text-muted">No recent activity</div>
            ) : (
              <ul className="divide-y divide-[var(--border)]" role="list">
                {data?.allActivity?.map((event: any, index: number) => {
                  const service = services[event.service];
                  const icon = typeIcons[event.type] || "·";
                  const colorMap: Record<string, string> = {
                    download: "var(--success)",
                    import: "var(--success)",
                    search: "var(--accent)",
                    refresh: "var(--text-muted)",
                    error: "var(--pink)",
                    request: "var(--accent-soft)",
                  };
                  const color = colorMap[event.type] || "var(--text-muted)";
                  return (
                    <li
                      key={`${event.service}-${event.timestamp}-${event.title}-${event.message}-${index}`}
                      className="flex items-start gap-3 px-5 py-3"
                    >
                      <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-xs font-medium" style={{ backgroundColor: `var(--accent-bg)`, color }}>
                        {icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-medium" style={{ color: service?.color }}>{service?.name}</span>
                          <span className="text-xs text-[var(--text-muted)]">{event.title}</span>
                        </div>
                        {event.message && <p className="mt-0.5 truncate text-xs text-[var(--text-muted)]">{event.message}</p>}
                      </div>
                      <span className="flex-shrink-0 text-xs text-[var(--text-muted)]">{formatTime(event.timestamp)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
