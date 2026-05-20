# *arr Ecosystem Dashboard

A unified dashboard for managing your *arr ecosystem — Radarr, Sonarr, Prowlarr, Bazarr, and Jellyseerr — all in one place.

## Features

- **Unified Health View** — See the status of all services at a glance
- **Live Queue Data** — Active downloads, missing items, disk usage
- **Embedded Service Pages** — Full service UI accessible via iframe proxy with session handling
- **Light/Dark Mode** — System-aware with manual toggle
- **Request Management** — Planned integration with Jellyseerr for movie/TV requests

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

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `RADARR_URL` | Radarr instance URL | `https://jellyradarr-admin.opsec.rent` |
| `SONARR_URL` | Sonarr instance URL | `https://jellysonarr-admin.opsec.rent` |
| `PROWLARR_URL` | Prowlarr instance URL | `https://jellyprowlarr-admin.opsec.rent` |
| `BAZARR_URL` | Bazarr instance URL | `https://jellybazarr.opsec.rent` |
| `JELLYSEERR_URL` | Jellyseerr instance URL | `https://jellyseerr.opsec.rent` |
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
│  │         API Route Proxy Layer           │ │
│  │  /api/radarr  /api/sonarr  /api/...     │ │
│  └──────────────────┬──────────────────────┘ │
│                     │                         │
│  ┌──────────────────▼──────────────────────┐ │
│  │        Iframe Embed Proxy               │ │
│  │  /api/embed/[service]/[...path]         │ │
│  │  - Cookie rewriting (SameSite=None)     │ │
│  │  - X-Frame-Options removal              │ │
│  │  - URL rewriting for SPA routing        │ │
│  │  - initialize.json patching             │ │
│  └──────────────────┬──────────────────────┘ │
└─────────────────────┼────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
   ┌────────┐   ┌────────┐   ┌────────┐
   │ Radarr │   │ Sonarr │   │  ...   │
   └────────┘   └────────┘   └────────┘
```

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS + OKLCH color system
- **Language:** TypeScript
- **Deployment:** Docker (multi-stage build, standalone output)

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server on port 4167 |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
