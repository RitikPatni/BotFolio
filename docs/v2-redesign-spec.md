# BotFolio V2 — Stripe-Inspired Redesign Spec

## Overview

Complete visual redesign targeting 8/10 UI quality. Stripe-style: gradient-forward, weight-300 elegance, polished micro-interactions. Two personas (studio/field) share the same visual language with distinct accent gradients.

## Design Prototype

See `docs/design-prototype-v2.html` — renders the full Stripe-inspired vision with gradient heroes, photo strip, gradient-underline nav, featured blog card, masonry gallery, before/after comparison.

## Architecture Decision

**Strategy: Incremental from V1 foundation.** The V1 workstreams (WS1-6) are live. V2 replaces the visual layer: typography, colors, layouts, transitions, and component styling. V2 does NOT touch:
- Content collections (blog, newsletter, books, highlights, photography manifests)
- Data flow (persona toggle, theme toggle, localStorage)
- Page routing (same routes, same Astro architecture)
- Build pipeline (same Astro v4 + SCSS + Open Props)

**New files vs modified files:** Most changes are SCSS modifications + BaseLayout.astro update. New files: masonry JS for photography, transition CSS, gradient utilities.

## Decisions (22 locked)

| # | Domain | Decision |
|---|---|---|
| 1 | Design system | Stripe — gradient-forward, weight-300, premium polish |
| 2 | Persona accents | B — shared Stripe base, per-persona gradient accents |
| 3 | Typography | Inter 300 headings, weight-driven, fluid clamp() scale |
| 4 | Color palette | Bi-persona: studio=blue-purple, field=amber-red-orange |
| 5 | Layout | Adaptive: 768px prose, 1440px listings |
| 6 | Hero | Gradient hero on home only |
| 7 | Photography | Masonry with gradient frame borders |
| 8 | Persona toggle | Smooth gradient wipe transition (200ms) |
| 9 | Nav | Gradient underline on active |
| 10 | Cards/surfaces | No cards — spacing + dividers |
| 11 | Font sizing | Fluid clamp() scale |
| 12 | Lightbox | Full-bleed dark overlay |
| 13 | Home photography | Photography strip below blog list |
| 14 | Blog post | Gradient hero + 960px wide prose + TOC |
| 15 | Blog listing | Gradient hero + featured post + cards |
| 16 | Library | Reading shelf metaphor |
| 17 | Transitions | All: ViewTransitions API, micro-interactions, toggle animation |
| 18 | Scope | Spec-first, phased by persona (studio first, then field) |
| 19 | Newsletter + coding | Merge into tag-filtered blog ("Writing") |
| 20 | Uses page | Minimal list, no hero |
| 21 | Color: studio | `#82aaff` (Night Owl blue) → `#c792ea` (Night Owl purple) |
| 22 | Color: field | `#F59E0B` (amber) → `#EF4444` (warm red-orange) |

## Color System

### Dark Theme (default)

```
Token              | Studio value                          | Field value
-------------------|---------------------------------------|-----------------------
--bg               | #0a0a0b                               | #0a0a0b (shared)
--bg-soft          | #121214                               | #121214 (shared)
--text             | #fafafa                               | #fafafa (shared)
--text-muted       | #888896                               | #888896 (shared)
--text-dim         | #5c5c6e                               | #5c5c6e (shared)
--accent-start     | #82aaff (Night Owl blue)              | #F59E0B (amber)
--accent-end       | #c792ea (Night Owl purple)            | #EF4444 (red-orange)
--gradient         | linear-gradient(135deg, start, end)   | same format
--gradient-subtle  | radial-gradient(ellipse at 50% 0%, accent 0%, transparent 70%)
--radius           | 12px for containers, 8px for cards, 100px for pills
```

### Light Theme

```
--bg               | #fafafa
--bg-soft          | #f0f0f3
--text             | #0a0a0b
--text-muted       | #5c5c6e
--text-dim         | #888896
(same accent gradients, slightly desaturated)
```

