// Content Layer entries expose `id` (file path), not `slug`. Derive the URL slug
// from the id by stripping the extension. Use this anywhere a collection entry's
// slug is needed for a link/path.
export const slugOf = (entry: { id: string }): string =>
  entry.id.replace(/\.mdx?$/, "");
