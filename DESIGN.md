---
name: BotFolio — Ritik Patni
description: Personal archive of a frontend engineer and wildlife/macro photographer, set in one Field Notes identity (cream paper, moss accent)
colors:
  # Light theme (the default) — src/styles/v2-tokens.scss:8-33
  cream: "#f7f4ed"
  paper: "#fffdf8"
  paper-deep: "#eee9dd"
  ink: "#1d1b16"
  ink-muted: "#55503f"
  ink-dim: "#746e5f"
  line: "rgba(29, 27, 22, 0.14)"
  moss: "#5f7350"
  moss-deep: "#46573a"
  moss-wash: "#c2cdb2"
  # Dark theme (scoped: /photography default, or the reader's stored choice) — src/styles/v2-tokens.scss:88-102
  charcoal: "#171812"
  charcoal-soft: "#1f2119"
  charcoal-deep: "#10110c"
  bone: "#f0ede2"
  bone-muted: "#a8a394"
  bone-dim: "#8e8878"
  line-dark: "rgba(240, 237, 226, 0.10)"
  moss-dark: "#9db38a"
  moss-dark-end: "#7d9468"
  moss-dark-text: "#b3c7a0"
  moss-dark-wash: "#2a3325"
  # Night Owl code-highlight theme (Shiki, astro.config.mjs:13-16) — content styling, never chrome
  night-owl-bg: "#011627"
  night-owl-text: "#d6deeb"
  night-owl-punct: "#d9f5dd"
  night-owl-punct-dim: "#5f7e97"
  night-owl-comment: "#637777"
  night-owl-slate: "#b2ccd6"
  night-owl-variable: "#d7dbe0"
  night-owl-tag: "#80cbc4"
  night-owl-attr: "#7fdbca"
  night-owl-attr-alt: "#caece6"
  night-owl-function: "#c792ea"
  night-owl-name: "#82aaff"
  night-owl-import: "#c5e378"
  night-owl-string: "#ecc48d"
  night-owl-number: "#f78c6c"
  night-owl-string-alt: "#ffeb95"
  night-owl-title: "#baebe2"
  night-owl-alert: "#ff6363"
  night-owl-accent: "#faf39f"
  # Utility
  scroll-mask-black: "#000"
typography:
  display:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "clamp(2.3rem, 5.4vw, 4.9rem)"
    fontWeight: 400
    lineHeight: 1.04
    letterSpacing: "-0.022em"
  display-sm:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "clamp(2.1rem, 9.6vw, 3rem)"
    fontWeight: 400
    lineHeight: 1.04
    letterSpacing: "-0.022em"
  h1:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "clamp(2.5rem, 6vw, 4rem)"
    fontWeight: 400
    lineHeight: 1.08
    letterSpacing: "-0.02em"
  h2:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "clamp(1.5rem, 2.4vw, 1.875rem)"
    fontWeight: 400
    lineHeight: 1.08
    letterSpacing: "-0.02em"
  h3:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "clamp(1.05rem, 1.8vw, 1.35rem)"
    fontWeight: 400
    lineHeight: 1.35
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Geist, Helvetica Neue, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.65
  prose:
    fontFamily: "Geist, Helvetica Neue, system-ui, sans-serif"
    fontSize: "1.16rem"
    fontWeight: 400
    lineHeight: 1.65
  lede:
    fontFamily: "Geist, Helvetica Neue, system-ui, sans-serif"
    fontSize: "1.05rem"
    lineHeight: 1.65
  ledger:
    fontFamily: "Geist, Helvetica Neue, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
  nav:
    fontFamily: "Geist, Helvetica Neue, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
  caption-title:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "0.95rem"
    fontWeight: 500
  meta:
    fontFamily: "IBM Plex Mono, monospace"
    fontSize: "0.82rem"
    letterSpacing: "0.08em"
  count:
    fontFamily: "IBM Plex Mono, monospace"
    fontSize: "0.78rem"
    letterSpacing: "0.06em"
  label:
    fontFamily: "IBM Plex Mono, monospace"
    fontSize: "0.75rem"
    letterSpacing: "0.1em"
  caption:
    fontFamily: "IBM Plex Mono, monospace"
    fontSize: "0.75rem"
    lineHeight: 1.45
    letterSpacing: "0.02em"
  code:
    fontFamily: "IBM Plex Mono, monospace"
    fontSize: "0.875rem"
