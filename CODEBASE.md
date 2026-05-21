# CODEBASE.md — *arr Ecosystem Dashboard

> Unified dashboard for Radarr, Sonarr, Prowlarr, Bazarr, Jellyseerr, and Jellyfin.

## Quick Reference

| What | Value |
|------|-------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript strict mode |
| Styling | Tailwind CSS 3.4 + OKLCH colors + CSS custom properties |
| Font | Rubik (Google Fonts, weights 400/500/600/700) |
| Design System | Sentri-inspired (see `DESIGN.md`) |
| Test Runner | Vitest 4.1.7 (node environment) |
| Linter | ESLint 9 + eslint-config-next |
| Dev Port | 5487 |
| Docker Port | 5487 |
| Node | 20 (Alpine) |

## Commands

```bash
npm run dev          # Start dev server on port 5487
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run test         # Run Vitest tests
npm run test:watch   # Run Vitest in watch mode
```

## Directory Structure

```
├── AGENTS.md                    # AI agent rules (security, Docker, workflow)
├── DESIGN.md                    # Sentri design system spec (551 lines)
├── CODEBASE.md                  # This file — codebase overview for agents
├── docker-compose.yml           # Docker compose (gitignored, contains secrets)
├── Dockerfile                   # Multi-stage Docker build
├── package.json
├── tailwind.config.ts           # Tailwind with CSS variable colors, Rubik font
├── tsconfig.json                # TypeScript strict mode
├── vitest.config.ts             # Vitest config (node env)
├── docs/superpowers/specs/      # Design specs
├── public/
│   └── favicon.svg              # Yellow J on dark background
└── src/
    ├── app/
    │   ├── globals.css            # CSS variables (light/dark), component classes
    │   ├── layout.tsx             # Root layout with Rubik font
    │   ├── page.tsx               # Home → <DashboardContent />
    │   ├── dashboard-content.tsx  # Main client dashboard (284 lines)
    │   ├── api/
    │   │   ├── actions/route.ts     # POST: pause/refresh/search
    │   │   ├── dashboard/route.ts   # GET: aggregated dashboard data
    │   │   ├── diskspace/route.ts   # GET: deduplicated disk space
    │   │   ├── health/route.ts      # GET: service health checks
    │   │   ├── jellyfin/route.ts    # GET: Jellyfin info + sessions
    │   │   ├── queues/route.ts      # GET: queue data
    │   │   └── system/route.ts      # GET: system status
    │   ├── radarr/page.tsx          # Redirects to Radarr URL
    │   ├── sonarr/page.tsx          # Redirects to Sonarr URL
    │   ├── prowlarr/page.tsx        # Redirects to Prowlarr URL
    │   ├── bazarr/page.tsx          # Redirects to Bazarr URL
    │   └── jellyseerr/page.tsx      # Redirects to Jellyseerr URL
    ├── components/
    │   ├── service-actions.tsx      # Pause/Refresh/Search buttons
    │   ├── service-icons.tsx        # SVG icons (Radarr, Sonarr, Prowlarr, Bazarr, Jellyseerr, Jellyfin)
    │   └── theme-toggle.tsx         # Light/dark mode toggle
    └── lib/
        ├── api.ts                   # Core API: arrFetch, health, queue, disk, actions
        ├── api.test.ts              # Tests: formatBytes, getDiskSpace
        ├── auth.ts                  # Basic auth resolution (per-service + global fallback)
        ├── auth.test.ts             # Tests: getBasicAuth, getBasicCredentials
        ├── jellyfin.ts              # Jellyfin API helpers
        ├── mock-data.ts             # Mock data for dev/testing
        └── services.ts              # Service configuration registry
```

## Architecture

### Data Flow

```
Browser → /api/dashboard (GET) → parallel fetches to all services
  ├── /api/health → checkHealth(serviceId) → /system/status
  ├── /api/queues → getQueue(serviceId) → /api/v3/queue
  ├── /api/diskspace → getDiskSpace(serviceId) → /api/v3/system/disk
  ├── /api/system → getSystemInfo(serviceId) → /api/v3/system/status
  └── /api/jellyfin → getJellyfinSystemInfo + getJellyfinSessions
```

