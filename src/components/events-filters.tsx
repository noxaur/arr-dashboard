"use client";
import { serviceOrder } from "@/lib/services";
import { serviceNames, typeLabels, type EventType } from "@/lib/events";

interface EventsFiltersProps {
  filtersOpen: boolean;
  filters: { services: string[]; types: string[] };
  hasActiveFilters: boolean;
  datePreset: number | null;
  searchInput: string;
  onToggleFiltersOpen: () => void;
  onSetSearchInput: (v: string) => void;
  onToggleService: (id: string) => void;
  onToggleType: (t: EventType) => void;
  onSetDatePreset: (days: number) => void;
  onClearFilters: () => void;
}

export function EventsFilters({
  filtersOpen,
  filters,
  hasActiveFilters,
  datePreset,
  searchInput,
  onToggleFiltersOpen,
  onSetSearchInput,
  onToggleService,
  onToggleType,
  onSetDatePreset,
  onClearFilters,
}: EventsFiltersProps) {
  return (
    <>
      <div className="mb-4 flex items-center gap-4">
        <button
          onClick={onToggleFiltersOpen}
          aria-expanded={filtersOpen}
          className="btn-ghost flex items-center gap-1.5 px-3 py-1.5 text-xs focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:outline-none"
        >
          <span className={`transition-transform duration-200 ${filtersOpen ? "rotate-90" : ""}`}>
            ▶
          </span>
          Filters
          {hasActiveFilters && (
            <span
              className="ml-1 rounded px-1.5 text-[10px] font-medium inline-flex items-center transition-transform duration-150 scale-100"
              style={{
                backgroundColor: "var(--accent-bg)",
                color: "var(--accent)",
                height: 18,
              }}
            >
              {filters.services.length + filters.types.length + (searchInput ? 1 : 0) + (datePreset ? 1 : 0)}
            </span>
          )}
        </button>
        <div className="h-5 w-px bg-[var(--border)]" />
        <input
          type="text"
          placeholder="Search events..."
          aria-label="Search events"
          value={searchInput}
          onChange={(e) => onSetSearchInput(e.target.value)}
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
                onClick={() => onToggleService(id)}
                className="btn-ghost px-2.5 py-1 text-xs focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:outline-none"
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
          <button
            onClick={() => onToggleService("jellyfin")}
            className="btn-ghost px-2.5 py-1 text-xs focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:outline-none"
            style={{
              backgroundColor: filters.services.includes("jellyfin") ? "var(--accent-bg)" : undefined,
              color: filters.services.includes("jellyfin") ? "var(--accent)" : undefined,
              borderColor: filters.services.includes("jellyfin") ? "var(--accent)" : undefined,
            }}
          >
            Jellyfin
          </button>

          <span className="text-xs" style={{ color: "var(--text-muted)" }}>|</span>

          {(Object.keys(typeLabels) as EventType[]).map((t) => {
            const hasFilter = filters.types.length > 0;
            const active = hasFilter && filters.types.includes(t);
            return (
              <button
                key={t}
                onClick={() => onToggleType(t)}
                className="btn-ghost px-2.5 py-1 text-xs focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:outline-none"
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
            onClick={() => onSetDatePreset(1)}
            className="btn-ghost px-2.5 py-1 text-xs focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:outline-none"
            style={{
              backgroundColor: datePreset === 1 ? "var(--accent-bg)" : undefined,
              color: datePreset === 1 ? "var(--accent)" : undefined,
              borderColor: datePreset === 1 ? "var(--accent)" : undefined,
            }}
          >24h</button>
          <button
            onClick={() => onSetDatePreset(7)}
            className="btn-ghost px-2.5 py-1 text-xs focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:outline-none"
            style={{
              backgroundColor: datePreset === 7 ? "var(--accent-bg)" : undefined,
              color: datePreset === 7 ? "var(--accent)" : undefined,
              borderColor: datePreset === 7 ? "var(--accent)" : undefined,
            }}
          >7d</button>
          <button
            onClick={() => onSetDatePreset(30)}
            className="btn-ghost px-2.5 py-1 text-xs focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:outline-none"
            style={{
              backgroundColor: datePreset === 30 ? "var(--accent-bg)" : undefined,
              color: datePreset === 30 ? "var(--accent)" : undefined,
              borderColor: datePreset === 30 ? "var(--accent)" : undefined,
            }}
          >30d</button>
          {hasActiveFilters && (
            <button onClick={onClearFilters} className="btn-ghost px-2.5 py-1 text-xs" style={{ color: "var(--pink)" }}>
              Clear all
            </button>
          )}
        </div>
      )}
    </>
  );
}
