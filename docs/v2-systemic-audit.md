# BotFolio V2 — Systemic Audit

Date: 2026-08-09
Scope: Post-V2 merge, live site + codebase analysis
Methodology: Browser inspection (live site), code audit (SCSS, TS, Astro), build verification

---

## Summary

8 systemic issues found. 3 blockers preventing correct V2 experience. 5 medium issues causing visual regressions and tech debt.

---

## 🔴 Blocker 1: Persona toggle JS — completely broken

**File:** `src/utils/layout/baseLayout.client.ts`

The persona toggle JavaScript still targets the V1 emoji toggle HTML structure, which was replaced by V2 pill buttons in Phase 1.2.

### Specific failures

| Line | Problem | Impact |
|---|---|---|
| 122 | `brandLink.href = "/photography" : "/coding"` | `/coding` does not exist in V2 — studio home is `/` |
| 126-142 | `updatePersonaUi` queries `.base-layout__persona-toggle-thumb-icon` | This DOM element no longer exists — all DOM mutations are no-ops |
| 137 | Sets `textContent` to `"📷"` / `"⌨"` | Old emoji approach, new HTML uses text labels "Dev" / "Photo" |
| 202-258 | `bindPersonaToggle` binds clicks to `[data-persona-toggle]` (the container div) | Clicking the actual pill buttons (`nav-persona-btn`) does not trigger the handler — events bubble correctly so this may work, but `updatePersonaUi` targets wrong DOM |
| 237 | Navigates to `/photography` or `/coding` on toggle | User is forcibly redirected away from current page even when they just want to switch persona in-place |
| 246 | Sets `sessionStorage.setItem("rp-persona-transition", "1")` | Transition flag is set but `applyPersonaEntryTransition` (line 64) expects `rp-persona-transition` — key name matches, but the CSS class `is-persona-switching` (line 4) is never defined in any SCSS file |

### User impact
Clicking "Dev" or "Photo" pill buttons navigates away from current page to `/coding` or `/photography` with no visual feedback. The active pill indicator never moves. The "smooth transition" Decision 8 is not implemented.

---

## 🔴 Blocker 2: `field-persona.scss` overrides V2 tokens with V1 Open Props grey

**File:** `src/styles/field-persona.scss` (59 lines)
**Loaded:** globally via `@use "./field-persona.scss"` in `global.scss` line 3

This WS3-era file was kept during the V2 migration but its `[data-persona="field"]` block directly conflicts with V2 tokens.

### Token conflicts

| Property | V2 value | field-persona.scss override | Effect |
|---|---|---|---|
| `--bg-soft` | `#121214` | `var(--gray-11)` | Grey surface backgrounds |
| `--muted` | `--text-muted` via V2 | `var(--gray-5)` | Grey muted text on dark bg |
| `--line` | `rgba(255,255,255,0.06)` | `var(--gray-9)` | Visible grey borders |
| `--font-display` | N/A (removed in V2) | `"Playfair Display"` | Serif leak on field pages |
| `h1-h6 font-weight` | `300` (V2 Inter) | `500` | Bold headings override |
| `--layout-max-width` | V2 variable | `var(--size-15)` | Layout override |

### When it activates
Any page with `data-persona="field"` on `<html>` — photography, library, and any page navigated to while field persona is active.

### User impact
Photography and library pages show grey backgrounds, grey borders, Playfair headings, and heavier font weights — exactly the "grey background area on pretty much all the pages" the user reported.

---

## 🔴 Blocker 3: Google Fonts — 300KB dead weight, Inter 300 missing

**File:** `src/layouts/BaseLayout/BaseLayout.astro` ~line 55

```html
https://fonts.googleapis.com/css2?family=
  Fira+Code:wght@400&
  Inter:wght@400;600&
  Lora:ital,wght@0,400;0,600;0,700;1,400;1,600&
  Playfair+Display:ital,wght@0,500;0,600;0,700;1,500&
  display=swap
```

### Fonts loaded vs used

| Font | Weights loaded | Used in V2? | Waste |
|---|---|---|---|
| Inter | 400, 600 | Yes (400 body, 500 accent) | **Inter 300 MISSING** — V2 headings specify weight 300 but no 300 file loaded; browser synthesizes from 400 |
| Lora | 400, 600, 700 + italic | ❌ Replaced by Inter | ~160KB |
| Playfair Display | 500, 600, 700 + italic | ❌ Replaced by Inter | ~140KB |
| Fira Code | 400 | ✅ Code blocks | 0 |

### User impact
V2 headings render at weight 400 instead of the designed 300 (browser synthesizes — looks heavier than intended). ~300KB of unused font files downloaded on first visit. Critical path render blocked by font CSS.

---

