# BotFolio UI Enhancement Spec — Concrete Implementation Plan

## Overview

Two independent workstreams:

| # | Workstream | Scope | Files touched |
|---|---|---|---|
| 1 | Code blocks | Night Owl syntax highlighting + Fira Code ligatures | 5 |
| 2 | Field persona | Complete visual transformation (wide, sans, immersive) | 9 |

Each workstream split into numbered phases with exact diffs. Phases are ordered for safe incremental delivery — each phase produces a working build.

---

## Workstream 1: Code Blocks — Night Owl + Fira Code

### Architecture Decision

Astro v4 ships Shiki built-in. No new integration needed. We install `@shikijs/themes` for the Night Owl theme (not bundled with Shiki), configure Shiki via `astro.config.mjs`, fix CSS conflicts, and add Fira Code.

**Why not Prism/rehype-highlight/starry-night?** Shiki is already loaded. Adding another library for identical functionality is wasteful.

**Why Fira Code instead of JetBrains Mono/Cascadia Code?** User preference. Fira Code also has the widest ligature coverage and Google Fonts availability (no self-hosting).

### Phase 1.1 — Install dependencies + configure Shiki

**File: `/root/BotFolio/package.json`** (1 change)

```diff
  "dependencies": {
    "@astrojs/rss": "^4.0.18",
    "@astrojs/sitemap": "^3.7.2",
+   "@shikijs/themes": "^1.0.0",
    "astro": "^4.16.0",
```

Run: `cd /root/BotFolio && npm install`

**File: `/root/BotFolio/astro.config.mjs`** (full rewrite, 4 additions)

Current file:
```js
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://ritikpatni.me',
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler'
        }
      }
    }
  }
});
```

New:
```js
import { defineConfig } from 'astro/config';
import { nightOwl } from '@shikijs/themes';

export default defineConfig({
  site: 'https://ritikpatni.me',
  markdown: {
    shikiConfig: {
      theme: nightOwl,
      wrap: true,
    },
  },
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler'
        }
      }
    }
  }
});
```

**Checkpoint 1.1:** `npm run build` passes. Code blocks have colors now (Night Owl theme active), but may look broken due to CSS conflicts. Proceed to Phase 1.2.

### Phase 1.2 — Add Fira Code font

**File: `/root/BotFolio/src/layouts/BaseLayout/BaseLayout.astro`** (line 84)

Current:
```html
      href="https://fonts.googleapis.com/css2?family=IBM+Plex+Serif:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&display=swap"
```

New:
```html
      href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500&family=IBM+Plex+Serif:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&display=swap"
```

**File: `/root/BotFolio/src/styles/global.scss`** (inside `:root` block, after `--font-display`)

Add:
```scss
  --font-mono: "Fira Code", "Cascadia Code", "JetBrains Mono", "Menlo", "Consolas", monospace;
```

**Checkpoint 1.2:** Fira Code loads in browser DevTools → Fonts tab. Ligatures not active yet — CSS fix next.

### Phase 1.3 — Fix CSS conflicts with Shiki

**Problem:** `%prose pre` sets `background: var(--bg-soft)` and `border: ...` which OVERRIDE Shiki's theme background and borders. Shiki renders `<pre class="astro-code" style="background-color:#011627;color:#...">` but the SCSS rules have higher specificity due to how Astro compiles placeholders.

Additionally, `%prose :where(code, kbd)` applies inline-code styles (gray background, padding) to any `<code>` including Shiki token spans, creating visual noise.

**File: `/root/BotFolio/src/styles/patterns.scss`** — three changes

**Change 1 — lines 172-178, replace `%prose :where(code, kbd)`:**

Current:
```scss
%prose :where(code, kbd) {
  font-family: var(--font-mono);
  font-size: var(--font-size-1);
  background: var(--bg-soft);
  border: var(--surface-border) solid var(--line);
  border-radius: var(--radius-2);
  padding-inline: var(--size-1);
}
```

