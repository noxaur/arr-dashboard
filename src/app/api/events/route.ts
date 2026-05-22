import { NextRequest, NextResponse } from "next/server";
import { fetchAllServices } from "@/lib/arr-service";
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
    : undefined;
  const selectedTypes = query.types
    ? query.types.split(",").filter(Boolean)
    : [];
  const searchText = (query.search ?? "").toLowerCase().trim();
  const fromDate = query.from ? new Date(query.from) : null;
  const toDate = query.to ? new Date(query.to) : null;
  const validFrom = fromDate && !isNaN(fromDate.getTime());
  const validTo = toDate && !isNaN(toDate.getTime());
  const page = Math.max(1, parseInt(query.page ?? "1", 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(query.pageSize ?? "50", 10) || 50));

  const entries = await fetchAllServices<ActivityEvent[]>("activity", selectedServices ? { services: selectedServices } : undefined);

  const allEvents: ActivityEvent[] = Object.entries(entries).flatMap(([service, events]) =>
    events.map((e) => ({ ...e, service }))
  );

  let filtered = allEvents.filter((event) => {
    if (selectedTypes.length > 0 && !selectedTypes.includes(event.type)) return false;
    if (searchText) {
      const matchTitle = event.title?.toLowerCase().includes(searchText) ?? false;
      const matchMessage = event.message?.toLowerCase().includes(searchText) ?? false;
      if (!matchTitle && !matchMessage) return false;
    }
    if (validFrom && new Date(event.timestamp) < fromDate!) return false;
    if (validTo && new Date(event.timestamp) > toDate!) return false;
    return true;
  });

  filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const total = filtered.length;
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
