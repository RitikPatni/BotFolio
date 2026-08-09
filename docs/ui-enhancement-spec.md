# BotFolio UI Enhancement Spec — Concrete Implementation Plan

## Overview

Six workstreams:

| # | Workstream | Scope | Files touched | Status |
|---|---|---|---|---|
| 1 | Code blocks | Night Owl syntax highlighting + Fira Code ligatures | 6 | ✅ Merged |
| 2 | SEO + Social | OG tags, Twitter cards, canonical URLs, og-image | 4 | ✅ Implemented |
| 3 | Field persona | Playfair Display + cinematic palette + pill nav + edge-bleed gallery | 9 | ✅ Spec approved |
| 4 | Studio typography | Lora headings + fixed rem scale + mobile 80% | 3 | ✅ Spec approved |
| 5 | Design polish | Card contrast, persona distinction, icon migration, content cleanup | 8 | ✅ Spec approved |
| 6 | OG images | Satori-based programmatic OG cards — default + per-blog | 5 | ✅ Spec approved |

---

## Design Audit — 2026-08-09

Multi-model audit (3 subagents: design/UX, responsiveness, content/SEO/a11y) + live browser inspection + code review. Full subagent reports at `~/.hermes/cache/delegation/subagent-summary-*.txt`.

### Decisions Made

| Q | Domain | Decision |
|---|---|---|
| Q1 | Font stack | **D** — Inter (body) + Playfair Display (headings). High contrast, dramatic, art-gallery feel |
| Q2 | Color palette | **C** — Higher contrast. Purer blacks/whites, fewer gray steps. Cinematic |
| Q3 | Nav style | **B** — Horizontal pills. Compact, single row of large pill buttons |
| Q4 | Gallery layout | **A** — Edge bleed. Images span viewport via negative margin |
| Q5 | Approval gate | **Yes** — V4 Pro reviewer → Kimi K2.7 gate before implementation |
| Q6 | Scope | **B** — All pages at once. Full 6-phase rollout |
| A | Photography gallery width | Edge-bleed (option 3) — images span viewport via negative margin, zero JS |
| B | Surface card contrast | Lighten cards to gray-10 (`#212529`), keep bg `#030507` |
| C | Persona visual distinction | Field cards → transparent bg + border-only; studio cards stay filled |
| D | Control icons | Emojis → SVG: braces `{ }` (studio), aperture (field), contrast (theme) |
| E | Empty blog posts | Delete from live, set `draft: true`, remove from sitemap/RSS |
| F | Contact page | 301 redirect `/contact` → `/about`, drop from sitemap |
| G | OG card typeface | Lora (studio voice) — represents site brand, not a persona |

### Studio Typography (Workstream 4)

| Role | Size | Weight | Font |
|---|---|---|---|
| Page title (h1) | 2rem | 600 | Lora |
| Sub-heading (h2/h3) | 1.5rem | 600 | Lora |
| Card title | 1.5rem | 600 | Lora |
| h4 | 1.25rem | 600 | Lora |
| Entry item title | 1.25rem | 600 | Lora |
| Lead / description | 1.125rem | 400 | Inter |
| Body content | 1rem | 400 | Inter |
| Code / meta | 0.875rem | 400 | Fira Code |
| Tags / chips | 0.75rem | 600 | Inter (uppercase) |
| Mobile | 80% of all above | — | — |

Font stack: `--font-display: "Lora", "Iowan Old Style", "Palatino Linotype", serif`
Weights loaded: Lora 400/500/600/700 (italic included), Inter 400/600, Fira Code 400.
Letter-spacing: drop `--font-letterspacing-1` on page titles (Lora at 600 is calligraphic enough).
Line-heights: keep Open Props defaults.

#### Phase 4.1 — Font-size custom properties

**File: `src/styles/global.scss`** — add to `:root` block (after `--font-mono`)

```diff
+  /* Font-size scale */
+  --fs-heading: 2rem;
+  --fs-subheading: 1.5rem;
+  --fs-content: 1rem;
+  --fs-code: 0.875rem;
```

Add mobile 80% override after `:root[data-theme="light"]` block:

```scss
/* 80% font-size scale on mobile */
@media (max-width: 48rem) {
  :root {
    --fs-heading: 1.6rem;
    --fs-subheading: 1.2rem;
    --fs-content: 0.8rem;
    --fs-code: 0.7rem;
  }
}
```

**Checkpoint 4.1:** Custom properties available. No visual change yet — patterns still use Open Props tokens.

#### Phase 4.2 — Replace Open Props sizes with custom properties

**File: `src/styles/patterns.scss`** — replace all fluid/fixed font-size tokens

| Selector | Old | New |
|---|---|---|
| `%page-title` | `font-size: var(--font-size-fluid-3)` | `font-size: var(--fs-heading)` |
| `%prose` | `font-size: var(--font-size-2)` | `font-size: var(--fs-content)` |
| `%prose h2` | `font-size: var(--font-size-6)` | `font-size: var(--fs-heading)` |
| `%prose h3` | `font-size: var(--font-size-5)` | `font-size: var(--fs-subheading)` |
| `%prose :where(code, kbd)` | `font-size: var(--font-size-1)` | `font-size: var(--fs-code)` |
| `%prose pre code` | `font-size: var(--font-size-1)` | `font-size: var(--fs-code)` |
| `%surface-card-title` | `font-size: var(--font-size-5)` | `font-size: var(--fs-subheading)` |

