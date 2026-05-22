# ADR-0001: Next.js App Router with Server-Side Aggregation

## Status
Accepted

## Context
The dashboard needs to aggregate health, queue, disk, and activity data from multiple *arr services. Each service runs on a different port authenticated by its own API key. Direct browser-to-service calls would require per-service CORS configuration and expose internal network topology to the client.

## Decision
Use Next.js App Router with server-side API route handlers for read-oriented data aggregation (health, queue, disk, activity), paired with Next.js URL rewrite proxies for direct service actions (search, pause, refresh) that require the full service API surface.

## Consequences
**Positive:**
- API keys are never exposed to third-party origins (all traffic stays within the dashboard origin)
- Server-side aggregation reduces client complexity

**Negative:**
- API keys are transmitted from the browser to the Next.js server via request headers on the rewrite proxy path, making them accessible in browser memory
- Two distinct data paths exist (aggregated reads vs. direct action calls) — see ADR-0006
