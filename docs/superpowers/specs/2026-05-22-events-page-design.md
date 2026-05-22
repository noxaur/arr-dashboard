# Events Page Design

## Problem

The dashboard currently limits event visibility to 15 recent activity items on the Dashboard page. Users have no way to browse the full history of events across all services, filter by service or event type, search for specific titles, or constrain results to a date range. Each service's full history is only accessible by clicking through to the service UI itself.

## Findings

### Branch: Data Model & API Layer

Chosen approach: **Backend proxy** — a new Next.js API route fetches history from each service and merges results server-side.

The existing `getActivity(id)` function in `src/lib/api.ts` already fetches from each service's `/history` endpoint (page size 10). The dashboard API route (`/api/dashboard`) already demonstrates the pattern: `Promise.allSettled` across all services, merge, sort by timestamp descending, slice to 15. The Events page needs a dedicated endpoint that supports pagination (no slice) and filter parameters.

**Data shape** (extended via prototype, used in mock data):
```ts
interface ActivityEvent {
  id: number;
  service: string;       // "radarr" | "sonarr" | "prowlarr" | "bazarr" | "jellyseerr"
  type: "download" | "import" | "search" | "refresh" | "error" | "request";
  title: string;
  message: string;
  timestamp: string;     // ISO 8601
  // Optional rich fields (from real *arr API responses):
  quality?: string;       // e.g. "WEB-1080p"
  qualityVersion?: number;
  indexer?: string;       // Prowlarr indexer name
  downloadClient?: string;
  size?: number;          // bytes
  score?: number;         // 0-100
  user?: string;          // Jellyseerr request user
  source?: string;        // e.g. "WebDL", "BluRay"
  protocol?: string;      // "torrent" | "usenet"
  movie?: { title: string; year?: number };         // Radarr
  series?: { title: string; season?: number; episode?: number; episodeTitle?: string }; // Sonarr
  subtitle?: { language: string };                   // Bazarr
  duration?: number;       // seconds (Jellyfin)
}
```

### Branch: Page Layout

Chosen approach: **Collapsible filter panel + scrollable event feed** — filter toggle button in the header bar opens/closes a filter card panel below. Search input stays inline next to the toggle. Prototype validated this over inline pills: keeps the view cleaner, filters are accessible on demand.

### Branch: Event Display

Chosen approach: **Activity feed (list)** — validated as **Variant A** via prototype (3 variants built, user selected A). Vertical rich event rows with:
- Type icon in colored circle badge
- Service name pill in service's OKLCH color
- Title + message (truncated to 1 line)
- Relative timestamp (via `formatTime()`, guarded with `mounted` state for SSR hydration safety)
- Clicking a single-event row opens the **detail modal**
- Grouped primary row: click toggles expand/collapse (does NOT open modal); ⓘ button appears on hover to open modal

### Branch: Navigation & Integration

Chosen approach: **Top-level nav item** — add "Events" as a primary navigation entry alongside Dashboard and service links. Currently there is no sidebar, so this doubles as a need to introduce navigation.

---

## Architecture

### Route Structure

New flat page following existing convention:
- `/events` → `src/app/events/page.tsx` → renders `<EventsPage />` client component
- `/api/events` → `src/app/api/events/route.ts` → GET handler that proxies service history APIs

### API Route: `GET /api/events`

**Query parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `services` | comma-separated string | all | Filter by service IDs |
| `types` | comma-separated string | all | Filter by event types |
| `search` | string | empty | Case-insensitive substring match on title + message |
| `from` | ISO date string | 7 days ago | Start of date range |
| `to` | ISO date string | now | End of date range |
| `page` | number | 1 | Page number |
| `pageSize` | number | 50 | Events per page |

**Implementation** (follows the dashboard API pattern in `src/app/api/dashboard/route.ts`):

1. Parse query params; if `USE_MOCK_DATA`, return mock data filtered/sorted
2. `Promise.allSettled(serviceOrder.map((id) => getActivity(id)))` for each service
3. Tag each event with its `service` id
4. Merge into single array
5. Apply client-side filters:
   - Service filter: keep only selected services
   - Type filter: keep only selected event types
   - Search filter: case-insensitive match on `title` and `message`
   - Date range: `timestamp >= from && timestamp <= to`
6. Sort by `timestamp` descending (newest first)
7. Paginate: slice for `(page - 1) * pageSize` to `page * pageSize`
8. Return `{ events, total, page, pageSize }`

### Client Component: Events Page (`src/app/events/page.tsx`)

Thin wrapper that imports and renders `<EventsContent />` (following `src/app/page.tsx` pattern).

### Client Component: Events Content (`src/app/events-content.tsx`)

State management (using React hooks, following `dashboard-content.tsx` pattern):

```tsx
interface EventsState {
  events: ActivityEvent[];
  total: number;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  filters: {
    services: string[];
    types: string[];
    search: string;
    from: string;  // ISO date
    to: string;    // ISO date
  };
  page: number;
}
```

