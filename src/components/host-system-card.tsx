"use client";
import { JellyfinIcon } from "@/components/service-icons";
import type { DashboardResponse } from "@/lib/types";

export function HostSystemCard({ data }: { data: DashboardResponse | null }) {
  return (
    <section className="mb-8">
      <h2 className="eyebrow mb-4">Host System</h2>
      <article className="card p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md">
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
  );
}
