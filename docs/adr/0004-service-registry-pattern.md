# ADR-0004: Service Registry Pattern

## Status
Accepted

## Context
[Need to centralize service config to avoid scattered env var reads]

## Decision
[Module-level service registry object loaded from env vars at import time]

## Consequences
**Positive:**
- Single source of truth for service configuration
- Easy to add/modify services

**Negative:**
- Registry is loaded once per process (Node.js module cache), but the env-read values inside it (url, apiKey) are captured at import time and won't reflect runtime env changes without a restart
