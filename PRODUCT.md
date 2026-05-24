# Product

## Register

product

## Users

Self-hosters and home media server enthusiasts who run multiple *arr services (Radarr, Sonarr, Prowlarr, Bazarr, Jellyseerr) alongside Jellyfin. Users are technically proficient, value information density, and want a single-pane-of-glass view of their entire media stack. They check the dashboard while managing their homelab, often at a desk with a large monitor in a dim room.

## Product Purpose

A unified, self-hosted monitoring dashboard that aggregates health, queue, disk usage, and activity data from the *arr ecosystem into one place. It exists to eliminate the need to check five separate UIs for status — success means the user can glance at one screen and know the state of their entire stack.

## Brand Personality

Technical, serious, precise. The dashboard communicates confidence through restraint: clean typography, deliberate spacing, and information density that respects the user's expertise. No decoration that doesn't carry data.

## Anti-references

Not a generic SaaS dashboard. Avoid cream-and-blue admin templates, flat card grids with identical icon-heading-text patterns, and the polished-but-vapid look of products that prioritize aesthetics over utility. This is a tool, not a marketing page.

## Design Principles

1. **Data first, chrome second.** Every pixel should either carry information or create space to read information. Decorative elements earn their keep.
2. **Respect the operator.** The user is technically literate. Don't explain, don't simplify, don't add friction between them and the data.
3. **Consistency is trust.** The same data appears the same way everywhere. Same spacing, same colors, same patterns — so anomalies are instantly visible.
4. **Dark by necessity, not by fashion.** The dashboard serves users checking status in dim environments. Dark mode is functional, not aesthetic.

## Visual Identity

The dashboard inherits the Jellyfin visual language (defined in DESIGN.md) through a **product-register lens** — design serves the task, not the brand.

- **Canvas** `#000b25` — a near-black navy that recedes behind data. Surface contrast (background shifts, not shadows) establishes hierarchy: canvas → surface → card → elevated.
- **Primary** `#007ca6` — teal-blue reserved for interactive accents only: active nav, focused elements, state indicators. Restrained by default, never decorative.
- **Semantic palette** — green `#00a400` (success), red `#fa383e` (danger), amber `#ffba00` (warning) for status badges, queue indicators, and health alerts.
- **Typeface** — Noto Sans at weights 300 (data-display headings) / 400 (body, labels) / 500 (nav) / 700 (buttons, strong). A single sans family carries the entire UI; no display or serif faces on dashboard surfaces.
- **Type scale** — fixed rem values with a ~1.2 ratio between steps. No fluid or clamp-sized headings. Line length capped at 75ch for prose; data tables and compact panels run denser.
- **Shapes** — pill radius (30 px) on action buttons, 8 px on cards and inputs, square on icon buttons. The pill is the signature interactive geometry.
- **Motion** — 150–250 ms transitions on state changes only. No decorative animation, no orchestrated page-load sequences. Exponential easing curves.
- **Elevation** — background color shifts for depth. No drop-shadows on cards. Shadows reserved for overlays and modals only.

## Accessibility & Inclusion

WCAG AA compliance. Keyboard-navigable interface. Proper focus indicators. Semantic HTML and ARIA labels where needed. Respect prefers-reduced-motion.