### Gradient Asset System

Reusable CSS gradients applied via custom properties:

```scss
/* Gradient types */
--gradient-hero: radial-gradient(ellipse at 50% 0%, var(--accent-start) 0%, transparent 70%);
--gradient-underline: linear-gradient(90deg, var(--accent-start), var(--accent-end));
--gradient-border: linear-gradient(135deg, var(--accent-start), var(--accent-end));
--gradient-card-hover: linear-gradient(135deg, color-mix(in srgb, var(--accent-start) 4%, transparent), color-mix(in srgb, var(--accent-end) 4%, transparent));
```

## Typography System

### Font Stack

```
--font-body: "Inter", system-ui, -apple-system, sans-serif;
--font-mono: "Fira Code", "Cascadia Code", "JetBrains Mono", monospace;
```

Serif removed entirely (Lora/Playfair dropped). All typography is Inter at varying weights.

| Role | Weight | Size | Tracking |
|---|---|---|---|
| Page title (h1) | 300 | clamp(2.5rem, 6vw, 5rem) | -0.03em |
| Section heading (h2) | 300 | clamp(1.75rem, 3vw, 2.5rem) | -0.02em |
| Card/entry title (h3) | 300 | clamp(1.1rem, 2vw, 1.5rem) | -0.01em |
| Subheading (h4) | 400 | clamp(1rem, 1.5vw, 1.25rem) | 0 |
| Body | 300 | clamp(0.95rem, 1.5vw, 1.1rem) | 0 |
| Code | 400 | 0.875rem | 0 |
| Meta/caption | 400 | 0.8rem | 0 |
| Blog prose body | 300 | 1.1rem | 0 (line-height: 1.8) |
| Blog prose heading | 400 | 1.5rem | -0.01em |

### Google Fonts URL

```
https://fonts.googleapis.com/css2?family=Fira+Code:wght@400&family=Inter:ital,opsz,wght@0,14..32,300;0,14..32,400;0,14..32,500;0,14..32,600;1,14..32,300&display=swap
```

One family (Inter) + monospace weight (Fira Code 400). Lora + Playfair removed.

## File Inventory

| File | Type | Change |
|---|---|---|
| `src/styles/v2-tokens.scss` | **NEW** | Color tokens, gradient assets, custom properties |
| `src/styles/v2-typography.scss` | **NEW** | Inter font stack, fluid clamp scale |
| `src/styles/v2-transitions.scss` | **NEW** | ViewTransitions, micro-interactions, toggle animation |
| `src/styles/global.scss` | Edit | Import v2 files, update tokens |
| `src/styles/patterns.scss` | Edit | Remove card styles, add divider patterns, update typography |
| `src/styles/primitives.scss` | Edit | Update Open Props overrides for V2 |
| `src/styles/field-persona.scss` | Delete or rewrite | Replaced by v2-tokens bi-persona system |
| `src/layouts/BaseLayout/BaseLayout.astro` | Edit | New nav, toggle, hero optional, fonts URL |
| `src/layouts/BaseLayout/BaseLayout.scss` | Edit | Gradient nav, sticky header, toggle pill, footer |
| `src/pages/_home/home.astro` | Edit | Gradient hero + photo strip + blog list |
| `src/pages/_home/_home.scss` | Edit | Hero gradients, photo strip, featured card |
| `src/pages/blog/index.astro` | Edit | Gradient hero + featured post + grid |
| `src/pages/blog/[...slug].astro` | Edit | Gradient hero + wide prose |
| `src/pages/blog/_blog.scss` | Edit | Wide prose, TOC sidebar |
| `src/pages/photography/index.astro` | Edit | Masonry grid + gradient frames |
| `src/pages/photography/_photography.scss` | Rewrite | Masonry layout, gradient borders |
| `src/pages/library/index.astro` | Edit | Reading shelf layout |
| `src/pages/library/_library.scss` | Edit | Horizontal scroll shelves |
| `src/pages/about/index.astro` | Minor | Gradient + spacing updates |
| `src/pages/uses/index.astro` | Minor | Minimal list, no hero |
| `src/pages/og/default.png.ts` | Edit | Update OG card design for V2 |
| `src/pages/og/blog/[slug].png.ts` | Edit | Update OG card design for V2 |

