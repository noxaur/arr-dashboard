# ADR-0006: Server-Side Actions API for Direct Service Interactions

## Status
Accepted

## Context
[Some dashboard interactions (search, pause, refresh) need to perform actions on services directly, not through aggregated read endpoints]

## Decision
[POST /api/actions endpoint that receives { service, action } from the client and calls server-side API functions. API keys remain server-side, read from environment variables at runtime.]

## Consequences
**Positive:**
- Actions are authenticated using env-var API keys server-side; no CORS issues
- The same AbortSignal timeout and retry logic from aggregated reads apply
- Origin header is validated to prevent CSRF

**Negative:**
- Actions are limited to predefined operations (pause, refresh, search) and don't expose the full API surface of each service
- Adding new actions requires updating both the route handler and client-side code
