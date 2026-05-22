# Events Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a dedicated Events page at `/events` that shows full event history across all services with filtering, grouping, and a detail modal.

**Architecture:** New flat page at `src/app/events/page.tsx` renders `<EventsContent />`. A new `/api/events` route proxies each service's `/history` endpoint via the existing `getActivity()` function, aggregates via `Promise.allSettled`, applies client-side filters, and returns paginated results. Following the existing dashboard pattern: one API route, one client component, shared types in `src/lib/`.

**Tech Stack:** Next.js 15 App Router, React 19, Tailwind CSS 3, existing `arrFetch()`/`getActivity()` from `src/lib/api.ts`

---

### Task 1: Create shared events types, constants, and grouping utility

**Files:**
- Create: `src/lib/events.ts`

This module contains everything shared between the API route and the client component: type definitions, display constants, the grouping utility, and the time formatter. It replaces what the prototype had split across `mock-data.ts` and `grouping.ts`.

- [ ] **Step 1: Write the file**

```ts
// src/lib/events.ts
// Shared types, constants, and utilities for the Events page

export type EventType = "download" | "import" | "search" | "refresh" | "error" | "request";

export interface ActivityEvent {
  id: number;
  service: string;
  type: EventType;
  title: string;
  message: string;
  timestamp: string;
  // Rich detail fields (available from real *arr API responses)
  quality?: string;
  qualityVersion?: number;
  indexer?: string;
  downloadClient?: string;
  size?: string;
  score?: number;
  user?: string;
  source?: string;
  protocol?: "usenet" | "torrent";
  movie?: { title: string; year?: number };
  series?: { title: string; season?: number; episode?: number; episodeTitle?: string };
  subtitle?: { language: string; type?: string };
  duration?: string;
}

export interface EventGroup {
  events: ActivityEvent[];
  count: number;
}

export const serviceColors: Record<string, string> = {
  radarr: "oklch(65% 0.15 30)",
  sonarr: "oklch(62% 0.14 170)",
  prowlarr: "oklch(60% 0.12 280)",
  bazarr: "oklch(62% 0.12 220)",
  jellyseerr: "oklch(62% 0.14 340)",
};

export const serviceNames: Record<string, string> = {
  radarr: "Radarr",
  sonarr: "Sonarr",
  prowlarr: "Prowlarr",
  bazarr: "Bazarr",
  jellyseerr: "Jellyseerr",
};

export const typeIcons: Record<EventType, string> = {
  download: "\u2193",
  import: "\u2713",
  search: "\u2295",
  refresh: "\u21BB",
  error: "\u0021",
  request: "\u002B",
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
export function formatTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 0) return "just now";
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(iso).toLocaleDateString();
}
```

- [ ] **Step 2: Verify file compiles**

Run: `npx tsc --noEmit src/lib/events.ts`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/events.ts
git commit -m "feat: add shared events types, constants, and grouping utility"
```

---

### Task 2: Create the events API route

**Files:**
- Create: `src/app/api/events/route.ts`
- Reference: `src/app/api/dashboard/route.ts` (pattern for Promise.allSettled)
- Modify: `src/lib/api.ts` — confirm `getActivity()` already exists and returns the right shape

- [ ] **Step 1: Check existing getActivity return type**

Run: `grep -n "getActivity" src/lib/api.ts`
Expected: Function exists at ~line 232, calls `/history?pageSize=10`, returns `ActivityEvent[]`

- [ ] **Step 2: Create the API route**

```ts
// src/app/api/events/route.ts
import { NextRequest, NextResponse } from "next/server";
import { serviceOrder } from "@/lib/services";
import { getActivity } from "@/lib/api";
import type { ActivityEvent } from "@/lib/events";

interface EventsQuery {
  services?: string;
  types?: string;
  search?: string;
  from?: string;
  to?: string;
  page?: string;
  pageSize?: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query: EventsQuery = Object.fromEntries(searchParams);

  const selectedServices = query.services
    ? query.services.split(",").filter(Boolean)
    : serviceOrder;
  const selectedTypes = query.types
    ? query.types.split(",").filter(Boolean)
    : [];
  const searchText = (query.search ?? "").toLowerCase().trim();
  const fromDate = query.from ? new Date(query.from) : null;
  const toDate = query.to ? new Date(query.to) : null;
  const page = Math.max(1, parseInt(query.page ?? "1", 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(query.pageSize ?? "50", 10) || 50));

