import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';

function toUrl(base: string, path: string) {
  return `${base}${path}`.replace(/(?<!:)\/\/+/, '/').replace('https:/', 'https://');
}

export async function GET(context: APIContext) {
  const site = (context.site ?? new URL('https://ritikpatni.me')).origin;

  const staticPaths = [
    '/',
    '/about/',
    '/blog/',
    '/newsletter/',
    '/uses/',
    '/library/',
    '/photography/',
    '/contact/'
  ];

  const blog = await getCollection('blog', ({ data }) => !data.draft);
  const newsletter = await getCollection('newsletter', ({ data }) => !data.draft);
  const books = await getCollection('books', ({ data }) => !data.draft);
  const highlights = await getCollection('highlights', ({ data }) => !data.draft);

  const dynamicPaths = [
    ...blog.map((item) => `/blog/${item.slug}/`),
    ...newsletter.map((item) => `/newsletter/${item.slug}/`),
    ...books.map((item) => `/library/books/${item.slug}/`),
    ...highlights.map((item) => `/library/highlights/${item.slug}/`)
  ];

  const urls = [...staticPaths, ...dynamicPaths];

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((path) => `  <url><loc>${toUrl(site, path)}</loc></url>`)
    .join('\n')}\n</urlset>`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8'
    }
  });
}
