---
version: alpha
name: Jellyfin-Wired-Design
description: Jellyfin's media-server brand fused with Wired's editorial structure. Jellyfin brings a dark-navy canvas, a teal-cyan primary, a purple-to-cyan gradient brandmark, pill-shaped buttons, and Noto Sans typography. Wired contributes its magazine-grid layout, editorial serif pairing, square-geometry counterpoints, and story-card hierarchy. The hybrid reads as a dark-theme SaaS marketing surface with editorial DNA.

colors:
  primary: "#007ca6"
  primary-light: "#00afeb"
  primary-dark: "#006385"
  primary-darker: "#003c50"
  on-primary: "#ffffff"
  accent-gradient-start: "#AA5CC3"
  accent-gradient-end: "#00A4DC"
  ink: "#ffffff"
  ink-soft: "#ebedf0"
  body: "#e3e3e3"
  body-muted: "#bec3c9"
  hairline: "#444950"
  canvas: "#000b25"
  canvas-surface: "#242526"
  canvas-card: "#172138"
  canvas-soft: "#1c1e21"
  canvas-elevated: "#333c44"
  link: "#007ca6"
  link-hover: "#00afeb"
  success: "#00a400"
  danger: "#fa383e"
  warning: "#ffba00"

typography:
  display-hero:
    fontFamily: "Noto Sans", sans-serif
    fontSize: 33px
    fontWeight: 300
    lineHeight: 45px
  display-lg:
    fontFamily: "Noto Sans", sans-serif
    fontSize: 28px
    fontWeight: 300
    lineHeight: 38px
  display-md:
    fontFamily: "Noto Sans", sans-serif
    fontSize: 24px
    fontWeight: 700
    lineHeight: 32px
  display-sm:
    fontFamily: "Noto Sans", sans-serif
    fontSize: 20px
    fontWeight: 700
    lineHeight: 28px
  display-xs:
    fontFamily: "Noto Sans", sans-serif
    fontSize: 16px
    fontWeight: 700
    lineHeight: 22px
  body-lg:
    fontFamily: "Noto Sans", sans-serif
    fontSize: 18px
    fontWeight: 400
    lineHeight: 30px
  body-md:
    fontFamily: "Noto Sans", sans-serif
    fontSize: 16px
    fontWeight: 400
    lineHeight: 27px
  body-md-strong:
    fontFamily: "Noto Sans", sans-serif
    fontSize: 16px
    fontWeight: 700
    lineHeight: 27px
  body-sm:
    fontFamily: "Noto Sans", sans-serif
    fontSize: 14px
    fontWeight: 400
    lineHeight: 21px
  body-sm-strong:
    fontFamily: "Noto Sans", sans-serif
    fontSize: 14px
    fontWeight: 700
    lineHeight: 21px
  caption:
    fontFamily: "Noto Sans", sans-serif
    fontSize: 12px
    fontWeight: 400
    lineHeight: 16px
  button-md:
    fontFamily: "Noto Sans", sans-serif
    fontSize: 19px
    fontWeight: 700
    lineHeight: 27px
  button-sm:
    fontFamily: "Noto Sans", sans-serif
    fontSize: 16px
    fontWeight: 700
    lineHeight: 22px
  editor-heading:
    fontFamily: "Noto Sans", sans-serif
    fontSize: 33px
    fontWeight: 300
    lineHeight: 45px
    letterSpacing: -0.5px
  editor-display:
    fontFamily: WiredDisplay, "Times New Roman", Georgia, serif
    fontSize: 64px
    fontWeight: 400
    lineHeight: 59.52px
    letterSpacing: -0.5px
  editor-lg:
    fontFamily: WiredDisplay, "Times New Roman", Georgia, serif
    fontSize: 48px
    fontWeight: 400
    lineHeight: 50.4px
    letterSpacing: -0.4px
  editor-md:
    fontFamily: WiredDisplay, "Times New Roman", Georgia, serif
    fontSize: 32px
    fontWeight: 400
    lineHeight: 35.2px
    letterSpacing: -0.3px
  editor-body-serif:
    fontFamily: BreveText, Georgia, "Times New Roman", serif
    fontSize: 16px
    fontWeight: 400
    lineHeight: 24px
    letterSpacing: 0.09px

