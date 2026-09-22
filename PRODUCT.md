# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: Ritik Patni himself — the site is a personal archive first. Years of weekly notes, reading lists, books, highlights, and photography live here as a record. Audience second: visitors (recruiters, peers, readers) who arrive and get a considered impression of the work.

## Product Purpose

A dual-identity personal site: frontend engineering and wildlife/macro photography under one roof. It archives writing (blog, weekly notes/newsletter), reading (library of books and highlights), and a photo gallery. Success means the archive stays truthful and complete, and any visitor leaves with an accurate sense of both identities.

## Positioning

Dual identity — engineer and photographer — executed with craft-level detail in every corner (captions, type rhythm, persona-specific systems). A neighboring portfolio can truthfully claim one of those things; not both at this fidelity.

## Operating Context

- Astro static site (RitikPatni/BotFolio), built and shipped primarily through AI agents (Hermes, Codex) opening PRs from the `notritikpatni` fork; Ritik reviews and merges.
- Content workflow: weekly newsletter cadence, reading-list curation, photography added via `src/assets/photography`.
- Deployed to Cloudflare; ~219 static pages per build.

## Capabilities and Constraints

- Dual-persona switching (studio/field): separate navigation, content slots, themes, and design languages per persona; light/dark per persona.
- Content collections with frontmatter parity checks: blog, newsletter (weekly notes), books, highlights.
- Static build; no client framework beyond Astro islands and vanilla JS interactions (lightbox, persona switcher, theme toggle).

## Brand Commitments

- **Studio and field personas stay visually separate — never merge.** This is binding for all future design work: no shared visual language, no cross-persona homogenization.

## Evidence on Hand

Real content only: 34 blog posts, 42 newsletter issues, 86 books, 56 highlights (collection counts from frontmatter parity check), plus a real wildlife/macro photo gallery. Nothing here may be fabricated — no invented testimonials, metrics, or placeholders presented as real.

## Product Principles

1. **Archive truth first.** Real content, accurately presented; never fabricate.
2. **Two worlds, one site.** Persona separation is structural, not cosmetic.
3. **Craft shows in the details.** Captions, spacing, heading order, contrast — the small things are the signature.
4. **Ship calm.** Quiet, considered changes over loud redesigns.
5. **Agents build, Ritik decides.** PR-based workflow with a human merge gate.

## Accessibility & Inclusion

WCAG AA for body and muted text (verified against token pairs in the Sep 2026 audit); reduced-motion respected across animations; logical heading order in authored content.

## Open Decisions

- Body font: Inter today, but not a binding commitment (future type explorations allowed).
- Token system: current dual-persona tokens are incumbent authority, but not pinned as a frozen contract — evolution allowed with intent.
