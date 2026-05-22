# ADR-0014: Environment Variable Validation

## Status

Accepted

## Context

The codebase reads environment variables across four files (`src/lib/services.ts`, `src/lib/auth.ts`, `src/lib/api.ts`, `src/lib/jellyfin.ts`) using five different access patterns:

1. `process.env.X || ""` — silently falls back to empty string, no validation
2. `process.env.X` (no fallback) — can be `undefined`, checked at call time
3. `process.env.X || process.env.Y || ""` — cascading fallback, no validation
4. `process.env[computedKey]` — dynamic key lookup, no validation
5. `process.env.X === "true"` — implicit string comparison, no parsing

There is no startup validation. Missing required variables surface as runtime errors only when the relevant endpoint is called. Jellyfin configuration is duplicated across `src/lib/jellyfin.ts` and `src/app/api/jellyfin/route.ts` with no shared validation.

## Decision

Centralize all environment variable access into `src/lib/env.ts` using a Zod schema with `z.object()` that validates and parses all env vars at module load time. All other modules import the typed `env` object from this module instead of reading `process.env` directly.

### Schema

| Variable | Required | Default | Description |
|---|---|---|---|
| `RADARR_URL` | yes | — | Radarr service URL (must be valid URL) |
| `SONARR_URL` | yes | — | Sonarr service URL (must be valid URL) |
| `PROWLARR_URL` | yes | — | Prowlarr service URL (must be valid URL) |
| `BAZARR_URL` | yes | — | Bazarr service URL (must be valid URL) |
| `JELLYSEERR_URL` | yes | — | Jellyseerr service URL (must be valid URL) |
| `RADARR_API_KEY` | yes | — | Radarr API key (non-empty string) |
| `SONARR_API_KEY` | yes | — | Sonarr API key (non-empty string) |
| `PROWLARR_API_KEY` | yes | — | Prowlarr API key (non-empty string) |
| `BAZARR_API_KEY` | yes | — | Bazarr API key (non-empty string) |
| `JELLYSEERR_API_KEY` | yes | — | Jellyseerr API key (non-empty string) |
| `ARR_BASIC_USER` | no | `""` | Global Basic Auth username for all *arr services |
| `ARR_BASIC_PASS` | no | `""` | Global Basic Auth password for all *arr services |
| `JELLYFIN_URL` | no | — | Jellyfin server URL |
| `JELLYFIN_API_KEY` | no | — | Jellyfin API key |
| `USE_MOCK_DATA` | no | `"false"` | Set to `"true"` to use mock data instead of real API calls |

Per-service Basic Auth overrides (`BASIC_USER_RADARR`, `BASIC_PASS_RADARR`, etc.) use computed keys in `auth.ts` and still read from `process.env` directly — the validated `env` object provides the global fallbacks.

### Changes per file

- **`src/lib/env.ts`** — new file with Zod schema and `export const env = envSchema.parse(process.env)`
- **`src/lib/services.ts`** — imports `env`, replaces `process.env.RADARR_URL || ""` with `env.RADARR_URL`
- **`src/lib/auth.ts`** — imports `env`, replaces global fallbacks with `env.ARR_BASIC_USER` / `env.ARR_BASIC_PASS`
- **`src/lib/api.ts`** — imports `env`, changes `USE_MOCK` constant to `useMock()` function (enables per-request mock toggle), replaces `process.env[service.apiKeyEnv]` with typed lookup on `env`
- **`src/lib/jellyfin.ts`** — imports `env`, replaces `process.env.JELLYFIN_URL` and `process.env.JELLYFIN_API_KEY`
- **`src/app/api/jellyfin/route.ts`** — imports `env`, replaces `getJellyfinConfig()` function

## Consequences

**Positive:**

- **Startup crash** — missing required vars crash immediately with clear Zod error messages instead of surfacing at call time
- **Single pattern** — eliminates inconsistency across five access patterns
- **TypeScript types** — all env vars have inferred types from the Zod schema
- **Optional vars documented** — clearly listed with defaults in a central schema
- **Deduplication** — Jellyfin config no longer duplicated between library and route

**Negative:**

- **New dependency** — adds Zod as a project dependency
- **Module-level parsing** — env must be set before the module is first imported (standard for Next.js projects with `.env.local`)
- **Per-request mock toggle lost** — `USE_MOCK_DATA` was previously read each time via `process.env`; the function `useMock()` mitigates this by reading from the (still mutable-at-import-time) `env` object, but in a long-running server the value is fixed at startup

## Related

- ADR-0004: Service Registry Pattern — established the service config pattern that this ADR validates
- ADR-0012: Service Adapter Seam — the adapter seam will use `env` for its config