rounded:
  none: 0px
  sm: 4px
  md: 8px
  lg: 12px
  pill: 30px
  full: 9999px

spacing:
  xxs: 2px
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 20px
  2xl: 24px
  3xl: 32px
  4xl: 48px

components:
  nav-bar:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm-strong}"
    height: 60px
    padding: "{spacing.sm} {spacing.lg}"
  nav-link:
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    fontWeight: 500
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.pill}"
    padding: "{spacing.sm} {spacing.3xl}"
    border: "1px solid {colors.primary}"
  button-outline:
    backgroundColor: transparent
    textColor: "{colors.ink}"
    borderColor: "{colors.ink-soft}"
    typography: "{typography.button-md}"
    rounded: "{rounded.pill}"
    padding: "{spacing.sm} {spacing.3xl}"
    border: "1px solid {colors.ink-soft}"
  button-ghost:
    backgroundColor: transparent
    textColor: "{colors.primary}"
    typography: "{typography.button-sm}"
    rounded: "{rounded.pill}"
    padding: "{spacing.xs} {spacing.lg}"
  button-icon-square:
    backgroundColor: transparent
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "{spacing.sm}"
  text-input:
    backgroundColor: "{colors.canvas-surface}"
    textColor: "{colors.ink}"
    borderColor: "{colors.hairline}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: "{spacing.sm} {spacing.lg}"
  card:
    backgroundColor: "{colors.canvas-card}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: "{spacing.lg}"
    boxShadow: none
  card-elevated:
    backgroundColor: "{colors.canvas-elevated}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: "{spacing.lg}"
  feature-card:
    backgroundColor: transparent
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    padding: "{spacing.none} {spacing.lg}"
  hero-band:
    backgroundColor: "{colors.canvas-surface}"
    textColor: "{colors.ink}"
    typography: "{typography.display-hero}"
    padding: "{spacing.4xl} {spacing.xl}"
    textAlign: center
  hero-subtitle:
    textColor: "{colors.ink-soft}"
    typography: "{typography.body-lg}"
    textAlign: center
  section-heading:
    textColor: "{colors.ink}"
    typography: "{typography.display-lg}"
    textAlign: center
  hairline-divider:
    borderColor: "{colors.hairline}"
  footer:
    backgroundColor: "{colors.canvas-elevated}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    padding: "{spacing.3xl}"
  badge:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.caption}"
    rounded: "{rounded.sm}"
    padding: "{spacing.xxs} {spacing.sm}"

  # ─── Examples (illustrative) ───
  ex-pricing-tier:
    description: "Default Pricing tier card."
    backgroundColor: "{colors.canvas-card}"
    textColor: "{colors.ink}"
    borderColor: "{colors.hairline}"
    rounded: "{rounded.md}"
    padding: "{spacing.lg}"
  ex-pricing-tier-featured:
    description: "Featured/highlighted tier — primary gradient border."
    backgroundColor: "{colors.canvas-card}"
    textColor: "{colors.ink}"
    borderColor: "{colors.primary}"
    rounded: "{rounded.md}"
    padding: "{spacing.lg}"
  ex-app-shell-row:
    description: "Sidebar nav row. Active state uses brand primary as indicator."
    backgroundColor: "{colors.canvas}"
    activeIndicator: "{colors.primary}"
    rounded: "{rounded.sm}"
    padding: "{spacing.md} {spacing.lg}"
  ex-data-table-cell:
    description: "Default data-table th + td chrome."
    headerBackground: "{colors.canvas-surface}"
    headerTypography: "{typography.caption}"
    bodyTypography: "{typography.body-sm}"
    cellPadding: "{spacing.md} {spacing.lg}"
    rowBorder: "{colors.hairline}"
  ex-auth-form-card:
    description: "Sign-in / sign-up card."
    backgroundColor: "{colors.canvas-card}"
    rounded: "{rounded.md}"
    padding: "{spacing.lg}"
  ex-modal-card:
    description: "Modal dialog surface."
    backgroundColor: "{colors.canvas-surface}"
    rounded: "{rounded.md}"
    padding: "{spacing.lg}"
  ex-empty-state-card:
    description: "Empty-state illustration frame."
    backgroundColor: "{colors.canvas-card}"
    rounded: "{rounded.md}"
    padding: "{spacing.3xl}"
    captionTypography: "{typography.body-md}"
  ex-toast:
    description: "Toast notification surface."
    backgroundColor: "{colors.canvas-elevated}"
    rounded: "{rounded.md}"
    padding: "{spacing.md} {spacing.lg}"
    typography: "{typography.body-sm}"
  ex-page-header:
    description: "Marketing page hero section."
    backgroundColor: "{colors.canvas-surface}"
    textColor: "{colors.ink}"
    padding: "{spacing.4xl} {spacing.xl}"
    textAlign: center

