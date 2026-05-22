# ADR-0006: URL Rewrites for Direct Service Proxy

## Status
Accepted

## Context
[Some dashboard interactions (search, pause, refresh) need to reach services directly, not through aggregated endpoints]

## Decision
[Next.js URL rewrites proxy certain paths directly to service URLs, forwarding headers including API keys]

## Consequences
**Positive:**
- Direct actions preserve the full API surface of each service

**Negative:**
- API keys are transmitted from the browser to the Next.js server via the rewrite proxy headers. While this keeps keys within the same origin (no cross-origin CORS exposure), they are accessible in browser memory. See ADR-0001 for the aggregated (read) data path where API keys stay entirely server-side with no browser exposure.