## Phase 1: Studio Persona (9 phases)

### Phase 1.1 — Token system

Create `v2-tokens.scss`, `v2-typography.scss`, update `global.scss`.

**v2-tokens.scss:**
```scss
:root {
  --bg: #0a0a0b;
  --bg-soft: #121214;
  --text: #fafafa;
  --text-muted: #888896;
  --text-dim: #5c5c6e;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-round: 100px;
  --studio-start: #82aaff;
  --studio-end: #c792ea;
  --field-start: #F59E0B;
  --field-end: #EF4444;
  --accent-start: var(--studio-start);
  --accent-end: var(--studio-end);
  --gradient-underline: linear-gradient(90deg, var(--accent-start), var(--accent-end));
  --gradient-hero: radial-gradient(ellipse at 50% 0%, var(--accent-start) 0%, transparent 70%);
  --gradient-border: linear-gradient(135deg, var(--accent-start), var(--accent-end));
}

[data-persona="field"] {
  --accent-start: var(--field-start);
  --accent-end: var(--field-end);
}

:root[data-theme="light"] {
  --bg: #fafafa;
  --bg-soft: #f0f0f3;
  --text: #0a0a0b;
}
```

**v2-typography.scss:**
```scss
--font-body: "Inter", system-ui, -apple-system, sans-serif;
--font-mono: "Fira Code", "Cascadia Code", "JetBrains Mono", monospace;

h1 { font-size: clamp(2.5rem, 6vw, 5rem); font-weight: 300; letter-spacing: -0.03em; }
h2 { font-size: clamp(1.75rem, 3vw, 2.5rem); font-weight: 300; letter-spacing: -0.02em; }
h3 { font-size: clamp(1.1rem, 2vw, 1.5rem); font-weight: 300; letter-spacing: -0.01em; }
h4 { font-size: clamp(1rem, 1.5vw, 1.25rem); font-weight: 400; }
body { font-size: clamp(0.95rem, 1.5vw, 1.1rem); font-weight: 300; line-height: 1.8; }
```

**global.scss:** Add `@use` imports at top, update `--font-display` to Inter, remove serif.

**Checkpoint 1.1:** Build passes. Inter 300 renders site-wide. Accent variables available.

### Phase 1.2 — Navigation redesign

**BaseLayout.astro:** Replace `base-layout__links` with gradient underline nav.

```astro
<nav class="nav-links" aria-label="Studio navigation" data-persona-nav="studio">
  {navSets.studio.map(item => (
    <a href={item.href} class={`nav-link${path === item.href ? ' active' : ''}`}>
      {item.label}
    </a>
  ))}
</nav>
```

Persona toggle: replace dropdown-style with pill button pair:
```html
<div class="persona-toggle">
  <button class="pt-btn active" data-persona="studio" aria-label="Switch to developer profile">
    <svg>...</svg> Studio
  </button>
  <button class="pt-btn" data-persona="field" aria-label="Switch to photography profile">
    <svg>...</svg> Field
  </button>
</div>
```

