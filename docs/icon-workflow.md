# Icon Workflow

This repo keeps icon SVGs as small, separate Astro components so they stay easy to review, reuse, and replace.

## Social icons

- Individual social icon SVGs live in `src/components/icons/social/`.
- `src/components/SocialIcon.astro` is only a selector wrapper.
- Add a new social icon by creating a new Astro file in `src/components/icons/social/` and registering it in the selector map inside `SocialIcon.astro`.

## UI icons

- Shared UI icon SVGs live in `src/components/icons/`.
- `src/components/UiIcon.astro` is only a selector wrapper.
- Add a new UI icon by creating a new Astro file in `src/components/icons/` and registering it in `UiIcon.astro`.

## Conventions

- Keep each icon as a standalone Astro component with the SVG markup only.
- Keep selector wrappers thin and declarative.
- Prefer one icon per file over inline path data in wrapper components.
- If an icon grows beyond a simple shape, keep the SVG file in its own component instead of folding it back into the wrapper.
