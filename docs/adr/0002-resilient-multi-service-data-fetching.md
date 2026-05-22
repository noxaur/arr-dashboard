# ADR-0002: Resilient Multi-Service Data Fetching

## Status
Accepted

## Context
[Dashboard must aggregate health, queue, disk, activity data from 5+ services without one failure blocking the entire page]

## Decision
[Promise.allSettled across all services, per-service error fallbacks, 30s auto-refresh]

## Consequences
**Positive:**
- One failing service never blocks the dashboard
- Each data category (health, queue, etc.) independently resilient

**Negative:**
- Unlike Promise.all (which short-circuits on the first rejection), Promise.allSettled always waits for every promise to complete, so a single hung service will delay the entire dashboard response regardless of success or failure