Plus: drop `--font-letterspacing-1` from `%page-title`.

**Checkpoint 4.2:** All headings use the fixed scale. H1 is now 2rem (was ~56px). Mobile: all sizes 80%.

#### Phase 4.3 — Swap IBM Plex Serif → Lora

**File: `src/styles/global.scss`**

```diff
-  --font-display: "IBM Plex Serif", "Iowan Old Style", "Palatino Linotype", serif;
+  --font-display: "Lora", "Iowan Old Style", "Palatino Linotype", serif;
```

**File: `src/layouts/BaseLayout/BaseLayout.astro`** — Google Fonts URL

```diff
-      href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500&family=IBM+Plex+Serif:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&display=swap"
+      href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400&family=Inter:wght@400;600&family=Lora:ital,wght@0,400;0,600;0,700;1,400;1,600&display=swap"
```

**Checkpoint 4.3:** All headings use Lora. IBM Plex Serif removed. Font weights trimmed to used values.

### Self-Fixable Items (no decisions needed)

| # | Severity | Page | Issue | Fix |
|---|---|---|---|---|
| 1 | 🔴 | All | theme-color meta `#111111` mismatches actual bg `#030507` | Change meta to `#030507` |
| 2 | 🔴 | Blog/News | Heading hierarchy jumps h1→h3 (no h2) | Change listing h3 to h2 |
| 3 | 🔴 | Photography | Empty H2/H4 in lightbox static DOM | `aria-hidden="true"` on dialog or defer to JS |
| 4 | 🔴 | Photography | Missing alt on decorative gallery thumbs | Add `alt=""` |
| 5 | 🟡 | All | Two `<nav aria-label="Main navigation">` — identical landmark labels | Distinct labels: "Studio navigation" / "Field navigation" |
| 6 | 🟡 | All | `viewport` meta lacks `initial-scale=1` | Add `initial-scale=1.0` |
| 7 | 🟡 | Blog | Two hand-written `<pre>` ASCII blocks lack `.astro-code` → no horizontal scroll | Add `overflow-x: auto` wrapper |
| 8 | 🟡 | All | Prose h2/h3 share identical top margin (`--size-7`) | h2 gets `margin-block-start: var(--size-8)` |
| 9 | 🔴 | All (SEO) | Sitemap URLs malformed (`https:///ritikpatni.me/`) | Fix `toUrl()` in `src/pages/sitemap.xml.ts` |
| 10 | 🔴 | Newsletter | Over-escaped `&quot;` in 3+ H3 titles | Content pipeline fix — unescape titles |
| 11 | 🔴 | Library | ~14 duplicate "Feedly" entries in Notes | Dedup by slug |
| 12 | 🟡 | All | Google Fonts loads 11 weights across 3 families | Trim to: Inter 400/600, Lora 400/600/700, Fira Code 400 |
| 13 | 🟡 | Mobile | Header loses stickiness at 48rem, 133px tall | `position: sticky` + collapse to single row |
| 14 | 🟡 | Photos | 39 hi-res images on one page, some unverified lazy-loading | Verify `loading="lazy"` + `srcset` on all gallery images |

### New Workstreams from Audit

#### Workstream 5: Design Polish

**Phase 5.1 — Surface card contrast**
File: `src/styles/global.scss`
Change `--bg-soft` from `var(--gray-11)` to `var(--gray-10)`.
```diff
-  --bg-soft: var(--gray-11);
+  --bg-soft: var(--gray-10);
```

**Phase 5.2 — SVG icon migration**
Files: `BaseLayout.astro`, `BaseLayout.scss`, 3 new icon components (already created)
- Persona toggle thumb: ⌨ → `<BracesIcon>`, 📷 → `<ApertureIcon>`
- Theme FAB: ◐ → `<ContrastIcon>`
- Remove emoji sizing CSS hacks

**Phase 5.3 — Persona nav landmark labels**
File: `BaseLayout.astro`
```diff
- aria-label="Main navigation"
+ aria-label="Studio navigation"  (on studio nav)
+ aria-label="Field navigation"   (on field nav)
```

**Phase 5.4 — Content cleanup**
- 48 "Imported from Obsidian. Content was empty" posts → `draft: true`
- 14 duplicate "Feedly" entries → dedup
- `/contact` → 301 to `/about`, remove from sitemap
- Newsletter `&quot;` escaping → unescape in content pipeline

**Phase 5.5 — theme-color meta fix**
File: `BaseLayout.astro`
```diff
- content="#111111"
+ content="#030507"
```

**Phase 5.6 — viewport + heading hierarchy + alt text**
- `viewport` → add `initial-scale=1.0`
- Blog/newsletter h3 → h2
- Gallery thumbs → `alt=""`
- Lightbox dialog → `aria-hidden="true"`

