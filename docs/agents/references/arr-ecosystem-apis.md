# *arr Ecosystem API Reference (2026)

## Latest Versions

| App | Version | API Version |
|-----|---------|-------------|
| **Sonarr** | v4.0.17.2967 | v3 |
| **Radarr** | v6.2.0.10390 | v3 |
| **Prowlarr** | v2.3.7.5365 | v1 |
| **Jellyfin** | 10.11.9 | OAS3 (flat) |
| **Seerr** (Jellyseerr/Overseerr merge) | v3.2.0 | v1 |
| **Bazarr** | v1.5.7-beta.44 | Custom |

---

## 1. OpenAPI Spec Locations

Pull raw specs directly from repos (web docs may redirect/404):

| Service | OpenAPI Spec URL |
|---------|-----------------|
| **Sonarr** | `https://raw.githubusercontent.com/Sonarr/Sonarr/develop/src/Sonarr.Api.V3/openapi.json` |
| **Radarr** | `https://raw.githubusercontent.com/Radarr/Radarr/develop/src/Radarr.Api.V3/openapi.json` |
| **Prowlarr** | `https://raw.githubusercontent.com/Prowlarr/Prowlarr/develop/src/Prowlarr.Api.V1/openapi.json` |
| **Jellyfin** | `https://api.jellyfin.org/openapi.json` |
| **Seerr** | `https://github.com/seerr-team/seerr/blob/develop/seerr-api.yml` |
| **Bazarr** | No published OpenAPI spec |

Also served locally at `/api/swagger.json` on each *arr server (Sonarr, Radarr, Prowlarr).

---

## 2. Authentication

| Service | Auth Header | Notes |
|---------|------------|-------|
| **Sonarr** | `X-Api-Key: <key>` | |
| **Radarr** | `X-Api-Key: <key>` | |
| **Prowlarr** | `X-Api-Key: <key>` | Also accepts `apikey` header |
| **Jellyfin** | `Authorization: Bearer <token>` | Legacy: `X-Emby-Token` (deprecated) |
| **Seerr** | `X-Api-Key: <key>` | Also supports cookie auth (`connect.sid`) |
| **Bazarr** | `X-Api-Key: <key>` | |

---

## 3. Endpoints

### Sonarr (port 7878, base `/api/v3`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v3/series` | List all series |
| POST | `/api/v3/series` | Add a new series |
| GET | `/api/v3/series/{id}` | Get series details |
| PUT | `/api/v3/series/{id}` | Update a series |
| DELETE | `/api/v3/series/{id}` | Delete a series |
| GET | `/api/v3/episode` | List episodes (filterable) |
| GET | `/api/v3/episode/{id}` | Episode details |
| PUT | `/api/v3/episode/monitor` | Bulk-monitor episodes |
| GET | `/api/v3/calendar` | Calendar events |
| GET | `/api/v3/queue` | Download queue |
| GET | `/api/v3/queue/details` | Queue details |
| POST | `/api/v3/command` | Execute a command (e.g. "RescanSeries") |
| GET | `/api/v3/system/status` | System health/status |
| GET | `/api/v3/health` | Health check |

### Radarr (port 7878, base `/api/v3`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v3/movie` | List all movies |
| POST | `/api/v3/movie` | Add a new movie |
| GET | `/api/v3/movie/{id}` | Get movie details |
| PUT | `/api/v3/movie/{id}` | Update a movie |
| DELETE | `/api/v3/movie/{id}` | Delete a movie |
| GET | `/api/v3/movie/lookup` | Lookup movies by TMDB/IMDb ID |
| GET | `/api/v3/rootfolder` | List root folders |
| GET | `/api/v3/qualityprofile` | List quality profiles |
| GET | `/api/v3/queue/details` | Queue details |
| POST | `/api/v3/command` | Execute a command |
| GET | `/api/v3/system/status` | System status |
| GET | `/api/v3/health` | Health check |

