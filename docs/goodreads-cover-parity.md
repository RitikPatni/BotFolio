# Goodreads Cover Parity

This guard keeps `src/content/books/*.md` cover images consistent with Goodreads-hosted cover URLs.

## Why

- Prevents drift to non-Goodreads cover sources.
- Auto-fixes known missing/invalid cover links for curated books.
- Keeps local + CI checks deterministic.

## Commands

- Check only:
  - `npm run books:covers:parity`
- Auto-fix files in place:
  - `npm run books:covers:fix`
- CI JSON mode:
  - `npm run books:covers:ci`

## Behavior

- Scans all `src/content/books/*.md` files.
- Reads the first markdown image in body as the cover image.
- Classifies cover state:
  - `goodreads` (allowed)
  - `missing`
  - `non_goodreads`
  - `placeholder` (Goodreads blank image)
- For known titles with mappings, rewrites invalid/missing covers to canonical Goodreads URLs.
- Keeps unresolved placeholders as info (non-blocking) when no real Goodreads cover exists yet.

## Enforcement

- Local hook (`.githooks/pre-commit`) runs parity check for relevant staged changes.
- CI workflow (`.github/workflows/goodreads-cover-parity.yml`) runs `books:covers:ci` on PR/push.

## Notes

- Mapping lives in `scripts/goodreads-cover-parity.mjs` (`COVER_BY_SLUG`).
- Add new slugs + Goodreads URLs there as new books are added.