**Phase 5.7 — Font weight trim**
File: `BaseLayout.astro` Google Fonts URL
Trim to: `Inter:wght@400;600`, `Lora:ital,wght@0,400;0,600;0,700;1,400;1,600`, `Fira+Code:wght@400`

**Phase 5.8 — Mobile header + prose fixes**
- `BaseLayout.scss`: keep header `position: sticky` on mobile, collapse to single row
- `patterns.scss`: h2 gets `margin-block-start: var(--size-8)`
- Blog ASCII pre blocks: wrap in `overflow-x: auto`

### Problem
DuckDuckGo and other search engines showed poor descriptions for BotFolio pages. No Open Graph tags, no Twitter cards, no canonical URLs, no social preview image. The `<head>` only had `<title>` and `<meta name="description">`.

### Solution

**File additions:**

**`src/layouts/BaseLayout/BaseLayout.astro`** — new props + meta tags:
- Added `image` prop (default: `/og-image.png`) and `ogType` prop (default: `website`)
- Computes `canonicalUrl` and `imageUrl` from `Astro.site`
- Renders: `og:title`, `og:description`, `og:image`, `og:url`, `og:type`, `og:site_name`
- Renders: `twitter:card` (summary_large_image), `twitter:title`, `twitter:description`, `twitter:image`
- Adds: `<link rel="canonical">`, `<meta name="robots" content="index, follow">`

**`src/pages/blog/[...slug].astro`** — per-post SEO:
- Path changed from `/blog` to `/blog/${post.slug}` for correct canonical URL
- `ogType="article"` for blog posts