New:
```scss
%prose :where(code, kbd) {
  font-family: var(--font-mono);
  font-size: var(--font-size-1);
  background: var(--bg-soft);
  border: var(--surface-border) solid var(--line);
  border-radius: var(--radius-2);
  padding-inline: var(--size-1);
}

// Shiki code blocks: let theme handle colors
%prose :global(.astro-code),
%prose :global(.astro-code) code {
  font-family: var(--font-mono);
  font-variant-ligatures: contextual;
  background: transparent;
  border: 0;
  padding: 0;
}
```

**Change 2 — lines 181-189, replace `%prose pre`:**

Current:
```scss
%prose pre {
  margin-block: var(--size-4);
  padding: var(--size-4);
  background: var(--bg-soft);
  border: var(--surface-border) solid var(--line);
  border-radius: var(--radius-2);
  max-inline-size: 100%;
  overflow: auto;
}
```

New:
```scss
%prose pre {
  margin-block: var(--size-4);
  border-radius: var(--radius-2);
  max-inline-size: 100%;
  overflow: auto;
}

%prose :global(.astro-code) {
  padding: var(--size-4);
}
```

**Change 3 — lines 191-195, replace `%prose pre code`:**

Current:
```scss
%prose pre code {
  border: 0;
  padding: 0;
  background: transparent;
}
```

New:
```scss
%prose pre code {
  font-family: var(--font-mono);
  font-size: var(--font-size-1);
  font-variant-ligatures: contextual;
  border: 0;
  padding: 0;
  background: transparent;
}
```

**Checkpoint 1.3:** `npm run build && npm run preview`, then visually verify:
- Open `/blog/building-quality-gated-ai-code-review-loops`
- Code blocks have Night Owl colors (dark blue background `#011627`, syntax-colored tokens)
- Inline code (`var(--size-md)`) still has gray background — not broken
- Fira Code ligatures visible: `!=`, `=>`, `===`, `->`, `>=` as single glyphs
- `npm run check` passes (TypeScript validation)
- All pre-existing pages visually unchanged

---

## Phase 2 Open Questions (Design Decisions Before Implementation)

These must be resolved before any Phase 2 code is written. Each question has one recommended default.

### Q1: Field Persona Font Stack

Field persona currently specified as Inter-only (sans). Should we:

| Option | Font pairing | Feel |
|---|---|---|
| **A (recommended)** | Inter (body + headings) — single typeface, varied weights | Clean, modern, Swiss-design inspired |
| B | Inter (body) + DM Serif Display (headings) | Editorial, magazine-like contrast |
| C | Space Grotesk (body + headings) | Geometric, slightly retro, distinctive |
| D | Inter (body) + Playfair Display (headings) | High contrast, dramatic, art-gallery feel |

Option A is recommended because it creates maximum differentiation from studio (which uses IBM Plex Serif for headings) while keeping the type system simple. Field mode becomes "pure sans" — no serifs anywhere — making the toggle between personas a clear typeface shift.

**Your call:** A, B, C, D, or propose your own?

---

### Q2: Field Color Palette — Keep or Deviate?

Both personas currently share the same `--gray-*` Open Props palette. Options:

