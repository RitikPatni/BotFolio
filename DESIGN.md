---
name: BotFolio — Ritik Patni
description: Dual-identity personal site — frontend engineering and wildlife/macro photography under one roof
colors:
  studio-ink-blue: "#8aa6c8"
  studio-ink-blue-light: "#1e50c8"
  studio-ink-fade: "#b8c4d4"
  studio-ink-fade-light: "#4a73d6"
  field-hazard-red: "#ff2a2a"
  field-hazard-deep: "#e61919"
  field-hazard-print: "#b81414"
  studio-carbon: "#0c0c0e"
  studio-carbon-soft: "#141416"
  studio-bone: "#f4f2ee"
  studio-paper: "#f7f6f3"
  studio-paper-soft: "#fbfbfa"
  studio-ink: "#1c1b19"
  field-carbon: "#0b0b0c"
  field-carbon-soft: "#131314"
  field-snow: "#f2f2f0"
  field-newsprint: "#eae8e3"
  field-newsprint-soft: "#f4f4f0"
  field-ink: "#0a0a0a"
  neutral-bg: "#0a0a0b"
  neutral-bg-soft: "#121214"
  neutral-text: "#fafafa"
typography:
  display:
    fontFamily: "Newsreader, Playfair Display, Instrument Serif, Georgia, serif"
    fontSize: "clamp(2.5rem, 6vw, 5rem)"
    fontWeight: 400
    lineHeight: 1.08
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Newsreader, Playfair Display, Instrument Serif, Georgia, serif"
    fontSize: "clamp(1.75rem, 3vw, 2.5rem)"
    fontWeight: 400
    lineHeight: 1.08
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Geist, Switzer, Helvetica Neue, system-ui, sans-serif"
    fontSize: "clamp(1.1rem, 2vw, 1.5rem)"
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Geist, Switzer, Helvetica Neue, system-ui, sans-serif"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "Geist Mono, JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.72rem"
    letterSpacing: "0.08em"
rounded:
  sm: "8px"
  md: "12px"
  round: "100px"
spacing:
  layout: "clamp(1rem, 3vw, 1.5rem)"
  card: "2rem"
  shot: "1.25rem"
components:
  card:
    backgroundColor: "{colors.neutral-bg-soft}"
    rounded: "{rounded.md}"
  button-primary:
    backgroundColor: "{colors.neutral-bg-soft}"
    textColor: "{colors.neutral-text}"
    rounded: "{rounded.round}"
  chip-accent:
    textColor: "{colors.studio-ink-blue}"
---

# Design System: BotFolio — Ritik Patni

## Overview

**Creative North Star: "Ink & Hazard — warm editorial ink meets Swiss hazard printing."**

This is one site with two deliberately separate design languages, never merged. The **studio** persona is warm editorial ink: carbon and bone surfaces, a serif display voice (Newsreader), a single desaturated ink-blue accent, crisp small radii, flat-calm atmosphere. The **field** persona is Swiss hazard printing: carbon and newsprint, massive uppercase Archivo Black macro headlines, a single hazard-red accent, zero radius, hard visible dividers. A visitor can stand in either room and know which one they're in instantly — that recognition is the system working.

Persona separation is structural, not cosmetic: separate navigation, content slots, themes, tokens, and type systems per persona (`[data-persona="studio"]` / `[data-persona="field"]`), each with its own dark and light theme. Shared infrastructure (the base `:root` token layer) exists only as a fallback and is fully overridden by both personas.

**Key Characteristics:**
- Two rooms, one archive — studio (editorial minimalism) and field (Swiss brutalism) never share visual language
- One accent per persona at a time: ink-blue or hazard-red, never both, never blended
- Weight- and case-driven hierarchy; gradients are whispers, never banners
- Tabular figures everywhere data appears; flat surfaces; borders over shadows
- Craft lives in the details: caption sizes, heading order, contrast — all audited

## Colors

The palette is dual-branded: warm monochrome plus one ink accent (studio), or unbleached paper plus one hazard accent (field). Shared neutrals exist only beneath both.

### Primary
- **Ink Blue** (`{colors.studio-ink-blue}` dark / `{colors.studio-ink-blue-light}` light): the studio persona's single accent — links, active states, card left-border signatures, focus rings. Desaturated and calm in dark; deepened for AA contrast on paper in light.
- **Hazard Red** (`{colors.field-hazard-red}` dark / `{colors.field-hazard-deep}` light): the field persona's single accent — the only color that ever screams. Used for active states, stamps, and accent borders; in light theme it prints deeper (`{colors.field-hazard-print}` for gradient ends).

