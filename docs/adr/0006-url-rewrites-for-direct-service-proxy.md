# ADR-0006: URL Rewrites for Direct Service Proxy

## Status
Accepted

## Context
Some dashboard interactions (search, pause, refresh) need to reach *arr services directly rather than through aggregated server-side endpoints. These actions use service-specific APIs that would require ongoing maintenance if proxied through custom aggregation handlers.

## Decision
Use Next.js URL rewrites to proxy certain request paths directly to *arr service URLs, forwarding the original request headers — including API keys — from the browser to the target service. This avoids building and maintaining custom aggregation endpoints for every possible service action.

## Consequences
**Positive:**
- Direct actions preserve the full API surface of each service without needing custom endpoint maintenance
- Avoids duplicating service API logic in the dashboard backend

**Negative:**
- API keys are transmitted from the browser to the Next.js server via the rewrite proxy headers. While this keeps keys within the same origin (no cross-origin CORS exposure), they are accessible in browser memory. See ADR-0001 for the server-side aggregation path that keeps keys fully server-side.
