"use client";
import { useState, useMemo } from "react";
import { Header } from "@/components/header";
import { useEvents } from "@/hooks/use-events";
import { EventsFilters } from "@/components/events-filters";
import { EventsPagination } from "@/components/events-pagination";
import { EventRow } from "@/components/event-row";
import { EventModal } from "./events-modal";
import { groupEvents } from "@/lib/events";

export function EventsContent() {
  const {
    events,
    totalPages,
    loading,
    error,
    page,
    setPage,
    filters,
    hasActiveFilters,
    hasSearch,
    searchInput,
    setSearchInput,
    datePreset,
    toggleService,
    toggleType,
    clearFilters,
    setDatePreset,
  } = useEvents();

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [modalEvent, setModalEvent] = useState<any>(null);

  const groupedEvents = useMemo(() => {
    if (hasSearch) return events.map((e) => ({ events: [e], count: 1 }));
    return groupEvents(events);
  }, [events, hasSearch]);

  return (
    <div className="min-h-screen">
      <Header />

      <main className="mx-auto max-w-[1152px] px-6 py-8">
        <EventsFilters
          filtersOpen={filtersOpen}
          filters={filters}
          hasActiveFilters={hasActiveFilters}
          datePreset={datePreset}
          searchInput={searchInput}
          onToggleFiltersOpen={() => setFiltersOpen(!filtersOpen)}
          onSetSearchInput={setSearchInput}
          onToggleService={toggleService}
          onToggleType={toggleType}
          onSetDatePreset={setDatePreset}
          onClearFilters={clearFilters}
        />

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
          <EventsPagination page={page} totalPages={totalPages} onSetPage={setPage} />
        )}
      </main>

      {modalEvent && (
        <EventModal event={modalEvent} onClose={() => setModalEvent(null)} />
      )}
    </div>
  );
}
