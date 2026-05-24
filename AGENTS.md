# AGENTS.md

## Project Overview

A Next.js 15 dashboard for managing the *arr media ecosystem (Radarr, Sonarr, Prowlarr, Bazarr, Jellyseerr) with Jellyfin integration. Client-side polling, aggregated API layer, light/dark OKLCH theming.

Key technologies: **Next.js 15 (App Router) · TypeScript strict · Tailwind CSS 3.4 (OKLCH) · Rubik font · Vitest 4 · ESLint 9 · Zustand · Zod**

## Setup Commands

```bash
npm install                   # Install all dependencies
cp .env.local.example .env.local  # Configure service URLs + API keys
npm run dev                   # Start dev server on port 5487
npm run build                 # Production build (Next.js standalone)
npm run start                 # Start production server
```

## Development Workflow

- Dev server runs on **port 5487** — configure this in `package.json` scripts
- Environment variables in `.env.local` — see README.md for full list
- Set `USE_MOCK_DATA=true` to develop without live services
- All external API calls go through `arrFetch()` (2 retries, exponential backoff, 15s timeout)
- Use `Promise.allSettled` pattern when aggregating multiple service calls (one failure doesn't break the dashboard)

## Testing Instructions

```bash
npm run test                  # Run all tests once (coverage: src/lib)
npm run test:watch            # Run tests in watch mode
npx vitest run src/lib/api.test.ts  # Single test file
npx vitest run -t "test name"       # Single test by name pattern
```

- **Framework:** Vitest 4 (node environment, not jsdom)
- **Location:** `src/lib/*.test.ts` (co-located with implementation)
- **Coverage:** `v8` provider, reports `text` + `lcov`, covers `src/lib`
- **Config:** `clearMocks: true`, `restoreMocks: true` in `vitest.config.ts`
- **Setup:** `vitest.setup.ts` runs before all tests

Test patterns used in this codebase:
- Mock `global.fetch` for API route tests
- Test auth header resolution, edge cases, and error states
- Write tests before implementation (TDD: red-green-refactor)

## Code Style

- **TypeScript strict mode** — `tsconfig.json` has `"strict": true`
- **No comments** in code unless explicitly requested
- **Path alias** `@/*` maps to `src/*` — import like `import { x } from "@/lib/api"`
- **No default exports** — prefer named exports everywhere
- **Follow existing patterns** — match the style of neighboring files

### Linting

```bash
npm run lint                  # ESLint 9 with @next/eslint-plugin-next + react-hooks
```

Rules: `react-hooks/rules-of-hooks` (error), `react-hooks/exhaustive-deps` (warn).

### Styling

- **Tailwind CSS 3.4** with CSS variables for theming
- **OKLCH color system** — all colors defined as CSS custom properties in `src/app/globals.css`
- Light/dark mode via CSS class on `<html>` — toggle with `theme-toggle.tsx`
- Semantic color tokens: `surface`, `border`, `text`, `accent`, `status`
- Custom spacing scale: `xxs` (2px) through `section` (96px)
- Animation tokens: `fade-in`, `slide-up`, `pulse`
- Rubik font at weights 400/500/600/700

## Build and Deployment

```bash
npm run build                 # Next.js standalone output
docker compose up -d --build  # Build + run Docker container
```

### Docker

- **Multi-stage build:** Builder stage (install + compile), Runner stage (Node 20 Alpine, standalone output)
- **Non-root user:** Runs as `nextjs` (uid 1001)
- **Port:** 5487
- **Restart policy:** `unless-stopped`
- **Logs:** `docker logs -f arr-ecosystem-dashboard`

### Environment Configuration

- `.env.local` — local development only (never commit)
- `docker-compose.yml` — source of truth for production (all vars defined here)
- Never commit `.env.local`, `docker-compose.yml` containing secrets, or `*.env` files

## Security

- **NEVER commit `.env.local`, `docker-compose.yml`, or files containing secrets**
- Before committing: `git diff --cached --name-only` — verify no env/credential files staged
- `.gitignore` must exclude `.env.local`, `docker-compose.yml`, `*.env`
- If a secret is accidentally staged, stop immediately and unstage it

## Pull Request Guidelines

- Title format: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:` prefix
- Keep PRs focused — one feature or fix per PR
- Before marking ready: run `npm run lint` + `npm run test` — both must pass
- PR descriptions should be 2-3 sentences starting with "This PR..."

## Architecture Notes

```
src/
├── app/              # Next.js App Router pages + API routes
│   ├── api/          # Route handlers: dashboard, health, queues, actions, etc.
│   ├── layout.tsx    # Root layout with Rubik font, theme class
│   └── page.tsx      # Home page → dashboard-content.tsx
├── components/       # React components (no default exports)
│   ├── header.tsx
│   ├── service-card.tsx
│   ├── service-actions.tsx
│   ├── activity-card.tsx
│   └── ...
├── hooks/            # Custom React hooks
│   └── use-events.ts
└── lib/              # Core logic, API helpers, types
    ├── api.ts        # arrFetch() — retry + timeout wrapper
    ├── auth.ts       # Basic auth resolution
    ├── services.ts   # Service registry config
    ├── types.ts      # Shared types
    ├── env.ts        # Environment variable access
    ├── format.ts     # Formatting utilities
    ├── events.ts     # Event aggregation
    ├── mock-data.ts  # Mock responses for development
    └── adapters/     # Per-service API adapters
```

**Data flow:** Client polls `/api/dashboard` every 30s (visibility-aware). The dashboard endpoint aggregates all services via `Promise.allSettled`. All external fetches use `arrFetch()` with 2 retries and 15s timeout.
