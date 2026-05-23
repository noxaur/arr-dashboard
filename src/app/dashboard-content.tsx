"use client";
import { useState, useCallback } from "react";
import { serviceOrder } from "@/lib/services";
import { Header } from "@/components/header";
import { HostSystemCard } from "@/components/host-system-card";
import { ServiceCard } from "@/components/service-card";
import { ActivityCard } from "@/components/activity-card";
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

            <ActivityCard events={recentEvents} loading={eventsLoading} />
          </div>
        </section>
      </main>
    </div>
  );
}
