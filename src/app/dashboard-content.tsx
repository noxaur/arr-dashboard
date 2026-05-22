"use client";
import { useEffect, useState } from "react";
import { services, serviceOrder } from "@/lib/services";
import { Header } from "@/components/header";
import Link from "next/link";
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
  search: "⊕",
  refresh: "↻",
  error: "!",
  request: "+",
};

function formatTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 0) return "just now";
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
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

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

  const fetchRecentEvents = async () => {
    try {
      const res = await fetch("/api/events?pageSize=3", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setRecentEvents(json.events || []);
      }
    } catch {
    } finally {
      setEventsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchRecentEvents();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchData();
        fetchRecentEvents();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen">
      <Header />

      <main className="mx-auto max-w-[1152px] px-6 py-8">
        {error && (
          <div className="mb-6 rounded-md border border-[var(--error)]/20 bg-[var(--error)]/5 px-4 py-3">
            <p className="text-sm text-[var(--error)]">{error}</p>
            <button onClick={() => { fetchData(); }} className="mt-2 text-sm underline">Retry</button>
          </div>
        )}

        {/* Host System Card */}
        <section className="mb-8">
          <h2 className="eyebrow mb-4">Host System</h2>
          <article className="card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md" style={{ backgroundColor: "oklch(62% 0.14 340 / 0.18)" }}>
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

        {/* Service Cards */}
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
                      <div className="flex h-9 w-9 items-center justify-center rounded-md" style={{ backgroundColor: `${service.color.slice(0, -1)} / 0.18)` }}>
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

            {/* Activity Card */}
            <article key="activity" className="card flex flex-col gap-3 p-4">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-md"
                  style={{ backgroundColor: "oklch(62% 0.14 340 / 0.18)" }}
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="oklch(62% 0.14 340)" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-text-primary">Recent Activity</h3>
                  <p className="text-xs text-text-muted">Events from all services</p>
                </div>
                <div className="ml-auto">
                  <span className="metric-value text-lg font-semibold text-text-primary">
                    {eventsLoading ? "—" : recentEvents.length}
                  </span>
                </div>
              </div>

              {eventsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-6 animate-pulse rounded-md bg-[var(--surface-hover)]" />
                  ))}
                </div>
              ) : recentEvents.length === 0 ? (
                <div className="py-4 text-center text-xs text-text-muted">No recent activity</div>
              ) : (
                <ul className="space-y-2">
                  {recentEvents.map((event: any, index: number) => {
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
                      <li key={`${event.service}-${event.timestamp}-${event.title}-${index}`} className="flex items-center gap-2">
                        <span
                          className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-[10px] font-medium"
                          style={{ backgroundColor: `${typeof color === "string" && color.startsWith("var") ? "rgba(100,160,220,0.12)" : color + "15"}`, color }}
                        >
                          {icon}
                        </span>
                        {service && (
                          <span className="rounded-sm px-1.5 py-0.5 text-[10px] font-medium" style={{ backgroundColor: `${service.color.slice(0, -1)} / 0.15)`, color: service.color }}>
                            {service.name}
                          </span>
                        )}
                        <span className="min-w-0 flex-1 truncate text-xs text-text-primary">{event.title}</span>
                        <span className="flex-shrink-0 text-[10px] text-text-muted">{formatTime(event.timestamp)}</span>
                      </li>
                    );
                  })}
                </ul>
              )}

              <Link href="/events" className="btn-ghost self-start">
                View All Events
              </Link>

              <div className="flex items-center justify-between border-t border-[var(--border)] pt-3">
                <span className="text-xs text-text-muted">
                  {eventsLoading ? "Loading..." : `${recentEvents.length} event${recentEvents.length !== 1 ? "s" : ""} today`}
                </span>
                <Link href="/events" className="btn-ghost" aria-label="View all events">
                  View All →
                </Link>
              </div>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}