---


## Overview

Jellyfin is the volunteer-built, free-software media system. Its web surface (built on Docusaurus / Infima) is a **dark-theme-first** marketing site: a deep-navy canvas (`{colors.canvas}` `#000b25`), a teal-cyan primary (`{colors.primary}` `#007ca6`), a signature purple-to-cyan brand gradient (visible in the logo), pill-shaped buttons (`{rounded.pill}` 30 px), and `Noto Sans` as the sole typeface across headings and body.

The brand lives in the contrast between the near-black canvas and the glowing teal interactive elements. The hero/subtitle combo sits centred with a light 300-weight heading. Feature cards are transparent on the dark canvas with a soft icon + heading + description layout. Pill-shaped CTAs (solid primary fill or white-outline) carry the call-to-action rhythm.

Wired's editorial DNA is preserved as an **optional editorial layer** — a serif display system (`WiredDisplay` / `BreveText`) for editorial content pages, magazine-style story grids, and article detail views within the same app. The two modes share the same spacing scale and component vocabulary.

**Key Characteristics:**
- Dark theme: canvas `#000b25`, surface `#242526`, card `#172138`, elevated `#333c44`.
- Brand primary `{colors.primary}` (`#007ca6`) — a teal-blue used for links, filled buttons, active states, and the accent gradient.
- Purple-to-cyan gradient (`#AA5CC3` → `#00A4DC`) in the logo and brandmark only.
- Single typeface: `"Noto Sans", sans-serif` at weights 300 / 400 / 500 / 700 across both headings and body.
- Pill-shaped buttons (`{rounded.pill}` 30 px) — the brand's signature interactive shape. Square geometry (`{rounded.none}`) reserved for icon buttons and editorial surfaces.
- Marketing layout: centred hero + feature grid + screenshot carousel + value prop columns + centred CTA.
- Cards have subtle radius (`{rounded.md}` 8 px) and sit on contrast surfaces without drop-shadows.
- Light value (70%) contrast between body text and canvas; 90%+ for headings.

## Colors

### Brand & Accent
- **Teal Blue** (`{colors.primary}` — `#007ca6`): The brand's primary accent. Used for filled buttons, links, active nav items, badges, and the gradient brandmark.
- **Primary Light** (`{colors.primary-light}` — `#00afeb`): Hover / highlight variant for primary actions.
- **Primary Dark** (`{colors.primary-dark}` — `#006385`): Pressed / active state variant.
- **Primary Darker** (`{colors.primary-darker}` — `#003c50`): Deep variant used in internal gradients.

### Brand Gradient
- **Purple → Cyan** (`{colors.accent-gradient-start}` `#AA5CC3` → `{colors.accent-gradient-end}` `#00A4DC`): The signature Jellyfin gradient. Used in the SVG logo mark only. Not applied to UI chrome.