**BaseLayout.scss:** Gradient underline CSS
```scss
.nav-link {
  position: relative;
  color: var(--text-muted);
  padding: 0.5rem 1rem;
  transition: color 200ms;
  &:hover { color: var(--text); }
  &.active { color: var(--text); }
  &.active::after {
    content: '';
    position: absolute; bottom: 0; left: 1rem; right: 1rem;
    height: 2px; border-radius: 1px;
    background: var(--gradient-underline);
  }
}

.persona-toggle {
  display: flex; gap: 0; border: 1px solid rgba(255,255,255,0.08);
  border-radius: var(--radius-round); padding: 2px;
  .pt-btn {
    padding: 0.35rem 0.75rem; border-radius: var(--radius-round);
    border: none; background: transparent; color: var(--text-muted);
    font-size: 0.8rem; cursor: pointer; transition: all 200ms;
    display: flex; align-items: center; gap: 0.35rem;
    &.active {
      background: rgba(255,255,255,0.06);
      color: var(--text);
      box-shadow: 0 0 12px color-mix(in srgb, var(--accent-start) 20%, transparent);
    }
  }
}

/* Sticky header with backdrop blur */
.base-layout__header {
  position: sticky; top: 0; z-index: 50;
  background: color-mix(in srgb, var(--bg) 85%, transparent);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
```

**Checkpoint 1.2:** Nav shows gradient underline on active page. Persona toggle is a pill pair. Header sticky with blur.

### Phase 1.3 — Home page redesign

**home.astro:** Gradient hero + tagline + photo strip + blog list.

```astro
<section class="hero">
  <div class="hero-content">
    <h1>Ritik <span class="fw-500">Patni</span></h1>
    <p class="hero-tagline">Building thoughtful product surfaces, systems, and shipping notes.</p>
    <span class="hero-accent">Frontend Developer</span>
  </div>
</section>

<!-- Photo strip: inline horizontal scroll of 6-8 photos -->
<div class="photo-strip">
  {latestPhotos.map(photo => <img src={photo.src} alt="" loading="lazy" />)}
</div>

<!-- Blog list -->
<section class="posts">
  <h2 class="section-title">Latest posts</h2>
  <div class="post-grid">
    {posts.map((post, i) => i === 0
      ? <article class="post-card post-card--featured">...</article>
      : <article class="post-card">...</article>
    )}
  </div>
</section>
```

**home.scss:**
```scss
.hero {
  padding: 6rem 2rem; position: relative; overflow: hidden;
  text-align: center;
  &::before {
    content: '';
    position: absolute; inset: 0; opacity: 0.15;
    background: var(--gradient-hero);
  }
  &-content { position: relative; z-index: 1; }
  &-name { margin-bottom: 1rem; }
  &-tagline { font-size: clamp(1.1rem, 2vw, 1.5rem); font-weight: 300; color: var(--text-muted); max-width: 600px; margin: 0 auto 2rem; }
  &-accent { display: inline-block; padding: 0.15em 0.5em; border-radius: 6px; font-size: 0.9rem; font-weight: 400; background: color-mix(in srgb, var(--accent-start) 15%, transparent); color: color-mix(in srgb, var(--accent-start) 90%, white); }
}

.photo-strip {
  display: flex; gap: 0.5rem; overflow-x: auto;
  padding: 1rem 0;
  mask-image: linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%);
  img { height: 160px; border-radius: var(--radius-md); object-fit: cover; flex-shrink: 0; border: 1px solid rgba(255,255,255,0.04); }
}

.post-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 380px), 1fr)); gap: 2rem; }
.post-card { padding: 2rem; border-bottom: 1px solid rgba(255,255,255,0.04); &--featured { grid-column: 1 / -1; background: color-mix(in srgb, var(--accent-start) 4%, transparent); border: 1px solid rgba(255,255,255,0.06); border-radius: var(--radius-md); } }
```

**Checkpoint 1.3:** Home page: gradient hero with radial glow, Inter 300 heading, photo strip with fade masks, featured blog card with subtle accent border.

### Phase 1.4 — Blog listing page

- Gradient hero ("Writing" or "Journal")
- Filter pills: All / Blog / Newsletter / Coding
- Featured post (latest) in accent-bordered card
- Remaining posts in 2-column grid with divider-bottom cards

**Checkpoint 1.4:** Blog listing filters by tag. Featured post stands out.

### Phase 1.5 — Blog post page

- Gradient hero with title, date, reading time, description
- 960px prose column (wider than current 768px)
- Table of contents in sidebar (desktop) or collapsed top (mobile)
- Fira Code 400 for code blocks, Night Owl theme preserved
- Drop cap or large initial letter on first paragraph

