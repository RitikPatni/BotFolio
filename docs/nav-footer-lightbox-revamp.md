# BotFolio — Nav, Footer & Lightbox Revamp Spec

**Date:** 2026-08-10
**Status:** Spec — ready for implementation
**Multi-model pipeline:** Planner → Executor → Auditor → Kimi gate per phase

---

## Root Cause

Three layout variables are undefined since `field-persona.scss` was dropped from `global.scss` imports in PR #29:

| Variable | State | Effect |
|---|---|---|
| `--layout-padding` | undefined → `""` | Container `padding: 0px` — everything flush against browser edges |
| `--layout-max-width` | undefined → `""` | Container `max-width: none` — content stretches full viewport |
| `--surface-border` | undefined → `""` | Footer `border-top: 0px` — invisible |

These were previously defined in `field-persona.scss` via Open Props. Their removal collapsed the entire layout structure.

---

## Phase 1: Layout Foundation

### 1.1 — Add missing tokens to v2-tokens.scss

**File:** `src/styles/v2-tokens.scss`

Add under `:root {` block:

```scss
  /* Layout */
  --layout-max-width: 75rem;
  --layout-padding: clamp(1rem, 3vw, 1.5rem);

  /* Borders */
  --border-light: 1px solid var(--line);
```

### 1.2 — Strip dead code from BaseLayout.scss

**File:** `src/layouts/BaseLayout/BaseLayout.scss`

Delete (these selectors have no matching HTML — the old emoji persona toggle and BEM nav selectors):

- Lines 153–210: `&__links`, `&__link` (BEM nav selectors — HTML uses `.nav-links`/`.nav-link`)
- Lines 212–258: `&__links--field`, `&__pill` (old pill nav — unused)
- Lines 380–479: `&__persona-toggle` and all children `&-track`, `&-state`, `&-thumb`, `&-thumb-icon` (old emoji toggle — HTML uses `.nav-persona-toggle`/`.nav-persona-btn`)

Also update the mobile container override (line 92–96): replace `--layout-padding: var(--size-3)` with nothing — the clamp() in v2-tokens handles responsive padding.

### 1.3 — Delete field-persona.scss

**File:** `src/styles/field-persona.scss`

Delete entire file (59 lines). It's not imported anywhere — dead code from V2 migration.

### 1.4 — Remove Open Props @use if no consumers

**File:** `src/styles/global.scss`

Remove `@use "open-props/style"` if grep confirms no other file references Open Props variables after Phase 1.2 cleanup. (BaseLayout.scss still uses `--size-*`, `--font-size-*` etc. — keep for now until Phase 2 replaces them with V2 tokens.)

**Verification:** `npm run build` exit 0. Live site container has horizontal padding. Footer border visible.

---

## Phase 2: Navigation Redesign

### 2.1 — Redesign header structure

**File:** `src/layouts/BaseLayout/BaseLayout.scss`

Replace the header block (lines 98–123) with V2 design:

```scss
&__header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: color-mix(in srgb, var(--bg) 88%, transparent);
  backdrop-filter: blur(16px);
  border-bottom: var(--border-light);
  padding-block: 0.625rem;
}
```

Remove the duplicate `.base-layout__header` block at lines 538–545 (it was added during V2 as a partial fix — now the main block handles everything).

### 2.2 — Container inside header

The header container (line 113–116) needs proper spacing:

```scss
.base-layout__container {
  display: grid;
  gap: 0.5rem;
  padding: 0 var(--layout-padding);
}
```

### 2.3 — Brand typography

```scss
&__brand {
  font-size: 1rem;
  font-weight: 400;
  letter-spacing: -0.01em;
  color: var(--text);
  transition: opacity 180ms ease;
  
  &:hover { opacity: 0.8; }
}
```

### 2.4 — Topbar layout

```scss
&__topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}
```

### 2.5 — Menu row (separator)

```scss
&__menu-row {
  border-top: var(--border-light);
  padding-top: 0.5rem;
}
```

### 2.6 — Nav links refinement

