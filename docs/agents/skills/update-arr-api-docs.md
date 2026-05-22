# Update *arr API Docs

Trigger: A breaking change in one of the *arr ecosystem apps — Sonarr, Radarr, Prowlarr, Jellyfin, Seerr (merged Jellyseerr/Overseerr), or Bazarr. This includes version bumps, auth changes, endpoint deprecations, or API schema alterations.

Output: Update `docs/agents/arr-ecosystem-apis.md` with the latest information.

## Workflow

### 1. Identify affected service

Ask the user which service changed. If unknown, check GitHub releases for all six.

### 2. Find the new version

Search GitHub releases for the affected service to find the latest version tag. Use the repository URLs below to locate the latest release.

### 3. Fetch the OpenAPI spec

Download the raw spec from the source repository:

| Service | OpenAPI Spec URL |
|---------|-----------------|
| **Sonarr** | `https://raw.githubusercontent.com/Sonarr/Sonarr/develop/src/Sonarr.Api.V3/openapi.json` |
| **Radarr** | `https://raw.githubusercontent.com/Radarr/Radarr/develop/src/Radarr.Api.V3/openapi.json` |
| **Prowlarr** | `https://raw.githubusercontent.com/Prowlarr/Prowlarr/develop/src/Prowlarr.Api.V1/openapi.json` |
| **Jellyfin** | `https://api.jellyfin.org/openapi.json` |
| **Seerr** | `https://github.com/seerr-team/seerr/blob/develop/seerr-api.yml` |
| **Bazarr** | No published spec — inspect source repo for API changes |

Parse the spec for:
- New, changed, or removed endpoints
- Changed auth methods or headers
- New required fields in request or response schemas
- Modified base paths or versioning

### 4. Compare with current reference

Read `docs/agents/arr-ecosystem-apis.md` and identify every section that needs updating:

- [ ] **Latest Versions** — bump the version number
- [ ] **OpenAPI Spec Locations** — update URLs if changed
- [ ] **Authentication** — update headers if auth scheme changed
- [ ] **Endpoints** — add new, update modified, remove deprecated
- [ ] **Cross-Service Integration Pattern** — update if flow changed
- [ ] **Default Ports** — update if changed
- [ ] **Health Check / Pre-Flight** — update if endpoints changed
- [ ] **Official Docs URLs** — update if documentation site changed

### 5. Update the file

Make surgical edits to `docs/agents/arr-ecosystem-apis.md`. Only change the sections that are affected. Do not reformat or restructure the file — match existing style exactly.

### 6. Verify

- Confirm the new version string is correct against GitHub releases
- Confirm auth headers match the OpenAPI spec
- Confirm every endpoint path matches the spec exactly
- Confirm no stale information remains (old versions, removed endpoints)
- Read the final file once to catch formatting or consistency issues

## Reference architecture

The *arr ecosystem integration flow:

```
User Request → Seerr ──TMDB ID──→ Radarr/Sonarr ──→ Prowlarr (indexer search)
                                  ↓
                              Download Client
                                  ↓
                              Jellyfin (media server)
                                  ↓
                              Bazarr (subtitle download)
```

TMDB ID is the canonical cross-service identifier. Radarr also accepts IMDb IDs.

## Repositories

| Service | Repository |
|---------|-----------|
| Sonarr | https://github.com/Sonarr/Sonarr |
| Radarr | https://github.com/Radarr/Radarr |
| Prowlarr | https://github.com/Prowlarr/Prowlarr |
| Jellyfin | https://github.com/jellyfin/jellyfin |
| Seerr | https://github.com/seerr-team/seerr |
| Bazarr | https://github.com/morpheus65535/bazarr |
