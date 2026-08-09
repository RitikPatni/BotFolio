import { Resvg } from "@resvg/resvg-js";
import { getCollection } from "astro:content";
import { formatDisplayDate } from "../../../utils/date";
import { readingTimeMinutes } from "../../../utils/readingTime";

function blogSvg(title: string, desc: string, date: string, readTime: string): string {
  const e = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#030507"/><stop offset="100%" stop-color="#0d1117"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#bg)"/>
    <rect x="0" y="0" width="6" height="100%" fill="rgba(255,255,255,0.08)"/>
    <text x="56" y="60" font-family="Arial,sans-serif" font-size="14" font-weight="500" fill="#868e96">Ritik Patni</text>
    <text x="1144" y="60" font-family="Arial,sans-serif" font-size="14" fill="#868e96" text-anchor="end">${e(date)}</text>
    <text x="56" y="520" font-family="Georgia,serif" font-size="44" font-weight="600" fill="#f8fafb">${e(title.substring(0, 60))}${title.length > 60 ? "..." : ""}</text>
    <text x="56" y="570" font-family="Arial,sans-serif" font-size="20" fill="#ced4da">${e(desc.substring(0, 90))}</text>
    <text x="56" y="610" font-family="Arial,sans-serif" font-size="14" fill="#868e96">${e(date)} · ${e(readTime)} · blog</text>
  </svg>`;
}

export async function getStaticPaths() {
  const posts = await getCollection("blog", ({ data }) => !data.draft);
  return posts.map((post) => ({ params: { slug: post.slug }, props: { post } }));
}

export async function GET({ props }: { props: { post: any } }) {
  const { post } = props;
  const date = formatDisplayDate(post.data.date);
  const min = Math.max(1, Math.ceil(readingTimeMinutes(post.body || "") || 1));

  const png = new Resvg(blogSvg(post.data.title, post.data.description || "", date, `${min} min read`), {
    fitTo: { mode: "width", value: 1200 },
  }).render().asPng();

  return new Response(png, { headers: { "Content-Type": "image/png" } });
}