Update existing `.nav-link` styles (lines 552–578):

```scss
.nav-link {
  position: relative;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 400;
  color: var(--text-muted);
  text-decoration: none;
  border-radius: 6px;
  transition: color 180ms ease, background-color 180ms ease;

  &:hover {
    color: var(--text);
    background: color-mix(in srgb, var(--text) 4%, transparent);
  }

  &.active {
    color: var(--text);
    background: color-mix(in srgb, var(--text) 6%, transparent);

    &::after {
      content: '';
      position: absolute;
      bottom: 2px;
      left: 0.75rem;
      right: 0.75rem;
      height: 2px;
      border-radius: 1px;
      background: var(--gradient-underline);
    }
  }
}
```

### 2.7 — Nav links gap

```scss
.nav-links {
  display: flex;
  gap: 0.125rem;
}
```

### 2.8 — Persona toggle refinement

```scss
.nav-persona-btn {
  padding: 0.35rem 0.875rem;
  font-size: 0.8125rem;
  
  &.active {
    background: color-mix(in srgb, var(--text) 7%, transparent);
    color: var(--text);
    box-shadow: 0 0 12px color-mix(in srgb, var(--accent-start) 12%, transparent);
  }
}
```

### 2.9 — Fix persona toggle JS

**File:** `src/utils/layout/baseLayout.client.ts`

Change `bindPersonaToggle` to bind to individual `.nav-persona-btn` buttons, and only toggle when clicking the **inactive** persona:

```javascript
const bindPersonaToggle = () => {
  const buttons = document.querySelectorAll<HTMLButtonElement>(".nav-persona-btn");
  if (buttons.length === 0) return;

  buttons.forEach((btn) => {
    if (btn.dataset.jsBound === "true") return;
    btn.dataset.jsBound = "true";

    btn.addEventListener("click", () => {
      const btnPersona = btn.getAttribute("data-persona") as PersonaMode | null;
      const current = document.documentElement.getAttribute("data-persona") === "field" ? "field" : "studio";
      
      // Only toggle when clicking the INACTIVE persona
      if (btnPersona === current) return;
      
      const next: PersonaMode = btnPersona ?? (current === "field" ? "studio" : "field");
      applyPersona(next);
      updatePersonaUi(next);
      // ... rest of transition/navigation logic unchanged
    });
  });
};
```

### 2.10 — Add type="button" to persona toggle buttons

**File:** `src/layouts/BaseLayout/BaseLayout.astro` (line 176–177)

Add `type="button"` to both `<button>` elements to prevent accidental form submission.

**Verification:** Build passes. Nav has visual hierarchy. Persona toggle works correctly (clicking active pill = no-op).

---

## Phase 3: Footer Redesign

### 3.1 — Footer border and spacing

**File:** `src/layouts/BaseLayout/BaseLayout.scss`

```scss
&__footer {
  border-top: var(--border-light);
  color: var(--text-muted);
  padding: 2rem 0 3rem;
  margin-top: 4rem;
}
```

### 3.2 — Two-column footer layout

```scss
&__footer-content {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 1rem;
  padding: 0 var(--layout-padding);

  @media (max-width: 48rem) {
    grid-template-columns: 1fr;
    text-align: center;
  }
}
```

### 3.3 — Footer copy

```scss
&__footer-copy {
  margin: 0;
  font-size: 0.8125rem;
  font-weight: 300;
  color: var(--text-dim);
}
```

### 3.4 — Social links

```scss
&__socials {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  justify-content: flex-end;

  @media (max-width: 48rem) {
    justify-content: center;
  }
}
```

```scss
&__social-link {
  color: var(--text-dim);
  border: 1px solid var(--line);
  border-radius: var(--radius-round);
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  transition: color 180ms ease, border-color 180ms ease, background-color 180ms ease;

  &:hover {
    color: var(--text);
    border-color: color-mix(in srgb, var(--text) 20%, transparent);
    background: color-mix(in srgb, var(--bg-soft) 60%, transparent);
  }
}
```

### 3.5 — Social icons

