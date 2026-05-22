# ADR-0001: Next.js App Router with Server-Side Aggregation

## Status
Accepted

## Context
[Need a unified dashboard that aggregates health, queue, disk, activity data from multiple *arr services without exposing internal network details]

## Decision
[Next.js App Router with all API routes aggregated server-side, server-side API route for direct service actions]

## Consequences
**Positive:**
- API keys are never exposed to the client or third-party origins (all traffic stays server-side within the dashboard origin)
- Server-side aggregation reduces client complexity

**Negative:**
- Two distinct data paths exist (aggregated reads via GET /api/dashboard vs. direct action calls via POST /api/actions) — see ADR-0006