### Surface
- **Canvas** (`{colors.canvas}` — `#000b25`): The default page background. A very dark navy, nearly black.
- **Canvas Surface** (`{colors.canvas-surface}` — `#242526`): Elevated surfaces — hero section, dropdowns, modals, search inputs.
- **Canvas Card** (`{colors.canvas-card}` — `#172138`): Card backgrounds, code blocks, search input fills.
- **Canvas Elevated** (`{colors.canvas-elevated}` — `#333c44`): Footer background, elevated surfaces.
- **Canvas Soft** (`{colors.canvas-soft}` — `#1c1e21`): Subtle contrast surfaces, table headers.
- **Hairline** (`{colors.hairline}` — `#444950`): 1 px dividers, table borders, TOC borders.

### Text
- **Ink** (`{colors.ink}` — `#ffffff`): All headings, body text on dark canvas.
- **Ink Soft** (`{colors.ink-soft}` — `#ebedf0`): Primary content text (slightly off-white for reduced eye strain).
- **Body** (`{colors.body}` — `#e3e3e3`): Body copy grey on dark canvas.
- **Body Muted** (`{colors.body-muted}` — `#bec3c9`): Secondary metadata, placeholder text, muted labels.

### Semantic
- **Link** (`{colors.link}` — `#007ca6`): All inline links and interactive text. Matches primary.
- **Link Hover** (`{colors.link-hover}` — `#00afeb`): Link hover state.
- **Success** (`{colors.success}` — `#00a400`): Positive states, success badges.
- **Danger** (`{colors.danger}` — `#fa383e`): Destructive actions, error states.
- **Warning** (`{colors.warning}` — `#ffba00`): Warning states, alert banners.

## Typography

### Font Family
Jellyfin uses a single typeface across the entire system:

1. **Noto Sans** — the sole typeface for headings, body, buttons, navigation, captions, and all UI text. Weights 300 (thin headings), 400 (body), 500 (nav links), 700 (buttons, strong labels). The monospace variant (`SFMono-Regular, Menlo, Monaco, Consolas...`) is used for code blocks and inline code only.

### Editorial Layer (Wired)
A secondary editorial type system is available for content-rich pages (articles, blog posts, documentation long-form):
1. **WiredDisplay** — proprietary tall-narrow high-contrast serif for editorial headlines (64 px hero scaling to 26 px sub-display).
2. **BreveText** — proprietary humanist serif for long-form body and bylines.
3. Best open-source approximations: *Playfair Display* for WiredDisplay, *Lora* / *Source Serif Pro* for BreveText, *Inter* or *Manrope* as Apercu equivalents.

### Hierarchy

| Token | Size | Weight | Line Height | Use |
|---|---|---|---|---|
| `{typography.display-hero}` | 33px | 300 | 44.8px | Hero heading (h1). |
| `{typography.display-lg}` | 28px | 300 | 38px | Major section headings (h2). |
| `{typography.display-md}` | 24px | 700 | 32px | Feature card headings (h3). |
| `{typography.display-sm}` | 20px | 700 | 28px | Subsection headings (h4). |
| `{typography.display-xs}` | 16px | 700 | 22px | Minor headings (h5). |
| `{typography.body-lg}` | 18px | 400 | 30px | Hero subtitle / lead body. |
| `{typography.body-md}` | 16px | 400 | 27.2px | Default body text. |
| `{typography.body-md-strong}` | 16px | 700 | 27.2px | Bold body. |
| `{typography.body-sm}` | 14px | 400 | 21px | Secondary body, footer text. |
| `{typography.body-sm-strong}` | 14px | 700 | 21px | Bold caption, nav-link. |
| `{typography.caption}` | 12px | 400 | 16px | Fine print, image captions, badges. |
| `{typography.button-md}` | 19px | 700 | 27px | Primary hero CTAs. |
| `{typography.button-sm}` | 16px | 700 | 22px | Secondary / inline buttons. |

