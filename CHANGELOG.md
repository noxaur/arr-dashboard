# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Dynamic `[service]` route replacing 5 per-service page files
- Adapter pattern in `src/lib/adapters/` with fetch retry and query utilities
- Code splitting via Next.js dynamic imports
- CSS containment for performance isolation

### Changed

- Architecture deepening Phase 3: extracted service-card, activity-card,
  host-system-card, event-row, events-filters, events-pagination components
- Architecture deepening Phase 2: consolidated 14 shared types into
  `src/lib/types.ts`, Zustand `dashboard-store.ts` for shared polling state
- Architecture deepening Phase 1: `useVisibilityPoll` hook, `ErrorBoundary`,
  Zod env validation (`env.ts` + ADR-0014)
- Parallelized service requests in health and queues API routes

### Fixed

- SSR crash from `motion`/`react` imports — force-dynamic rendering on
  pages using motion
- Theme-toggle SSR crash — moved `document` access from initializer to
  `useEffect`
- Replace invalid CSS `var()` transparency syntax with proper `oklch()`
  values (#114)
- Validate `serviceId` against known service list in health and queues
  routes (#105)
- Prevent partial basic auth credentials from being sent as header (#109)
- Prevent negative queue progress when `item.size` is 0 (#112)
- Clamp disk `usedBytes` to prevent negative percentage (#110)
- Add `AbortController` to dashboard-store to prevent fetch race
  conditions (#100)
- Resolve ESLint plugin version mismatch (#116)
- Sync `package-lock.json` with `package.json` for Docker build (#121)

### Performance

- Fix SSR crash, deduplicate API calls, add code splitting and CSS
  containment

## [0.2.0] - 2026-05-21

### Added

- **Dashboard** — aggregated `/api/dashboard` endpoint collecting health,
  queue, activity, and disk data from all services in one request
- **Events page** (`/events`) with filterable, grouped event feed,
  service/type/date/search filters, time-window grouping with count badges,
  event detail modal (#96)
- **Activity card** replacing the recent activity section in the services
  grid (#97)
- **SVG service logos** — recognizable SVG icons for Radarr, Sonarr,
  Prowlarr, Bazarr, Jellyseerr, Jellyfin replacing single-letter icons (#19)
- **Sentri design system** — OKLCH color system, Rubik typography,
  themed components, SVG icons, internal nav, favicon (#94)
- **Per-service basic auth** — `getBasicAuth()` resolving per-service creds
  with global fallback (`ARR_BASIC_USER`/`ARR_BASIC_PASS`)
- **Client-side rendering with polling** — dashboard renders immediately
  with skeleton loading, fetches data client-side every 30s, visibility-aware
  polling via `useVisibilityPoll` (#18)
- **Shared storage detection** — services on the same physical disk show
  "Shared storage" indicator instead of duplicate progress bars (#28)
- **Responsive top bar** — hides metrics at breakpoints (`md`/`lg`/`xl`)
  to prevent mobile overflow (#27)
- **Cross-origin iframe auth research** — research docs and reference
  materials for future iframe embedding (#95)
- **ADR-0011** — mock data layer via `USE_MOCK_DATA` env var for
  development/testing without live services
- **ErrorBoundary** — wraps dashboard and events pages to catch render
  errors gracefully
- **Zod env validation** — centralized `env.ts` with Zod schema
- **Docker setup** — multi-stage Dockerfile, standalone Next.js output,
  non-root `nextjs` user

### Changed

- **API-only architecture** — removed iframe proxy (`/api/embed/[...path]`)
  and all iframe components; all API access through server-side route
  handlers
- **Service redirect pages** — converted to server components with
  `redirect()` to prevent infinite reload loops (#25)
- **Tailwind colors theme-aware** — hardcoded OKLCH values replaced with
  CSS variable references responding to `[data-theme]` switching (#26)
- **Dark mode theme flash prevention** — blocking head script
  synchronously reads theme preference before hydration
- **Shared Header component** — extracted with auto-detecting nav and
  global stats, replacing duplicate per-page headers
- **Format utilities** — `format.ts` extracted with `formatBytes`/`parseBytes`
- **Default Docker port** — changed from 3000 to 5487, unified internal
  and external port mapping (#30)

### Fixed

- **Security: missing API keys** — fail fast with descriptive errors
  instead of sending empty auth headers (#1)
- **Security: CSRF bypass** — require both `Origin` and `Host` headers
  in POST `/api/actions`, fail closed with 403 if either is missing (#69)
- **Security: cross-origin abuse** — validate Origin/Referer headers
  match the host (#2)
- **Disk double-counting** — Radarr and Sonarr share the same storage
  pool; use Radarr as authoritative source, fall back to Sonarr (#12)
- **Disk cache-busting** — `?t=timestamp` query parameter prevents *arr
  cached disk data (#32)
- **Disk deduplication** — path-based deduplication correctly handles
  multiple physical disks with the same capacity (#34)
- **PauseQueue API** — changed invalid PUT to POST `/command` with
  `PauseAllDownloadClients` (#3)
- **Fetch error differentiation** — distinguish config errors (no retry)
  from network errors (2 retries with exponential backoff, 15s timeout)
  (#13)
- **Activity feed deduplication** — unique React keys using service +
  timestamp + title + index (#7)
- **Prowlarr RSS noise** — filter out `indexerRss`/`indexerSearch` events
  from activity feed (#36)
- **Failed queue status** — map `failed` status so failed downloads
  don't appear as `queued` (#68)
- **Negative duration** — guard against clock skew producing "-1440d ago"
  in `formatTime` (#72)
- **parseBytes** — accepts `string|number`, handles B/KB/MB/GB/TB,
  uses `Math.round`, guards against NaN/Infinity (#70)
- **Back button navigation loop** — resolve infinite redirect loop (#55)
- **Remove dead rewrites** — URL rewrite proxies forwarded headers
  without `X-Api-Key`, always returning 401 (#73)
- **Deduplicate formatUptime** — exported from `api.ts`, removed local
  copy in system route (#71)
- **`fetch` response.ok check** — properly handle non-2xx responses in
  `ServiceActions` (#56)
- **Defer JELLYFIN reads** — `JELLYFIN_URL`/`JELLYFIN_API_KEY` read at
  request time, not module init (#83)
- **Aggregate all services** — when no service param provided, return
  real data for all services, not just the first (#82)
- **Visual feedback** — success/failure indicators for service actions
  (#86)
- **Hardcoded URLs removed** — no more production URLs in `services.ts`,
  `next.config.ts`, or jellyfin route (#8)
- **Iframe proxy bugs** — double `<base>` tag, late injection, cookie
  path regex (#5b4bc6a)
- **ESLint migration** — from deprecated `next lint` to ESLint CLI with
  TypeScript parser (#10)

### Refactored

- Removed iframe proxy (226 lines of regex HTML rewriting) and all iframe
  components
- Replaced 5 per-service pages with client-side redirect pages
- Extracted shared `Header` component
- Consolidated duplicate `arrFetch` import in system route
- Removed unused `apiUrl`/`embedUrl` fields from `ServiceConfig`

### Added (Infrastructure)

- **Vitest test suite** — 7 auth module tests covering per-service
  credentials, global fallback, precedence, empty config (#9)
- **Disk space tests** — `formatBytes` (GB/TB/zero/boundary),
  `getDiskSpace` (N/A handling, single/multi disk, API failure) (#37)
- **CODEBASE.md** — comprehensive codebase overview for AI-assisted
  development (#52)
- **ADR-0002** — resilient data fetching with `Promise.allSettled`,
  per-service error fallbacks
- **ADR-0004** — service registry pattern, env var name storage
- **ADR-0006** — URL rewrites for direct proxy + server-side actions
- **ADR-0011** — mock data layer
- **README with screenshots and demo videos** — comprehensive
  documentation with visual gallery (#25fdf44, #264d753)

### Removed

- Iframe proxy and all iframe-view components
- 5 unused page files (bazarr, jellyseerr, prowlarr, radarr, sonarr)
- Duplicate Docker section in README

[Unreleased]: https://github.com/user/repo/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/user/repo/compare/v0.1.0...v0.2.0