rounded:
  sm: "4px"
  md: "6px"
  round: "999px"
  card: "0px"
spacing:
  gutter: "clamp(1rem, 3vw, 2rem)"
  layout-padding: "clamp(1rem, 3vw, 1.5rem)"
  layout-max: "75rem"
  content-max: "60rem"
  header-h: "61px"
components:
  nav-link:
    typography: "{typography.nav}"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.md}"
  card:
    backgroundColor: "transparent"
    rounded: "{rounded.card}"
  theme-toggle:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.round}"
  ledger-link:
    typography: "{typography.ledger}"
    textColor: "{colors.ink}"
  strip-frame:
    rounded: "{rounded.sm}"
---

# Design System: BotFolio — Ritik Patni

This file is the design law for the shipped site. It is written in the present tense: every rule describes what the site does now, and every authority claim points at the code that enforces it. When this file and the code disagree, the code is what ships. File the gap as a bug in one or the other; don't quietly follow either side.

Each factual claim was measured against the built site (computed styles, both themes, 1440 and 390 widths). Claim IDs `C01`–`C36` and gap-pass IDs `G01`–`G26` are cited inline below. The evidence (`measurements.json` and the probe scripts) lives in the local `design/docs-round/` directory. `/design/` is gitignored, so that directory is not in the repository. Re-measure before you trust a number that looks stale.

## Overview

**Creative North Star: "Field Notes": a naturalist's notebook kept by an engineer.**

There is one identity: cream paper, ink, and one moss accent. A serif voice (Newsreader) carries the headings, a quiet grotesque (Geist) carries reading and UI, and a mono hand (IBM Plex Mono) carries dates, counts and exposure data. Engineering and photography live in the same notebook and share the same surfaces, type and accent. The two subjects show up as two voices in one sentence (the home statement switches from roman to moss italic), not as two visual systems.

The earlier dual-persona system (separate "studio" and "field" rooms, each with its own accent, type and radius) is dissolved. No route renders a persona attribute and the header has no persona switch (`C01`, `C02`).

**Key characteristics**
- Paper first. Light is the default theme. Dark is a warm charcoal theme, used by default on `/photography` or when the reader chooses it.
- One accent, moss, in both themes and at both ends of every gradient token.
- Hierarchy comes from the serif/sans/mono split and from size, not from colour or weight theatrics.
- Flat: whitespace and top hairlines structure the page. Cards have no boxes, no left rules and no shadows.
- Truth in the details: counts are computed at build time, captions come from real EXIF, and contrast floors are measured.

### Token authority chain

Styles load in exactly this order (`src/styles/global.scss:1-7`, imported by `src/layouts/BaseLayout/BaseLayout.astro:2`):

1. `open-props/style`: stock scales (`--size-*`, `--font-size-*`, `--border-size-*`). These are utility only, and nothing visual is decided here.
2. `primitives.scss`: surface/stack primitives that read the tokens.
3. **`v2-tokens.scss`: the single token authority.** Every colour, radius, layout measure, type-ramp size and font stack is defined here (`:root` light at `:8-84`, dark override at `:88-102`).
4. `v2-typography.scss`: base element sizes (`h2` takes `--fs-h2` at `:18-24`, `h3` takes `--fs-h3`) and the mono metadata layer (`:57-67`).
5. `page-hero.scss`: the shared page hero (`.page-hero__title` takes `--fs-h1`, `:30-37`).
6. `v2-transitions.scss`: motion tokens (`--ease-out`, `--ease-soft`, `--dur-fast/base/slow` at `:7-11`) and the reduced-motion collapse (`:76-81`).
7. **`field-notes.scss`: the rules layer, and the last word in the cascade.** It sets heading family, weight and tracking (`:11-23`), body leading (`:25-30`), tabular figures (`:33-35`), hero glow (`:38-50`) and the authoritative card chrome (`:56-96`).

