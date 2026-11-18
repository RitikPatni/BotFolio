# v3 Identity Spec — "Keeper"

Status: **SPEC ONLY — no code in this PR.** Implementation follows owner review, per the
spec-first process gate (questionnaire → approved spec → prototype → code).

Provenance: style-lab iterations v1–v4 (20-tile exploration → 15-tile iteration → grammar
assembly → house style v1.0) plus the owner-approved site prototype
(`botfolio-proto.html`, both themes QA'd 2026-11-18). Owner decisions recorded:

1. **Full identity swap.** Earth palette + kingfisher teal replace stone + rust. The
   annotated-record grammar becomes house style. This supersedes Ledger (#92) as a new
   identity (v3), not a token retune.
2. **Light-first, both themes.** Paper (warm earth) is the default ground and no-JS
   fallback; dark remaps to the lab's warm ink ground. Theme ownership, stored-choice
   and `prefers-color-scheme` behaviour are unchanged from Ledger.
3. **Full clone typography.** EB Garamond + JetBrains Mono ship as webfonts. Schibsted
   Grotesk and Newsreader are dropped entirely.
4. **Restructure as we go.** Home and each route's layout rebuild in the same phase as
   their reskin — no separate "reskin everything, then restructure" pass.

Naming: Ledger #92 replaced an identity #66 that was already called "Field Notes".
To keep the history unambiguous, v3 must **not** reuse that name. Proposed working name:
**Keeper** (the grade-5 row that earns the accent). Owner may rename before implementation.

---

## 1 · Grammar (the four rules)

Derived from house style v1.0; these govern layout decisions the tokens can't:

- i. **The record is chronological.** Log-like surfaces (home field strip, photography
  index, blog index) read as dated entries, newest first.
- ii. **Exactly one entry earns the accent.** One teal element per record/frame/section
  viewport: the keeper row, the accent clause, the stamp. Never two competing accents.
- iii. **The edit is the artifact.** Where drafts/diffs/revisions are shown (blog posts
  about work, grade records), the strike-through stays visible; nothing is quietly
  replaced.
- iv. **Strike the symptom, write the cause.** Diff pairs render minus dim / plus accent,
  with the serif-italic argument underneath.

## 2 · Type pairing jobs

- **EB Garamond** carries voice: headings, prose, italic arguments, the site wordmark.
- **JetBrains Mono** carries measurement: dates, counts, EXIF, meta lines, nav, stamps.
- The Ledger grotesque/italic split is retired. Hierarchy comes from the serif/mono
  split plus size; no weight theatrics (`fontWeight: 400` everywhere except the stamp
  and keeper row bolds).

## 3 · Tokens

New colours, sizes and font stacks go into `v2-tokens.scss` only; components consume
`var(--token)` and never hardcode a hex (token-authority chain unchanged). Font tokens
carry their own fallbacks (`L03` rule stands).

### Light (default)

| Token | Value | Ground floors (measured) |
|---|---|---|
| `--bg` paper | `#ece3d3` | — |
| `--bg-soft` | `#f2ead9` | — |
| `--bg-deep` | `#e2d6bf` | — |
| `--text` ink | `#261e14` | 12.5+ on all grounds |
| `--text-muted` | `#5c5442` | 5.21–6.26 |
| `--text-dim` | `#655b49` | 4.64–5.58 |
| `--line` | `rgba(38,30,20,0.18)` | strokes only |
| `--accent-text` teal-deep | `#176267` | 4.90–5.89 (functional accent text) |
| `--accent-start` teal | `#2ec4cf` | marks/strokes only — fails text floors on light |
| `--accent-wash` | `rgba(23,98,103,0.14)` | hover wash on clickable cards |

### Dark

| Token | Value | Ground floors (measured) |
|---|---|---|
| `--bg` ink | `#1a1510` | — |
| `--bg-soft` | `#2b2417` | — |
| `--bg-deep` | `#12100b` | — |
| `--text` | `#e8dfca` | 11.58–14.34 |
| `--text-muted` | `#c9bb9c` | 8.10–10.02 |
| `--text-dim` | `#b3a685` | 6.37–7.88 |
| `--line` | `rgba(232,223,202,0.12)` | strokes only |
| `--accent-text` / `--accent-start` teal | `#2ec4cf` | 7.25–8.56 (one teal serves both jobs) |
| `--accent-wash` | `rgba(46,196,207,0.14)` | hover wash |

Contrast rules carried over verbatim: `dim < muted < text` always; 4.5:1 floor for any
functional text on all three grounds in both themes; body prose is always `--text`; no
opacity-made fourth tier. Light keeps the Ledger trick of separate mark/text accent
tokens because pure `#2ec4cf` fails text floors on paper (1.47–1.77:1).

Non-negotiable carryover: **Night Owl code-highlight theme is content styling, never
chrome — unchanged.**

## 4 · Route-by-route restructure (same phase as reskin)

| Route | Reskin | Restructure |
|---|---|---|
| `/` (home) | tokens + type | statement with single accent clause; field-log strip replaces/augments the current hero ledger; writing as numbered record rows |
| `/blog` + `[slug]` | tokens + type | index as record rows (no · meta, mono ledger); article: Garamond prose, drop cap + footnote pattern where present |
| `/photography` | tokens + type | index as chronological morning-log strips; lightbox chrome recoloured; captions stay real EXIF |
| `/library`, `books`, `highlights` | tokens + type | grade-record plate pattern for notes/verdicts |
| `/coding`, `/resources`, `/uses` | tokens + type | record rows; no layout invention beyond the grammar |
| `/about`, `/contact`, `/newsletter*` | tokens + type | minimal: serif voice + mono data swap |
| `404` | tokens + type | keeper joke optional; owner decides at build |

## 5 · Phases and gates

Each phase: Coder implements → independent review → owner looks at the preview → next
phase unlocks. No phase ships without the owner's look.

- **P1 · Foundation** — fonts self-hosted subset (Garamond 400 + italic, JetBrains Mono
  400/700; woff2, `font-display: swap`), token swap in `v2-tokens.scss`, Schibsted +
  Newsreader removed everywhere (bundle proof: no stray references), share cards
  recoloured.
- **P2 · Chrome + home** — site header/nav/wordmark, footer, home restructure per §4.
- **P3 · Content routes** — blog, photography, library, coding, resources, uses, about,
  contact, newsletter, 404.
- **P4 · True-up** — contrast re-measurement round (new `K` IDs), DESIGN.md rewritten
  to present tense for Keeper (identity history gets Ledger→Keeper entry), claim/gap
  audit, accessibility pass, performance budget check.

DESIGN.md is present-tense law and changes **only** at P4 when the code ships — this PR
does not touch it.

## 6 · Non-goals

- No revival of the dual-persona system (stays dissolved).
- No new identity name reuse of "Field Notes".
- No layout-chrome philosophy change: flat, whitespace + top hairlines, no boxes/shadows
  — plates (grade record) are the one boxed component, introduced deliberately.
- No motion redesign; Ledger transitions carry over.

## 7 · Evidence

- Prototype (owner-approved): `botfolio-proto.html` in the style-lab workspace; both
  themes captured and QA'd 2026-11-18. Copy available on request — not committed here.
- Contrast measurements: computed WCAG ratios for every token × ground pair, tables in
  §3; re-measured at P4 regardless.
