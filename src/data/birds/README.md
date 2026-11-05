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

Only add a photo when its species has been explicitly identified. Generic gallery frames (a "kingfisher" or "flamingo" without a species) stay unmatched until the owner confirms them. Photo years come from the gallery metadata and may predate the exported eBird sighting years; do not treat the two sources as a single chronology.

This starter uses two explicitly named gallery photos (Common Kingfisher and Black Drongo). Both images were visually reviewed for consistency with their published gallery identifications; owner confirmation is still welcome. The tracked gallery has 16 bird assets although the live gallery displayed 21 when this branch was prepared. The five missing assets and any additional record shots were not imported or guessed. Ashy Prinia and Common Babbler have no quality-qualified exact-match sticker in the pinned upstream data; their species pages remain available without invented artwork.

Validation rejects unknown slugs, missing assets, a second featured photo, location-like fields, non-year dates and GPS EXIF in source JPEGs. Pages serve images through `astro:assets`, which re-encodes them without metadata.
