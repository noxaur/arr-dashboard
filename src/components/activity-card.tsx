"use client";
import Link from "next/link";
import { services } from "@/lib/services";
import { formatTime } from "@/lib/events";

const typeIcons: Record<string, string> = {
  download: "\u2193",
  import: "\u2713",
  search: "\u2295",
  refresh: "\u21BB",
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
      <Link href="/events" className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="oklch(62% 0.14 340)" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-medium text-text-primary">Activity Feed</h3>
          <p className="text-xs text-text-muted">Latest events across all services</p>
        </div>
        <div className="ml-auto">
          <span className="metric-value text-lg font-semibold text-text-primary">
            {loading ? "\u2014" : events.length}
          </span>
        </div>
      </Link>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-5 w-5 animate-pulse rounded bg-[var(--surface-hover)]" />
              <div className="h-3 flex-1 animate-pulse rounded bg-[var(--surface-hover)]" />
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6">
          <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" opacity="0.4">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <p className="text-xs text-text-muted">No recent events</p>
        </div>
      ) : (
        <ul className="space-y-1">
          {events.map((event: any, index: number) => {
            const service = services[event.service];
            const icon = typeIcons[event.type] || "\u00B7";
            const color = colorMap[event.type] || "var(--text-muted)";
            return (
              <li key={`${event.service}-${event.timestamp}-${event.title}-${index}`} className="flex items-start gap-2.5 rounded-md px-2 py-2 transition-colors hover:bg-[var(--surface-hover)]">
                <span
                  className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-[10px] font-medium"
                  style={{ backgroundColor: "var(--accent-bg)", color }}
                >
                  {icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    {service && (
                      <span className="rounded-sm px-1 py-0.5 text-[10px] font-medium leading-none" style={{ backgroundColor: `${service.color.slice(0, -1)} / 0.15)`, color: service.color }}>
                        {service.name}
                      </span>
                    )}
                    <span className="truncate text-xs text-text-primary">{event.title}</span>
                  </div>
                  {event.message && (
                    <p className="mt-0.5 truncate text-[11px] text-text-muted leading-relaxed">{event.message}</p>
                  )}
                </div>
                <span className="flex-shrink-0 pt-0.5 text-[10px] text-text-muted">{formatTime(event.timestamp)}</span>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex items-center justify-between border-t border-[var(--border)] pt-3">
        <span className="text-xs text-text-muted">
          {loading ? "—" : `${events.length} event${events.length !== 1 ? "s" : ""}`}
        </span>
        <Link href="/events" className="btn-ghost text-xs" aria-label="View all events">
          View All \u2192
        </Link>
      </div>
    </article>
  );
}
