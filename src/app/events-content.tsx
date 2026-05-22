"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
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
import { ThemeToggle } from "@/components/theme-toggle";

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
  if (filters.types.length > 0 && filters.types.length < Object.keys(typeLabels).length) {
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
  const [datePreset, setDatePresetState] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const searchRef = useRef<ReturnType<typeof setTimeout>>(null);
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

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
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      setLoading(true);
      setError(null);
      const qs = buildQuery(filters, page);
      const res = await fetch(`/api/events?${qs}`, { cache: "no-store", signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: EventsResponse = await res.json();
      setEvents(data.events);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setLastUpdated(new Date());
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
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
    setDatePresetState(null);
    setPage(1);
  };

  const setDatePreset = (days: number) => {
    if (datePreset === days) {
      setDatePresetState(null);
      setFilters((f) => ({ ...f, from: "", to: "" }));
    } else {
      const to = new Date().toISOString().split("T")[0];
      const from = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];
      setFilters((f) => ({ ...f, from, to }));
      setDatePresetState(days);
    }
    setPage(1);
  };

  const hasSearch = filters.search.trim().length > 0;

  const groupedEvents = useMemo(() => {
    if (hasSearch) return events.map((e) => ({ events: [e], count: 1 }));
    return groupEvents(events);
  }, [events, hasSearch]);

  const hasActiveFilters =
    filters.services.length > 0 ||
    filters.types.length > 0 ||
    filters.search.trim().length > 0 ||
    filters.from !== "" ||
    filters.to !== "";

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-[1152px] items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md" style={{ backgroundColor: "var(--lime)" }}>
              <span className="text-sm font-semibold" style={{ color: "var(--primary)" }}>⬡</span>
            </div>
            <h1 className="text-base font-semibold">*arr Dashboard</h1>
            <nav className="ml-4 flex items-center gap-1">
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>/</span>
              <Link
                href="/events"
                className="rounded px-2 py-1 text-xs font-medium transition-all"
                style={{ color: "var(--accent)", backgroundColor: "var(--accent-bg)" }}
              >
                Events
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 lg:gap-6">
            <span className="hidden sm:inline text-xs" style={{ color: "var(--text-muted)" }}>
              {total} {total === 1 ? "event" : "events"}
            </span>
            {lastUpdated && (
              <span className="hidden lg:inline text-xs" style={{ color: "var(--text-muted)" }}>
                · {mounted ? formatTime(lastUpdated.toISOString()) : ""}
              </span>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1152px] px-6 py-8">
        <div className="mb-4 flex items-center gap-4">
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            aria-expanded={filtersOpen}
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
            aria-label="Search events"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="max-w-xs flex-1 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs outline-none placeholder:text-[var(--text-muted)]"
            style={{ color: "var(--text-primary)" }}
          />
        </div>

        {filtersOpen && (
          <div className="mb-4 flex flex-wrap items-center gap-1.5">
            {serviceOrder.map((id) => {
              const hasFilter = filters.services.length > 0;
              const active = hasFilter && filters.services.includes(id);
              return (
                <button
                  key={id}
                  onClick={() => toggleService(id)}
                  className="btn-ghost px-2.5 py-1 text-xs"
                  style={{
                    backgroundColor: active ? "var(--accent-bg)" : undefined,
                    color: active ? "var(--accent)" : undefined,
                    borderColor: active ? "var(--accent)" : undefined,
                  }}
                >
                  {serviceNames[id]}
                </button>
              );
            })}

            <span className="text-xs" style={{ color: "var(--text-muted)" }}>|</span>

            {(Object.keys(typeLabels) as EventType[]).map((t) => {
              const hasFilter = filters.types.length > 0;
              const active = hasFilter && filters.types.includes(t);
              return (
                <button
                  key={t}
                  onClick={() => toggleType(t)}
                  className="btn-ghost px-2.5 py-1 text-xs"
                  style={{
                    backgroundColor: active ? "var(--accent-bg)" : undefined,
                    color: active ? "var(--accent)" : undefined,
                    borderColor: active ? "var(--accent)" : undefined,
                  }}
                >
                  {typeLabels[t]}
                </button>
              );
            })}

            <span className="text-xs" style={{ color: "var(--text-muted)" }}>|</span>

            <button
              onClick={() => setDatePreset(1)}
              className="btn-ghost px-2.5 py-1 text-xs"
              style={{
                backgroundColor: datePreset === 1 ? "var(--accent-bg)" : undefined,
                color: datePreset === 1 ? "var(--accent)" : undefined,
                borderColor: datePreset === 1 ? "var(--accent)" : undefined,
              }}
            >24h</button>
            <button
              onClick={() => setDatePreset(7)}
              className="btn-ghost px-2.5 py-1 text-xs"
              style={{
                backgroundColor: datePreset === 7 ? "var(--accent-bg)" : undefined,
                color: datePreset === 7 ? "var(--accent)" : undefined,
                borderColor: datePreset === 7 ? "var(--accent)" : undefined,
              }}
            >7d</button>
            <button
              onClick={() => setDatePreset(30)}
              className="btn-ghost px-2.5 py-1 text-xs"
              style={{
                backgroundColor: datePreset === 30 ? "var(--accent-bg)" : undefined,
                color: datePreset === 30 ? "var(--accent)" : undefined,
                borderColor: datePreset === 30 ? "var(--accent)" : undefined,
              }}
            >30d</button>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="btn-ghost px-2.5 py-1 text-xs" style={{ color: "var(--pink)" }}>
                Clear all
              </button>
            )}
          </div>
        )}

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
          <div className="card divide-y divide-[var(--border)]" style={{ overflow: "hidden", borderRadius: "var(--radius-xl)" }}>
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
    <>
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
        <span
          className="flex h-5 w-5 flex-shrink-0 items-center justify-center text-[20px] font-bold leading-none"
          style={{ color: typeColors[primary.type] }}
          aria-hidden="true"
        >
          {typeIcons[primary.type]}
        </span>

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

      {isGroup && expanded && !hasSearch && (
        <>
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
    </>
  );
}