```scss
&__social-icon {
  width: 0.875rem;
  height: 0.875rem;
}
```

### 3.6 — Theme FAB

```scss
&__theme-fab {
  position: fixed;
  right: 1rem;
  bottom: calc(1rem + env(safe-area-inset-bottom, 0px));
  z-index: 40;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: var(--radius-round);
  border: var(--border-light);
  background: var(--bg-soft);
  color: var(--text-dim);
  font-size: 1rem;
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: border-color 180ms ease, transform 180ms ease, box-shadow 180ms ease;

  &:hover {
    border-color: color-mix(in srgb, var(--text) 20%, transparent);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }
}
```

**Verification:** Build passes. Footer has visible border, two-column layout on desktop, stacked on mobile. Socials look intentional.

---

## Phase 4: Lightbox Fixes

### 4.1 — Fix metadata visibility (JS → CSS class instead of hidden attribute)

**File:** `src/utils/photography/photographyLightbox.client.ts` (line 92)

Change:
```javascript
metadataElement.hidden = !isVisible;
```
To:
```javascript
metadataElement.classList.toggle('is-visible', isVisible);
```

**File:** `src/pages/photography/_photography.lightbox.metadata.scss` (line 19)

Change:
```scss
&[data-visible="true"],
html:has(&[open]) & {
  transform: translateX(0);
}
```
To:
```scss
&.is-visible {
  transform: translateX(0);
}
```

Also remove `hidden` attribute from the aside in `PhotographyLightbox.astro` (line 110).

### 4.2 — Bottom sheet for mobile metadata

**File:** `src/pages/photography/_photography.lightbox.metadata.scss`

Add mobile layout:

```scss
@media (max-width: 48rem) {
  .photography__metadata {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    top: auto;
    width: 100%;
    max-height: 60vh;
    border-radius: var(--radius-md) var(--radius-md) 0 0;
    border-left: none;
    border-top: 1px solid var(--line);
    transform: translateY(100%);
    padding-bottom: calc(1.5rem + env(safe-area-inset-bottom, 0px));

    &.is-visible {
      transform: translateY(0);
    }

    &::before {
      content: '';
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: -1;
      opacity: 0;
      transition: opacity 200ms ease;
    }

    &.is-visible::before {
      opacity: 1;
    }
  }
}
```

### 4.3 — Button sizing (44px touch targets)

**File:** `src/pages/photography/_photography.lightbox.shell.scss`

Change all action/close buttons (lines 69–87): `width: 44px; height: 44px` (up from 40px).

Change nav buttons (lines 107–136): `width: 44px; height: 44px` (consistent sizing).

### 4.4 — Mobile responsive adjustments

**File:** `src/pages/photography/_photography.lightbox.shell.scss`

Add:

```scss
@media (max-width: 48rem) {
  .photography__lightbox-toolbar {
    padding: 0.75rem 1rem;
    padding-bottom: calc(0.75rem + env(safe-area-inset-bottom, 0px));
  }

  .photography__lightbox-frame {
    padding: 1rem;
  }

  .photography__lightbox-image {
    max-height: 65vh;
  }

  .photography__lightbox-summary {
    padding: 0 1rem 1rem;
  }

  .photography__lightbox-nav {
    width: 40px;
    height: 40px;

    &[data-gallery-prev] { left: 0.5rem; }
    &[data-gallery-next] { right: 0.5rem; }
  }
}
```

### 4.5 — Swipe gestures

**File:** `src/utils/photography/photographyLightbox.client.ts`

Add swipe detection after the touchstart handler (line 158):

```javascript
let touchStartX = 0;
let touchStartY = 0;

frameElement.addEventListener("touchstart", (e) => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
  
  if (isFullscreenActive()) {
    revealChrome();
  }
}, { passive: true });

frameElement.addEventListener("touchend", (e) => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;
  
  // Only swipe if horizontal movement exceeds vertical and threshold
  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
    move(dx > 0 ? -1 : 1);
  }
}, { passive: true });
```

