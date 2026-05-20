import { services } from "@/lib/services";
import type { ActivityEvent } from "@/lib/mock-data";

interface ActivityFeedProps {
  events: ActivityEvent[];
}

const typeIcons: Record<string, string> = {
  download: "↓",
  import: "✓",
  search: "⌕",
  refresh: "↻",
  error: "!",
  request: "+",
};

const typeColors: Record<string, string> = {
  download: "oklch(68% 0.18 145)",
  import: "oklch(72% 0.16 145)",
  search: "oklch(68% 0.14 230)",
  refresh: "oklch(65% 0.01 175)",
  error: "oklch(62% 0.22 25)",
  request: "oklch(62% 0.14 300)",
};

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return date.toLocaleDateString();
}

export function ActivityFeed({ events }: ActivityFeedProps) {
  return (
    <section className="card flex flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-medium text-text-primary">
          Activity Feed
        </h2>
        <span className="text-xs text-text-muted">
          {events.length} events
        </span>
      </div>

      <ul className="divide-y divide-border" role="list">
        {events.map((event, index) => {
          const service = services[event.service];
          const icon = typeIcons[event.type] || "·";
          const color = typeColors[event.type] || "oklch(65% 0.01 175)";

          return (
            <li
              key={`${event.service}-${event.timestamp}-${event.title}-${event.message}-${index}`}
              className="flex items-start gap-3 px-4 py-3"
              style={{
                animationDelay: `${index * 50}ms`,
              }}
            >
              <div
                className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-xs font-medium"
                style={{
                  backgroundColor: `${color}15`,
                  color,
                }}
              >
                {icon}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-medium text-text-secondary">
                    {service?.name}
                  </span>
                  <span className="text-xs text-text-muted">
                    {event.title}
                  </span>
                </div>
                <p className="truncate text-xs text-text-muted">
                  {event.message}
                </p>
              </div>

              <time
                className="flex-shrink-0 text-xs text-text-muted"
                dateTime={event.timestamp}
              >
                {formatTime(event.timestamp)}
              </time>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
