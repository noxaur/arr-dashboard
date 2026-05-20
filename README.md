# *arr Ecosystem Dashboard

A unified dashboard for managing your *arr ecosystem — Radarr, Sonarr, Prowlarr, Bazarr, and Jellyseerr — all in one place.

## Features

- **Unified Health View** — See the status of all services at a glance
- **Live Queue Data** — Active downloads, missing items, disk usage
- **Host System Info** — Jellyfin server details and active stream count
- **Recent Activity Feed** — Aggregated history from all services
- **Service Actions** — Pause downloads, refresh monitored, search missing
- **Light/Dark Mode** — System-aware with manual toggle
- **Client-Side Dashboard** — Skeleton loading, 30s polling, visibility-aware
- **Retry Logic** — Exponential backoff (2 retries), 15s timeout, error vs offline distinction
- **Shared Storage Detection** — Identifies services on the same disk, avoids duplicate metrics
- **Mobile Responsive** — Progressive disclosure of header metrics by breakpoint
- **SVG Service Logos** — Custom icons for each service

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Copy environment file and configure
cp .env.local.example .env.local

# Start dev server
npm run dev
```

Open [http://localhost:4167](http://localhost:4167)

### Docker Deployment

```bash
# Edit docker-compose.yml with your credentials
docker compose up -d --build
```

Open [http://localhost:3000](http://localhost:3000)

#### Docker Configuration

- **Multi-stage build**: Builder stage installs deps and compiles, runner stage uses standalone output
- **Non-root user**: Runs as `nextjs` (uid 1001) for security
- **Node 20 Alpine**: Minimal base image (~50MB)
- **Standalone output**: Uses Next.js standalone mode for smaller production image
- **Restart policy**: `unless-stopped` — auto-restarts on failure or system reboot

#### Docker Compose Structure

```yaml
services:
  dashboard:
    build: .
    container_name: arr-ecosystem-dashboard
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - RADARR_URL=...
      - RADARR_API_KEY=...
      # ... all other env vars
```

#### Updating

```bash
# Pull latest code and rebuild
docker compose up -d --build

# Or use cache and only rebuild changed layers
docker compose build --no-cache && docker compose up -d
```

#### Logs

```bash
# View logs
docker logs -f arr-ecosystem-dashboard

# View last 100 lines
docker logs --tail 100 arr-ecosystem-dashboard
```

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `RADARR_URL` | Radarr instance URL | `https://jellyradarr-admin.opsec.rent` |
| `SONARR_URL` | Sonarr instance URL | `https://jellysonarr-admin.opsec.rent` |
| `PROWLARR_URL` | Prowlarr instance URL | `https://jellyprowlarr-admin.opsec.rent` |
| `BAZARR_URL` | Bazarr instance URL | `https://jellybazarr.opsec.rent` |
| `JELLYSEERR_URL` | Jellyseerr instance URL | `https://jellyseerr.opsec.rent` |
| `JELLYFIN_URL` | Jellyfin instance URL | — |
| `JELLYFIN_API_KEY` | Jellyfin API key | — |
| `ARR_BASIC_USER` | Global basic auth username | — |
| `ARR_BASIC_PASS` | Global basic auth password | — |
| `BASIC_USER_<SERVICE>` | Per-service basic auth username (overrides global) | — |
| `BASIC_PASS_<SERVICE>` | Per-service basic auth password (overrides global) | — |
| `RADARR_API_KEY` | Radarr API key | — |
| `SONARR_API_KEY` | Sonarr API key | — |
| `PROWLARR_API_KEY` | Prowlarr API key | — |
| `BAZARR_API_KEY` | Bazarr API key | — |
| `JELLYSEERR_API_KEY` | Jellyseerr API key | — |
| `USE_MOCK_DATA` | Use mock data instead of live API | `false` |

## Architecture

```
┌─────────────────────────────────────────────┐
│              Dashboard (Next.js)             │
│  ┌───────────┐  ┌───────────┐  ┌──────────┐ │
│  │  Health   │  │   Queue   │  │ Activity │ │
│  │  Status   │  │   Data    │  │  Feed    │ │
│  └─────┬─────┘  └─────┬─────┘  └────┬─────┘ │
│        │              │              │        │
│  ┌─────▼──────────────▼──────────────▼─────┐ │
│  │      /api/dashboard (aggregated)        │ │
│  │  Single endpoint for all service data   │ │
│  └──────────────────┬──────────────────────┘ │
│                     │                         │
│  ┌──────────────────▼──────────────────────┐ │
│  │        Service Redirect Pages           │ │
│  │  Server components with redirect()      │ │
│  │  /radarr, /sonarr, /prowlarr, ...       │ │
│  └─────────────────────────────────────────┘ │
└─────────────────────┬────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
   ┌────────┐   ┌────────┐   ┌────────┐
   │ Radarr │   │ Sonarr │   │  ...   │
   └────────┘   └────────┘   └────────┘
```

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS + OKLCH color system with CSS variables
- **Language:** TypeScript strict mode
- **Testing:** Vitest
- **Deployment:** Docker (multi-stage build, standalone output)

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server on port 4167 |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Vitest test suite |
| `npm run test:watch` | Run Vitest in watch mode |