## 🟡 Medium 4: Open Props loaded 4 times in SCSS cascade

**Files importing `@use "open-props/style"`:**

| File | Why |
|---|---|
| `src/styles/global.scss` | Legacy — should be removed once patterns dependency is gone |
| `src/styles/patterns.scss` | Defines `%surface-card`, `%page-hero`, etc. |
| `src/styles/primitives.scss` | Utility classes using Open Props tokens |
| `src/styles/field-persona.scss` | WS3-era overrides |

Sass `@use` deduplicates at compile time (single CSS output), but the Open Props variable namespace (`--size-*`, `--gray-*`, `--radius-*`, `--font-size-*`) is available to every page importing patterns.scss, creating variable shadowing risks against V2 tokens.

---

## 🟡 Medium 5: 11 pages still `@use "patterns.scss"` with `%surface-card` extends

These pages import patterns.scss and extend `%surface-card` which uses Open Props `--surface-border`, `--surface-radius`, `--surface-padding` — not V2 dark tokens.

| Page file | Pattern extends | V2 status |
|---|---|---|
| `about/_about.scss` | `%page-hero`, `%surface-card`, `%content-grid` | Partially V2 (field block added) but patterns still active |
| `photography/_photography.scss` | `%surface-card`, `%page-hero` | V2 rewrite done but patterns import still present |
| `library/books/_slug.scss` | `%surface-card` | **Untouched** — full V1 styling |
| `library/highlights/_slug.scss` | `%surface-card` | **Untouched** — full V1 styling |
| `coding/_coding.scss` | `%surface-card` | **Untouched** — full V1 styling |
| `newsletter/_newsletter.scss` | Multiple patterns | **Untouched** — full V1 styling |
| `newsletter/_slug.scss` | Multiple patterns | **Untouched** — full V1 styling |
| `contact/_contact.scss` | Multiple patterns | Redirects to about — low priority |

### User impact
Pages using `%surface-card` get grey Open Props borders and surface backgrounds instead of V2 dark `var(--line)` borders. Library book detail, highlight detail, and coding pages look like the pre-V2 site.

---

## 🟡 Medium 6: Duplicate `prefers-reduced-motion` with conflicting values

| File | Duration | Line |
|---|---|---|
| `global.scss` | `0.001ms` | After line 41 |
| `v2-transitions.scss` | `0.01ms` | After line 47 |

Both apply `!important` to `animation-duration` and `transition-duration`. Last-loaded wins (v2-transitions → 0.01ms). Functional but wasteful — should be consolidated.

---

## 🟡 Medium 7: Field nav labels — routing mismatch

The navigation data (`NAV_LINKS_BY_PERSONA`) defines field nav links. Need to verify:
- "Gallery" → `/photography` (correct)
- "Archive" → actual path? 
- "About" → `/about` (shared)

Nav labels should match V2 terminology and actual routes.

---

## 🟡 Medium 8: Library detail + coding + newsletter pages — never V2'd

Three page groups were completely missed by all 16 V2 phases:

| Page | Route | Status |
|---|---|---|
| Library book detail | `/library/books/[slug]` | V1 BEM + %surface-card + patterns.scss |
| Library highlight detail | `/library/highlights/[slug]` | V1 BEM + %surface-card + patterns.scss |
| Coding | `/coding` | V1 card grid + patterns.scss |
| Newsletter listing | `/newsletter` | V1 BEM, now superseded by /blog listing |
| Newsletter detail | `/newsletter/[slug]` | V1 BEM, accessible via /blog listing links |

### User impact
These pages render with old 2/10 styling: grey borders, filled cards, old typography, old spacing. They break the consistent V2 experience.

---

## Build Status

```
npm run build: 217 pages, exit 0, 0 errors
```

No build errors. All 8 issues above are runtime/logic/visual, not compilation failures.

---

## Recommended Fix Order

| Priority | # | Issue | Effort | Impact |
|---|---|---|---|---|
| 1 | 3 | Fix Google Fonts (remove Lora/Playfair, add Inter 300) | 5 min | Immediate visual fix |
| 2 | 1 | Fix persona toggle JS (selectors + navigation targets) | 30 min | Toggle works |
| 3 | 2 | Remove field-persona.scss override | 10 min | Grey backgrounds gone |
| 4 | 4 | Remove Open Props from global.scss | 5 min | Clean dependency |
| 5 | 5 | Drop patterns.scss from photo, about, library, coding, newsletter | 2h | All pages V2 consistent |
| 6 | 8 | V2 restyle library detail + coding + newsletter pages | 3h | Complete coverage |
| 7 | 7 | Verify/fix field nav labels | 15 min | Correct routing |
| 8 | 6 | Consolidate reduced-motion | 5 min | Clean CSS |
