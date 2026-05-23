import type { EventType, ActivityEvent, EventGroup } from "./types";

export type { EventType, ActivityEvent, EventGroup };

export const serviceColors: Record<string, string> = {
  radarr: "oklch(65% 0.15 30)",
  sonarr: "oklch(62% 0.14 170)",
  prowlarr: "oklch(60% 0.12 280)",
  bazarr: "oklch(62% 0.12 220)",
  jellyseerr: "oklch(62% 0.14 340)",
  jellyfin: "oklch(60% 0.13 50)",
};

export const serviceNames: Record<string, string> = {
  radarr: "Radarr",
  sonarr: "Sonarr",
  prowlarr: "Prowlarr",
  bazarr: "Bazarr",
  jellyseerr: "Jellyseerr",
  jellyfin: "Jellyfin",
};

export const typeIcons: Record<EventType, string> = {
  download: "↓",
  import: "✓",
  search: "⊕",
  refresh: "↻",
  error: "!",
  request: "+",
};

export const typeColors: Record<EventType, string> = {
  download: "var(--success)",
  import: "var(--success)",
  search: "var(--accent)",
  refresh: "var(--text-muted)",
  error: "var(--pink)",
  request: "var(--accent-soft)",
};

export const typeLabels: Record<EventType, string> = {
  download: "Download",
  import: "Import",
  search: "Search",
  refresh: "Refresh",
  error: "Error",
  request: "Request",
};

/** Groups consecutive events sharing service + type + title */
export function groupEvents(events: ActivityEvent[]): EventGroup[] {
  const groups: EventGroup[] = [];
  let current: ActivityEvent[] = [];

  for (const event of events) {
    if (current.length === 0) {
      current = [event];
    } else {
      const last = current[current.length - 1];
      const sameGroup =
        last.service === event.service &&
        last.type === event.type &&
        last.title === event.title;

      if (sameGroup) {
        current.push(event);
      } else {
        groups.push({ events: current, count: current.length });
        current = [event];
      }
    }
  }

  if (current.length > 0) {
    groups.push({ events: current, count: current.length });
  }

  return groups;
}

/** Relative time formatter — safe for SSR via mounted-state guard in components */
export function formatTime(iso: string, now?: number): string {
  const date = new Date(iso);
  const diff = (now ?? Date.now()) - date.getTime();
  if (diff < 0) return "just now";
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return date.toLocaleDateString();
}
