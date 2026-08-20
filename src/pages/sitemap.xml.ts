import type { APIContext } from "astro";
import { getCollection } from "astro:content";
import { slugOf } from "../utils/slug";

function toUrl(base: string, path: string) {
  return new URL(path, base).toString();
}

export async function GET(context: APIContext) {
  const site = (context.site ?? new URL("https://ritikpatni.me")).origin;

  const staticPaths = [
    "/",
    "/coding/",
    "/about/",
    "/blog/",
    "/newsletter/",
    "/uses/",
    "/library/",
    "/resources/",
    "/photography/",
    "/contact/",
  ];

  const blog = await getCollection("blog", ({ data }) => !data.draft);
  const newsletter = await getCollection(
    "newsletter",
    ({ data }) => !data.draft,
  );
  const books = await getCollection("books", ({ data }) => !data.draft);
  const highlights = await getCollection(
    "highlights",
    ({ data }) => !data.draft,
  );
  const resources = await getCollection(
    "resources",
    ({ data }) => !data.draft,
  );

  const dynamicPaths = [
    ...blog.map((item) => `/blog/${slugOf(item)}/`),
    ...newsletter.map((item) => `/newsletter/${slugOf(item)}/`),
    ...books.map((item) => `/library/books/${slugOf(item)}/`),
    ...highlights.map((item) => `/library/highlights/${slugOf(item)}/`),
    ...resources.map((item) => `/resources/${slugOf(item)}/`),
  ];

  const urls = [...staticPaths, ...dynamicPaths];

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((path) => `  <url><loc>${toUrl(site, path)}</loc></url>`)
    .join("\n")}\n</urlset>`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