**Data flow:**
1. On mount and on filter change, call `fetch("/api/events?" + new URLSearchParams(filters))`
2. Debounce search input by 300ms
3. Render filter bar + event feed + pagination

### Filter Bar

A sticky header bar containing a **"Filters" toggle button** and a **search input**. When the toggle is clicked, a filter panel card drops down below the bar. The bar itself is `sticky top-0` with `z-10` and a backdrop blur/surface background.

**Header bar layout:**
```
[▶ Filters]  [🔍 Search events...]
```

**Filter panel** (card, toggled open/closed):

| Control | Type | Description |
|---------|------|-------------|
| Service filter | Pill group per service | Each pill colored with the service's OKLCH color. Active = filled, inactive = outline. "All" button to reset. |
| Event type filter | Pill group per type | Icons: ↓ download, ✓ import, ⊕ search, ↻ refresh, ! error, + request. Multi-select. |
| Date range | Two date inputs | "From" and "To" [`<input type="date">`], with quick preset buttons (24h, 7d, 30d, 90d) |
| Clear all | Button | Resets all filters to defaults |

Controls are grouped by type in labeled sections inside the card (e.g., "Service", "Event Type", "Date Range"). The card is a standard `.card` container. Animates open/closed with a height transition.

### Events Feed

A single `.card` container with `.divide-y divide-[var(--border)]` rows, following the existing activity feed pattern but with richer layout per row:

```
┌─────────────────────────────────────────────────────────┐
│ [↓] [Radarr]  Movie Title                         2m ago │
│      Downloaded The Matrix 1999                        │
├─────────────────────────────────────────────────────────┤
│ [✓] [Sonarr]  Show Name                           15m ago │
│      Episode S01E01 imported successfully               │
├─────────────────────────────────────────────────────────┤
│ [!] [Prowlarr] Indexer Error                       1h ago │
│      Connection refused: indexer.example.com            │
└─────────────────────────────────────────────────────────┘
```

**Each row:**
- Left: event type icon in a colored circle badge (background color varies by type, same as existing `colorMap`)
- Left-center: service name pill in the service's OKLCH color
- Center: title (primary text) + message (muted text, truncate to 1 line)
- Right: relative timestamp (using existing `formatTime()` helper)

**Hover state:** `bg-[var(--surface-hover)]` on the row.

### Pagination

Simple prev/next controls below the feed:
- "Showing 1–50 of 342 events"
- [Previous] [1] [2] [3] ... [7] [Next] buttons

Styled as secondary buttons matching existing `.btn-ghost` pattern.

### Event Grouping (Duplicate Collapsing)

Consecutive events with the same `service` + `type` + `title` are automatically collapsed into a single card. A "+X" badge indicates the count of additional events in the group.

**Grouping rule (applied post-merge, before pagination):**
1. Events are sorted by timestamp descending (newest first)
2. Walk the sorted array: if event `[i]` and `[i+1]` share `service`, `type`, and `title`, they belong to the same group
3. As soon as a mismatched event appears (different service, type, or title), the group closes
4. A group of 1 (no consecutive duplicate) renders as a normal single event card
5. A group of N > 1 renders as one primary card + "+(N-1)" badge

**Example timeline (sorted newest → oldest):**
```
1. Prowlarr | indexer query | "nzbgeek.info"     ─┐
2. Prowlarr | indexer query | "nzbgeek.info"       ├── Group A (3)
3. Prowlarr | indexer query | "nzbgeek.info"     ─┘
4. Sonarr   | import        | "S01E01"           ← interleaved, breaks group A
5. Prowlarr | indexer query | "nzbgeek.info"     ─┐
6. Prowlarr | indexer query | "nzbgeek.info"       ├── Group B (2)
```

**Visual rendering of a grouped card (prototype-validated):**
```
┌─ [↓] [Prowlarr]  Indexer query                      +2 ─┐ ← primary row
│     nzbgeek.info                                    ⓘ  │
├─ 3 consecutive events ──────────────────────────────────┤ ← group header
│  │ [↓] [Prowlarr]  Indexer query                    3m  │ ← expanded sub-rows
│  │     nzbgeek.info                                    │    (--bg-elevated bg,
│  │ [↓] [Prowlarr]  Indexer query                    6m  │     3px left accent
│  │     nzbgeek.info                                    │     border in service
│  │ [↓] [Prowlarr]  Indexer query                    9m  │     color)
│  │     nzbgeek.info                                    │
└──────────────────────────────────────────────────────────┘
```

Clicking the primary row expands/collapses the group. The "+X" badge sits on the right side, styled as a small pill with `bg-[var(--accent-bg)]`. An ⓘ button appears on the right when hovering the primary row — clicking it opens the **detail modal** instead of toggling the group.

**Expanded sub-rows** use:
- `background-color: var(--bg-elevated)` for visual distinction from the card container
- 3px left border in the service's OKLCH color
- A group header row above the sub-rows: "X consecutive events" in muted text
- Single-event rows (groups of 1) render normally, clickable to open the modal