**Checkpoint 1.5:** Blog post: gradient hero, wide prose, TOC.

### Phase 1.6 — Uses page

- Minimal: "Hardware" / "Software" / "Desk" sections
- No hero. Simple divider-separated sections.
- Clean Inter 300 headings.

**Checkpoint 1.6:** Uses page: minimal, no hero.

### Phase 1.7 — Newsletter + Coding merge into blog

- Add `category` field to blog frontmatter: `blog`, `newsletter`, `coding`
- Update blog listing: filter by category
- Move newsletter content into blog collection (keep URLs via redirects)
- Move coding posts into blog collection

**Checkpoint 1.7:** All writing accessible via single `/blog` page with filter pills.

### Phase 1.8 — Transitions and micro-interactions

- ViewTransitions API: 200ms fade between pages
- Card hover: subtle border brighten
- Persona toggle: accent color smooth transition (CSS `transition: --accent-start 200ms`)
- Photo strip images: scale on hover
- Nav: link underline animated on page change
- Lightbox: fade-in overlay

**Checkpoint 1.8:** Smooth page transitions, persona toggle animation, micro-interactions.

### Phase 1.9 — OG images update

- Default OG: Stripe-inspired dark gradient + Inter 300 name + accent tagline
- Blog OG: Gradient accent line + title + metadata

**Checkpoint 1.9:** OG images match Stripe aesthetic.

## Phase 2: Field Persona (7 phases)

### Phase 2.1 — Photography redesign

- Masonry grid layout (JS: `masonry-layout` npm package or ~50 lines of vanilla JS)
- Gradient frame borders: `border: 1px solid color-mix(in srgb, var(--accent-start) 15%, transparent)`
- Hover: border brightens to full accent
- Variable aspect ratios (preserved from image metadata)
- Category anchor links at top (gradient-underline style)

**Checkpoint 2.1:** Photography: masonry grid with gradient borders.

### Phase 2.2 — Lightbox redesign

- Full-bleed dark overlay
- Semi-transparent toolbar with gradient
- Keyboard navigation (← → Esc)
- Image fills viewport, metadata panel slides from bottom
- Smooth fade-in transition

**Checkpoint 2.2:** Lightbox: immersive full-bleed overlay.

### Phase 2.3 — Library redesign

- Reading shelf metaphor: horizontal scroll rows
- Each row = category (currently reading, fiction, non-fiction, hindi)
- Each book: cover image only, title on hover
- Filter pills at top
- Notes section: clean list, divider-separated

**Checkpoint 2.3:** Library: horizontal scroll shelves, cover-only.

### Phase 2.4 — Field persona home page

- Amber-gold gradient hero ("Photography" or field tagline)
- Direct entry to gallery
- Featured shot section
- Archive link

**Checkpoint 2.4:** Field home page with amber-gold accent.

### Phase 2.5 — Field persona about page

- Same layout as studio about, but amber-gold accent
- Photography gear section (lenses, bodies)
- Contact section

**Checkpoint 2.5:** Field about page.

### Phase 2.6 — Field persona transitions

- Toggle from studio: accent smoothly shifts from blue-purple to amber-red-orange
- All elements transition: nav underline, hero glow, card borders
- ViewTransitions: field→studio, studio→field

**Checkpoint 2.6:** Persona toggle: smooth accent color transition.

### Phase 2.7 — OG images for field

- Field OG card: amber-gold gradient accent, photography tagline

**Checkpoint 2.7:** Field OG images match field persona accent.

---

## Master Verification Checklist

