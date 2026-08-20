# BotFolio — Known Issues & Deferred Work

Living list of known problems and deferred tasks. Not in scope for active PRs unless
explicitly picked up. See `git log` / open PRs for what's currently in flight.

_Last updated: 2026-08-20_

## Open issues

### 1. Studio Library hover experience is poor
- **Area:** `/library` (studio/personal persona)
- **Problem:** Hover interaction on library items/cards is not good — unspecified
  rough edges (feedback, transitions, focus state, or layout shift on hover).
- **Status:** Deferred. Needs a dedicated hover/interaction design pass.
- **Owner:** Ritik (to direct specifics when picked up).

### 2. Field (photo) persona needs Library access
- **Area:** persona routing + nav (`src/config/site.ts`, `baseLayout.client.ts`)
- **Problem:** Strict content partition currently makes Library **studio-only**.
  The photography/field persona should also be able to reach the Library.
- **Decision needed when picked up:** Does Library become a *shared* route (visible
  to both personas), or does it get a field-appropriate treatment/variant? This
  partially reverses the strict-partition decision from PR #41, so confirm intent
  before editing the partition rules.
- **Status:** Deferred.

## Planned upgrades

### 3. Upgrade to Astro 7
- **Area:** project framework (`package.json`, build/config)
- **Plan:** Move BotFolio from the current Astro major to **Astro 7** when available/stable.
- **Watch-outs when picked up:** breaking changes in Astro 7 (content collections, config
  schema, or integration APIs); re-verify the persona partition + Koboyo self-host build
  still pass after upgrade. tsc `Buffer → BodyInit` pre-existing errors may shift.
- **Status:** Planned, not started.

### 4. Publish blog to Standard.site (AT Protocol)
- **Area:** blog distribution / AT Proto integration
- **What:** Standard.site is an AT Protocol lexicon spec for long-form writing
  (`site.standard.publication` + `site.standard.document`). Surface BotFolio posts on the
  ATmosphere social web while keeping the site as the source of truth.
- **Process (from standard.site docs):**
  1. Get an AT Protocol identity (a DID).
  2. Create one `site.standard.publication` record (url + name).
  3. Add `/.well-known/site.standard.publication` on the domain returning the publication AT-URI.
  4. Per post, create a `site.standard.document` record (site, title, path, publishedAt, textContent).
  5. Add `<link rel="site.standard.document" href="at://…">` to each post's HTML `<head>`.
- **Needs when picked up:** AT Proto DID + client; decide Astro build-step vs standalone deploy
  script; all posts vs new-only.
  - DID known: `did:plc:53jkze3ofomdesnodoz5i34y` (handle `ritikpatni.bsky.social`).
- **Status:** Planned, not started.

## Context (for future reference)
- PR #41 ("strict persona content partition") intentionally locked Library to studio.
  Reopening that for field is a deliberate change, not a bug.
- Pre-existing issues flagged during the persona work but left out of scope:
  - `og/blog/[slug].png.ts` + `og/default.png.ts`: 2 tsc `Buffer → BodyInit` errors
    (build still passes; unrelated to persona work).
  - Gallery lightbox chevrons off-screen on mobile.
  - Vision-model false positives (not real bugs): "broken flamingo image" on
    `/photography` (files are valid JPEGs) and "studio accent teal-cyan" (computed
    `--accent-start` is `#8aa6c8` ink-blue).