### Secondary
- **Ink Fade** (`{colors.studio-ink-fade}` dark / `{colors.studio-ink-fade-light}` light): studio's gradient partner — accent gradients run ink-blue → ink-fade. Field has no secondary: hazard red gradients to its own deeper print, never to another hue.

### Tertiary
- None. One accent per persona is doctrine.

### Neutral
- **Warm Carbon** (`{colors.studio-carbon}` / `{colors.studio-carbon-soft}`): studio dark surfaces — never pure black.
- **Bone** (`{colors.studio-bone}`): studio dark text — warm white, never pure white.
- **Studio Paper** (`{colors.studio-paper}` / `{colors.studio-paper-soft}`): studio light surfaces — warm bone paper.
- **Studio Ink** (`{colors.studio-ink}`): studio light text — charcoal ink.
- **Carbon** (`{colors.field-carbon}` / `{colors.field-carbon-soft}`): field dark surfaces — matte near-black.
- **Snow** (`{colors.field-snow}`): field dark text — cooler than studio bone.
- **Newsprint** (`{colors.field-newsprint}` / `{colors.field-newsprint-soft}`): field light surfaces — unbleached paper.
- **Field Ink** (`{colors.field-ink}`): field light text — carbon ink on newsprint.
- **Shared Base** (`{colors.neutral-bg}` / `{colors.neutral-bg-soft}` / `{colors.neutral-text}`): pre-persona fallback and OG image ground; both personas override all three.

### Named Rules
**The Two Rooms Rule.** Studio and field never share accent language. An element that works in both rooms must earn it in each persona's tokens separately — no cross-persona homogenization, ever (binding commitment from PRODUCT.md).

**The Whisper Rule.** Gradients are whispers, never banners: hero glow lands at 4–5% opacity (studio 0.04–0.05, field 0). Nothing larger than a hint.

**The One Accent Rule.** Each persona carries exactly one accent hue at a time. If a second accent color appears in a persona, one of them is wrong.

## Typography

**Display Font:** Newsreader (studio) / Archivo Black (field), per persona — with Georgia / Arial Black fallbacks
**Body Font:** Geist (studio) / Archivo (field) — with Helvetica Neue fallbacks; shared base is Inter
**Label/Mono Font:** Geist Mono (studio) / JetBrains Mono (field)

**Character:** Studio types like an editor — serif display at weight 400 with tight tracking, sentence case, comfortable 1.65 leading. Field types like a printing press — uppercase grotesque at 800, negative tracking, compressed 0.9–0.95 leading, with monospace telemetry for metadata. The shared base (Inter 300, weight-driven hierarchy) exists beneath both but is always overridden.

### Hierarchy
- **Display** (studio: 400, clamp(2.5rem, 6vw, 5rem), 1.08 / field: 800, clamp(2.5rem, 9vw, 7rem), 0.9, uppercase): studio = serif page titles; field = macro headlines sized so PHOTOGRAPHY fits without mid-word breaks (mobile: clamp(1.75rem, 10vw, 3rem), measured not guessed).
- **Headline** (studio: 400, clamp(1.75rem, 3vw, 2.5rem) / field: 800, uppercase, -0.03em): section titles.
- **Title** (studio: serif 400 h3 / field: Archivo 700 uppercase +0.02em h3): card and item titles.
- **Body** (400 weight both personas; studio 1.65 leading / field 1.5; shared base 300 at 1.8): prose holds to ~70ch max.
- **Label** (mono, 0.72rem, +0.08em, uppercase): field metadata telemetry and studio mono accents. Floor for any functional text is 0.75rem (12px) — cover captions were bumped to meet it.

### Named Rules
**The Case Boundary Rule.** Field shouts in uppercase; studio keeps sentence case. A studio headline in all-caps is a persona leak.

**The Measured Macro Rule.** Field's giant type is sized from measurement (PHOTOGRAPHY ≈ 8.1em wide in Archivo Black), never guesswork — no mid-word breaks, no right-edge clipping, ever.

## Layout

Single centered column, max 75rem, with fluid page padding of clamp(1rem, 3vw, 1.5rem). Content rhythm: generous section padding driven by persona (studio: clamp(3.5rem, 8vw, 6.5rem) top, slightly larger bottom — bottom > top is doctrine; field: clamp(3rem, 7vw, 5.5rem)). Post grids auto-fit at minmax(min(100%, 380px), 1fr) shared / 360px field; gallery masonry at 3 columns in field, bordered shots in studio. Mobile breakpoint at 48rem: nav collapses to horizontal scroll, field headlines step down to measured mobile clamps, post cards span full width with zero inline padding.

## Elevation & Depth

