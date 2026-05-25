# BotFolio

## Photography Category Workflow

Photography data is centralized through a manifest so category metadata and image lists stay in one place.

### Source of truth

- Category manifest: `src/data/photography/manifest.ts`
- Shared data exports: `src/data/photography/index.ts`
- Shared types: `src/data/photography/types.ts`
- Page consumer: `src/pages/photography/index.astro`

### Add a new category

1. Add images under `src/assets/photography/<category-id>/`.
2. Add data in `src/data/photography/`:
   - Create `<category-id>.json` if it fits under 400 lines.
   - If it grows beyond 400 lines, split into parts like `<category-id>-part-1.json`, `<category-id>-part-2.json`.
3. Import the new JSON file(s) in `src/data/photography/manifest.ts`.
4. Add a new manifest entry in `photographyCategoryManifest` with:
   - `id` matching the assets folder name.
   - `label` and `description` for UI copy.
   - `items` pointing to the imported JSON list.
5. Build and verify:
   - `./node_modules/.bin/astro build`

### JSON item shape

Each image entry should follow this shape:

```json
{
  "filename": "example.jpg",
  "title": "Example Title",
  "category": "birds",
  "tags": ["tag-1", "tag-2"],
  "alt": "Accessible description",
  "date": "2026-01-01",
  "metadata": {
    "location": "Optional place",
    "camera": "Optional camera",
    "lens": "Optional lens",
    "focalLength": "Optional focal length",
    "aperture": "Optional aperture",
    "shutterSpeed": "Optional shutter speed",
    "iso": 100
  }
}
```

### Conventions

- Keep source code and data files under 400 lines.
- Prefer splitting large category datasets instead of growing a monolithic file.
- Keep category IDs aligned across assets folder, manifest entry, and JSON `category` field.