**When search is active:** Grouping is disabled — every matching event shows individually so users can scan results without collapsed sections hiding potential matches.

### Event Detail Modal

Clicking a single-event row (or clicking the ⓘ button on a grouped primary row) opens a centered modal overlay.

**Component:** `<EventModal event={event} onClose={() => setModalEvent(null)} />`

**Structure:**
- **Overlay:** Full-screen `bg-black/60` backdrop, closes modal on click
- **Card:** Centered, max-width ~500px, `.card` styling, closes on Escape key

**Card content:**
1. **Header:** Type icon badge + service name pill + event type label + ✕ close button
2. **Body:**
   - Event title (bold, larger text)
   - Event message (text-muted)
   - Timestamp: relative format (e.g. "6m ago") + absolute (e.g. "5/22/2026, 11:12:11 AM")
   - Detail table (when rich fields are available): two-column table with alternating row backgrounds. Shows available fields: Quality, Quality Version, Size, Source, Protocol, Indexer, Download Client, Score, User, Media (movie/series/episode info). Empty fields are omitted.
3. **Footer:** Event ID (e.g. "Event #4") + "Open in {Service} ↗" link (opens the service's UI for that event)

**Interaction:**
- Closes on: Escape key, backdrop click, ✕ button click
- Single-event rows: click the row → opens modal
- Grouped primary rows: click row → expand/collapse (NOT modal); ⓘ button appears on hover → click to open modal
- Grouped sub-rows: click the sub-row → opens modal for that specific event

### Empty State

When no events match filters:
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                    No events found                       │
│            Try adjusting your filters or date range      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Navigation Integration

There is no sidebar currently. Add "Events" as a text link in the Dashboard header area (`dashboard-content.tsx`), positioned next to the Dashboard title with a separator:

```
Dashboard | Events  [theme-toggle]
```

This avoids introducing a full sidebar component while giving clear access. The Header component already has space for this — the "Events" link uses `.btn-ghost` style with active state using `bg-[var(--accent-bg)]`.

Additionally, add a summary card on the Dashboard page showing total event count across all services (or "No recent activity" if zero), linking to the Events page. This provides a visual entry point from the main view.

### Responsive Behavior

| Breakpoint | Filter bar | Event list |
|------------|------------|------------|
| Desktop (>=1024px) | Toggle button + search inline in header bar, panel drops below | Full rows with message, 50/page |
| Tablet (640-1023px) | Same toggle + search, panel drops below | Full rows with message, 25/page |
| Mobile (<640px) | Same toggle + search stacked vertically | Compact rows (hide message, hide secondary details on hover), 15/page |

### Error Handling

- If any service is unreachable, `Promise.allSettled` ensures other services still return events. The error for that service is logged server-side but doesn't block the response.
- On the client, if the fetch fails entirely, show an error banner (matching the existing pattern in `dashboard-content.tsx`).
- Individual fetch retries use the existing `arrFetch` retry logic (2 retries, exponential backoff).

### Prototype Validation

A UI prototype with 3 variants was built at `/prototype-events` and verified browser-side:

- **Variant A (chosen):** Activity feed layout with grouping, collapsible filters, and modal detail view
- **Variant B:** Table layout with sortable columns — rejected
- **Variant C:** Sidebar + feed — rejected

**Prototype learnings folded into this spec:**
- Collapsible filter panel preferred over inline pills
- Expanded groups need visual encapsulation: `--bg-elevated` per-row background + service-color left accent border + "X consecutive events" header
- `formatTime()` needs `mounted` state guard for Next.js SSR hydration
- Single-event rows: click → modal; grouped primary rows: click → expand/collapse (ⓘ hover button → modal)
- Modal needs to show detail fields when available (quality, size, source, protocol, score, media info)

### Testing Considerations

1. **API route:** Test that query parameters correctly filter events. Test pagination boundaries.
2. **Client component:** Test filter interactions update the displayed events. Test empty state. Test error state. Test modal open/close from both single-event rows and grouped-event ⓘ buttons.
3. **Grouping logic:** Test that consecutive same-service+type+title events group correctly and interleaving events break the group. Test that grouping is disabled when search is active.
4. **Navigation:** Test that the Events link is visible and navigates to `/events`.
5. **Visual:** Test responsive layout at all three breakpoints.

---

## Files to Create / Modify

| Action | File | Description |
|--------|------|-------------|
| Create | `src/app/events/page.tsx` | New route, renders `<EventsContent />` |
| Create | `src/app/events-content.tsx` | Client component: filter bar + event feed + pagination + modal state |
| Create | `src/app/events-content/event-modal.tsx` | Detail modal component |
| Create | `src/app/events-content/grouping.ts` | Consecutive grouping utility |
| Create | `src/app/api/events/route.ts` | API route: proxy service history + filter + paginate |
| Modify | `src/app/dashboard-content.tsx` or layout | Add "Events" navigation link |
| Delete | `src/app/prototype-events/` | Remove prototype files once implementation replaces them |
