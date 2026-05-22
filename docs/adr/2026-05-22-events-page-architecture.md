# ADR: Events Page Architecture

**Date:** 2026-05-22
**Status:** Accepted

## Context

The dashboard aggregates health, queue, disk, and activity data for five services (Radarr, Sonarr, Prowlarr, Bazarr, Jellyseerr). The existing activity feed on the dashboard page shows only the 15 most recent events across all services — no filtering, no pagination, no detail view. Users need a dedicated page to browse the full event history with sorting and filtering capabilities.

Two existing patterns conflicted:
- The dashboard's activity feed already fetches all activity data and could be repurposed
- But the feed is limited to 15 events and uses the dashboard's existing API route

## Decision

We will build a standalone Events page with:

1. **New flat route** at `src/app/events/page.tsx` — follows the existing flat routing pattern (no shared layouts, no sidebar)
2. **New `/api/events` API route** — proxies each service's `/history` endpoint via `getActivity()`, aggregates with `Promise.allSettled`, applies server-side filters, and returns paginated results. Separate from the dashboard API to keep concerns decoupled.
3. **Activity feed layout** (prototype Variant A) — rich vertical event rows with consecutive-event grouping, chosen over a table layout or sidebar+cards after prototype testing
4. **Collapsible filter panel** (prototype Variant B) — togglable panel with service pills, type pills, date range inputs, and presets, rather than always-visible filters or inline pills
5. **Event detail modal** — popup overlay with rich detail fields (quality, size, indexer, score, etc.), closes on Escape/backdrop/button, rather than a separate detail page
6. **Server-side filtering, client-side grouping** — the API route handles service/type/search/date/pagination filters; the client groups consecutive same-service+type+title events for display
7. **Navigation via header link** — "Events" link added to the sticky dashboard header, consistent with the project's header-based navigation model

## Alternatives Considered

- **Reusing the dashboard API route** — rejected because it conflates concerns and would require breaking the dashboard's 15-event limit
- **Table layout (Variant B)** — rejected in favor of activity feed for better readability of event messages and richer visual hierarchy
- **Sidebar layout (Variant C)** — rejected because the existing header-based navigation doesn't support a sidebar pattern
- **Separate detail page** — rejected in favor of a modal to avoid context switches and keep filter state intact
- **Client-side filtering** — rejected because the client should display what the API returns; server-side filtering keeps the client simple, enables proper pagination, and makes the API reusable
- **Inline filter pills in sticky bar** — rejected in favor of a collapsible panel to reduce visual noise and accommodate the date range inputs

## Consequences

- The dashboard API route remains unchanged and still returns only 15 recent events
- The Events page has its own loading, error, and empty states independent of the dashboard
- Users can deep-link to `/events?services=radarr,sonarr&types=error` (filter params in URL hash not implemented in v1 but straightforward to add)
- The `ActivityEvent` type in `src/lib/events.ts` becomes the shared contract between API and client
- Adding the Events nav link required touching `dashboard-content.tsx`, keeping navigation in one file
- Prototype files under `src/app/prototype-events/` get deleted after the validated design is extracted

## Related

- Design spec: `docs/superpowers/specs/2026-05-22-events-page-design.md`
- Implementation plan: `docs/superpowers/plans/2026-05-22-events-page-implementation.md`
