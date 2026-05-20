# Request Management & Discovery — Feature Spec

**Date:** 2026-05-20
**Status:** Planned (not yet implemented)
**Priority:** Feature request

## Overview

A full-featured content discovery and request management system integrated into the *arr dashboard. Think Jellyseerr-like functionality but unified across all services, with rich metadata, favorites, watch history, and a request workflow.

## User Stories

### Discovery & Search
- As a user, I want to search for movies and TV shows from a unified search bar
- As a user, I want to browse trending, popular, recently released, and upcoming content
- As a user, I want to see rich details: poster, backdrop banner, trailer, ratings (TMDB, IMDb, Rotten Tomatoes), cast, genres, runtime, release status
- As a user, I want to filter by type (movie/TV), genre, year, rating, language

### Request Workflow
- As a user, I want to request a movie or TV show with options:
  - Quality profile (4K, 1080p, 720p, etc.)
  - Root folder selection
  - Language/subtitle preferences
  - Season selection (for TV shows)
  - Tags/notes for the request
- As a user, I want to see request status: pending, approved, processing, available, declined
- As a user, I want to cancel my own pending requests

### Favorites & Watchlist
- As a user, I want to mark content as favorite
- As a user, I want a personal watchlist of content I plan to watch
- As a user, I want to see when favorites become available

### Watch History
- As a user, I want to mark content as watched
- As a user, I want a history of everything I've watched
- As a user, I want to see recommendations based on watch history

### Request Management (`/requests`)
- As a user, I want to see all my requests in one place
- As a user, I want to filter requests by status (pending, approved, available, declined)
- As an admin, I want to approve/decline requests from other users
- As a user, I want to see request details (who requested, when, quality, root folder)

### Rich Metadata Integration
- **TMDB** — primary source for posters, backdrops, cast, crew, genres, overview, trailers
- **IMDb** — rating score, top 250 status
- **Rotten Tomatoes** — Tomatometer score, audience score
- **Trakt** — watch stats, trending data
- **Subtitles** — available subtitle languages, subtitle search results
- **Banners/Art** — fanart, clear logos, character art, season posters

## Architecture

### Data Sources
- **TMDB API** — free, comprehensive metadata (movies, TV, people, images, videos)
- **OMDb API** or **TMDb** for IMDb ratings (IMDb doesn't have a public API)
- **Rotten Tomatoes** — no public API; would need scraping or third-party service
- **Trakt API** — watch history, trending, recommendations
- **Existing *arr APIs** — Radarr/Sonarr for existing library, request fulfillment

### New Backend Routes
```
GET  /api/search?query=&type=    # Search TMDB for movies/TV
GET  /api/discover?type=         # Browse trending/popular/upcoming
GET  /api/content/:id            # Full details for a movie/TV show
GET  /api/content/:id/trailer    # Trailer/teaser videos
GET  /api/content/:id/ratings    # Aggregated ratings (TMDB, IMDb, RT)
GET  /api/content/:id/images     # Posters, backdrops, banners
GET  /api/content/:id/cast       # Cast & crew
GET  /api/favorites              # User's favorites
POST /api/favorites              # Add to favorites
DELETE /api/favorites/:id        # Remove from favorites
GET  /api/watchlist              # User's watchlist
POST /api/watchlist              # Add to watchlist
DELETE /api/watchlist/:id        # Remove from watchlist
GET  /api/watch-history          # User's watch history
POST /api/watch-history          # Mark as watched
GET  /api/requests               # All requests (filtered by user/role)
POST /api/requests               # Create a new request
PATCH /api/requests/:id          # Update request status (approve/decline)
DELETE /api/requests/:id         # Cancel/delete request
GET  /api/recommendations        # Personalized recommendations
```

### Database Schema (SQLite or Supabase)
```
users (id, username, role, created_at)
favorites (id, user_id, tmdb_id, media_type, created_at)
watchlist (id, user_id, tmdb_id, media_type, created_at)
watch_history (id, user_id, tmdb_id, media_type, watched_at, rating)
requests (
  id, user_id, tmdb_id, media_type,
  quality_profile, root_folder, language,
  seasons (for TV), tags, notes,
  status (pending|approved|processing|available|declined),
  created_at, updated_at, approved_by
)
```

### Frontend Pages
```
/search              — Unified search with filters, grid results
/content/:id         — Detail page: poster, banner, trailer, ratings, cast, request button
/favorites           — User's favorites grid
/watchlist           — User's watchlist
/watch-history       — User's watch history with ratings
/requests            — Request management (all statuses, approve/decline for admins)
```

### Frontend Components
- `SearchBar` — global search with autocomplete
- `ContentCard` — poster + title + year + rating + status badge
- `ContentGrid` — responsive grid of ContentCards with pagination/infinite scroll
- `ContentDetail` — full detail view (banner, poster, trailer embed, ratings, cast, request form)
- `RequestForm` — quality, folder, language, seasons, tags
- `RequestList` — filterable list of requests with status pills
- `RatingBadge` — aggregated rating display (TMDB/IMDb/RT)
- `TrailerPlayer` — embedded YouTube trailer
- `CastCarousel` — horizontal scroll of cast photos
- `BackdropBanner` — hero backdrop image with gradient overlay

## Dependencies
- TMDB API key (free at themoviedb.org)
- Trakt API key (free)
- Database for user data (SQLite for local, Supabase for hosted)
- Existing *arr API keys (already configured)

## Implementation Phases

### Phase 1: Search & Discovery
- TMDB integration, search, browse pages
- Content detail pages with posters, ratings, trailers
- Basic request form (quality, root folder)

### Phase 2: Request Management
- Request workflow (create, approve, decline, fulfill)
- `/requests` page with filtering
- Integration with Radarr/Sonarr for actual fulfillment

### Phase 3: Personal Features
- Favorites, watchlist, watch history
- User authentication/sessions
- Recommendations based on history

### Phase 4: Rich Metadata
- Aggregated ratings (TMDB + IMDb + RT)
- Full image gallery (banners, logos, character art)
- Cast/crew detail pages
- Subtitle availability display

## Open Questions
1. Multi-user support or single-user? (affects auth model)
2. Self-hosted database (SQLite) or Supabase?
3. Rotten Tomatoes data source (no public API)?
4. Should this replace Jellyseerr or complement it?
5. Admin vs. user roles needed, or just single user?
