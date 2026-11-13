# Gallery Add Workflow

One-step helper to register a new photo in the photography gallery, plus the validator that guards it.

## Adding a photo

```bash
npm run gallery:add -- <category> <path/to/photo.jpg> --title "Title" \
  --alt "Descriptive alt text (>=12 chars)" [--tags a,b] [--rating 1-5] \
  [--date YYYY-MM-DD] [--file birds-part-2.json] [--dry-run]
```

Example:

```bash
npm run gallery:add -- macro ~/Pictures/bee-on-leaf.jpg \
  --title "Bee on a Leaf" \
  --alt "A honeybee clinging to a wet green leaf with pollen on its legs" \
  --tags bee,macro,pollen --rating 4
```

What it does:

- Validates arguments up front (`--title` and `--alt` are required; alt must be ≥12 characters; category must be one that `src/data/photography/manifest.ts` imports a JSON file for).
- Derives the filename from kebab-cased title plus the lowercased source extension (`.jpeg` becomes `.jpg`), and refuses if that slug is already used by any entry or asset — the slug is the deep-link id (`/photography#<slug>`).
- Reads EXIF with the already-installed `sharp` and fills `date` (DateTimeOriginal) and `metadata` (`camera`, `lens`, `focalLength`, `aperture`, `shutterSpeed`, `iso`) where present; CLI flags override EXIF, and unreadable EXIF falls back to `date: ""` with a note.
- Picks the target file: `--file` if given, else the last `birds-part-N.json` for birds, else `<category>.json`.
- Copies (never moves) the photo to `src/assets/photography/<category>/<filename>`, appends the entry, and writes the JSON with 2-space indent and a trailing newline. Tags default to `[category]`.
- Runs `node scripts/validate-gallery.mjs`; if it fails, both the copied asset and the JSON change are rolled back.
- `--dry-run` prints the entry and target paths and writes nothing.

## What the validator checks

See [gallery-validator.md](gallery-validator.md) for the full list. In short: required fields, kebab-case filenames and tags, alt ≥12 chars, `YYYY-MM-DD` dates, integer 1–5 ratings, asset existence, filename/slug uniqueness across all manifest files, and that every entry lives in a JSON file `manifest.ts` imports.

## Remaining manual steps

- **Pick a rating.** `--rating` is optional, but unrated frames sort last and never reach the home strip — the script warns when it is omitted. Rate the frame (1–5) as part of the add.
- **Review the alt text.** The script enforces the 12-character minimum only; read it back and make sure it actually describes the photo for someone who cannot see it.

## Shrinking oversized originals

Visitors never download the originals: `astro:assets` resizes every frame at build time (the lightbox tops out at 1920px wide). Camera originals (6192px, up to 11 MB) only bloat the repo and slow the build.

```bash
npm run images:optimize                 # dry run: lists originals over 3840px
npm run images:optimize -- --write      # resize them in place
npm run images:optimize -- --max 3200 --write
```

With `--write` it caps the long edge (default 3840px, 2x the largest served width) and keeps the filename, the format and the EXIF, so no entry changes its `filename` and no orphan copy is left behind. It first records the camera resolution in the entry's `metadata.resolution`, which the lightbox shows in place of the file's shrunken size. It refuses to run while `src/data/photography` has uncommitted edits. Run `npm run gallery:validate` afterwards.

## Pre-commit hook

`npm install` installs `.githooks/pre-commit` (see `scripts/install-gallery-hook.mjs`). When a commit touches gallery data, assets or the validator, the hook exports the **staged** copies of those files to a temp folder and runs the strict validator there. An unstaged fix can't hide a staged break, and unrelated work in progress can't block a good commit.