- `Promise.allSettled` ensures one service failure doesn't break the dashboard
- All external fetches use `arrFetch()` with 2 retries, exponential backoff, 15s timeout
- Client polls `/api/dashboard` every 30s when page is visible
- `USE_MOCK_DATA=true` returns mock data instead of live API calls

### API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/dashboard` | GET | Aggregated data: all services + Jellyfin |
| `/api/health` | GET | Health check; `?service=radarr` for single |
| `/api/queues` | GET | Queue data; `?service=radarr` for single |
| `/api/actions` | POST | Execute actions: `{service, action}` |
| `/api/system` | GET | System status for all services |
| `/api/jellyfin` | GET | Jellyfin server info + active streams |
| `/api/diskspace` | GET | Deduplicated disk (Radarr+Sonarr share disks) |

### Next.js Rewrites

`next.config.ts` rewrites `/api/{radarr,sonarr,prowlarr,bazarr,jellyseerr}/*` to the respective service URLs for direct API proxying.

## Services

| Service | ID | API Version | Color | Env Key |
|---------|-----|-------------|-------|---------|
| Radarr | radarr | `/api/v3` | `oklch(65% 0.15 30)` | `RADARR_API_KEY` |
| Sonarr | sonarr | `/api/v3` | `oklch(62% 0.14 170)` | `SONARR_API_KEY` |
| Prowlarr | prowlarr | `/api/v1` | `oklch(60% 0.12 280)` | `PROWLARR_API_KEY` |
| Bazarr | bazarr | `/api` | `oklch(62% 0.12 220)` | `BAZARR_API_KEY` |
| Jellyseerr | jellyseerr | `/api/v1` | `oklch(62% 0.14 340)` | `JELLYSEERR_API_KEY` |

## Design System

### CSS Custom Properties (in `globals.css`)

All colors use CSS variables that switch between light and dark themes via `[data-theme="dark"]`.

**Key tokens:**
- `--bg` / `--surface` — background colors
- `--border` / `--border-strong` — border colors
- `--text-primary` / `--text-secondary` / `--text-muted` — text colors
- `--accent` / `--accent-soft` / `--accent-bg` — violet accent
- `--success` / `--warning` / `--error` — semantic colors
- `--primary` — primary button bg (inverted per theme)
- `--lime` — electric lime `#c2ef4e` (rare, one per viewport)
- `--pink` — hot pink `#fa7faa` (secondary punctuation)
- `--violet-deep` — `#422082`
- `--ring` — focus ring `#9dc1f5`
- `--radius-xs` through `--radius-xxl` — 4/6/8/10/12/18px

### Component Classes

| Class | Purpose |
|-------|---------|
| `.btn-primary` | Primary CTA (uppercase, 14px/700, 0.2px tracking) |
| `.btn-inverted` | Primary CTA on dark canvas (white bg) |
| `.btn-secondary` | Secondary button with border |
| `.btn-ghost` | Minimal button (transparent, rounded-xl) |
| `.btn-violet-token` | Violet pill button |
| `.card` | Default card (border, radius-xl, hover shadow) |
| `.card-dark` | Dark card (ink-deep bg, radius-xxl) |
| `.pill` | Small pill badge |
| `.pill-neutral-dark` | Dark pill badge |
| `.status-dot` / `.status-dot.healthy` / `.status-dot.warning` / `.status-dot.error` | Status indicators |
| `.eyebrow` | Section label (15px, uppercase, 0.2px tracking) |
| `.micro-cap` | Micro label (10px, 600, 0.25px tracking) |
| `.metric-value` | Tabular numbers for metrics |

### Font

- **Rubik** loaded via `next/font/google` (weights 400/500/600/700)
- Available as `var(--font-rubik)` CSS variable and `font-sans` Tailwind class
- **Monaco** for code (`font-mono`)

### Full Design Spec