**`public/og-image.png`** — 1200×630 social preview:
- Dark background (#111111) matching site theme
- "Ritik Patni" in Inter Bold (64px, white)
- Tagline "Frontend developer & wildlife/macro photographer" (28px, muted gray)
- URL "ritikpatni.me" (28px, dimmed gray)

### Verification
- `npm run build`: 240 pages, 0 errors
- All pages have: og:title, og:description, og:image, og:url, og:type, og:site_name
- All pages have: twitter:card, twitter:title, twitter:description, twitter:image
- All pages have: canonical URL, robots meta
- Blog posts use `ogType="article"` with post-specific path

---

## Workstream 3: Field Persona Transformation (REWRITTEN — 2026-08-09)

Decisions resolved. Spec rewritten to match: Playfair Display, cinematic palette, horizontal pill nav, edge-bleed gallery, all pages.

### Architecture Decision

**Strategy: CSS cascade gating, not page forking.**

Every field-persona change uses `[data-persona="field"]` as a selector prefix. This means:
- Studio persona CSS is untouched — zero risk of regression
- All field overrides live in one file (`field-persona.scss`)
- No JS changes needed (persona toggle already sets `data-persona` attribute)
- If field mode breaks, studio mode still works perfectly

**Why not separate layouts?** Astro content collections share one `[...slug].astro` template. Forking layouts means duplicating every page route slug → double the maintenance. CSS gating is simpler and safer.

**Font strategy:** Inter (body) at 400 weight + Playfair Display (headings) at minimum 500 weight. Playfair is a high-contrast transitional serif — dramatic, elegant, art-gallery feel. Its extreme stroke contrast (hairline thins vs bold thicks) creates instant visual identity distinct from studio's Lora. Minimum weight 500 ensures hairlines remain visible on dark backgrounds.

**Color strategy:** Cinematic high-contrast palette. Pure black background, brighter whites, fewer intermediate gray steps. The page becomes a dark frame; photos provide all the color.

**Nav strategy:** Horizontal pills. Large rounded buttons in a single row with icons (BracesIcon, ApertureIcon from Workstream 5). Compact and scannable. Icon-only on mobile.

**Gallery strategy:** Edge-bleed. Images span viewport edges via CSS `margin-inline: calc(var(--layout-padding) * -1)`. On mobile (< 48rem): `margin-inline: 0` (already full-width).

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

### Cinematic Color Palette

Field persona overrides the shared `:root` tokens with a higher-contrast cinematic scale:

```
Token        | Studio (shared :root) | Field override      | Purpose
-------------|----------------------|---------------------|--------
--bg         | gray-12 (#030507)    | #000000 (pure black) | Darker, more dramatic
--bg-soft    | gray-10 (#212529)    | gray-11 (#1a1c1e)   | Fewer gray steps
--text       | stone-0 (#f8fafb)    | stone-0              | Shared
--muted      | gray-4               | gray-5              | Brighter muted text
--line       | gray-8               | gray-9              | Subtler borders on pure black
```

Applied in `field-persona.scss`:
```scss
[data-persona="field"] {
  --bg: #000000;
  --bg-soft: var(--gray-11);
  --muted: var(--gray-5);
  --line: var(--gray-9);
}
```

### File Inventory

| File | Type | What changes |
|---|---|---|
| `src/styles/field-persona.scss` | **NEW** | All `[data-persona="field"]` overrides: layout, palette, fonts, pills, gallery, transitions |
| `src/styles/global.scss` | Edit | Import `field-persona.scss` |
| `src/layouts/BaseLayout/BaseLayout.astro` | Edit | Field nav: replace simple links with horizontal pills + SVG icons |
| `src/layouts/BaseLayout/BaseLayout.scss` | Edit | Pill nav styles |
| `src/pages/photography/_photography.scss` | Edit | Edge-bleed gallery + hero gradient |
| `src/pages/library/_library.scss` | Edit | Field book grid + filter pills |
| `src/pages/_home/_home.scss` | Edit | Field hero treatment |
| `src/pages/about/_about.scss` | Edit | Field persona styling |

### Phase 3.1 — Layout tokens + Playfair typography

**File: `src/styles/field-persona.scss` (NEW)**

```scss
/* ==========================================================================
   Field Persona — Immersive visual experience
   All styles gated on [data-persona="field"] on <html>
   Studio persona is completely untouched.
   ========================================================================== */

@use "open-props/style";

[data-persona="field"] {
  /* Layout */
  --layout-max-width: var(--size-15);       /* ~1440px (was ~768px) */
  --layout-padding: var(--size-fluid-4);
  --prose-max-width: var(--size-content-4);
  --surface-padding: var(--size-6);
  --surface-radius: var(--radius-3);

  /* Cinematic palette */
  --bg: #000000;
  --bg-soft: var(--gray-11);
  --muted: var(--gray-5);
  --line: var(--gray-9);

  /* Playfair Display for headings */
  --font-display: "Playfair Display", "Iowan Old Style", "Palatino Linotype", serif;

  /* Force minimum heading weight — Playfair hairlines vanish on dark bg */
  h1, h2, h3, h4, h5, h6 {
    font-weight: 500;
  }
}
```

**File: `src/layouts/BaseLayout/BaseLayout.astro`** — Google Fonts URL (add Playfair)

```diff
-      href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500&family=IBM+Plex+Serif:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&display=swap"
+      href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400&family=Inter:wght@400;600&family=Lora:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500&display=swap"
```

(Final URL combines WS4 Lora trim + WS3 Playfair. Also loaded in design-audit-variants.html.)

**File: `src/styles/global.scss`** — add import at bottom

```scss
@use "./field-persona.scss";
```

**Checkpoint 3.1:** Toggle to field persona. Container expands to ~1440px. All headings switch to Playfair Display (500+ weight). Background goes pure black. Studio mode completely unchanged.

### Phase 3.2 — Horizontal pill navigation

**Current nav (studio):** Row of simple `<a>` links — `Journal | Notes | About`
**Current nav (field):** Same row of simple links — `Gallery | Archive | About`
**Target nav (field):** Horizontal pills with SVG icons, single row. Compact, scannable.

**File: `src/layouts/BaseLayout/BaseLayout.astro`** — replace field nav block

Current:
```astro
            <nav
              class="base-layout__links"
              aria-label="Field navigation"
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
              aria-label="Field navigation"
              data-persona-nav="field"
            >
              {
                navSets.field.map((item) => (
                  <a
                    href={item.href}
                    class={`base-layout__pill ${path === item.href ? "base-layout__pill--active" : ""}`}
                    aria-current={path === item.href ? "page" : undefined}
                  >
                    <span class="base-layout__pill-icon" aria-hidden="true">
                      {item.href === "/photography" ? <ApertureIcon /> :
                       item.href === "/library" ? <ImageIcon /> :
                       <BracesIcon />}
                    </span>
                    <span class="base-layout__pill-label">{item.label}</span>
                  </a>
                ))
              }
            </nav>
```

(Imports needed at top of BaseLayout.astro: `import ApertureIcon from "../../components/icons/ApertureIcon.astro"`, `import ImageIcon from "../../components/icons/ImageIcon.astro"`, `import BracesIcon from "../../components/icons/BracesIcon.astro"`. ImageIcon already exists in the codebase; ApertureIcon and BracesIcon created in WS5.2.)

**File: `src/layouts/BaseLayout/BaseLayout.scss`** — pill styles

```scss
  /* ─── Field persona pill nav ──────────────────────────────────── */

  &__links--field {
    display: flex;
    gap: var(--size-2);
    flex-wrap: nowrap;

    @media (max-width: 48rem) {
      gap: var(--size-1);
    }
  }

  &__pill {
    display: inline-flex;
    align-items: center;
    gap: var(--size-2);
    padding: var(--size-2) var(--size-4);
    border: var(--surface-border) solid
      color-mix(in srgb, var(--line) 50%, transparent);
    border-radius: var(--radius-round);
    background: transparent;
    color: var(--muted);
    text-decoration: none;
    font-size: var(--font-size-1);
    font-weight: var(--font-weight-5);
    min-block-size: 44px;          /* touch target */
    min-inline-size: 44px;
    transition:
      color 180ms ease,
      border-color 180ms ease,
      background-color 180ms ease;

    &:hover,
    &:focus-visible {
      color: var(--text);
      border-color: color-mix(in srgb, var(--text) 25%, var(--line));
      background: color-mix(in srgb, var(--bg-soft) 30%, transparent);
    }

    &--active {
      color: var(--text);
      border-color: color-mix(in srgb, var(--text) 40%, var(--line));
      background: color-mix(in srgb, var(--bg-soft) 60%, transparent);
    }

    @media (max-width: 48rem) {
      padding: var(--size-2) var(--size-3);
    }
  }

  &__pill-icon {
    display: flex;
    align-items: center;
    svg {
      inline-size: var(--size-4);
      block-size: var(--size-4);
    }
  }

  &__pill-label {
    @media (max-width: 48rem) {
      /* visually-hidden — NOT display:none (a11y: preserves accessible name) */
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
  }
```

**Checkpoint 3.2:** Toggle to field persona. Nav shows 3 pills: 📷 Gallery, 📷 Archive, 🧑 About. Hover states work. Active page pill highlighted. On mobile: icons only, labels hidden. Studio nav unchanged.

### Phase 3.3 — Photography edge-bleed gallery

**File: `src/pages/photography/_photography.scss`** — replace field persona section

```scss
/* ─── Field persona — edge-bleed gallery ──────────────────────── */

[data-persona="field"] .photography {
  &__hero {
    padding-block: var(--size-10) var(--size-8);
    text-align: center;
  }

  &__title {
    font-weight: 700;
    letter-spacing: var(--font-letterspacing-1);
  }

  /* Edge-bleed: images span viewport edges */
  &__gallery {
    grid-template-columns: repeat(auto-fill, minmax(min(100%, var(--size-14)), 1fr));
    gap: var(--size-2);
    margin-inline: calc(var(--layout-padding) * -1);
  }

  &__shot {
    border-radius: 0;               /* no card radius in field */
  }

  &__image {
    transition: transform 400ms var(--ease-2);
  }

  &__shot-link:hover &__image,
  &__shot-link:focus-visible &__image {
    transform: scale(1.02);
  }

  &__caption {
    padding-inline: var(--size-3);  /* compensate for edge-bleed */
    padding-block: var(--size-2);
  }

  &__section-title {
    font-size: var(--font-size-6);
    font-weight: 700;
    margin-block: var(--size-8) var(--size-4);
  }
}

/* Mobile: no negative margin (already full-width) */
@media (max-width: 48rem) {
  [data-persona="field"] .photography__gallery {
    margin-inline: 0;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  [data-persona="field"] .photography__image {
    transition: none;
  }
}
```

**Checkpoint 3.3:** Photography in field mode: hero center-aligned, gallery images bleed to viewport edges, hover scale on images. Category titles larger (700 weight Playfair). On mobile: edge-bleed disabled, images fill viewport naturally.
### Phase 3.4 — Library field treatment

**File: `src/pages/library/_library.scss`** — add at end

```scss
/* ─── Field persona ───────────────────────────────────────────── */

[data-persona="field"] .library {
  &__hero {
    padding-block: var(--size-10) var(--size-8);
    text-align: center;
  }

  &__title {
    font-weight: 700;
    letter-spacing: var(--font-letterspacing-1);
  }

  /* Books grid: larger columns */
  &__books-grid {
    grid-template-columns: repeat(auto-fill, minmax(min(100%, var(--size-13)), 1fr));
    gap: var(--size-4);

    @media (min-width: 60rem) {
      grid-template-columns: repeat(auto-fill, minmax(var(--size-13), 1fr));
    }
  }

  &__item {
    padding: var(--size-3);
    border-radius: var(--radius-3);
    background: transparent;          /* Decision C: field cards transparent */
    border: var(--surface-border) solid
      color-mix(in srgb, var(--line) 50%, transparent);
  }

  &__book-cover-link, &__book-cover {
    border-radius: var(--radius-3);
  }
}
```

**Checkpoint 3.4:** Library in field mode: hero center-aligned, book covers larger with wider columns. Studio unchanged.

### Phase 3.5 — Home + About field treatment

**File: `src/pages/_home/_home.scss`** — add at end

```scss
/* ─── Field persona ───────────────────────────────────────────── */

[data-persona="field"] .index {
  &__hero {
    padding-block: var(--size-10) var(--size-8);
    text-align: center;
  }

  &__title {
    font-weight: 700;
    letter-spacing: var(--font-letterspacing-1);
  }

  &__section-title {
    font-size: var(--font-size-5);
    font-weight: 700;
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
  }

  &__title {
    font-weight: 700;
    letter-spacing: var(--font-letterspacing-1);
  }
}
```

**Checkpoint 3.5:** Home and About in field mode: hero sections center-aligned, Playfair headings at 700 weight. Studio unchanged.

### Phase 3.6 — Polish: transitions, responsive, edge cases

**File: `src/styles/field-persona.scss`** — append

```scss
/* ─── Responsive: collapse field persona on mobile ────────────── */

@media (max-width: 48rem) {
  [data-persona="field"] {
    --layout-max-width: 100%;
    --layout-padding: var(--size-3);
    --surface-padding: var(--size-4);
  }
}

/* ─── Smooth persona transition ───────────────────────────────── */

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
  [data-persona="field"] h1, h2, h3, h4, h5, h6 {
    transition: none;
  }
}
```

**Checkpoint 3.6:** Mobile: container full-width, padding reduced. Persona toggle animation smooth. `prefers-reduced-motion` respected. Studio unchanged.

---

## Master Verification Checklist

### Workstream 3 — Field Persona
- [ ] `npm run build` passes with zero errors
- [ ] `npm run check` passes
- [ ] Studio persona: every page renders identically to current production
- [ ] Field persona: container max-width is `var(--size-15)` (~1440px, not 768px)
- [ ] Field persona: background is pure black (`#000000`)
- [ ] Field persona: headings use Playfair Display at 500+ weight, body uses Inter
- [ ] Field persona: muted text is brighter (gray-5 vs gray-4)
- [ ] Field nav: horizontal pills with SVG icons, hover/active states
- [ ] Field nav mobile: icon-only, labels hidden, pills maintain 44px touch target
- [ ] Photography: edge-bleed gallery (images span viewport edges)
- [ ] Photography mobile: edge-bleed disabled, images full-width
- [ ] Library: hero center-aligned, wider book grid
- [ ] Home: field hero center-aligned, Playfair headings
- [ ] About: field hero center-aligned
- [ ] Persona toggle animation: smooth container + font-family transition
- [ ] `prefers-reduced-motion`: transitions disabled
- [ ] Light mode: works in field persona independently
- [ ] Zero console errors

### Workstream 4 — Studio Typography
- [ ] `npm run build` passes
- [ ] Studio headings use Lora at 600 weight
- [ ] Font sizes: 2rem h1/h2, 1.5rem h3/card, 1rem body, 0.875rem code
- [ ] Mobile: 80% scale on all sizes
- [ ] IBM Plex Serif removed from font stack and Google Fonts URL
- [ ] `--font-letterspacing-1` dropped from page titles

### Workstream 5 — Design Polish
- [ ] Card background is gray-10 (`#212529`), visibly lifts from `#030507`
- [ ] Persona toggle uses BracesIcon / ApertureIcon (SVG), not emoji
- [ ] Theme FAB uses ContrastIcon (SVG), not emoji
- [ ] Nav landmarks have distinct labels ("Studio navigation" / "Field navigation")
- [ ] `viewport` meta includes `initial-scale=1.0`
- [ ] `theme-color` meta dark is `#030507` (matching actual bg)
- [ ] Blog/newsletter listings use h2 not h3
- [ ] Gallery thumbnails have `alt=""` on decorative images
- [ ] Lightbox dialog is `aria-hidden="true"`
- [ ] Google Fonts URL trimmed to used weights only
- [ ] Sitemap URLs are `https://ritikpatni.me/` (not `https:///ritikpatni.me/`)
- [ ] Empty blog posts set to `draft: true`
- [ ] `/contact` returns 301 to `/about`

### Rollback Plan
Every phase is independently revertible via `git revert`. Since all persona changes are CSS-gated behind `[data-persona="field"]`, removing `field-persona.scss` and the import line in `global.scss` instantly restores the studio-only look. Studio typography changes (Lora + scale) are reversible by reverting patterns.scss + global.scss + BaseLayout.astro.

---

## Phase Ordering (Execution Sequence)

```
WS4: Studio typography (Lora + rem scale + mobile 80%)
  ↓
WS5.1-5.8: Design polish (14 self-fixable items)
  ↓
WS3.1 → 3.2 → 3.3 → 3.4 → 3.5 → 3.6  (field persona: incremental)
```

WS4 ships first — immediate typography improvement. WS5 next — quick wins. WS3 last — the biggest visual change, built on the clean foundation of WS4+WS5.

Each phase checkpoint must pass before proceeding to the next phase. Do not batch phases — incremental verification prevents hard-to-debug regressions.

---

## Workstream 6: Programmatic OG Image Generation

### Architecture Decision

**Strategy: Satori + resvg at build time, zero runtime cost.**

Satori (Vercel's HTML→SVG engine) renders JSX to SVG using Yoga layout (Flexbox subset). resvg converts SVG to PNG. Both run entirely at build time — no headless browser, no Cloudflare runtime dependency.

**Why not Puppeteer/Playwright?** Adds 300MB+ of Chromium to the build. Satori is ~500KB and uses the same layout engine as React Native.

**Why not `image_generate`?** AI can't reliably render text at 1200×630. Typography must be pixel-perfect for OG cards.

**OG card typeface: Lora (studio voice).** OG cards represent the site brand, not a specific persona. Lora is the studio heading font and the site's primary display typeface. It reads as "Ritik Patni" regardless of which persona a visitor lands on.

**Two endpoints:**

| Route | What it generates | When |
|---|---|---|
| `/og/default.png` | Site-wide OG image (name + tagline) | Build time |
| `/og/blog/[slug].png` | Per-blog OG image (title + date + read time) | Build time |

### Dependencies

```bash
npm install satori @resvg/resvg-js
```

~500KB total, dev + build dependency only.

### OG Card Design — Default

```
┌──────────────────────────────────────────────────────────┐
│  [subtle gradient overlay]                    ⌨  📷      │
│                                                          │
│                    Ritik Patni                            │
│              (Lora 600, 72px, white)                      │
│                                                          │
│     Frontend developer & wildlife/macro photographer      │
│            (Inter 400, 24px, muted gray)                  │
│                                                          │
│                    ritikpatni.me                          │
│            (Inter 400, 18px, dimmed gray)                 │
│                                                          │
│  ═══════════════════════════════════════════════════════  │
│  dark bg (#030507) with subtle geometric/camera pattern  │
└──────────────────────────────────────────────────────────┘
```

### OG Card Design — Per-Blog

```
┌──────────────────────────────────────────────────────────┐
│  Ritik Patni                                    [date]   │
│  (Inter 500, 14px, top-left)                             │
│                                                          │
│     Building Quality-Gated AI Code Review Loops           │
│  (Lora 600, 40px multi-line, white, max 2 lines)         │
│                                                          │
│  How to implement auditor-reviewer and planner-...        │
│  (Inter 400, 20px, muted, max 1 line — description)      │
│                                                          │
│  07 Aug 2026  ·  7 min read  ·  blog                     │
│  (Inter 400, 14px, dimmed)                               │
│                                                          │
│  ═══════════════════════════════════════════════════════  │
│  dark bg + subtle left-accent bar (Playfair aesthetic)   │
└──────────────────────────────────────────────────────────┘
```

### File Inventory

| File | Type | What |
|---|---|---|
| `src/pages/og/default.png.ts` | **NEW** | Astro endpoint: default OG card |
| `src/pages/og/blog/[slug].png.ts` | **NEW** | Astro endpoint: per-blog OG cards |
| `src/utils/og/render.ts` | **NEW** | Shared Satori renderer + layout primitives |
| `src/utils/og/default-card.tsx` | **NEW** | JSX template for default card |
| `src/utils/og/blog-card.tsx` | **NEW** | JSX template for blog card |
| `public/og-image.png` | **DELETE** | Replaced by `/og/default.png` |
| `package.json` | Edit | Add `satori`, `@resvg/resvg-js` |

### Phase 6.1 — Install deps + shared renderer

**File: `package.json`**

```diff
  "dependencies": {
+   "@resvg/resvg-js": "^2.6.0",
+   "satori": "^0.10.0",
    ...
  }
```

Run: `npm install`

**File: `src/utils/og/render.ts` (NEW)**

```ts
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import type { SatoriOptions } from "satori";

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

// Fonts bundled locally under src/assets/fonts/ to avoid gstatic URL rot.
// Download these 5 woff2 files once and commit them:
//   Inter-Regular.woff2  (400)
//   Inter-Medium.woff2   (500) — needed for blog card top-meta row
//   Inter-Bold.woff2     (600)
//   Lora-Regular.woff2   (400)
//   Lora-Bold.woff2      (600)
//
// In Astro endpoints, resolve font binaries via import.meta.resolve
// and readFileSync. Alternative: use Vite's ?arraybuffer import.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const FONTS_DIR = resolve(import.meta.dirname, "../../../assets/fonts");

function loadFont(filename: string): ArrayBuffer {
  return readFileSync(resolve(FONTS_DIR, filename)).buffer;
}

export async function renderOgImage(jsx: JSX.Element): Promise<Buffer> {
  const fonts: SatoriOptions["fonts"] = [
    { name: "Inter", data: loadFont("Inter-Regular.woff2"), weight: 400, style: "normal" },
    { name: "Inter", data: loadFont("Inter-Medium.woff2"), weight: 500, style: "normal" },
    { name: "Inter", data: loadFont("Inter-Bold.woff2"), weight: 600, style: "normal" },
    { name: "Lora", data: loadFont("Lora-Regular.woff2"), weight: 400, style: "normal" },
    { name: "Lora", data: loadFont("Lora-Bold.woff2"), weight: 600, style: "normal" },
  ];

  const svg = await satori(jsx, {
    width: OG_WIDTH,
    height: OG_HEIGHT,
    fonts,
  });

  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: OG_WIDTH },
  });

  return resvg.render().asPng();
}
```

### Phase 6.2 — Default OG card

**File: `src/utils/og/default-card.tsx` (NEW)**

```tsx
/** @jsxImportSource satori */

export function DefaultOgCard() {
  return (
    <div
      style={{
        width: 1200,
        height: 630,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #030507 0%, #0d1117 50%, #030507 100%)",
        fontFamily: "Inter",
        color: "#f8fafb",
        gap: 24,
        position: "relative",
      }}
    >
      {/* Subtle decorative line */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)",
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
        }}
      >
        <h1
          style={{
            fontFamily: "Lora",
            fontSize: 72,
            fontWeight: 600,
            color: "#f8fafb",
            margin: 0,
            lineHeight: 1.1,
          }}
        >
          Ritik Patni
        </h1>

        <p
          style={{
            fontSize: 24,
            fontWeight: 400,
            color: "#ced4da",
            margin: 0,
            maxWidth: 700,
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          Frontend developer &amp; wildlife/macro photographer
        </p>

        <p
          style={{
            fontSize: 18,
            fontWeight: 400,
            color: "#868e96",
            margin: 0,
            marginTop: 8,
          }}
        >
          ritikpatni.me
        </p>
      </div>
    </div>
  );
}
```

**File: `src/pages/og/default.png.ts` (NEW)**

```ts
import { DefaultOgCard } from "../../utils/og/default-card";
import { renderOgImage } from "../../utils/og/render";

export async function GET() {
  const png = await renderOgImage(<DefaultOgCard />);
  return new Response(png, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
```

### Phase 6.3 — Per-blog OG cards

**File: `src/utils/og/blog-card.tsx` (NEW)**

```tsx
/** @jsxImportSource satori */

export function BlogOgCard({
  title,
  description,
  date,
  readTime,
}: {
  title: string;
  description: string;
  date: string;
  readTime: string;
}) {
  return (
    <div
      style={{
        width: 1200,
        height: 630,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        background: "linear-gradient(150deg, #030507 0%, #0d1117 100%)",
        fontFamily: "Inter",
        color: "#f8fafb",
        padding: 56,
        position: "relative",
      }}
    >
      {/* Left accent bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          width: 6,
          background: "linear-gradient(180deg, rgba(255,255,255,0.1), rgba(255,255,255,0.03), transparent)",
        }}
      />

      {/* Top metadata row */}
      <div
        style={{
          position: "absolute",
          top: 48,
          left: 56,
          display: "flex",
          justifyContent: "space-between",
          width: 1088,
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 500, color: "#868e96" }}>
          Ritik Patni
        </span>
        <span style={{ fontSize: 14, fontWeight: 400, color: "#868e96" }}>
          {date}
        </span>
      </div>

      {/* Title */}
      <h1
        style={{
          fontFamily: "Lora",
          fontSize: 44,
          fontWeight: 600,
          color: "#f8fafb",
          margin: 0,
          marginBottom: 16,
          lineHeight: 1.25,
          maxWidth: 900,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {title}
      </h1>

      {/* Description */}
      <p
        style={{
          fontSize: 20,
          fontWeight: 400,
          color: "#ced4da",
          margin: 0,
          marginBottom: 24,
          maxWidth: 750,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {description}
      </p>

      {/* Bottom meta */}
      <p
        style={{
          fontSize: 14,
          fontWeight: 400,
          color: "#868e96",
          margin: 0,
        }}
      >
        {date} &middot; {readTime} &middot; blog
      </p>
    </div>
  );
}
```

**File: `src/pages/og/blog/[slug].png.ts` (NEW)**

```ts
import { getCollection } from "astro:content";
import { BlogOgCard } from "../../../utils/og/blog-card";
import { renderOgImage } from "../../../utils/og/render";
import { formatDisplayDate } from "../../../utils/date";

// Canonical read-time helper. If a shared utility is later added to
// src/utils/readingTime.ts, replace this with an import of that helper.
function getReadTime(body: string): string {
  const words = body.split(/\s+/).length;
  return `${Math.max(1, Math.ceil(words / 200))} min read`;
}

export async function getStaticPaths() {
  const posts = await getCollection("blog", ({ data }) => !data.draft);
  return posts.map((post) => ({ params: { slug: post.slug }, props: { post } }));
}

export async function GET({ props }: { props: { post: any } }) {
  const { post } = props;
  const date = formatDisplayDate(post.data.date);
  const readTime = getReadTime(post.body || "");

  const png = await renderOgImage(
    <BlogOgCard
      title={post.data.title}
      description={post.data.description || ""}
      date={date}
      readTime={readTime}
    />
  );

  return new Response(png, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
```

### Phase 6.4 — Wire up OG tags

**File: `src/layouts/BaseLayout/BaseLayout.astro`** — update `image` prop logic

```diff
- image = "/og-image.png",
+ image = "/og/default.png",
```

**File: `src/pages/blog/[...slug].astro`** — pass per-post OG image

```diff
+ const ogImage = `/og/blog/${post.slug}.png`;

  <BaseLayout
    title={...}
    description={...}
    path={`/blog/${post.slug}`}
    ogType="article"
+   image={ogImage}
  >
```

### Phase 6.5 — Cleanup

```bash
rm public/og-image.png  # replaced by /og/default.png
```

### Checkpoint 6.x

- [ ] `npm run build` passes (now slower — ~30-60s extra for 240 OG cards)
- [ ] `curl -I https://ritikpatni.me/og/default.png` returns `image/png`
- [ ] `curl -I https://ritikpatni.me/og/blog/building-quality-gated-ai-code-review-loops.png` returns `image/png`
- [ ] Blog post pages render `og:image` pointing to per-blog OG card
- [ ] Non-blog pages render `og:image` pointing to default OG card
- [ ] Twitter Card Validator renders correctly at 1200×630
- [ ] OG cards have correct typography (Lora headings, Inter body)
- [ ] Dark gradient background renders cleanly

### Verification

```bash
npm run build
# Confirm dist/og/default.png and dist/og/blog/*.png exist
ls dist/og/default.png
ls dist/og/blog/ | wc -l  # should match non-draft blog count
```

---

## Updated Master Verification Checklist

(Add to existing checklist)

### Workstream 6 — OG Image Generation
- [ ] `npm run build` passes with Satori dependency
- [ ] `dist/og/default.png` exists (1200×630, dark gradient, Lora heading)
- [ ] Per-blog OG cards exist for all non-draft posts
- [ ] Blog pages reference `/og/blog/<slug>.png` in `og:image`
- [ ] All other pages reference `/og/default.png` in `og:image`
- [ ] `public/og-image.png` removed
- [ ] Twitter/OG validators show correct card images

