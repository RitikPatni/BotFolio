# Gallery QA Validator

Runs a fast consistency check over photography manifests and image assets.

## What it validates

- Required fields per entry: `filename`, `title`, `category`, `tags`, `alt`, `date`
- `filename` is lowercase kebab-case with image extension
- `category` exists in `src/data/photography/manifest.ts`
- `tags` are lowercase kebab-case strings
- `alt` text is present and descriptive (min length)
- `date` format is `YYYY-MM-DD` (or empty string)
- Image file exists at `src/assets/photography/<category>/<filename>`
- Duplicate filename detection across all manifest files
- Category distribution summary (informational, with portfolio-intent-aware drift warning)

## Portfolio intent note

This validator assumes your stated goal:
- portfolio is intentionally **birds-heavy** and **wildlife-heavy**

So it does **not** warn for birds/wildlife dominance. It only warns if birds+wildlife combined drops below 70% (possible drift from intent).

## Run

```bash
npm run gallery:validate
```

Strict mode (warnings fail the command; informational notes do not):

```bash
npm run gallery:validate:strict
```

or directly:

```bash
node scripts/validate-gallery.mjs --strict
```

CI mode (strict + machine-readable JSON):

```bash
npm run gallery:validate:ci
```

or directly:

```bash
node scripts/validate-gallery.mjs --ci
```

## Automatic local enforcement (no manual copy-paste)

A Git pre-commit hook is installed automatically via `prepare` (runs on `npm install`/`npm ci` in local clones):

- Hook file: `.githooks/pre-commit`
- Installer: `scripts/install-gallery-hook.mjs`
- Hook behavior:
  - if staged files include photography data/assets, runs `npm run gallery:validate:strict`
  - otherwise skips quickly

You can also install/reinstall manually:

```bash
npm run gallery:hook:install
```

## Exit behavior

- Standard mode:
  - Exit `0`: no blocking issues (warnings allowed)
  - Exit `1`: one or more blocking errors
- Strict mode:
  - Exit `0`: no errors and no warnings (informational notes allowed)
  - Exit `1`: any error or warning
- CI mode (`--ci`):
  - equivalent to strict mode for pass/fail
  - outputs only JSON report to stdout (for GitHub Actions / CI parsers)