### Phase 1 — Studio
- [ ] Build passes (0 errors)
- [ ] Inter 300 renders site-wide, no serif fonts
- [ ] Nav: gradient underline on active, sticky header with blur
- [ ] Home: gradient hero with radial glow, photo strip, featured blog card
- [ ] Blog listing: filter pills, featured post, 2-column grid
- [ ] Blog post: gradient hero, 960px prose, TOC
- [ ] Uses: minimal list, no hero
- [ ] Newsletter + coding merged into tag-filtered blog
- [ ] Page transitions: ViewTransitions API active
- [ ] Persona toggle: pill button pair, active state glow
- [ ] Light mode: gradients adapt correctly
- [ ] Mobile: nav collapses, photo strip scrollable, prose readable

### Phase 2 — Field
- [ ] Build passes
- [ ] Photography: masonry grid with gradient borders
- [ ] Lightbox: full-bleed overlay, keyboard navigation
- [ ] Library: horizontal scroll shelves, cover-only
- [ ] Field home: amber-gold hero
- [ ] Field about: amber-gold accent
- [ ] Persona toggle: studio↔field accent transition smooth
- [ ] OG images: studio blue-purple, field amber-red-orange
- [ ] Mobile: masonry single-column, shelves scrollable

### Rollback
Every phase is independently revertible via `git revert`. V1 typography/colors can be restored by removing v2-tokens.scss import and reverting global.scss font stack.

---

## Execution Plan

```
Spec lock → Phase 1.1 → 1.2 → 1.3 → 1.4 → 1.5 → 1.6 → 1.7 → 1.8 → 1.9
                                                                    ↓
                                                        Studio PR (merge)
                                                                    ↓
                                              Phase 2.1 → 2.2 → 2.3 → 2.4 → 2.5 → 2.6 → 2.7
                                                                    ↓
                                                             Field PR (merge)
```

Phases 1.1-1.9 ship studio persona. Phases 2.1-2.7 ship field persona. Each phase checkpoint must pass before proceeding.

---

## Multi-Model Handoff — Binding Orchestration Plan

Every phase goes through the full 4-stage pipeline. No phase ships without gate approval. The planner (me) cannot also be the auditor or reviewer — each role runs independently.

### Stage Flow

```
PHASE PLAN (V4 Pro — me)
    │  Pre-research files, build exact old_string/new_string patches
    │  Produce HANDOFF PACKET
    ▼
EXECUTOR (V4 Flash — delegate_task subagent)
    │  Apply patches, build, verify — but DO NOT commit
    │  Return results (files modified, build output, verification)
    │  Executor has ZERO commit authority
    ▼
AUDITOR (V4 Pro — me, SEPARATE from planning)
    │  Read output files fresh — do NOT trust executor claims
    │  Run build + grep verification myself
    │  Compare against plan steps
    │
    ├── PASS → auditor commits with semantic message
    │          → proceeds to Reviewer gate
    │
    └── FAIL → auditor produces REVISION PACKET
               → back to Executor with specific failures
    ▼
REVIEWER (Kimi K2.7 — hermes chat --quiet)
    │  Independent verification of all 3 stages
    │  Reads committed state on branch
    │  Returns: APPROVED / NEEDS WORK
    │
    ├── APPROVED → push to fork → next phase
    └── NEEDS WORK → IMPROVEMENT PACKET → back to Executor (max 3 loops)
```

### Commit Authority

| Role | Can commit? | When |
|---|---|---|
| Planner | No | — |
| Executor | **No** | Executor only patches + builds, never commits |
| Auditor | **Yes** | Only after independent verification PASS and before Kimi gate |
| Reviewer | No | Only returns APPROVED or NEEDS WORK |

### Gate Rules (NON-NEGOTIABLE)

1. **Every phase gates.** No skipping. No "this one is simple enough."
2. **Auditor must run fresh evidence.** Cannot cite executor's output. Must run `npm run build` + grep checks themselves this turn.
3. **Kimi runs via `hermes chat --quiet`.** Prompt file written to `/tmp/kimi-v2-p{P}-prompt.txt`. Background process with `notify_on_complete=true`, timeout=300s.
4. **Max 3 review loops per phase.** If Kimi rejects 3 times, the phase is structurally broken — redesign the plan for that phase.
5. **No code changes during gate.** If Kimi says NEEDS WORK, the executor applies fixes — not me, not during audit.
6. **Phase commits are atomic.** No mixing phases. Each phase = one commit on the branch.

