"use client";
import { useState, useCallback } from "react";
import Link from "next/link";
import { serviceOrder, services } from "@/lib/services";
import { Header } from "@/components/header";
import { HostSystemCard } from "@/components/host-system-card";
import { ServiceCard } from "@/components/service-card";
import { useDashboardStore } from "@/lib/dashboard-store";
import { useVisibilityPoll } from "@/lib/use-visibility-poll";

export function DashboardContent() {
  const data = useDashboardStore((s) => s.data);
  const loading = useDashboardStore((s) => s.loading);
  const error = useDashboardStore((s) => s.error);
  const fetchData = useDashboardStore((s) => s.fetchData);

  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  const fetchRecentEvents = useCallback(async () => {
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
  }, []);

  const refresh = useCallback(async () => {
    await fetchData();
    await fetchRecentEvents();
  }, [fetchData, fetchRecentEvents]);

  useVisibilityPoll(refresh, 30000);

  return (
    <div className="min-h-screen">
      <Header />

      <main className="mx-auto max-w-[1152px] px-6 py-8">
        {error && (
          <div className="mb-6 rounded-md border border-[var(--error)]/20 bg-[var(--error)]/5 px-4 py-3">
            <p className="text-sm text-[var(--error)]">{error}</p>
            <button onClick={refresh} className="mt-2 text-sm underline">Retry</button>
          </div>
        )}

        <HostSystemCard data={data} />

        <section className="mb-8">
          <h2 className="eyebrow mb-4">Services</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {serviceOrder.map((id) => {
              const svcData = data?.services?.find((s) => s.id === id);
              if (!svcData) return null;
              return <ServiceCard key={id} data={svcData} loading={loading} />;
            })}
          </div>
          <section className="mt-6">
            <h4 className="text-sm font-medium text-text-primary mb-3">Activity Feed</h4>
            <div className="grid gap-4 sm:grid-cols-3">
              {eventsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-16 animate-pulse rounded-md bg-[var(--surface-hover)]" />
                ))
              ) : recentEvents.length === 0 ? (
                <p className="col-span-full text-xs text-text-muted py-4 text-center">No recent events</p>
              ) : (
                <ul className="services-split-events col-span-full grid gap-4 sm:grid-cols-3">
                  {recentEvents.map((event: any, i: number) => (
                    <li key={i} className="rounded-md border border-[var(--border)] p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="rounded-sm px-1 py-0.5 text-[10px] font-medium leading-none" style={{ backgroundColor: event.service && services[event.service] ? `${services[event.service].color.slice(0, -1)} / 0.15)` : "var(--surface-hover)", color: event.service && services[event.service] ? services[event.service].color : "var(--text-muted)" }}>
                          {event.service || "unknown"}
                        </span>
                        <span className="text-[10px] text-text-muted ml-auto">{new Date(event.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      <p className="text-xs text-text-primary truncate">{event.title}</p>
                      {event.message && <p className="text-[11px] text-text-muted truncate mt-0.5">{event.message}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <Link href="/events" className="btn-ghost text-xs mt-3 inline-flex items-center gap-1">
              View all events <span aria-hidden="true">&rarr;</span>
            </Link>
          </section>
        </section>
      </main>
    </div>
  );
}