Flat by default; depth comes from borders and tonal layering, not shadows. Studio permits exactly one shadow — a diffuse `0 1px 2px rgba(0,0,0,0.04)` on cards — as a whisper of lift on its soft surfaces. Field permits none: structure is expressed with 1px solid dividers at elevated line contrast (field lines run ~0.14–0.18 alpha, roughly double studio's), and cards are flat `--bg-soft` rectangles. Hero glow gradients (the only depth-adjacent effect) are damped per the Whisper Rule.

### Shadow Vocabulary
- **Studio Card Lift** (`box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04)`): the only shadow in the system; studio surfaces at rest. Never stack, never darken.

## Shapes

Radius is persona doctrine. Studio is crisp and small: 4px (sm) / 6px (md), with 999px round reserved for pills and the theme FAB — never on containers. Field is absolute zero: every radius token (including inherited Open Props steps) is pinned to 0 — cards, shots, tags, buttons are hard rectangles. Borders are the shared structural voice: 1px solid `--line` everywhere, with studio adding its 2px accent left-border signature on cards (0.45 alpha accent mix; 3px in field on featured items). object-fit cover imagery, hard crops, no clipped corners, no blob geometry anywhere.

## Components

Philosophy: **tailored in the studio, stamped in the field** — the same components, tailored with serif calm in one room and stamped with hazard urgency in the other.

### Buttons
- **Shape:** studio = pill (radius-round, 999px); field = hard rectangle (0)
- **Primary:** bg-soft surface, `--text` label, 1px `--line` border, padding 0.75rem 1.75rem; field swaps to uppercase mono micro-type
- **Hover / Focus:** accent border bloom (30% accent mix into line), subtle accent-tinted background (8%), translateY(-1px) lift with reduced-motion kill; focus-visible = 2px accent outline with offset
- **Ghost:** nav links — muted text, 4% text-tint hover wash; active link gains 2px gradient underline (studio) or accent wash (field)

### Chips
- **Style:** studio = accent pill (radius-round, 15% accent tint bg, accent-text label); field = bordered mono tag (radius 0, 1px line, uppercase 0.7rem)
- **State:** selected = stronger accent border + tinted bg + `--text` label (`aria-pressed=true`)

### Cards / Containers
- **Corner Style:** studio 6px / field 0
- **Background:** bg-soft in both rooms
- **Shadow Strategy:** studio 1px lift only (see Elevation); field none
- **Border:** studio = 1px line + 2px accent left signature (45% accent mix); field = 1px line at higher alpha, 3px accent left on featured
- **Internal Padding:** 2rem standard; studio featured cards clamp(1.5rem, 4vw, 2.5rem) with 5% accent-tinted bg

### Inputs / Fields
- **Style:** 1px `--line` stroke on bg, small radius (studio 5px inherited / field 0), full inline size
- **Focus:** 2px accent outline with `--size-1` offset (focus-visible doctrine)

### Navigation
- Sticky header, bg with 16px backdrop blur, bottom hairline. Brand left, persona toggle (Dev/Photo) right — the toggle is the two-rooms hinge: pill track (studio rounding) with active button in accent tint + 45% accent border + glow ring in dark. Links: 0.875rem, muted → text on hover with 4% wash; active link = gradient underline (2px, accent-start → accent-end, bottom 2px). Mobile: single horizontal scroll row, hidden scrollbar.

### Signature Component: The Persona Switcher
The Dev/Photo toggle is the system's keystone — the one place both rooms are visible at once, and the only component whose active state is pinned per-theme (`--persona-btn-active-bg`) so a theme leak can never break its contrast.

## Do's and Don'ts

### Do:
- **Do** scope every accent decision through the active persona's tokens (`--accent-start/-end/-text`) — never hardcode a persona's hex outside its layer.
- **Do** keep accent-colored text AA-safe: light theme uses the deepened per-persona `--accent-text` (that's what it's for).
- **Do** use tabular figures (`font-variant-numeric: tabular-nums`) for any data, both personas.
- **Do** keep functional micro-text at or above 0.75rem (12px).
- **Do** verify heading order (no skipped levels) in authored content.

### Don't:
- **Don't** merge, blend, or cross-pollinate the studio and field visual languages — the Two Rooms Rule is binding (PRODUCT.md).
- **Don't** let a gradient exceed a whisper — hero glow caps at 4–5% opacity; a gradient banner or gradient text is a violation.
- **Don't** introduce a second accent hue into either persona.
- **Don't** stack or darken shadows beyond the studio 1px lift; field gets none.
- **Don't** fabricate content, testimonials, or metrics — the archive is real or it doesn't ship.
