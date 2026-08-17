import type { APIContext } from "astro";
import { getCollection } from "astro:content";

const SITE = (context: APIContext) =>
  (context.site ?? new URL("https://ritikpatni.me")).toString().replace(/\/$/, "");

interface Entry {
  title: string;
  url: string;
  description: string;
  body: string;
  date?: Date;
}

export async function GET(context: APIContext) {
  const site = SITE(context);

  const blog = await getCollection("blog", ({ data }) => !data.draft);
  const newsletter = await getCollection("newsletter", ({ data }) => !data.draft);
  const books = await getCollection("books", ({ data }) => !data.draft);
  const highlights = await getCollection("highlights", ({ data }) => !data.draft);

  const entries: Entry[] = [
    ...blog.map((p) => ({
      title: p.data.title,
      url: `${site}/blog/${p.slug}/`,
      description: p.data.description,
      body: p.body ?? "",
      date: p.data.date,
    })),
    ...newsletter.map((p) => ({
      title: p.data.title,
      url: `${site}/newsletter/${p.slug}/`,
      description: p.data.description,
      body: p.body ?? "",
      date: p.data.date,
    })),
    ...books.map((p) => ({
      title: p.data.title,
      url: `${site}/library/books/${p.slug}/`,
      description: p.data.description,
      body: p.body ?? "",
      date: p.data.date,
    })),
    ...highlights.map((p) => ({
      title: p.data.title,
      url: `${site}/library/highlights/${p.slug}/`,
      description: p.data.description,
      body: p.body ?? "",
      date: p.data.date,
    })),
  ].sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0));

  const sections = entries
    .map(
      (e) =>
        `## ${e.title}\nURL: ${e.url}${e.date ? `\nPublished: ${e.date.toISOString().slice(0, 10)}` : ""}\n${e.description ? e.description + "\n" : ""}\n${e.body.trim()}\n`,
    )
    .join("\n---\n\n");

  const header = `# Ritik Patni — Full Content

This file contains the full text of all published notes, blog posts, newsletters, book entries, and highlights from ritikpatni.me. For a curated overview, see /llms.txt.

`;

  const body = header + "\n---\n\n" + sections;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
