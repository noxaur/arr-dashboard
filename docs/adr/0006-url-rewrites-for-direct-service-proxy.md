# ADR-0006: URL Rewrites and Server-Side Actions for Direct Service Access

## Status
Accepted

## Context
Some dashboard interactions need to reach *arr services directly rather than through aggregated server-side endpoints. These include arbitrary API calls (using the full service API surface) and predefined actions (search, pause, refresh). Two mechanisms exist for direct access, each suited to different use cases.

## Decision

### URL Rewrite Proxy
Use Next.js URL rewrites to proxy `/api/{service}/:path*` request paths directly to the corresponding *arr service URL, forwarding the original request headers from the browser to the target service. This provides full access to each service's API surface without building custom aggregation handlers.

### Server-Side Actions API
Provide a `POST /api/actions` endpoint that receives `{ service, action }` from the client and calls server-side API functions. API keys stay server-side, read from environment variables at runtime. Origin header validation prevents CSRF. Available actions: pause queue, refresh monitored, search missing.

## Consequences
**Positive:**
- URL rewrites preserve the full API surface of each service without needing custom endpoint maintenance
- The server-side actions endpoint keeps API keys server-side for predefined operations
- The same AbortSignal timeout and retry logic from aggregated reads apply to the actions endpoint
- Rewrite-based access requires no backend changes when a service adds new API endpoints

**Negative:**
- URL rewrites transmit API keys from the browser to the Next.js server via request headers — while same-origin, keys are accessible in browser memory. See ADR-0001.
- The actions endpoint is limited to predefined operations (pause, refresh, search)
- Adding new actions requires updating both the route handler and client-side code
- Having two direct-access mechanisms adds architectural complexity