Rules:
- New colours, sizes and font stacks go into `v2-tokens.scss` only. Component styles consume `var(--token)`. They never hardcode a hex that already has a token.
- `field-notes.scss` wins ties. Its `:root h1/h2/h3` selectors (specificity 0,1,1) outrank single-class component rules and the bare element rules in `v2-typography.scss`. To override heading weight or tracking in a component, you need specificity of (0,2,0) or more, as `_home.scss:23` does deliberately.
- Route stylesheets must not set an `h2` font-size (`v2-typography.scss:17`).

## Colors

The palette is cream and ink plus one moss accent, retuned for dark.

| Role | Token | Light | Dark | Source |
|---|---|---|---|---|
| Page ground | `--bg` | `#f7f4ed` cream | `#171812` charcoal | `v2-tokens.scss:10`, `:90` |
| Raised surface | `--bg-soft` | `#fffdf8` paper | `#1f2119` | `:11`, `:91` |
| Deep band | `--bg-deep` | `#eee9dd` | `#10110c` | `:12`, `:92` |
| Text | `--text` | `#1d1b16` ink | `#f0ede2` bone | `:15`, `:93` |
| Muted text | `--text-muted` | `#55503f` | `#a8a394` | `:16`, `:94` |
| Dim text | `--text-dim` | `#746e5f` | `#8e8878` | `:20`, `:97` |
| Hairline | `--line` | `rgba(29,27,22,.14)` | `rgba(240,237,226,.10)` | `:21`, `:98` |
| Accent | `--accent-start` | `#5f7350` moss | `#9db38a` | `:24`, `:99` |
| Accent end | `--accent-end` | `#46573a` | `#7d9468` | `:25`, `:100` |
| Accent text | `--accent-text` | `#46573a` | `#b3c7a0` | `:27`, `:102` |
| Accent wash | `--accent-wash` | `#c2cdb2` | `#2a3325` | `:26`, `:101` |

All eleven values match the computed `:root` in both themes (`C03`, `C04`). `body` paints `--bg` and `--text` (`global.scss:24-31`; `C05`, `C06`).

### Text hierarchy and contrast

There are three text tiers plus accent text. Each has a measured floor in both themes (`C07`, `C08`):

| Tier | Light on `--bg` / `--bg-soft` | Dark on `--bg` / `--bg-soft` | Use |
|---|---|---|---|
| `--text` | 15.66 / 16.92 | 15.24 / 13.89 | headings, body, prose, caption titles |
| `--text-muted` | 7.34 / 7.93 | 7.09 / 6.46 | ledger counts, strip and gallery captions, nav links at rest, page-hero lead |
| `--text-dim` | 4.62 / 4.99 | 5.05 / 4.61 | the mono metadata layer (dates, hero meta, figcaptions), page-hero meta, footer copy and social links (`BaseLayout.scss:151`, `:167`; `G08`) |
| `--accent-text` | 7.12 / 7.69 | 9.86 / 8.99 | moss italic, section kickers, gallery index links |

Rules:
- **dim < muted < text, always.** A new grey must fit between two existing tiers or it doesn't ship. Don't use opacity to make a fourth tier.
- **4.6:1 is the floor for any functional text** in both themes. `--text-dim` was retuned to clear it on both `--bg` and `--bg-soft` (`v2-tokens.scss:17-20`, `:95-97`).
- **`--text-dim` never sits on `--bg-deep` in light.** It measures 4.19:1 there (`C09`). On the deep band (the home contact strip, the gallery frame wells), use `--text-muted` or stronger, as `_home.scss:99` and `:154` do.
- Body prose is always `--text` (`v2-typography.scss:49-55`). The muted tiers are for supporting metadata only.

### Accent