  const results = await Promise.allSettled(
    selectedServices.map((id) => getActivity(id))
  );

  const allEvents: ActivityEvent[] = [];

  results.forEach((result, i) => {
    if (result.status === "fulfilled") {
      const serviceEvents = result.value.map((e: any) => ({
        ...e,
        service: selectedServices[i],
      }));
      allEvents.push(...serviceEvents);
    }
    // rejected services are silently skipped (logged server-side if needed)
  });

  // Apply filters
  let filtered = allEvents.filter((event) => {
    if (selectedTypes.length > 0 && !selectedTypes.includes(event.type)) return false;
    if (searchText) {
      const matchTitle = event.title?.toLowerCase().includes(searchText) ?? false;
      const matchMessage = event.message?.toLowerCase().includes(searchText) ?? false;
      if (!matchTitle && !matchMessage) return false;
    }
    if (fromDate && new Date(event.timestamp) < fromDate) return false;
    if (toDate && new Date(event.timestamp) > toDate) return false;
    return true;
  });

  // Sort by timestamp descending (newest first)
  filtered.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const total = filtered.length;

  // Paginate
  const start = (page - 1) * pageSize;
  const paginated = filtered.slice(start, start + pageSize);

  return NextResponse.json({
    events: paginated,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}
```

- [ ] **Step 3: Verify the route compiles**

Run: `npm run build` and check for errors in the route.
Expected: Build completes with no errors for `src/app/api/events`

- [ ] **Step 4: Test with mock data**

Toggle `USE_MOCK_DATA=true` in `.env.local`, then curl:
```bash
curl -s "http://localhost:5487/api/events?pageSize=5" | head -c 500
```
Expected: JSON response with `events` array (5 items), `total`, `page`, `pageSize`, `totalPages`

- [ ] **Step 5: Test filter parameters**

```bash
curl -s "http://localhost:5487/api/events?types=error" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'{len(d[\"events\"])} events, all type=error: {all(e[\"type\"]==\"error\" for e in d[\"events\"])}')"
```
Expected: All returned events have type "error"

- [ ] **Step 6: Commit**

```bash
git add src/app/api/events/route.ts
git commit -m "feat: add events API route with filtering and pagination"
```

---

### Task 3: Create the event detail modal component

**Files:**
- Create: `src/app/events-modal.tsx`
- Depends on: `src/lib/events.ts` (types, constants, formatTime)

Port the validated prototype modal (`src/app/prototype-events/event-modal.tsx`) to production code using `ActivityEvent` type from `src/lib/events.ts`.

- [ ] **Step 1: Write the component**

```tsx
// src/app/events-modal.tsx
"use client";

import { useEffect, useRef } from "react";
import type { ActivityEvent } from "@/lib/events";
import {
  serviceColors,
  serviceNames,
  typeIcons,
  typeColors,
  formatTime,
} from "@/lib/events";

interface EventModalProps {
  event: ActivityEvent;
  onClose: () => void;
}

export function EventModal({ event, onClose }: EventModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const absTime = new Date(event.timestamp).toLocaleString();

  const detailRows: { label: string; value: string }[] = [];
  if (event.quality) detailRows.push({ label: "Quality", value: event.quality + (event.qualityVersion ? ` (v${event.qualityVersion})` : "") });
  if (event.size) detailRows.push({ label: "Size", value: event.size });
  if (event.indexer) detailRows.push({ label: "Indexer", value: event.indexer });
  if (event.downloadClient) detailRows.push({ label: "Client", value: event.downloadClient });
  if (event.source) detailRows.push({ label: "Source", value: event.source });
  if (event.protocol) detailRows.push({ label: "Protocol", value: event.protocol === "torrent" ? "Torrent" : "Usenet" });
  if (event.score !== undefined) detailRows.push({ label: "Score", value: `${event.score}/100` });
  if (event.user) detailRows.push({ label: "User", value: event.user });
  if (event.movie) detailRows.push({ label: "Movie", value: `${event.movie.title}${event.movie.year ? ` (${event.movie.year})` : ""}` });
  if (event.series) {
    detailRows.push({
      label: "Episode",
      value: `${event.series.title} S${String(event.series.season ?? 0).padStart(2, "0")}E${String(event.series.episode ?? 0).padStart(2, "0")}${event.series.episodeTitle ? ` — ${event.series.episodeTitle}` : ""}`,
    });
  }
  if (event.subtitle) {
    detailRows.push({ label: "Language", value: event.subtitle.language });
    if (event.subtitle.type) detailRows.push({ label: "Subtitle type", value: event.subtitle.type });
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        padding: "1rem",
      }}
    >
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: "520px",
          maxHeight: "90vh",
          overflow: "auto",
          backgroundColor: "var(--surface)",
          border: "1px solid var(--border)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between gap-3 px-5 py-4"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-2">
            <span
              className="flex h-6 w-6 flex-shrink-0 items-center justify-center text-sm font-bold leading-none"
              style={{ color: typeColors[event.type] }}
              aria-hidden="true"
            >
              {typeIcons[event.type]}
            </span>
            <span
              className="rounded px-1.5 py-0.5 text-xs font-medium"
              style={{
                backgroundColor: `${serviceColors[event.service].replace(")", " / 0.15)")}`,
                color: serviceColors[event.service],
              }}
            >
              {serviceNames[event.service]}
            </span>
            <span
              className="rounded px-1.5 py-0.5 text-xs font-medium"
              style={{
                backgroundColor: `${typeColors[event.type].replace(")", " / 0.1)")}`,
                color: typeColors[event.type],
              }}
            >
              {event.type}
            </span>
          </div>
          <button
            onClick={onClose}
            className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-sm"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "var(--surface-hover)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          <h3 className="mb-1 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            {event.title}
          </h3>
          {event.message && (
            <p className="mb-4 text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {event.message}
            </p>
          )}