### Editorial Hierarchy (Wired)

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|
| `{typography.editor-display}` | 64px | 400 | 59.5px | -0.5px | Cover-story headline. |
| `{typography.editor-lg}` | 48px | 400 | 50.4px | -0.4px | Major feature headline. |
| `{typography.editor-md}` | 32px | 400 | 35.2px | -0.3px | Section sub-headline. |
| `{typography.editor-body-serif}` | 16px | 400 | 24px | 0.09px | Article body (BreveText). |

### Principles
- **Single face, multiple weights.** Noto Sans carries the entire UI at 300 / 400 / 500 / 700. Weight-300 headings on dark canvas create an elegant, airy hero.
- **All-caps for semantic labels.** Badges use `{typography.caption}` with uppercase CSS transform.
- **Buttons are 700-weight.** The only bold text outside headings — CTAs must stand out against body copy.
- **Editorial serif layer is optional.** Use `{typography.editor-*}` tokens for content-rich pages only.

## Layout

### Spacing System
- **Base unit**: 4 px.
- **Tokens**: `{spacing.xxs}` 2 px · `{spacing.xs}` 4 px · `{spacing.sm}` 8 px · `{spacing.md}` 12 px · `{spacing.lg}` 16 px · `{spacing.xl}` 20 px · `{spacing.2xl}` 24 px · `{spacing.3xl}` 32 px · `{spacing.4xl}` 48 px.
- **Section padding**: hero uses `{spacing.4xl}` 48 px top/bottom on desktop.

### Grid & Container
- **Container default**: 1140 px max-width (Infima `--ifm-container-width`).
- **Container wide**: 1320 px max-width (`--ifm-container-width-xl`).
- Marketing layout: 1-col centred hero → 3/4-col feature grid → 2-col screenshot row → 4-col value prop → centred CTA.
- Feature cards (Movies, Shows, Music, etc.): arranged in a 3-column grid at desktop, collapsing to 2-col at tablet, 1-col at mobile.

### Responsive Strategy

#### Breakpoints

| Name | Width | Key Changes |
|---|---|---|
| Mobile | < 768px | 1-col grids; hamburger nav; reduced heading sizes. |
| Tablet | 768–996px | 2-col feature grid. |
| Desktop | ≥ 997px | Full 3/4-col grids; expanded nav. |

#### Touch Targets
- Buttons render ~44 px tall. WCAG AAA at all viewports.
- Nav items have `{spacing.sm}` vertical padding for comfortable tap targets.

#### Collapsing Strategy
- Nav: full link row at desktop (left logo, centre links, right search/CTA). Hamburger sidebar at mobile (83vw width).
- Feature grid: 3-col → 2-col → 1-col.
- Screenshot carousel: side-by-side at desktop, swipeable stack at mobile.

#### Image Behavior
- Screenshot images: contained inside card frames with rounded corners.
- Feature icons: SVG illustrations at consistent sizes inside transparent cards.
- Logo SVG: white + gradient mark, responsive width.

## Elevation & Depth

| Level | Treatment | Use |
|---|---|---|
| Level 0 — Flat | No shadow, no border. | Default — most surfaces. |
| Level 1 — Hairline | 1 px solid `{colors.hairline}` border. | Dividers, table borders, TOC, inputs. |
| Level 2 — Surface Contrast | Subtle background shift (`{colors.canvas-surface}` or `{colors.canvas-card}`). | Cards, dropdowns, hero, search panel. |
| Level 3 — Elevated | Background `{colors.canvas-elevated}`. | Footer, toasts. |
| Drop Shadow (light) | `0 1px 2px 0 #0000001a` (`--ifm-global-shadow-lw`). | Alert banners, pagination. |
| Drop Shadow (tl) | `0 12px 28px 0 #0003, 0 2px 4px 0 #0000001a` (`--ifm-global-shadow-tl`). | Modals, dropdown menus. |
| Drop Shadow (md) | `0 5px 40px #0003` (`--ifm-global-shadow-md`). | Elevated cards, dialogs. |

