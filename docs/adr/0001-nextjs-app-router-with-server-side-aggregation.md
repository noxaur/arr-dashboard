# ADR-0001: Next.js App Router with Server-Side Aggregation

## Status
Accepted

## Context
[Need a unified dashboard that aggregates health, queue, disk, activity data from multiple *arr services without exposing internal network details]

## Decision
[Next.js App Router with all API routes aggregated server-side, URL rewrite proxy for direct service access]

## Consequences
**Positive:**
- API keys remain same-origin (all traffic stays within the dashboard origin) and are not exposed to third-party origins — see ADR-0006 for the rewrite proxy path where keys are browser-accessible
- Server-side aggregation reduces client complexity

**Negative:**
- API keys are transmitted from the browser to the Next.js server via request headers on the rewrite proxy path, making them accessible in browser memory
- Two distinct data paths exist (aggregated reads vs. direct action calls) — see ADR-0006
