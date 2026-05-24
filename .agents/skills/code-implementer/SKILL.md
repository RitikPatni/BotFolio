---
name: code-implementer
description: Implement and modify production code in this repository while following project styling conventions.
---

Use this skill whenever implementing or updating code in this repository.

## Styling Stack

- Use SCSS for global and component styles.
- Use Open Props tokens as the first choice for design variables.
- Keep local semantic CSS variables for theme mapping where needed.
- Avoid magic numeric CSS values (`px`, `rem`, `%`) for spacing, radius, font-size, and sizing when an Open Props token exists.

### Required Open Props Setup

- Ensure dependency `open-props` is installed.
- Ensure dependency `sass` is installed for SCSS compilation.
- Import Open Props in SCSS entry files:

```scss
@use "open-props/style";
```

## BEM Rules

- Use BEM naming for new UI styles.
- For each `.astro` file, use the file name as the root block class.
- Keep classes file-scoped, e.g. for `blog.astro`: `.blog`, `.blog__item`, `.blog__item--featured`.
- For `BaseLayout.astro`, use `.base-layout` block.
- Block format: `.block`
- Element format: `.block__element`
- Modifier format: `.block--modifier` or `.block__element--modifier`
- Avoid deep descendant selectors when a BEM element class can be used.
- Prefer semantic blocks over generic utility names for new features.
- Prefer class-based BEM selectors over tag-based selectors inside blocks.

## File Structure Rules

- Every `.astro` file should import its own SCSS file.
- Keep each page/layout/component in its own folder with code and style colocated.
- For routable folders under `src/pages/`, prefix local style files with `_` (example: `_blog.scss`) so Astro does not treat them as pages.
- Keep shared styling primitives in `src/styles/` (for example `patterns.scss` and `global.scss`).
- Keep `src/styles/global.scss` for tokens, theme variables, and global reset/base only.

## Accessibility Baseline

- Preserve semantic landmarks (`header`, `main`, `footer`) and unique `main` target id for skip links.
- Keep keyboard focus visible (`:focus-visible`) for links and buttons.
- Use `aria-current="page"` for active nav link.
- Ensure icon-only or action-only buttons have clear `aria-label` text.

## Static Publishing Baseline

- Keep Astro output static-compatible.
- Ensure `rss.xml` is generated from content collections.
- Ensure sitemap generation is enabled.
- Keep `public/robots.txt` present and updated with crawler policy.

## Implementation Notes

- Keep selectors flat and predictable.
- Preserve existing behavior and layout while migrating legacy selectors.
- If touching existing non-BEM styles, migrate incrementally and avoid broad regressions.
- Keep color and spacing tokens centralized in `:root` and theme scopes.