| Option | Approach | Risk |
|---|---|---|
| **A (recommended)** | Same palette, different application. Gradients, transparency, softer borders. Gray-12 dark / gray-0 light. Zero palette drift. | Low — same tokens, different usage |
| B | Warm-tinted palette for field (sepia/brown undertones vs. studio's neutral gray). Would need new CSS custom properties. | Medium — palette divergence risk |
| C | Higher contrast field palette (purer blacks/whites, fewer gray steps). Cinematic feel. | Medium — could clash with photo content |

Option A is recommended because photography already brings its own color via images. Let the photos do the heavy lifting; the UI should recede.

**Your call:** A, B, C?

---

### Q3: Field Nav — Card Grid vs. Mega Menu

Currently spec'd as a card grid below the header. Alternative:

| Option | Pattern | Best for |
|---|---|---|
| **A — Card Grid (recommended)** | 2-3 cards side by side with icon + title + description | 3 nav items (Gallery, Archive, About). Clean, spacious. |
| B — Horizontal Pills | Large pill buttons with icons, single row | Compact, less immersive |
| C — Vertical Sidebar | Left-aligned sidebar with icons, stays fixed | More app-like, desktop-only feel |

Option A is recommended because it matches the "wide, immersive" brief and scales to 3 items naturally.

**Your call:** A, B, C?

---

### Q4: Photography Gallery — Edge Bleed vs. Contained

| Option | Approach | Risk |
|---|---|---|
| **A — Edge bleed (recommended)** | Images span viewport edges via negative margins. Gap: `var(--size-2)`. | Needs responsive guard on mobile |
| B — Contained-wide | Container full-width but images inside it with generous gap | Less dramatic |
| C — Masonry | JS-driven masonry layout, varied heights | JS dependency, CLS risk |

Option A is recommended — pure CSS, zero JS, maximum impact.

**Your call:** A, B, C?

---

### Q5: Multi-Model Approval Gate for Phase 2

Phase 2 has 6 sub-phases (2.1–2.6). Before implementing, we should run the spec through our own reviewer loop to catch design issues early.

Proposed flow:

```
SPEC (this document)
    │
    ▼
┌─────────────────────────────┐
│ ① REVIEWER — V4 Pro          │  ← Read full spec
│    → design coherence check  │  → Does field persona feel intentional or bolted-on?
│    → accessibility check     │  → Does sans-only hurt readability at scale?
│    → mobile-first check      │  → Does wide layout collapse cleanly?
│    → performance check       │  → Any layout thrash on persona toggle?
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ ② QUALITY GATE — Kimi K2.7   │  ← Fresh perspective
│    → APPROVED / NEEDS WORK   │  → Different model, different training
│    → critique + suggestions  │  → Final go/no-go per phase
└──────────────────────────────┘
```

**Gate criteria:**
- Kimi returns `APPROVED` → implement Phase 2.1
- Kimi returns `NEEDS WORK` → incorporate feedback, re-gate
- Max 2 review cycles

Run this tomorrow before any code. The reviewer finds design smell; Kimi confirms or rejects.

**Your call:** Run the gate tomorrow before implementation?

---

### Q6: Scope — All Pages or Photography-First?

| Option | Approach | Effort |
|---|---|---|
| **A — Photography-first (recommended)** | Implement field persona ONLY on photography + library pages first. Home and About get minimal treatment. Land, verify, then expand. | Lower risk |
| B — All pages at once | Full 6-phase rollout across all field persona pages | Higher risk of regressions |

Option A is recommended — photography is the hero page for field persona. Get it right there, then propagate patterns to library, home, about.

**Your call:** A or B?


### Architecture Decision

**Strategy: CSS cascade gating, not page forking.**

Every field-persona change uses `[data-persona="field"]` as a selector prefix. This means:
- Studio persona CSS is untouched — zero risk of regression
- All field overrides live in one file (`field-persona.scss`)
- No JS changes needed (persona toggle already sets `data-persona` attribute)
- If field mode breaks, studio mode still works perfectly

**Why not separate layouts?** Astro content collections share one `[...slug].astro` template. Forking layouts means duplicating every page route slug → double the maintenance. CSS gating is simpler and safer.

**Font strategy:** Field persona drops IBM Plex Serif entirely. All text (headings, body, meta, nav) uses Inter at varying weights. This creates the "sans, wide, experiential" feel via one consistent typeface at different scales.

**Color strategy:** Same `--gray-*` palette, different application. Field uses gradients, softer borders, and more transparency instead of hard `--bg-soft` filled cards.

### File Inventory

| File | Type | What changes |
|---|---|---|
| `src/styles/field-persona.scss` | **NEW** | All `[data-persona="field"]` CSS overrides |
| `src/styles/global.scss` | Edit | Import `field-persona.scss` |
| `src/layouts/BaseLayout/BaseLayout.astro` | Edit | Field nav gets card-style markup |
| `src/layouts/BaseLayout/BaseLayout.scss` | Edit | Field nav card styles, container width gating |
| `src/pages/photography/_photography.scss` | Edit | Field gallery bleed + hero gradient |
| `src/pages/library/_library.scss` | Edit | Field book grid + filter tabs |
| `src/pages/_home/_home.scss` | Edit | Field hero treatment |
| `src/pages/about/_about.scss` | Edit | Field persona card styling |

### Phase 2.1 — Layout tokens + typography

**File: `src/styles/field-persona.scss` (NEW)**

```scss
/* ==========================================================================
   Field Persona — Immersive visual experience
   All styles gated on [data-persona="field"] on <html>
   Studio persona is completely untouched by this file.
   ========================================================================== */

@use "open-props/style";

/* ─── Layout tokens ──────────────────────────────────────────── */

[data-persona="field"] {
  --layout-max-width: var(--size-15);       /* ~1440px (was ~768px) */
  --layout-padding: var(--size-fluid-4);    /* fluid responsive padding */
  --prose-max-width: var(--size-content-4); /* wider reading width */
  --surface-padding: var(--size-6);         /* more breathing room */
  --surface-radius: var(--radius-3);        /* softer corners */

  /* Sans-only — no serifs in field persona */
  --font-display: "Inter", "Segoe UI", "Helvetica Neue", sans-serif;
}
```

**File: `src/styles/global.scss`** — add import at bottom

```scss
@use "./field-persona.scss";
```

**Checkpoint 2.1:** Toggle to field persona. Page goes wide (container expands to ~1440px). All headings switch from IBM Plex Serif to Inter. Spacing increases. Layout feels dramatically different from studio.

### Phase 2.2 — Field navigation redesign

**Current nav (studio):** Row of simple `<a>` links — `Journal | Notes | About`
**Target nav (field):** Card grid with icons, labels, and descriptions

**File: `src/layouts/BaseLayout/BaseLayout.astro`** — replace field nav block (lines 201-217)

Current:
```astro
            <nav
              class="base-layout__links"
              aria-label="Main navigation"
              data-persona-nav="field"
            >
              {
                navSets.field.map((item) => (
                  <a
                    href={item.href}
                    class={`base-layout__link ${path === item.href ? "base-layout__link--active" : ""}`}
                    aria-current={path === item.href ? "page" : undefined}
                  >
                    {item.label}
                  </a>
                ))
              }
            </nav>
```

New:
```astro
            <nav
              class="base-layout__links base-layout__links--field"
              aria-label="Main navigation"
              data-persona-nav="field"
            >
              {
                navSets.field.map((item) => (
                  <a
                    href={item.href}
                    class={`base-layout__field-nav-card ${path === item.href ? "base-layout__field-nav-card--active" : ""}`}
                    aria-current={path === item.href ? "page" : undefined}
                  >
                    <span class="base-layout__field-nav-icon" aria-hidden="true">
                      {item.href === "/photography" ? "📷" : item.href === "/library" ? "📚" : "🧑"}
                    </span>
                    <span class="base-layout__field-nav-label">{item.label}</span>
                    <span class="base-layout__field-nav-desc">
                      {item.href === "/photography" ? "Curated image sets from field sessions" :
                       item.href === "/library" ? "Reading notes, books, and long-form references" :
                       "Field notes, bio, and contact"}
                    </span>
                  </a>
                ))
              }
            </nav>
```

**File: `src/layouts/BaseLayout/BaseLayout.scss`** — add after `&__links` block (line 154)

```scss
  /* ─── Field persona nav cards ─────────────────────────────────── */

  &__links--field {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, var(--size-13)), 1fr));
    gap: var(--size-3);
    padding-block: var(--size-2);  /* extra breathing room below header */
  }

  &__field-nav-card {
    display: grid;
    gap: var(--size-1);
    padding: var(--size-4);
    border: var(--surface-border) solid
      color-mix(in srgb, var(--line) 60%, transparent);
    border-radius: var(--radius-3);
    background: color-mix(in srgb, var(--bg) 94%, transparent);
    color: var(--text);
    text-decoration: none;
    transition:
      border-color 220ms var(--ease-2),
      background-color 220ms var(--ease-2),
      transform 220ms var(--ease-2),
      box-shadow 220ms var(--ease-2);

    &:hover,
    &:focus-visible {
      border-color: color-mix(in srgb, var(--text) 20%, var(--line));
      background: color-mix(in srgb, var(--bg-soft) 60%, var(--bg));
      transform: translateY(-2px);
      box-shadow: var(--shadow-2);
    }

    &--active {
      border-color: color-mix(in srgb, var(--text) 30%, var(--line));
      background: color-mix(in srgb, var(--bg-soft) 80%, var(--bg));
    }

    @media (prefers-reduced-motion: reduce) {
      &:hover,
      &:focus-visible {
        transform: none;
      }
    }
  }

  &__field-nav-icon {
    font-size: var(--font-size-5);
    line-height: 1;
  }

  &__field-nav-label {
    font-size: var(--font-size-3);
    font-weight: var(--font-weight-6);
    line-height: var(--font-lineheight-1);
  }

  &__field-nav-desc {
    font-size: var(--font-size-1);
    color: var(--muted);
    line-height: var(--font-lineheight-2);
  }
```

**Checkpoint 2.2:** Toggle to field persona. Header shows card grid nav with icons + descriptions. Hover states work. Active page card highlighted. Studio nav unchanged (simple links).

### Phase 2.3 — Photography page field treatment

**File: `src/pages/photography/_photography.scss`** — add at end of file

```scss
/* ─── Field persona ───────────────────────────────────────────── */

[data-persona="field"] .photography {
  &__hero {
    padding-block: var(--size-10) var(--size-8);
    text-align: center;
    background: linear-gradient(
      180deg,
      color-mix(in srgb, var(--bg-soft) 60%, var(--bg)) 0%,
      var(--bg) 100%
    );
  }

  &__title {
    font-weight: var(--font-weight-8);
    letter-spacing: var(--font-letterspacing-1);
  }

  &__gallery {
    grid-template-columns: repeat(auto-fill, minmax(min(100%, var(--size-14)), 1fr));
    gap: var(--size-2);
    margin-inline: calc(var(--layout-padding) * -1);  /* edge-to-edge bleed */
  }

  &__shot {
    border-radius: 0;  /* no card radius in field mode */
  }

  &__image {
    transition: transform 400ms var(--ease-2);
  }

  &__shot-link:hover &__image,
  &__shot-link:focus-visible &__image {
    transform: scale(1.02);
  }

  &__caption {
    padding-inline: var(--size-2);
    padding-block: var(--size-2);
  }

  /* Category section titles get more breathing room */
  &__section-title {
    font-size: var(--font-size-6);
    font-weight: var(--font-weight-7);
    margin-block: var(--size-8) var(--size-4);
  }
}
```

**Checkpoint 2.3:** Photography page in field mode: hero has gradient background + tall padding. Gallery images bleed to viewport edges (negative margin on gallery container). Hover scale on images. Category titles are larger. Studio mode unchanged.

### Phase 2.4 — Library page field treatment

**File: `src/pages/library/_library.scss`** — add at end of file

```scss
/* ─── Field persona ───────────────────────────────────────────── */

[data-persona="field"] .library {
  &__hero {
    padding-block: var(--size-10) var(--size-8);
    text-align: center;
    background: linear-gradient(
      180deg,
      color-mix(in srgb, var(--bg-soft) 60%, var(--bg)) 0%,
      var(--bg) 100%
    );
  }

  &__title {
    font-weight: var(--font-weight-8);
    letter-spacing: var(--font-letterspacing-1);
  }

  /* Books grid: larger columns, more gap */
  &__books-grid {
    grid-template-columns: repeat(auto-fill, minmax(min(100%, var(--size-13)), 1fr));
    gap: var(--size-4);

    @media (min-width: 60rem) {
      grid-template-columns: repeat(auto-fill, minmax(var(--size-13), 1fr));
    }
  }

  /* Book items: bigger covers, softer cards */
  &__item {
    padding: var(--size-3);
    border-radius: var(--radius-3);
  }

  &__book-cover-link {
    border-radius: var(--radius-3);
  }

  &__book-cover {
    border-radius: var(--radius-3);
  }

  /* Category filters: horizontal pill tabs instead of underline links */
  &__tags {
    gap: var(--size-1);
    margin-block-end: var(--size-5);
  }

  &__tag-button {
    font-size: var(--font-size-1);
    padding: var(--size-2) var(--size-4);
    border-radius: var(--radius-round);
    border: var(--surface-border) solid
      color-mix(in srgb, var(--line) 60%, transparent);
    text-decoration: none;
    background: transparent;
    color: var(--muted);
    transition:
      color 180ms ease,
      background-color 180ms ease,
      border-color 180ms ease;

    &:hover,
    &:focus-visible {
      color: var(--text);
      border-color: color-mix(in srgb, var(--text) 20%, var(--line));
      background: color-mix(in srgb, var(--bg-soft) 40%, var(--bg));
    }

    &[aria-pressed="true"] {
      color: var(--text);
      border-color: color-mix(in srgb, var(--text) 40%, var(--line));
      background: color-mix(in srgb, var(--bg-soft) 80%, var(--bg));
    }
  }

  /* Section titles larger */
  &__section-title {
    font-size: var(--font-size-5);
    font-weight: var(--font-weight-7);
    margin-block: var(--size-7) var(--size-3);
  }

  /* Notes list: wider cards */
  &__notes-list {
    gap: var(--size-4);
  }

  &__note-item {
    padding: var(--size-5);
    border-radius: var(--radius-3);
  }
}
```

**Checkpoint 2.4:** Library page in field mode: hero with gradient. Book covers are larger with wider columns. Filter buttons are pill-shaped tabs (not underline text). Notes cards have more padding. Studio mode unchanged.

### Phase 2.5 — Home + About page field treatment

**File: `src/pages/_home/_home.scss`** — add at end

```scss
/* ─── Field persona ───────────────────────────────────────────── */

[data-persona="field"] .index {
  &__hero {
    padding-block: var(--size-10) var(--size-8);
    text-align: center;
  }

  &__title {
    font-weight: var(--font-weight-8);
    letter-spacing: var(--font-letterspacing-1);
  }

  &__section-title {
    font-size: var(--font-size-5);
    font-weight: var(--font-weight-7);
  }
}
```

**File: `src/pages/about/_about.scss`** — add at end

```scss
/* ─── Field persona ───────────────────────────────────────────── */

[data-persona="field"] .about {
  &__hero {
    padding-block: var(--size-10) var(--size-8);
    text-align: center;
    background: linear-gradient(
      180deg,
      color-mix(in srgb, var(--bg-soft) 60%, var(--bg)) 0%,
      var(--bg) 100%
    );
  }

  &__title {
    font-weight: var(--font-weight-8);
    letter-spacing: var(--font-letterspacing-1);
  }
}
```

**Checkpoint 2.5:** Home and About pages in field mode: hero sections with gradient backgrounds and center-aligned text. All headings sans-serif. Studio mode unchanged.

### Phase 2.6 — Polish: transitions, responsive, edge cases

**File: `src/styles/field-persona.scss`** — append responsive overrides

```scss
/* ─── Responsive: collapse field mode on mobile ───────────────── */

@media (max-width: 48rem) {
  [data-persona="field"] {
    --layout-max-width: 100%;
    --layout-padding: var(--size-3);
    --surface-padding: var(--size-4);
  }

  /* Single-column nav cards on mobile */
  [data-persona="field"] .base-layout__links--field {
    grid-template-columns: 1fr;
    gap: var(--size-2);
  }

  /* No edge bleed on mobile — images fill width naturally */
  [data-persona="field"] .photography__gallery {
    margin-inline: 0;
  }
}

/* ─── Smooth persona transition ────────────────────────────────── */

[data-persona="field"] .base-layout__container {
  transition: max-width 400ms var(--ease-2);
}

[data-persona="field"] {
  h1, h2, h3, h4, h5, h6 {
    transition: font-family 300ms var(--ease-1);
  }
}

@media (prefers-reduced-motion: reduce) {
  [data-persona="field"] .base-layout__container,
  [data-persona="field"] h1,
  [data-persona="field"] h2,
  [data-persona="field"] h3,
  [data-persona="field"] h4,
  [data-persona="field"] h5,
  [data-persona="field"] h6 {
    transition: none;
  }
}
```

**Checkpoint 2.6:** Mobile responsive — field nav stacks as single column, gallery margins collapse, container goes full-width. Persona toggle animation smooth (container width and font-family transition). `prefers-reduced-motion` respected.

---

## Master Verification Checklist

### Workstream 1 — Code Blocks
- [ ] `npm run build` passes with zero errors
- [ ] `npm run check` passes (TypeScript)
- [ ] Blog post at `/blog/building-quality-gated-ai-code-review-loops` shows Night Owl theme colors
- [ ] Code blocks have dark blue background (`#011627`), not `var(--bg-soft)` gray
- [ ] Inline code (backtick-wrapped words) still have gray background — not broken
- [ ] Fira Code ligatures active: `!=` `=>` `===` `->` `>=` span>
- [ ] Light mode: code blocks still readable (Night Owl works in light mode too)
- [ ] All other pages visually unchanged

### Workstream 2 — Field Persona
- [ ] Studio persona: every page renders identically to current production
- [ ] Field persona: max container width is `var(--size-15)` not `var(--size-md)`
- [ ] Field persona: NO serif fonts anywhere — all Inter
- [ ] Field nav: card grid with icons + descriptions, hover states, active highlight
- [ ] Photography: hero gradient, gallery edge-to-edge, hover scale on images
- [ ] Library: hero gradient, pill tab filters, larger book covers, wider notes cards
- [ ] Home: field hero center-aligned, section titles larger
- [ ] About: field hero gradient, social cards unchanged
- [ ] Persona toggle: switching between personas animates smoothly
- [ ] Persona toggle: studio→field→studio cycle preserves correct state
- [ ] Light/dark mode: works in both personas independently
- [ ] Mobile (< 48rem): field nav single-column, gallery no edge bleed
- [ ] `npm run build` passes, `npm run check` passes
- [ ] Zero console errors

### Rollback Plan
Every phase is independently revertible via `git revert`. Since field persona changes are CSS-only and gated behind `[data-persona="field"]`, removing `field-persona.scss` and the import line in `global.scss` instantly restores the studio-only look.

---

## Phase Ordering (Execution Sequence)

```
Phase 1.1 → 1.2 → 1.3  (code blocks: ship independently)
Phase 2.1 → 2.2 → 2.3 → 2.4 → 2.5 → 2.6  (field persona: incremental)
```

Workstream 1 can ship before, after, or in parallel with Workstream 2. No dependencies between them.

Each phase checkpoint must pass before proceeding to the next phase. Do not batch phases — incremental verification prevents hard-to-debug regressions.
