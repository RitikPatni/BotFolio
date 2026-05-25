# Content frontmatter parity

This repo now enforces strict frontmatter parity for website content markdown in:

- `src/content/blog/*.md`
- `src/content/newsletter/*.md`
- `src/content/books/*.md`
- `src/content/highlights/*.md`

## Canonical frontmatter contract

Every file is normalized to this exact key order:

1. `title` (string)
2. `description` (string)
3. `date` (strict `YYYY-MM-DD` string)
4. `draft` (boolean)
5. `tags` (YAML array; `[]` allowed)
6. `category` (string)

Collection-specific additions:

- `highlights`: adds `source_url` (string; empty or valid `http(s)` URL) between `tags` and `category`

## Commands

- Check parity (fails if drift exists):
  - `npm run content:frontmatter:parity`
- Auto-fix/normalize all content markdown:
  - `npm run content:frontmatter:fix`
- CI mode (JSON output + strict pass/fail):
  - `npm run content:frontmatter:ci`

## Drift prevention

- Local pre-commit hook runs parity check when content/frontmatter files are staged.
- GitHub Action `.github/workflows/content-frontmatter-parity.yml` enforces parity on PRs and pushes to `main`.

## Extending to Obsidian later

This parity contract is intentionally source-agnostic. When we apply the same sanity to Obsidian exports, we can map Obsidian metadata into this canonical schema before import so website + vault stay aligned.