### 4.6 — Fullscreen tap-to-toggle-chrome

**File:** `src/utils/photography/photographyLightbox.client.ts`

Change the `pointermove`/`touchstart` handlers to allow tap toggle:

```javascript
frameElement.addEventListener("click", (e) => {
  if (!isFullscreenActive()) return;
  // Toggle chrome on direct click (not swipe)
  const isVisible = lightboxShell.dataset.uiVisible !== "false";
  setChromeVisibility(!isVisible);
  if (!isVisible) scheduleChromeHide();
});
```

**Verification:** Build passes. Metadata slides in on desktop (side panel) and mobile (bottom sheet). Buttons are 44px. Swipe works.

---

## Phase 5: Image Optimizer

### 5.1 — Create optimization script

**File:** `scripts/optimize-images.sh`

```bash
#!/bin/bash
# Convert PNG/JPG images to WebP at 80% quality
# Usage: ./scripts/optimize-images.sh [quality=80]

QUALITY="${1:-80}"
ASSETS_DIR="src/assets/photography"

echo "Converting images to WebP (quality: ${QUALITY})..."
find "$ASSETS_DIR" -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" \) | while read -r file; do
  webp="${file%.*}.webp"
  if [ -f "$webp" ]; then
    echo "  SKIP (exists): $webp"
    continue
  fi
  echo "  CONVERT: $file → $webp"
  cwebp -q "$QUALITY" "$file" -o "$webp" 2>/dev/null || {
    echo "  FAILED: $file — install cwebp (apt install webp)"
  }
done

echo "Done."
```

### 5.2 — Install dependency check

Add to build pipeline notes: requires `webp` package (`apt install webp` for `cwebp`).

### 5.3 — Add npm script

**File:** `package.json`

```json
"scripts": {
  "images:optimize": "bash scripts/optimize-images.sh"
}
```

**Verification:** `npm run images:optimize` converts PNGs/JPGs to WebP at 80% quality. No file overwritten if WebP already exists.

---

## Phase 6: Build & PR

| # | Step |
|---|---|
| 6.1 | `rm -rf .astro && npm run build` — verify exit 0 |
| 6.2 | Commit per phase with conventional commits |
| 6.3 | Push to fork, create PR against RitikPatni/BotFolio |

---

## Files Changed (Summary)

| File | Phase | Lines |
|---|---|---|
| `src/styles/v2-tokens.scss` | 1 | +6 |
| `src/styles/field-persona.scss` | 1 | DELETE 59 |
| `src/styles/global.scss` | 1 | -1 (Open Props @use) |
| `src/layouts/BaseLayout/BaseLayout.scss` | 2,3 | ~400 changed |
| `src/layouts/BaseLayout/BaseLayout.astro` | 2 | +2 (type=button) |
| `src/utils/layout/baseLayout.client.ts` | 2 | ~40 changed |
| `src/pages/photography/_photography.lightbox.shell.scss` | 4 | ~40 changed |
| `src/pages/photography/_photography.lightbox.metadata.scss` | 4 | ~30 changed |
| `src/utils/photography/photographyLightbox.client.ts` | 4 | ~30 changed |
| `src/pages/photography/PhotographyLightbox.astro` | 4 | -1 (hidden attr) |
| `scripts/optimize-images.sh` | 5 | NEW 20 |
| `package.json` | 5 | +1 |

**Total: ~12 files, ~570 lines changed / added.**

---

## Multi-Model Pipeline Binding

Per the established contract from @session:default/20260809_063409_9a15e5d2:

| Stage | Model | Role |
|---|---|---|
| Plan | deepseek-v4-pro | Pre-research + HANDOFF PACKET with exact patches |
| Execute | deepseek-v4-flash (delegate_task) | Apply patches, build, verify. NEVER commits |
| Audit | deepseek-v4-pro | Fresh verify evidence. ONLY auditor commits if PASS |
| Gate | kimi-k2.7-code (hermes chat) | Read committed state. File-based prompt |

**Rules:** Max 3 review loops. No V1 shortcuts. No drift from spec.