### Model Assignments

| Role | Model | How |
|---|---|---|
| Planner | V4 Pro | Me — pre-research, exact patches, HANDOFF PACKET |
| Executor | V4 Flash | `delegate_task` subagent — applies patches, builds |
| Auditor | V4 Pro | Me — independent verification, fresh build + grep |
| Reviewer | Kimi K2.7 | `hermes chat --provider opencode-go -m kimi-k2.7-code -q "$(cat /tmp/prompt.txt)" --quiet` |

### Audit Evidence (minimum per phase)

The auditor must produce FRESH (this turn, not cached) evidence for:
- [ ] `npm run build` passes (exit 0, no errors)
- [ ] Each file modified = verified via grep or read_file
- [ ] No regressions in untouched files (diff check)
- [ ] Executor followed all constraints from HANDOFF PACKET

**Iron law: no verification claim without fresh output this turn.**

### Kimi Prompt Template

Every Kimi gate prompt follows this structure:

```
Verify Phase {N}.{M}: {description}. Read these files:
{FILE_PATHS}

Check:
1. {criterion}
2. {criterion}
...
Build: cd /root/BotFolio && npm run build - exit 0

Return: APPROVED or NEEDS WORK
```

### Failure Recovery

If Kimi returns NEEDS WORK:
1. Extract the IMPROVEMENT PACKET from Kimi's output
2. Prepend it to the HANDOFF PACKET as "REVISION CONTEXT"
3. Re-dispatch executor with the updated context
4. Auditor verifies the revision
5. Kimi re-gates
6. Max 3 loops — if still failing, escalate to user for plan redesign

### Phase Orchestration Schedule

```
Phase 1.1 (Tokens)   → Executor → Auditor → Kimi → APPROVED → commit
Phase 1.2 (Nav)      → Executor → Auditor → Kimi → APPROVED → commit
Phase 1.3 (Home)     → Executor → Auditor → Kimi → APPROVED → commit
Phase 1.4 (Blog list)→ Executor → Auditor → Kimi → APPROVED → commit
Phase 1.5 (Blog post)→ Executor → Auditor → Kimi → APPROVED → commit
Phase 1.6 (Uses)     → Executor → Auditor → Kimi → APPROVED → commit
Phase 1.7 (Content)  → Executor → Auditor → Kimi → APPROVED → commit
Phase 1.8 (Trans.)   → Executor → Auditor → Kimi → APPROVED → commit
Phase 1.9 (OG)       → Executor → Auditor → Kimi → APPROVED → commit
                               ↓
                        Studio PR + merge
                               ↓
Phase 2.1 (Photos)   → Executor → Auditor → Kimi → APPROVED → commit
Phase 2.2 (Lightbox) → Executor → Auditor → Kimi → APPROVED → commit
Phase 2.3 (Library)  → Executor → Auditor → Kimi → APPROVED → commit
Phase 2.4 (Fld Home) → Executor → Auditor → Kimi → APPROVED → commit
Phase 2.5 (Fld About)→ Executor → Auditor → Kimi → APPROVED → commit
Phase 2.6 (Fld Trans)→ Executor → Auditor → Kimi → APPROVED → commit
Phase 2.7 (Fld OG)   → Executor → Auditor → Kimi → APPROVED → commit
                               ↓
                         Field PR + merge
```

**Total gates: 16 phases × 4 stages per phase = 64 stage-gate checkpoints.**

### What "DONE" means for each phase

A phase is NOT done until:
1. Build passes (fresh evidence from this turn)
2. Kimi has returned APPROVED
3. Changes are committed to the branch with a semantic commit message
4. Branch is pushed to fork

The V1 workflow where executor output was accepted without independent verification, and Kimi gates were skipped or timed out, is explicitly prohibited in V2.
