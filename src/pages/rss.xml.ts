import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { slugOf } from '../utils/slug';

export async function GET(context: APIContext) {
  const blogEntries = (await getCollection('blog', ({ data }) => !data.draft)).map((entry) => ({
    title: entry.data.title,
    description: entry.data.description,
    pubDate: entry.data.date,
    link: `/blog/${slugOf(entry)}/`
  }));

  const newsletterEntries = (await getCollection('newsletter', ({ data }) => !data.draft)).map((entry) => ({
    title: `[Newsletter] ${entry.data.title}`,
    description: entry.data.description,
    pubDate: entry.data.date,
    link: `/newsletter/${slugOf(entry)}/`
  }));

  const items = [...blogEntries, ...newsletterEntries].sort(
    (a, b) => b.pubDate.getTime() - a.pubDate.getTime()
  );

  return rss({
    title: 'Ritik Patni — Updates',
    description: 'Blog posts and newsletter updates from Ritik Patni.',
    site: context.site ?? 'https://ritikpatni.me',
    items,
    stylesheet: false
  });
}
