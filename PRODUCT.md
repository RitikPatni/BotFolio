# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: Ritik Patni himself — the site is a personal archive first. Years of weekly notes, reading lists, books, highlights, and photography live here as a record. Audience second: visitors (recruiters, peers, readers) who arrive and get a considered impression of the work.

## Product Purpose

A dual-identity personal site: frontend engineering and wildlife/macro photography under one roof. It archives writing (blog, weekly notes/newsletter), reading (library of books and highlights), and a photo gallery. Success means the archive stays truthful and complete, and any visitor leaves with an accurate sense of both identities.

## Positioning

Dual identity — engineer and photographer — executed with craft-level detail in every corner (captions, type rhythm, measured contrast, real EXIF). Both subjects live in one Field Notes identity. A neighboring portfolio can truthfully claim one of those things; not both at this fidelity.

## Operating Context

- Astro static site (RitikPatni/BotFolio), built and shipped primarily through AI agents (Hermes, Codex) opening PRs from the `notritikpatni` fork; Ritik reviews and merges.
- Content workflow: weekly newsletter cadence, reading-list curation, photography added via `src/assets/photography`.
- Deployed to Cloudflare Pages; ~220 static pages per build, emitted as files (`build.format: 'file'`) so canonical URLs are slashless.

## Capabilities and Constraints

- One identity, one navigation: a single-row sticky header (brand · Home, Journal, Notes, Gallery, Library, Uses, About · theme toggle) on every route. Light/dark theme toggle; light is the default, and `/photography` opens in dark unless the reader has chosen otherwise.
- Content collections with frontmatter parity checks: blog, newsletter (weekly notes), books, highlights.
- Static build; no client framework beyond Astro islands and vanilla JS interactions (lightbox, nav overflow hint, theme toggle).
- Archive counts shown on the home page are computed at build time from the same data the linked pages list.

## Brand Commitments

- **One Field Notes identity (cream paper, moss accent) for both subjects.** Engineering and photography share one visual language; the difference shows in voice (the home statement's roman → moss-italic turn), not in separate systems. This replaces the earlier "studio and field personas never merge" commitment, which was retired when the persona system was dissolved (PR #83). DESIGN.md is the design law.

## Evidence on Hand

Real content only: 35 blog posts (24 published, 11 drafts), 42 newsletter issues, 86 books, 56 highlights (collection file counts), plus a real 39-frame wildlife/macro photo gallery. The published Notes stream (blog + newsletter) is 66 entries, which is the count the home page renders. Nothing here may be fabricated — no invented testimonials, metrics, or placeholders presented as real.

## Product Principles

1. **Archive truth first.** Real content, accurately presented; never fabricate.
2. **Two subjects, one notebook.** Engineering and photography share one identity; they differ in voice, not in system.
3. **Craft shows in the details.** Captions, spacing, heading order, contrast — the small things are the signature.
4. **Ship calm.** Quiet, considered changes over loud redesigns.
5. **Agents build, Ritik decides.** PR-based workflow with a human merge gate.

## Accessibility & Inclusion

WCAG AA for all functional text: every text tier (text, muted, dim) clears 4.6:1 on page and raised surfaces in both themes (measured in `design/docs-round/measurements.json`); reduced-motion respected across animations; logical heading order in authored content.

## Open Decisions

- Body font: Geist today (with Newsreader for headings and IBM Plex Mono for metadata), but not a binding commitment (future type explorations allowed).
- Token system: the Field Notes tokens in `src/styles/v2-tokens.scss` are incumbent authority, but not pinned as a frozen contract — evolution allowed with intent.
