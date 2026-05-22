# ADR-0012: Service Adapter Seam for Multi-Service Fetch Layer

## Status
Accepted

## Context

The dashboard fetches data from five *arr services (Radarr, Sonarr, Prowlarr, Bazarr, Jellyseerr) and Jellyfin. The current fetch layer in `src/lib/api.ts` is 381 lines containing 11 exported functions, each internally branching on `serviceId` with per-service endpoint paths, response shapes, and error handling.

This pattern has three symptoms:

1. **Shallow interface, scattered branching** — Each function (`checkHealth`, `getQueue`, `getActivity`, etc.) has a simple type signature (`serviceId: string → Result`) but internally repeats the same `if (serviceId === "prowlarr") return []` / `if (serviceId === "jellyseerr") fetch(...)` pattern. A sixth service would require editing all 5 fetch-and-parse functions plus 1–2 route handlers. The same per-service knowledge is repeated, not composed.

2. **Redundant HTTP calls** — `checkHealth` and `getSystemInfo` both call `/system/status` independently for the same service in the dashboard aggregation, wasting a request.

3. **Jellyfin has parallel fetch infrastructure** — `src/lib/jellyfin.ts` reimplements the same retry-with-backoff pattern as `arrFetch` with different auth (X-Emby-Token vs X-Api-Key), and the `/api/jellyfin` route handler duplicates config reading and makes raw fetch calls without retry logic.

ADR-0004 established a service registry for configuration. ADR-0002 established resilient multi-service fetching via `Promise.allSettled`. Both decisions are sound — the gap is that the *per-service fetch and parse logic* has no seam of its own.

## Decision

Introduce a `ServiceAdapter` seam that separates per-service fetch-and-parse logic from route handler orchestration.

### The Seam

Each service provides an adapter satisfying this interface:

```typescript
interface ServiceAdapter {
  readonly id: string;
  readonly capabilities: Set<string>;  // e.g., "health", "queue", "disk", "activity", "system"
  query(spec: Record<string, unknown>): Promise<Record<string, unknown>>;
  command(cmd: { action: string; [key: string]: unknown }): Promise<{ success: boolean; error?: string }>;
}
```

- `query()` takes a partial spec (which data categories to fetch) and returns a result containing only those keys. Unsupported categories are silently omitted.
- `command()` executes an action (pause, refresh, search). Unsupported actions return `{ success: false, error }`.
- `capabilities` allows callers to discover what a service supports at runtime.

### Registry

A central `getAdapter(id: string): ServiceAdapter` function provides access to adapters by service ID. Each adapter is a separate module at `src/lib/adapters/{serviceId}.ts`.

### Convenience Layer

A higher-level module at `src/lib/arr-service.ts` uses the registry internally and provides:

```typescript
async function getDashboardData(): Promise<DashboardData>;
async function getCategoryData<T>(category: string, options?: { services?: string[] }): Promise<Record<string, T>>;
```

- `getDashboardData()` fetches all categories for all services in parallel, computes aggregations (total queue, active downloads, health alerts, total disk), and returns a single structured response. The `/api/dashboard` route handler drops from 46 lines to ~5.
- `getCategoryData("health", { services: [...] })` fetches one category across N services. Used by `/api/health`, `/api/queues`, etc.

### What does NOT change

- `src/lib/services.ts` (ADR-0004) stays as the config registry
- `src/lib/auth.ts` stays as the Basic Auth helper
- The retry-with-backoff primitive is extracted into a shared utility (not a new seam, just deduplication)
- Mock data (ADR-0011) integrates at the adapter factory level — `USE_MOCK_DATA=true` returns mock adapters instead of real ones
- Jellyfin implements the same `ServiceAdapter` interface, making it a first-class service rather than a parallel fetch layer

## Consequences

**Positive:**
- **Locality** — Each service's API quirks (endpoint paths, response shapes, field names) live in one adapter file. Adding a new *arr service is one new file + one registry entry. Zero route handler changes.
- **Leverage** — The `/api/dashboard` route goes from 46 lines to ~5. The 7 `Promise.all` groups collapse into one. Category callers (`/api/health`, `/api/queues`) stop duplicating per-service branching logic.
- **No redundant calls** — Health + system info come from the same HTTP response, cutting the dashboard's fan-out by ~5 requests.
- **Jellyfin integrates** — No more parallel fetch infrastructure. Same retry, same capabilities, same error handling.
- **Test surface shrinks** — The `ServiceAdapter` interface is the test seam. Each adapter is testable in isolation with mocked transport. Route handlers become thin orchestration (testable with fake adapters).

**Negative:**
- **New abstraction** — Developers must learn the adapter pattern, registry, and capability model. Small upfront cost.
- **Overhead for trivial adapters** — Prowlarr's adapter (no queue, no disk) is mostly capability declarations and `undefined` returns.
- **Capabilities are static** — An adapter declares what it supports at construction time, not per-request. A service that intermittently supports a feature cannot reflect that.
- **Adapters don't compose** — A cross-service concern (e.g., disk dedup between Radarr and Sonarr) lives outside the adapter seam, in the route handler or convenience layer.

## Related

- ADR-0004: Service Registry Pattern — precedent for per-service configuration
- ADR-0002: Resilient Multi-Service Data Fetching — preserved, moved behind the seam
- ADR-0011: Mock Data Layer — mock adapters replace env-var short-circuits