Jellyfin uses surface contrast (background colour shifts) as its primary elevation cue. Drop-shadows are reserved for overlays and interactive surfaces.

## Shapes

### Border Radius Scale

| Token | Value | Use |
|---|---|---|
| `{rounded.none}` | 0px | Icon buttons, editorial surfaces, Wired-mode cards. |
| `{rounded.sm}` | 4px | Badges, small indicators. |
| `{rounded.md}` | 8px | Cards, inputs, modals, toasts — default UI chrome. |
| `{rounded.lg}` | 12px | Larger container surfaces (optional). |
| `{rounded.pill}` | 30px | Primary and outline buttons — the brand's signature interactive shape. |
| `{rounded.full}` | 9999px | Avatars, icon containers. |

Jellyfin's signature is **pill-shaped buttons** (30 px radius) combined with **moderately rounded cards** (8 px). Square geometry is reserved for editorial mode and icon buttons. This contrasts with Wired's all-square approach.

## Components

### Buttons

**`button-primary`** — the filled teal CTA.
- Background `{colors.primary}`, text `{colors.on-primary}`, label `{typography.button-md}` (Noto Sans 19 px / 700), border `1 px solid {colors.primary}`, padding `{spacing.sm} {spacing.3xl}`, shape `{rounded.pill}` 30 px.

**`button-outline`** — the white outline CTA.
- Background transparent, text `{colors.ink}`, 1 px solid `{colors.ink-soft}` border, same typography, shape `{rounded.pill}` 30 px, padding `{spacing.sm} {spacing.3xl}`.

**`button-ghost`** — the minimal text CTA.
- Background transparent, text `{colors.primary}`, label `{typography.button-sm}` (Noto Sans 16 px / 700), padding `{spacing.xs} {spacing.lg}`, shape `{rounded.pill}`.

**`button-icon-square`** — the square icon button.
- Background transparent, text `{colors.ink}`, shape `{rounded.none}`, padding `{spacing.sm}`.

### Cards & Containers

**`card`** — the default content card.
- Background `{colors.canvas-card}` (`#172138`), text `{colors.ink}`, padding `{spacing.lg}`, shape `{rounded.md}` 8 px. No border or shadow — background contrast does the work.

**`card-elevated`** — the elevated surface (footer, overlays).
- Background `{colors.canvas-elevated}` (`#333c44`), same typography / padding / shape.

**`feature-card`** — the transparent feature grid card.
- Background transparent, text `{colors.ink}`, padding `{spacing.none} {spacing.lg}`. Rendered as text + icon on the dark canvas without a container.

### Inputs & Forms

**`text-input`** — the standard text input.
- Background `{colors.canvas-surface}` (`#242526`), text `{colors.ink}`, 1 px solid `{colors.hairline}` border, body in `{typography.body-md}`, padding `{spacing.sm} {spacing.lg}`, shape `{rounded.md}` 8 px.

### Navigation

**`nav-bar`** — the dark top nav.
- Background `{colors.canvas}` (`#000b25`), text `{colors.ink}`, padding `{spacing.sm} {spacing.lg}`, height 60 px. Layout: logo left, link row centre, search/CTA right.

**`nav-link`** — link items inside nav.
- Text `{colors.ink}`, set in `{typography.body-md}` (Noto Sans 16 / 500). Active state highlights in `{colors.primary}`.

**`footer`** — the elevated footer band.
- Background `{colors.canvas-elevated}` (`#333c44`), text `{colors.ink}`, padding `{spacing.3xl}`. Body in `{typography.body-sm}` (Noto Sans 14 / 400). Links in white, hover in `{colors.primary}`.

### Signature Components

**`hero-band`** — the dark hero section.
- Background `{colors.canvas-surface}` (`#242526`), text `{colors.ink}`, padding `{spacing.4xl} {spacing.xl}`. Heading in `{typography.display-hero}` (Noto Sans 33 px / 300), subtitle in `{typography.body-lg}` (Noto Sans 18 px / 400), centred. Two CTAs side by side below.

