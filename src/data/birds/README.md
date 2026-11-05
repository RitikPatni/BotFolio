# Bird journal data

Separate from the curated gallery (`src/data/photography/`). Routes: `/birds`, `/birds/<slug>`.

| File | What it holds | How it changes |
|---|---|---|
| `life-list.json` | `slug`, `commonName`, `scientificName`, `years` per species. Nothing else. | `npm run birds:import -- <ebird-life-list.csv>` (keep the raw CSV outside the repo) |
| `photos.json` | Explicit photo → species links with role `featured` (max one per species) or `record` | Hand-edited; see below |
| `stickers.json` | huashu-bird-sticker illustrations, exact scientific-name match, `meetsQualityBar: true` | `npm run birds:stickers -- <species.csv> <downloaded-stickers-dir>` |

## Adding a photo or record shot

1. Put the JPEG under `src/assets/photography/` (record shots that are not gallery picks can go in `src/assets/photography/birds-records/`; they don't join the gallery unless added to its manifest).
2. Add an entry to `photos.json`: `slug` from `life-list.json`, `file` relative to `src/assets/photography/`, `role`, `alt`, `year` (year only), and `evidence`, meaning who identified the species and how.
3. Run `npm run birds:validate && npm run birds:test`.

Only add a photo when its species has been explicitly identified. Generic gallery frames (a "kingfisher" or "flamingo" without a species) stay unmatched until the owner confirms them.

Validation rejects unknown slugs, missing assets, a second featured photo, location-like fields, non-year dates and GPS EXIF in source JPEGs. Pages serve images through `astro:assets`, which re-encodes them without metadata.
