# ADR-0004: Service Registry Pattern

## Status
Accepted

## Context
The dashboard manages configuration for five *arr services (Radarr, Sonarr, Prowlarr, Bazarr, Jellyseerr). Each service has a URL and an API key. These values must be accessed from multiple modules without scattering environment variable reads across the codebase.

## Decision
Define a module-level service registry object that reads environment variables at import time. Each service entry stores its URL and the name of its API key environment variable (not the key itself). The actual API key is read at runtime in the fetch layer.

## Consequences
**Positive:**
- Single source of truth for service configuration
- Easy to add or modify services
- API key values are not held in the registry object — only env var names are stored, so keys are never accidentally serialized or logged

**Negative:**
- Registry is loaded once per process (Node.js module cache), so URL values are captured at import time and won't reflect runtime env changes without a restart
