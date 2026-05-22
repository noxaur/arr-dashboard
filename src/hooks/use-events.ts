"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import type { ActivityEvent, EventType } from "@/lib/events";
import type { EventsResponse } from "@/lib/types";
import { serviceOrder } from "@/lib/services";
import { typeLabels } from "@/lib/events";

interface Filters {
  services: string[];
  types: string[];
  search: string;
  from: string;
  to: string;
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

export function useEvents() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
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

  const hasActiveFilters =
    filters.services.length > 0 ||
    filters.types.length > 0 ||
    filters.search.trim().length > 0 ||
    filters.from !== "" ||
    filters.to !== "";

  return {
    events,
    total,
    totalPages,
    loading,
    error,
    lastUpdated,
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
    fetchEvents,
  };
}
