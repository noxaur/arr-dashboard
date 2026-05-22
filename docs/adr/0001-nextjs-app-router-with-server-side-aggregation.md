# ADR-0001: Next.js App Router with Server-Side Aggregation

## Status
Accepted

## Context
The dashboard needs to aggregate health, queue, disk, and activity data from multiple *arr services. Each service runs on a different port authenticated by its own API key. Direct browser-to-service calls would require per-service CORS configuration and expose internal network topology to the client.

## Decision
Use Next.js App Router with server-side API route handlers for read-oriented data aggregation (health, queue, disk, activity), paired with Next.js URL rewrite proxies for arbitrary service API access that requires the full service API surface.

## Consequences
**Positive:**
- API keys are not exposed to third-party origins (all traffic stays within the dashboard origin)
- Server-side aggregation reduces client complexity
- URL rewrites preserve the full API surface of each service without needing custom aggregation endpoints

**Negative:**
- Two distinct data paths exist (aggregated reads via GET /api/dashboard vs. direct service access via URL rewrite proxy) — see ADR-0006
- URL rewrites require forwarding API keys from the browser to the target service via request headers, making keys accessible in browser memory
- The server-side actions endpoint (POST /api/actions) mitigates the key exposure concern for predefined operations but adds a second direct-access mechanism
