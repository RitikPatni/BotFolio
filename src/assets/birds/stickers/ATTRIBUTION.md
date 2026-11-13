# Bird sticker attribution

Bird stickers: [huashu-bird-sticker](https://github.com/alchaincyf/huashu-bird-sticker) by Huashu, licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

- Source release: `v2.2.0` (LICENSE.md dated 2026-11-05: every sticker file is CC BY 4.0, including art first released under PolyForm Shield 1.0.0).
- Files: copied unmodified from `stickers/<Order>/<Family>/<Scientific_name>.webp`; the exact upstream path for each file is in `src/data/birds/stickers.json`. The site serves resized/re-encoded variants through `astro:assets`.
- Selection: exact `scientific_name` match against the life list and `meets_quality_bar = True` in upstream `data/species.csv`. Ashy Prinia and Common Babbler fail the quality bar and stay text-only.
- These are AI illustrations, not identification references and not Ritik's photographs. Per upstream NOTICE.md, the reference photographs used to make them are not included or relicensed, and taxonomy/name data keeps its own terms (AviList CC BY 4.0, IOC CC BY 3.0). The journal uses eBird names from Ritik's own life list, not upstream taxonomy fields.