See `DESIGN.md` for the complete Sentri design system including colors, typography scale, spacing, border radius, component specs, responsive breakpoints, and do's/don'ts.

## Components

### `DashboardContent` (`src/app/dashboard-content.tsx`)
- Client component, no props
- State: `data`, `loading`, `lastUpdated`, `error`
- Fetches `/api/dashboard` on mount + 30s polling (visibility-aware)
- Renders: header, Host System card, Services grid (3-col), Activity Feed

### `ServiceActions` (`src/components/service-actions.tsx`)
- Props: `{ serviceId: string, hasQueue: boolean }`
- Buttons: Pause (conditional), Refresh (always), Search (radarr/sonarr only)

### `ThemeToggle` (`src/components/theme-toggle.tsx`)
- No props
- Persists to `localStorage`, respects `prefers-color-scheme`
- Sets `data-theme` attribute on `<html>`

### Icon Components (`src/components/service-icons.tsx`)
- `RadarrIcon`, `SonarrIcon`, `ProwlarrIcon`, `BazarrIcon`, `JellyseerrIcon`, `JellyfinIcon`
- Props: `{ className?: string }`
- SVGs from jellyicons with native colors preserved

## Data Types

### `HealthStatus`
```ts
{ status: "healthy" | "warning" | "error" | "offline", message: string, version: string, responseTime: number }
```

### `QueueItem`
```ts
{ id: number, title: string, progress: number, status: "downloading" | "queued" | "importing" | "failed", size: string, sizeLeft: string, eta: string, service: string }
```

### `ActivityEvent`
```ts
{ id: number, service: string, type: "download" | "import" | "search" | "refresh" | "error" | "request", title: string, message: string, timestamp: string }
```

### `DiskSpace`
```ts
{ used: string, total: string, percent: number, usedBytes?: number, mounts?: Array<{path, used, total}> }
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `RADARR_URL` | Yes | Radarr instance URL |
| `SONARR_URL` | Yes | Sonarr instance URL |
| `PROWLARR_URL` | Yes | Prowlarr instance URL |
| `BAZARR_URL` | Yes | Bazarr instance URL |
| `JELLYSEERR_URL` | Yes | Jellyseerr instance URL |
| `RADARR_API_KEY` | Yes | Radarr API key |
| `SONARR_API_KEY` | Yes | Sonarr API key |
| `PROWLARR_API_KEY` | Yes | Prowlarr API key |
| `BAZARR_API_KEY` | Yes | Bazarr API key |
| `JELLYSEERR_API_KEY` | Yes | Jellyseerr API key |
| `ARR_BASIC_USER` | No | Global basic auth username |
| `ARR_BASIC_PASS` | No | Global basic auth password |
| `BASIC_USER_{SERVICE}` | No | Per-service basic auth (overrides global) |
| `BASIC_PASS_{SERVICE}` | No | Per-service basic auth (overrides global) |
| `JELLYFIN_URL` | No | Jellyfin server URL |
| `JELLYFIN_API_KEY` | No | Jellyfin API key |
| `USE_MOCK_DATA` | No | Set `"true"` for mock data |

## Security Rules

- **NEVER** commit `.env.local`, `docker-compose.yml`, or any file containing secrets
- `.gitignore` must always exclude `.env.local`, `docker-compose.yml`, `*.env`
- If a secret is staged, stop immediately and unstage it
- Before committing: `git diff --cached --name-only` to verify

## Docker

- Multi-stage build: builder (node:20-alpine) → runner (node:20-alpine, non-root user)
- Port: 5487
- All env vars defined in `docker-compose.yml` (source of truth for production)
- Verify before committing: `docker compose up -d --build`

## Testing

- **Vitest** in node environment
- Tests live alongside source: `*.test.ts`
- Mock `./services` and `./auth` modules, stub `global.fetch`
- Use `vi.resetModules()` and `vi.stubEnv()` for clean env isolation
- Run: `npm run test`

## Branching

- Feature branches: `feat/<description>`
- Fix branches: `fix/<description>`
- Never push directly to `main`
- PR titles: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`
