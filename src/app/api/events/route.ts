import { NextRequest, NextResponse } from "next/server";
import { serviceOrder } from "@/lib/services";
import { getActivity } from "@/lib/api";
import { getJellyfinActivity } from "@/lib/jellyfin";
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
    : [...serviceOrder, "jellyfin"];
  const selectedTypes = query.types
    ? query.types.split(",").filter(Boolean)
    : [];
  const searchText = (query.search ?? "").toLowerCase().trim();
  const fromDate = query.from ? new Date(query.from) : null;
  const toDate = query.to ? new Date(query.to) : null;
  const validFrom = fromDate && !isNaN(fromDate.getTime());
  const validTo = toDate && !isNaN(toDate.getTime());
  const page = Math.max(1, parseInt(query.page ?? "1", 10) || 1);
  const pageSize = Math.min(200, Math.max(1, parseInt(query.pageSize ?? "100", 10) || 100));

  const arrServiceIds = selectedServices.filter((id) => id !== "jellyfin");
  const includeJellyfin = !query.services || query.services.split(",").includes("jellyfin");

  const [arrResults, jellyfinEvents] = await Promise.all([
    Promise.allSettled(arrServiceIds.map((id) => getActivity(id))),
    includeJellyfin ? getJellyfinActivity() : Promise.resolve([]),
  ]);

  const allEvents: ActivityEvent[] = [];

  if (includeJellyfin) {
    allEvents.push(...jellyfinEvents.map((e) => ({ ...e, service: "jellyfin" })));
  }

  arrResults.forEach((result, i) => {
    if (result.status === "fulfilled") {
      const serviceEvents = result.value.map((e: any) => ({
        ...e,
        service: arrServiceIds[i],
      }));
      allEvents.push(...serviceEvents);
    } else {
      console.error(`Events API: failed to fetch activity for ${arrServiceIds[i]}`, result.reason);
    }
  });

  // Apply filters
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
