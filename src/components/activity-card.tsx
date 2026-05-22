"use client";
import Link from "next/link";
import { services } from "@/lib/services";
import { formatTime } from "@/lib/events";

const typeIcons: Record<string, string> = {
  download: "↓",
  import: "✓",
  search: "⊕",
  refresh: "↻",
  error: "!",
  request: "+",
};

const colorMap: Record<string, string> = {
  download: "var(--success)",
  import: "var(--success)",
  search: "var(--accent)",
  refresh: "var(--text-muted)",
  error: "var(--pink)",
  request: "var(--accent-soft)",
};

export function ActivityCard({
  events,
  loading,
}: {
  events: any[];
  loading: boolean;
}) {
  return (
    <article className="card flex flex-col gap-3 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md" style={{ backgroundColor: "oklch(62% 0.14 340 / 0.18)" }}>
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
            {loading ? "—" : events.length}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-6 animate-pulse rounded-md bg-[var(--surface-hover)]" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="py-4 text-center text-xs text-text-muted">No recent activity</div>
      ) : (
        <ul className="space-y-2">
          {events.map((event: any, index: number) => {
            const service = services[event.service];
            const icon = typeIcons[event.type] || "·";
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

      <div className="flex items-center justify-between border-t border-[var(--border)] pt-3">
        <span className="text-xs text-text-muted">
          {loading ? "Loading..." : `${events.length} event${events.length !== 1 ? "s" : ""} today`}
        </span>
        <Link href="/events" className="btn-ghost" aria-label="View all events">
          View All →
        </Link>
      </div>
    </article>
  );
}