### Prowlarr (port 9696, base `/api/v1`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/indexer` | List all configured indexers |
| POST | `/api/v1/indexer` | Create a new indexer |
| GET | `/api/v1/indexer/{id}` | Retrieve a single indexer |
| PUT | `/api/v1/indexer/{id}` | Update an indexer |
| DELETE | `/api/v1/indexer/{id}` | Delete an indexer |
| POST | `/api/v1/indexer/test` | Test a single indexer |
| POST | `/api/v1/indexer/testall` | Test all indexers |
| GET | `/api/v1/indexer/categories` | List default categories |
| GET | `/api/v1/indexer/status` | Indexer status |
| GET | `/api/v1/search` | Search across indexers |
| GET | `/api/v1/downloadclient` | List download clients |
| GET | `/api/v1/system/status` | System health |

### Jellyfin (port 8096, flat routes)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/Sessions/Playing` | Report playback start |
| POST | `/Sessions/Playing/Progress` | Report playback progress |
| POST | `/Sessions/Playing/Stopped` | Report playback stop (scrobble) |
| GET | `/Users/{userId}/Items` | List library items for user |
| GET | `/Users/{userId}/Items/{itemId}` | Get item details |
| GET | `/System/Info` | Server information |
| GET | `/System/Info/Public` | Public server info (no auth) |
| GET | `/Health` | Health check |
| GET | `/Users` | List users (admin) |

Official SDKs: TypeScript, Kotlin, Swift, Dart/Flutter, C#/.NET

### Seerr (merged Jellyseerr/Overseerr, base `/api/v1`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/status` | Service health/status |
| GET | `/api/v1/request` | List all media requests |
| POST | `/api/v1/request` | Create a new request |
| GET | `/api/v1/request/{id}` | Get request details |
| PUT | `/api/v1/request/{id}` | Update/approve/deny request |
| DELETE | `/api/v1/request/{id}` | Delete a request |
| GET | `/api/v1/user` | List/get users |
| GET | `/api/v1/settings` | Get global settings |
| PUT | `/api/v1/settings` | Update settings |
| GET | `/api/v1/search/{query}` | Search TMDB for media |

Docs: https://docs.seerr.dev/api/seerr-api

### Bazarr (base `/api/v1`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/subtitles` | List subtitles for media item |
| POST | `/api/v1/subtitles` | Upload subtitle file |
| DELETE | `/api/v1/subtitles/{id}` | Delete a subtitle |
| GET | `/api/v1/subtitles/search` | Search external providers |
| POST | `/api/v1/subtitles/download` | Trigger subtitle download |
| GET | `/api/v1/system/status` | System status |

Bazarr has limited/undocumented API — treat as fragile.

---

## 4. Cross-Service Integration Pattern

```
User Request → Seerr ──TMDB ID──→ Radarr/Sonarr ──→ Prowlarr (indexer search)
                                  ↓
                              Download Client
                                  ↓
                              Jellyfin (media server)
                                  ↓
                              Bazarr (subtitle download)
```

### Glue: External IDs
- **TMDB ID** is the canonical cross-service identifier
- Pass `tmdbId` in Radarr/Sonarr lookup/add payloads
- Radarr also accepts `imdbId`

---

## 5. Default Ports

| Service | Port |
|---------|------|
| Radarr | 7878 |
| Sonarr | 8989 |
| Prowlarr | 9696 |
| Jellyfin | 8096 |
| Seerr | 5055 |
| Bazarr | 6767 |

---

## 6. Health Check / Pre-Flight

Always check service health before bulk operations:
- `/api/v3/health` (Sonarr, Radarr)
- `/api/v1/system/status` (Prowlarr)
- `/Health` (Jellyfin)
- `/api/v1/status` (Seerr)

---

## 7. Official Docs URLs

- Sonarr: https://sonarr.tv/docs/api/
- Radarr: https://radarr.video/docs/api/
- Prowlarr: https://prowlarr.com/docs/api/
- Jellyfin: https://api.jellyfin.org/
- Seerr: https://docs.seerr.dev/api/seerr-api
- Bazarr: https://bazarr.ericweissgerber.com/api/ (mostly broken, returns 301)
- Servarr Wiki: https://wiki.servarr.com/