Moss is the only accent hue. Every accent token in both themes sits in one green family (`C10`).
- `--accent-start` is for strokes and marks: the active nav underline (`BaseLayout.scss:259-268`), hover hairlines on the ledger and frames, focus outlines (`BaseLayout.scss:15-18`, via `--accent`), and the theme-toggle hover border.
- `--accent-text` is for accent-coloured text: the italic clause of the home statement (`_home.scss:40-44`; `C11`), section kickers (`_home.scss:214-222`), and gallery index links (`_photography.scss:36-45`).
- `--accent-wash` is for the 14% hover wash on list cards (`field-notes.scss:79-90`).
- The gradient tokens are kept for compatibility only, and both ends are moss, so they read as a flat moss rule. `--gradient-hero` is `none` (`v2-tokens.scss:29-33`).

### Code blocks (Night Owl)

Markdown code renders through Shiki's Night Owl theme (`astro.config.mjs:13-16`): ground `{colors.night-owl-bg}` (#011627) and the theme's canonical syntax colours, listed in the frontmatter, set in IBM Plex Mono (`global.scss:59`; `C12`). Night Owl is content styling, like a photograph on the wall. It appears only inside `<pre>`/`<code>` and is exempt from the one-accent rule.

### Utility

`{colors.scroll-mask-black}` is the mask colour for scroll-fade `mask-image` gradients (`_home.scss:113`). By convention it never renders as ink.

### Named rules

**The One Accent Rule.** Moss is the only accent hue in both themes. If a second accent hue appears in chrome, one of them is wrong.

**The Whisper Rule.** Gradients are whispers, never banners. `--gradient-hero` is `none`. Page-hero glow is capped at 0.04–0.05 opacity (`field-notes.scss:38-50`). No gradient text and no gradient fills on paper.

**The Paper Rule.** Text never sits on a photograph. Every caption, control and heading sits on `--bg`, `--bg-soft` or `--bg-deep`, so contrast comes from the tokens, never from photo measurements.

## Typography

**Fonts loaded:** exactly three families, from one Google Fonts request (`BaseLayout.astro:128`; `C13`):

| Family | Faces requested | Token | Role |
|---|---|---|---|
| **Geist** | 400, 500, 600 | `--font-body` = `--font-ui` = `--font-sans` (`v2-tokens.scss:77-80`) | body, UI, nav, ledger |
| **Newsreader** | roman 400 and 500, italic 400; opsz 6–72 | `--font-display` (`v2-tokens.scss:78`) | h1–h3, the home statement, caption titles |
| **IBM Plex Mono** | 400, 500 | `--font-mono` (`v2-tokens.scss:81`) | dates, counts, labels, captions, code |

No other family ships. Fraunces, Fira Code, Archivo, JetBrains Mono, Geist Mono and Switzer appear nowhere in the build (`C14`). OG images render Newsreader and IBM Plex Mono from bundled TTFs (`src/assets/og-fonts/`).

Rules:
- Use only the requested faces. Newsreader has no 600, and Geist has no 300. A weight outside the table above is a bug: it synthesizes or snaps to the nearest face.
- Form controls inherit the body family (`global.scss:54-56`). `code`, `kbd`, `samp` and `pre` use `--font-mono` (`global.scss:58-61`).

### Type ramp

Shared type sizes come from this ramp. The ramp tokens live in `v2-tokens.scss:48-54`. Rendered values are given at 1440 / 390 wide. Some component title sizes are still set locally. They are listed under Known deviations below.