          {/* Timestamp */}
          <div className="mb-4 rounded p-3 text-xs" style={{ backgroundColor: "var(--bg-elevated)" }}>
            <div style={{ color: "var(--text-muted)" }}>Timestamp</div>
            <div style={{ color: "var(--text-secondary)" }}>{formatTime(event.timestamp)}</div>
            <div style={{ color: "var(--text-muted)", fontSize: "11px" }}>{absTime}</div>
          </div>

          {/* Detail fields */}
          {detailRows.length > 0 && (
            <div className="overflow-hidden rounded text-xs" style={{ border: "1px solid var(--border)" }}>
              {detailRows.map((row, i) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between px-3 py-2"
                  style={{
                    borderBottom: i < detailRows.length - 1 ? "1px solid var(--border)" : undefined,
                    backgroundColor: i % 2 === 0 ? "var(--surface)" : "var(--bg-elevated)",
                  }}
                >
                  <span style={{ color: "var(--text-muted)" }}>{row.label}</span>
                  <span className="ml-4 text-right font-medium" style={{ color: "var(--text-secondary)" }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>
            Event #{event.id}
          </span>
          <a
            href={`/${event.service}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost text-xs"
            style={{ color: serviceColors[event.service], textDecoration: "none" }}
          >
            Open in {serviceNames[event.service]} ↗
          </a>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify component compiles**

Run: `npm run build`
Expected: No errors for `src/app/events-modal.tsx`

- [ ] **Step 3: Commit**

```bash
git add src/app/events-modal.tsx
git commit -m "feat: add event detail modal component"
```

---

### Task 4: Create the main events content component

**Files:**
- Create: `src/app/events-content.tsx`
- Depends on: `src/lib/events.ts`, `src/app/events-modal.tsx`, `src/lib/services.ts`

This is the largest component. It handles: data fetching with 30s polling, filter state (services, types, search, date range), the filter bar with collapsible panel, the event feed with grouping, pagination, empty state, and error state.

- [ ] **Step 1: Write the component**

```tsx
// src/app/events-content.tsx
"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { serviceOrder } from "@/lib/services";
import {
  type ActivityEvent,
  type EventType,
  serviceColors,
  serviceNames,
  typeIcons,
  typeColors,
  typeLabels,
  groupEvents,
  formatTime,
} from "@/lib/events";
import { EventModal } from "./events-modal";

interface Filters {
  services: string[];
  types: string[];
  search: string;
  from: string;
  to: string;
}

interface EventsResponse {
  events: ActivityEvent[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function buildQuery(filters: Filters, page: number): string {
  const params = new URLSearchParams();
  if (filters.services.length > 0 && filters.services.length < serviceOrder.length) {
    params.set("services", filters.services.join(","));
  }
  if (filters.types.length > 0 && filters.types.length < 6) {
    params.set("types", filters.types.join(","));
  }
  if (filters.search) params.set("search", filters.search);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  params.set("page", String(page));
  params.set("pageSize", "50");
  return params.toString();
}

export function EventsContent() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [modalEvent, setModalEvent] = useState<ActivityEvent | null>(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Filters>({
    services: [],
    types: [],
    search: "",
    from: "",
    to: "",
  });
  const searchRef = useRef<ReturnType<typeof setTimeout>>(null);
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Debounce search input
  useEffect(() => {
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => {
      setFilters((f) => ({ ...f, search: searchInput }));
      setPage(1);
    }, 300);
    return () => {
      if (searchRef.current) clearTimeout(searchRef.current);
    };
  }, [searchInput]);

  const fetchEvents = useCallback(async () => {
    try {
      setError(null);
      const qs = buildQuery(filters, page);
      const res = await fetch(`/api/events?${qs}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: EventsResponse = await res.json();
      setEvents(data.events);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load events");
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") fetchEvents();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  const toggleService = (id: string) => {
    setFilters((f) => {
      const next = f.services.includes(id)
        ? f.services.filter((s) => s !== id)
        : [...f.services, id];
      return { ...f, services: next };
    });
    setPage(1);
  };

  const toggleType = (t: EventType) => {
    setFilters((f) => {
      const next = f.types.includes(t)
        ? f.types.filter((x) => x !== t)
        : [...f.types, t];
      return { ...f, types: next };
    });
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ services: [], types: [], search: "", from: "", to: "" });
    setSearchInput("");
    setPage(1);
  };

  const setDatePreset = (days: number) => {
    const to = new Date().toISOString().split("T")[0];
    const from = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];
    setFilters((f) => ({ ...f, from, to }));
    setPage(1);
  };

  // Determine if grouping is active (disabled when search is active)
  const hasSearch = filters.search.trim().length > 0;

  // Group or flatten events
  const groupedEvents = useMemo(() => {
    if (hasSearch) return events.map((e) => ({ events: [e], count: 1 }));
    return groupEvents(events);
  }, [events, hasSearch]);

  // Which services are selected (none = all)
  const activeServices = filters.services.length === 0
    ? serviceOrder
    : filters.services;

  const hasActiveFilters =
    filters.services.length > 0 ||
    filters.types.length > 0 ||
    filters.search.trim().length > 0 ||
    filters.from !== "" ||
    filters.to !== "";

  return (
    <div className="min-h-screen">
      {/* Filter bar — sticky header */}
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-sm">
        <div className="mx-auto max-w-[1152px] px-6 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="btn-ghost flex items-center gap-1.5 px-3 py-1.5 text-xs"
            >
              <span style={{ display: "inline-block", transition: "transform 150ms ease", transform: filtersOpen ? "rotate(90deg)" : "rotate(0deg)" }}>
                ▶
              </span>
              Filters
              {hasActiveFilters && (
                <span
                  className="ml-1 rounded px-1.5 py-0.5 text-[10px] font-medium"
                  style={{ backgroundColor: "var(--accent-bg)", color: "var(--accent)" }}
                >
                  {filters.services.length + filters.types.length + (filters.search ? 1 : 0) + (filters.from || filters.to ? 1 : 0)}
                </span>
              )}
            </button>
            <div className="h-5 w-px bg-[var(--border)]" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="flex-1 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs outline-none placeholder:text-[var(--text-muted)] max-w-xs"
              style={{ color: "var(--text-primary)" }}
            />
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                {total} {total === 1 ? "event" : "events"}
              </span>
              {lastUpdated && (
                <span className="hidden sm:inline text-xs" style={{ color: "var(--text-muted)" }}>
                  · {mounted ? formatTime(lastUpdated.toISOString()) : ""}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Filter panel — collapsible */}
      {filtersOpen && (
        <div className="mx-auto max-w-[1152px] px-6 pt-0 pb-4">
          <div className="card p-4 space-y-4">
            {/* Service filter */}
            <div>
              <span className="micro-cap mb-2 block">Service</span>
              <div className="flex flex-wrap gap-1.5">
                {serviceOrder.map((id) => {
                  const active = activeServices.includes(id);
                  const color = serviceColors[id];
                  return (
                    <button
                      key={id}
                      onClick={() => toggleService(id)}
                      className="rounded px-2.5 py-1 text-xs font-medium transition-all"
                      style={{
                        backgroundColor: active ? `${color.replace(")", " / 0.15)")}` : "var(--surface)",
                        color: active ? color : "var(--text-muted)",
                        border: active ? `1px solid ${color}` : "1px solid var(--border)",
                      }}
                    >
                      {serviceNames[id]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Event type filter */}
            <div>
              <span className="micro-cap mb-2 block">Event Type</span>
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(typeLabels) as EventType[]).map((t) => {
                  const active = filters.types.length === 0 || filters.types.includes(t);
                  const color = typeColors[t];
                  return (
                    <button
                      key={t}
                      onClick={() => toggleType(t)}
                      className="rounded px-2.5 py-1 text-xs font-medium transition-all"
                      style={{
                        backgroundColor: active ? `${color.replace(")", " / 0.1)")}` : "var(--surface)",
                        color: active ? color : "var(--text-muted)",
                        border: active ? `1px solid ${color}` : "1px solid var(--border)",
                      }}
                    >
                      {typeIcons[t]} {typeLabels[t]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date range */}
            <div>
              <span className="micro-cap mb-2 block">Date Range</span>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="date"
                  value={filters.from}
                  onChange={(e) => { setFilters((f) => ({ ...f, from: e.target.value })); setPage(1); }}
                  className="rounded border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs outline-none"
                  style={{ color: "var(--text-primary)" }}
                />
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>to</span>
                <input
                  type="date"
                  value={filters.to}
                  onChange={(e) => { setFilters((f) => ({ ...f, to: e.target.value })); setPage(1); }}
                  className="rounded border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs outline-none"
                  style={{ color: "var(--text-primary)" }}
                />
                <button onClick={() => setDatePreset(1)} className="btn-ghost text-xs px-2 py-1">24h</button>
                <button onClick={() => setDatePreset(7)} className="btn-ghost text-xs px-2 py-1">7d</button>
                <button onClick={() => setDatePreset(30)} className="btn-ghost text-xs px-2 py-1">30d</button>
                <button onClick={() => setDatePreset(90)} className="btn-ghost text-xs px-2 py-1">90d</button>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="btn-ghost text-xs px-2 py-1" style={{ color: "var(--pink)" }}>
                    Clear all
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content area */}
      <main className="mx-auto max-w-[1152px] px-6 pb-8">
        {error ? (
          <div className="card p-4" style={{ borderColor: "var(--error)" }}>
            <p className="text-xs" style={{ color: "var(--error)" }}>{error}</p>
          </div>
        ) : loading ? (
          <div className="card p-4">
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Loading events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="card py-12 text-center">
            <p className="text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
              No events found
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {hasActiveFilters ? "Try adjusting your filters or date range" : "No recent activity across services"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {groupedEvents.map((group, gi) => {
              const primary = group.events[0];
              const isGroup = group.count > 1;
              return (
                <EventRow
                  key={`${primary.service}-${primary.type}-${primary.title}-${gi}`}
                  group={group}
                  isGroup={isGroup}
                  hasSearch={hasSearch}
                  onEventClick={setModalEvent}
                />
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="btn-ghost px-3 py-1.5 text-xs disabled:opacity-40"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 7) {
                pageNum = i + 1;
              } else if (page <= 4) {
                pageNum = i + 1;
              } else if (page >= totalPages - 3) {
                pageNum = totalPages - 6 + i;
              } else {
                pageNum = page - 3 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className="rounded px-2.5 py-1 text-xs font-medium"
                  style={{
                    backgroundColor: pageNum === page ? "var(--accent-bg)" : "transparent",
                    color: pageNum === page ? "var(--accent)" : "var(--text-muted)",
                  }}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="btn-ghost px-3 py-1.5 text-xs disabled:opacity-40"
            >
              Next
            </button>
            <span className="text-xs ml-2" style={{ color: "var(--text-muted)" }}>
              Page {page} of {totalPages}
            </span>
          </div>
        )}
      </main>

      {/* Event detail modal */}
      {modalEvent && (
        <EventModal event={modalEvent} onClose={() => setModalEvent(null)} />
      )}
    </div>
  );
}

// ─── Event Row Component ────────────────────────────────────────────

function EventRow({
  group,
  isGroup,
  hasSearch,
  onEventClick,
}: {
  group: { events: ActivityEvent[]; count: number };
  isGroup: boolean;
  hasSearch: boolean;
  onEventClick: (event: ActivityEvent) => void;
}) {
  const primary = group.events[0];
  const [expanded, setExpanded] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const handlePrimaryClick = () => {
    if (isGroup && !hasSearch) {
      setExpanded(!expanded);
    } else {
      onEventClick(primary);
    }
  };

  return (
    <div className="card overflow-hidden" style={{ borderRadius: "var(--radius-xl)" }}>
      {/* Primary row */}
      <div
        onClick={handlePrimaryClick}
        className="flex items-center gap-3 px-5 py-3"
        style={{
          cursor: "pointer",
          transition: "background-color 150ms ease",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.backgroundColor = "var(--surface-hover)";
          setShowInfo(true);
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
          setShowInfo(false);
        }}
      >
        {/* Type icon */}
        <span
          className="flex h-5 w-5 flex-shrink-0 items-center justify-center text-[20px] font-bold leading-none"
          style={{ color: typeColors[primary.type] }}
          aria-hidden="true"
        >
          {typeIcons[primary.type]}
        </span>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-xs font-medium" style={{ color: serviceColors[primary.service] }}>
              {serviceNames[primary.service]}
            </span>
            <span className="truncate text-xs" style={{ color: "var(--text-secondary)" }}>
              {primary.title}
            </span>
          </div>
          {primary.message && (
            <p className="mt-0.5 truncate text-xs" style={{ color: "var(--text-muted)" }}>
              {primary.message}
            </p>
          )}
        </div>

        {/* Right side: badge, info button, timestamp */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isGroup && !hasSearch && (
            <span
              className="rounded px-1.5 py-0.5 text-[10px] font-medium"
              style={{ backgroundColor: "var(--accent-bg)", color: "var(--accent)" }}
            >
              +{group.count - 1}
            </span>
          )}
          {isGroup && showInfo && !hasSearch && (
            <button
              onClick={(e) => { e.stopPropagation(); onEventClick(primary); }}
              className="flex h-5 w-5 items-center justify-center rounded text-xs"
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "var(--surface-hover)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
              }}
              title="View details"
            >
              ⓘ
            </button>
          )}
          <span className="text-xs flex-shrink-0" style={{ color: "var(--text-muted)" }}>
            {formatTime(primary.timestamp)}
          </span>
        </div>
      </div>

      {/* Expanded sub-rows */}
      {isGroup && expanded && !hasSearch && (
        <>
          {/* Group header */}
          <div
            className="px-5 py-1.5 text-[10px] font-medium"
            style={{
              backgroundColor: "var(--bg-elevated)",
              color: "var(--text-muted)",
              borderLeft: `3px solid ${serviceColors[primary.service]}`,
              borderTop: "1px solid var(--border)",
            }}
          >
            {group.count - 1} more {group.count - 1 === 1 ? "event" : "events"}
          </div>
          {group.events.slice(1).map((event, subIdx) => (
            <div
              key={event.id}
              onClick={() => onEventClick(event)}
              className="flex items-center gap-3 px-5 py-2.5"
              style={{
                borderTop: subIdx > 0 ? "1px solid var(--border)" : undefined,
                borderLeft: `3px solid ${serviceColors[primary.service]}`,
                backgroundColor: "var(--bg-elevated)",
                cursor: "pointer",
                transition: "opacity 150ms ease",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.8"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs" style={{ color: "var(--text-secondary)" }}>
                  {event.message}
                </p>
              </div>
              <span className="flex-shrink-0 text-xs" style={{ color: "var(--text-muted)" }}>
                {formatTime(event.timestamp)}
              </span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify the component compiles**

Run: `npm run build`
Expected: No errors for `src/app/events-content.tsx`

- [ ] **Step 3: Commit**

```bash
git add src/app/events-content.tsx
git commit -m "feat: add events content component with filters, feed, pagination"
```

---

### Task 5: Create the events page route

**Files:**
- Create: `src/app/events/page.tsx`

Following the same pattern as `src/app/page.tsx` → `<DashboardContent />`.

- [ ] **Step 1: Write the page**

```tsx
// src/app/events/page.tsx
import { EventsContent } from "../events-content";

export default function EventsPage() {
  return <EventsContent />;
}
```

- [ ] **Step 2: Verify the route compiles**

Run: `npm run build`
Expected: Route compiles with no errors

- [ ] **Step 3: Test the route loads**

Navigate to `http://localhost:5487/events`
Expected: Events page renders with filter bar and event feed

- [ ] **Step 4: Commit**

```bash
git add src/app/events/page.tsx
git commit -m "feat: add events page route"
```

---

### Task 6: Add navigation link and clean up prototype

**Files:**
- Modify: `src/app/dashboard-content.tsx` — add "Events" nav link in header
- Delete: `src/app/prototype-events/` — remove prototype files

- [ ] **Step 1: Add Events nav link to the dashboard header**

Add after the dashboard title (`<h1>`) in the header (line 85):

```tsx
<nav className="flex items-center gap-1">
  <span className="text-xs" style={{ color: "var(--text-muted)" }}>/</span>
  <Link
    href="/events"
    className="rounded px-2 py-1 text-xs font-medium transition-all"
    style={{
      color: "var(--text-muted)",
    }}
    onMouseEnter={(e) => {
      (e.currentTarget as HTMLElement).style.backgroundColor = "var(--surface-hover)";
    }}
    onMouseLeave={(e) => {
      (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
    }}
  >
    Events
  </Link>
</nav>
```

Add import at top of file:
```tsx
import Link from "next/link";
```

**Placement:** Insert between the `</h1>` closing tag (line 85) and the metrics section (line 87), after the existing title.

- [ ] **Step 2: Verify the dashboard compiles**

Run: `npm run build`
Expected: No errors

- [ ] **Step 3: Remove prototype files**

```bash
rm -rf src/app/prototype-events
rm -f src/components/prototype-switcher.tsx
```

- [ ] **Step 4: Verify build still works after cleanup**

Run: `npm run build`
Expected: No errors (prototype-switcher import may cause error if still referenced)

- [ ] **Step 5: Remove prototype-switcher import from layout.tsx if present**

Check: `grep -n "prototype-switcher" src/app/layout.tsx`
If found: remove the import and the `<PrototypeSwitcher />` JSX, commit the change.

- [ ] **Step 6: Commit**

```bash
git add src/app/dashboard-content.tsx
git rm -r src/app/prototype-events
git rm -f src/components/prototype-switcher.tsx 2>/dev/null || true
git commit -m "feat: add Events nav link to dashboard, remove prototype files"
```

---

### Task 7: Test the full feature end-to-end

- [ ] **Step 1: Start dev server**

Run: `npm run dev`
Expected: Server starts on port 5487

- [ ] **Step 2: Navigate to Events page**

Go to `http://localhost:5487/events`
Expected: Page loads with sticky filter bar, event feed, no console errors

- [ ] **Step 3: Test filters**

1. Click "Filters" toggle → panel opens
2. Click a service pill → events filter to that service only
3. Click a type pill → events filter to that type
4. Type in search → events filter after 300ms debounce
5. Select a date preset → events filter to that range

- [ ] **Step 4: Test grouping**

Verify consecutive same-service+type+title events show with "+X" badge and expand on click.

- [ ] **Step 5: Test modal**

1. Click a single-event row → modal opens with detail fields
2. Press Escape → modal closes
3. Click backdrop → modal closes
4. On a grouped row, hover to see ⓘ button, click it → modal opens

- [ ] **Step 6: Test pagination**

If total pages > 1, click through pagination buttons. Verify page numbers update correctly.

- [ ] **Step 7: Test navigation from Dashboard**

Go to `http://localhost:5487/`
Expected: "Events" link visible in the header next to the dashboard title

- [ ] **Step 8: Run the full test suite**

Run: `npm test`
Expected: All existing tests pass