**`hero-subtitle`** — the hero description copy.
- Text `{colors.ink-soft}` (`#ebedf0`), set in `{typography.body-lg}` (Noto Sans 18 / 400), centred.

**`section-heading`** — major section title.
- Text `{colors.ink}`, set in `{typography.display-lg}` (Noto Sans 28 px / 300), centred.

**`hairline-divider`** — the 1 px separator.
- 1 px solid `{colors.hairline}`.

**`badge`** — semantic label.
- Background `{colors.primary}`, text `{colors.on-primary}`, set in `{typography.caption}` (Noto Sans 12 / 400, uppercase), shape `{rounded.sm}` 4 px, padding `{spacing.xxs} {spacing.sm}`.

### Examples (illustrative)

Each `ex-*` entry references brand-native primitives so downstream consumers render consistent surfaces.

**`ex-pricing-tier`** — Default pricing tier card with canvas-card surface and hairline border.
- Properties: `backgroundColor`, `textColor`, `borderColor`, `rounded`, `padding`

**`ex-pricing-tier-featured`** — Featured tier with primary border highlight.
- Properties: `backgroundColor`, `textColor`, `borderColor`, `rounded`, `padding`

**`ex-app-shell-row`** — Sidebar nav row inside the app shell. Active state uses brand primary as the indicator.
- Properties: `backgroundColor`, `activeIndicator`, `rounded`, `padding`

**`ex-data-table-cell`** — Default data-table th + td chrome.
- Properties: `headerBackground`, `headerTypography`, `bodyTypography`, `cellPadding`, `rowBorder`

**`ex-auth-form-card`** — Sign-in / sign-up card on canvas-card surface.
- Properties: `backgroundColor`, `rounded`, `padding`

**`ex-modal-card`** — Modal dialog on canvas-surface with elevated shadow.
- Properties: `backgroundColor`, `rounded`, `padding`

**`ex-empty-state-card`** — Empty-state illustration frame.
- Properties: `backgroundColor`, `rounded`, `padding`, `captionTypography`

**`ex-toast`** — Toast notification on elevated surface.
- Properties: `backgroundColor`, `rounded`, `padding`, `typography`

**`ex-page-header`** — Marketing page hero section.
- Properties: `backgroundColor`, `textColor`, `padding`, `textAlign`


## Do's and Don'ts

### Do
- Use `{colors.primary}` (`#007ca6`) for all filled CTAs, active links, and interactive highlights. The teal-blue against the dark-navy canvas IS the brand signature.
- Set hero headings in `{typography.display-hero}` (Noto Sans 33 px weight 300) centred on the dark surface. The light weight on dark canvas creates the brand's airy, open feel.
- Use `{rounded.pill}` 30 px on all primary and outline CTAs. The pill shape is Jellyfin's signature interactive geometry.
- Layer surfaces by background colour, not shadows: canvas → surface → card → elevated.
- Keep the brand gradient (`#AA5CC3` → `#00A4DC`) reserved for the logo mark only. Never use it as a UI chrome gradient.
- Use Noto Sans at weights 300 (headings), 400 (body), 500 (nav), 700 (CTAs) across the entire UI.

### Don't
- Don't use light mode as the default. The brand canvas is `#000b25` — a very dark navy, not white.
- Don't deviate from the single-typeface system. Noto Sans carries the brand; serifs belong only in the editorial layer.
- Don't use square corners on primary CTAs. Jellyfin's buttons are pill-shaped (`{rounded.pill}` 30 px).
- Don't apply the purple-cyan gradient to buttons, backgrounds, or decorative UI chrome. The gradient is logo-only.
- Don't add drop-shadows to cards. Surface contrast (background colour shifts) is the elevation system.
- Don't use the editorial serif layer (`WiredDisplay` / `BreveText`) on marketing/surface UI. Reserve serifs for content-rich editorial pages only.