| Level | Token / value | Rendered | Face | Where |
|---|---|---|---|---|
| Display | `--fs-display` `clamp(2.3rem, 5.4vw, 4.9rem)` | 77.76px at 1440 | Newsreader 400, opsz 72, lh 1.04, −0.022em | home statement (`_home.scss:23-34`) |
| Display sm | `--fs-display-sm` `clamp(2.1rem, 9.6vw, 3rem)` | 37.44px at 390 | same | home statement at ≤48rem (`_home.scss:189-192`) |
| H1 | `--fs-h1` `clamp(2.5rem, 6vw, 4rem)` | 64 / 40px | Newsreader 400, lh 1.08, −0.02em | every page-hero title (`page-hero.scss:30-37`) |
| **H2** | `--fs-h2` `clamp(1.5rem, 2.4vw, 1.875rem)` | **30 / 24px** | Newsreader 400, lh 1.08 | **every h2 on every route** (`v2-typography.scss:18-24`) |
| H3 | `--fs-h3` `clamp(1.05rem, 1.8vw, 1.35rem)` | 21.6px at 1440 | Newsreader 400, −0.01em | base h3 (`v2-typography.scss:26-31`, family and weight from `field-notes.scss:19-23`) |
| Prose | 1.16rem / 1.65 | 18.56px / 30.6px | Geist 400 | `.prose`, `.slug-prose` paragraphs and lists (size from `v2-typography.scss:49-55`; that rule's 1.78 leading loses to `field-notes.scss:25-30`; `G13`) |
| Lede | 1.05rem / 1.65 (landing heroes `clamp(1.05rem, 2vw, 1.4rem)`) | 16.8px; 19.2px on `/uses` at 1440 | Geist 400, `--text-muted` | `.page-hero__lead` (`page-hero.scss:39-47`, `:60-64`; `G12`) |
| Body | 1rem / 1.65 | 16px / 26.4px | Geist 400 | `body`, `p`, `li` (`field-notes.scss:25-30`) |
| Ledger | 1rem | 16px | Geist 400 | home ledger links |
| Caption title | 0.95rem | 15.2px | Newsreader 500 | strip and gallery captions |
| Nav | 0.875rem (0.8125rem at ≤48rem) | | Geist 400 | header links (`BaseLayout.scss:238-248`, `:291-294`) |
| Meta | 0.82rem base, +0.08em, uppercase, `--text-dim` | 12.8–13.6px (route steps 0.8–0.85rem) | IBM Plex Mono | metadata layer (`v2-typography.scss:57-67`; `C24`) |
| Count | 0.78rem, +0.06em | 12.48px | IBM Plex Mono, tabular | ledger counts, section kickers |
| Label / caption | **0.75rem** (the floor) | 12px | IBM Plex Mono | strip label, "Open the gallery →", exposure captions, gallery index, nav "More →" hint |

Measured: one H2 size everywhere, 30px at 1440 and 24px at 390 on every sampled route and theme (`C16`, `C17`). H1 is 64 / 40px (`C18`), H3 is 21.6px (`C19`), the display sizes match (`C20`), and body is 16 / 1.65 (`C15`). The hero supporting sizes match too (`C22`, `C23`).

Rules:
- **The One H2 Rule.** `h2` has a single size, `--fs-h2`. Route styles must not set an h2 font-size, line-height or weight.
- **The Floor Rule.** Functional text is at least 0.75rem (12px). 0.75rem is a floor, not a default, and is reserved for mono labels and captions.
- **The Voice Split.** Newsreader speaks (titles, the statement, names of things). Geist reads and operates (prose, nav, links). Plex Mono records (dates, counts, EXIF, labels). Don't set a date in Newsreader or a heading in mono.
- **Case.** Headings, ledger and captions use sentence case. Only the mono label layer uppercases: the strip label, "Open the gallery →", the gallery index and the metadata layer. EXIF lines are never uppercased, so "f/6.3" stays lowercase (`_photography.scss:129-137`).
- **Tabular figures** are on site-wide (`field-notes.scss:33-35`) and set explicitly on counts, dates and captions.
- **Italic** is the second voice. Use it only for the moss clause of the home statement, and never as decoration elsewhere.

### Known deviations (open bugs, measured `G20`–`G24`)

The built site breaks the rules above in these places. Each one is a bug to fix in the code. None of them is a pattern to copy.
- **Off-ramp title sizes.** Card and list h3 titles set their own sizes. Post-card titles render 32 / 24px featured and 24 / 17.6px regular (`_home.scss:251`, `:263`). Journal item titles render 24px, Uses card titles 24 / 18.4px, Library item titles 15.2px and the lightbox metadata title 16px.
- **Below the 0.75rem floor.** Three labels on `/uses` (kicker, section index, card badge) render at 0.72rem, which is 11.52px (`uses/_uses.scss:25`). The lightbox metadata labels (`_photography.lightbox.metadata.scss:119`) and book detail labels (`library/books/_slug.scss:126`) are also declared at 0.72rem.
- **Weights outside the requested faces.** The header brand is a `<strong>`, so it computes Geist 700 and renders the 600 face. Many route styles still declare `font-weight: 300`, which Geist doesn't ship, so the text renders at 400. These include the page-hero title and lead, card descriptions, the footer copy, newsletter and library text, and lightbox text. Where a `:root p` / `li` rule applies, 400 wins outright. Prose `em` and `code em` synthesize italics, because Geist and Plex Mono have no italic face requested.

## Layout

### One content edge

- Header, main and footer share one container: `inline-size: min(100%, var(--layout-max-width))`, centered, inline padding `--gutter` (`BaseLayout.scss:38-44`).
- **`--gutter: clamp(1rem, 3vw, 2rem)` is the one inline inset** (`v2-tokens.scss:44-46`). Nothing inside the container adds its own inline padding. Below 48rem, section padding is zeroed so content uses the container width (`global.scss:81-92`).
- Result: brand, page H1 and footer copy share the same x on every route. That is 152px at 1440 and 16px at 390 (`C26`). A new section that starts anywhere else is a bug.
- `--layout-max-width: 75rem` sets the page measure. `--content-max: 60rem` is the shared hero/section measure (`v2-tokens.scss:41-42`). `--prose-max-width: 60ch` sets reading width.
- No route scrolls horizontally at either width (`C36`).

### Header

- **There is one solid row: brand · nav · theme toggle** (`BaseLayout.astro:206-230`, `BaseLayout.scss:46-64`).
- It is sticky at `top: 0` with a `--bg` ground and a 1px `--line` bottom hairline. There is no transparency, no backdrop blur, no overlay mode and no scroll-aware state.
- It is 61px tall on every route, theme and width (`C25`). `--header-h` (fallback 61px, measured by ResizeObserver) feeds `scroll-padding-block-start` so anchor jumps clear the bar, and it feeds the home hero height (`BaseLayout.scss:1-10`).
- Nav labels are Home, Journal, Notes, Gallery, Library, Uses, About, from one `NAV_LINKS` list (`src/config/site.ts:14-22`; `C27`). The active link gets `aria-current="page"`, `--text`, a 6% ink wash and a 2px `--accent-start` underline (`BaseLayout.scss:255-269`).
- When the links outgrow the bar (below about 700px), they scroll sideways inside the nav slot with edge masks. A mono "More →" hint shows while links remain hidden and disappears at the end. The page itself never widens.
- The theme toggle is a 2.25rem round button inside the bar (`BaseLayout.scss:91-109`). There is no floating toggle.
- Theme flips are atomic: `html[data-theme-switching]` suspends all transitions for two frames (`BaseLayout.scss:198-205`), so text never shows on the wrong-polarity surface mid-flip.

### Home: the Index hero

Sources: `src/pages/_home/home.astro:26-124` and `src/pages/_home/_home.scss:1-197`.

1. **The sentence is the hero.** An `h1`: "**Ritik Patni** builds thoughtful product surfaces — *and documents nature up close, one frame at a time.*" (`C28`). It is set at `--fs-display` with max 22ch. The name is weight 500 and the second clause is italic in `--accent-text` (`C21`, `C11`).
2. **The ledger is the doors.** A ruled row of links: Notes · *n* posts, Gallery · *n* frames, Library · *n* books, About →. **Every count is computed at build time** from the same data the destination page lists: non-draft blog plus newsletter entries, the gallery manifest length, and non-draft books (`home.astro:26-33`). It currently renders 66 / 39 / 86 (`C29`). Never type a count in by hand.
3. **The contact sheet closes the hero.** A `--bg-deep` band with a top hairline paints edge to edge via `border-image` outset, which adds no page scroll (`_home.scss:84-87`). Inside it:
   - a mono label, "Contact sheet · recent frames";
   - a row of the **8 most recent frames by date** (ties keep manifest order; `home.astro:42-50`), at one shared height and natural aspect ratios, 4px radius, all `loading="lazy"`. The height is `clamp(8.5rem, 22svh, 13rem)` (208px cap) on desktop and 11rem (176px) at ≤48rem (`C30`). The row scrolls and scroll-snaps inside the content column and fades at its right edge;
   - **Journal-style captions** under each frame: the frame title in Newsreader 0.95rem/500, then one mono exposure line, `aperture · shutter · ISO`, taken from the frame's own EXIF. Missing fields are dropped, and a frame with no EXIF shows only its title (`home.astro:35-40`);
   - **"Open the gallery →"**, the closing link under the row on the right, in the mono label style (uppercase via CSS; `_home.scss:171-182`).
4. The hero's **minimum** height is `100svh − --header-h` (`_home.scss:11`). It grows with its content: at 1440×900 it measures 922px against an 839px minimum, and at 390×844 it measures 841px against 783px. On both, the bottom of the strip (about 60–80px) falls below the fold (`G15`). Below the hero, "Latest posts" uses the shared section header: a mono moss kicker plus an h2 on the ramp.

### Gallery: the contact sheet

Sources: `src/pages/photography/index.astro` and `_photography.scss:1-221`.

- **Justified rows.** Each frame is `flex: <aspect> 1 calc(<aspect> × --sheet-row-h)`, so every frame in a row shares one height at its natural shape. An `::after` filler stops the last row from stretching (`_photography.scss:81-97`). The row-height basis is `clamp(10rem, 17vw, 15rem)`, or 9rem at ≤48rem.
- Frames are 4px radius on a `--bg-deep` well. Hover shows a 1px `--accent-start` outline at 3px offset. The frame itself is the lightbox trigger, and there is no separate icon button (`C31`).
- Captions use the same language as the home strip: a Newsreader title, then a mono exposure line, never uppercased.
- A **ruled mono index** sits at the top: an uppercase 0.75rem row of moss jump links with build-time counts ("39 frames · Birds 21 · …"). Each category section has a sentence-case h2 on the ramp and a mono meta line.
- `/photography` defaults to the dark theme. A stored reader choice still wins (`BaseLayout.astro:27`; `C32`).
- Never crop a frame to fit a grid, and never set text on a frame.

### Other pages

- **Page heroes** share one block: mono meta, an H1 at `--fs-h1`, and a lede in `--text-muted` (`page-hero.scss`).
- **Cards and lists** are flat. There is no box, no left rule, no radius and no shadow, only a top hairline and whitespace (`field-notes.scss:56-77`; `C33`). Hover is a 14% `--accent-wash` tint (`:79-90`).
- **404.** Unknown URLs return HTTP 404 with `src/pages/404.astro`: a mono "404 · page not found" kicker, an H1 at the ramp, one lede sentence, and three ruled doors (Home, Notes, Gallery). It is `noindex, follow` with no canonical (`BaseLayout.astro:166`; `C34`, `G25`).

### URLs

- **Canonical URLs are slashless.** `trailingSlash: 'never'` plus `build.format: 'file'` (`astro.config.mjs:6-11`) emit `/about.html`, which Cloudflare Pages serves at `/about`. `/about/` and `/about.html` 308 to `/about`, and every canonical has no trailing slash (`C35`).
- Internal links are always written slashless (`/blog`, `/about#connect`).
- `/contact` is a `noindex` redirect stub to `/about#connect`, and it is not listed in the sitemap (`src/pages/sitemap.xml.ts:24`; `G26`).

### Breakpoint

There is one breakpoint, `48rem`. At or below it: the display statement switches to `--fs-display-sm`, nav links tighten, the strip height becomes 176px, the gallery row basis becomes 9rem, and section inline padding is zeroed.

## Elevation and depth

The page is flat. Depth comes from tonal layering (`--bg` → `--bg-soft` → `--bg-deep`) and 1px hairlines, not shadows.
- Cards, list items, the header and heroes carry **no shadow**.
- Shadows exist only on layers that genuinely float above the page: the photography lightbox chrome and metadata sheet (`_photography.lightbox.shell.scss:60`, `_photography.lightbox.metadata.scss:16`) the gallery loading-status pill (`_photography.scss:175`) and the lightbox action tooltips (`_photography.scss:201`). Book covers also get a hover lift (`library/_library.scss:160`) and a flat moss offset on the book detail page (`library/books/_slug.scss:25`).
- Page-hero glow is capped by the Whisper Rule (0.04–0.05).

## Shapes

- **Radii come from three tokens: 4px `--radius-sm`, 6px `--radius-md`, 999px `--radius-round`** (`v2-tokens.scss:36-38`).
  - 4px: photographs (strip, gallery, covers) and inline code.
  - 6px: nav links and surface primitives (`--surface-radius`).
  - 999px: the theme toggle and pills only, never containers.
- Cards and list rows are **0** (`field-notes.scss:69`).
- Borders are 1px `--line` everywhere. Accent borders appear only as hover and focus states.
- There are no clipped corners and no blob geometry. Photographs keep their native aspect ratio.

## Components

### Theme toggle
A round 2.25rem button in the header bar with a `--bg-soft` ground and a 45% `--text` border, which turns `--accent-start` on hover. `aria-pressed` reflects state. The stored key is `rp-theme`.

### Nav link
Geist 0.875rem in `--text-muted`, 6px radius, and a 4% `--text` wash on hover. The active link gets `--text`, a 6% wash and a 2px moss underline.

### Ledger link
Geist 1rem in `--text` with a 1px `--line` underline that turns `--accent-start` on hover, while the label turns `--accent-text`. The count is mono 0.78rem in `--text-muted`.

### Contact-sheet frame (home strip and gallery)
A natural-ratio image at 4px radius, with a transparent 1px outline at 3px offset that turns moss on hover and focus. The caption is a Newsreader title plus a mono exposure line in `--text-muted`.

### Section header
A mono uppercase kicker in `--accent-text` (0.78rem, +0.14em), then an h2 on the ramp, on the shared left edge.

### Focus
Every link and button shows a 2px `--accent` outline with a `--size-1` offset on `:focus-visible` (`BaseLayout.scss:15-18`).

## Motion

- The tokens are `--ease-out` `cubic-bezier(.22,1,.36,1)`, `--ease-soft` `cubic-bezier(.4,0,.2,1)`, `--dur-fast` 160ms, `--dur-base` 240ms and `--dur-slow` 360ms (`v2-transitions.scss:7-11`).
- Under `prefers-reduced-motion: reduce`, every duration collapses to 0.01ms (`v2-transitions.scss:76-81`), and smooth scrolling is only enabled for `no-preference` (`global.scss:41-45`).
- Interaction motion is mostly colour, border and outline transitions. There are three exceptions. `main` plays a one-off `content-rise` entrance on every page load: it fades in from 10px below over `--dur-slow` (`v2-transitions.scss:67-74`; `G18`). The theme toggle presses to `scale(0.92)` (`:62-64`). Lightbox tooltips lift 0.25rem on reveal (`_photography.scss:205-214`). Nothing autoplays, and reduced motion collapses all three (`G19`).

## Do's and don'ts

### Do
- **Do** take every colour, size and font from `v2-tokens.scss`. If something you need is missing, add a token there first.
- **Do** keep the hierarchy dim < muted < text and the 4.6:1 floor in both themes. Re-measure when you touch a grey.
- **Do** use `--accent-text` for moss text and `--accent-start` for moss strokes.
- **Do** start every section on the shared content edge (`--gutter` inside the container).
- **Do** compute every count from the collection or manifest the linked page renders.
- **Do** caption photographs with their real title and EXIF, and drop missing fields.
- **Do** keep functional text at or above 0.75rem, and use tabular figures for data.
- **Do** write internal URLs slashless.

### Don't
- **Don't** reintroduce personas, a persona switch, or a second accent hue.
- **Don't** set an h2 size in a route stylesheet, or a font size off the ramp.
- **Don't** load or reference a family other than Geist, Newsreader and IBM Plex Mono, or a weight outside the requested faces.
- **Don't** put text on a photograph, crop a frame to fit a grid, or bleed an image to the viewport edge.
- **Don't** make the header transparent, blurred, two-row or scroll-aware.
- **Don't** box, left-rule, round or shadow a card.
- **Don't** let a gradient exceed a whisper, and never use gradient text.
- **Don't** fabricate content, counts, testimonials or EXIF. The archive is real or it doesn't ship.
