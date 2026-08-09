import { Resvg } from "@resvg/resvg-js";
import { getCollection } from "astro:content";
import { formatDisplayDate } from "../../../utils/date";
import { readingTimeMinutes } from "../../../utils/readingTime";

function blogSvg(title: string, desc: string, date: string, readTime: string): string {
  const e = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0a0a0b"/><stop offset="100%" stop-color="#0d1015"/>
      </linearGradient>
      <linearGradient id="accent" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#82aaff"/><stop offset="100%" stop-color="#c792ea"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#bg)"/>
    <rect x="0" y="0" width="5" height="100%" fill="url(#accent)"/>
    <ellipse cx="1080" cy="80" rx="300" ry="260" fill="url(#accent)" opacity="0.07"/>
    <text x="56" y="74" font-family="Inter,ui-sans-serif,system-ui,sans-serif" font-size="16" font-weight="300" fill="#5c5c6e">Ritik Patni</text>
    <text x="1144" y="74" font-family="Inter,ui-sans-serif,system-ui,sans-serif" font-size="15" font-weight="300" fill="#5c5c6e" text-anchor="end">${e(date)}</text>
    <text x="56" y="516" font-family="Inter,ui-sans-serif,system-ui,sans-serif" font-size="44" font-weight="300" letter-spacing="-0.4" fill="#fafafa">${e(title.substring(0, 60))}${title.length > 60 ? "..." : ""}</text>
    <text x="56" y="572" font-family="Inter,ui-sans-serif,system-ui,sans-serif" font-size="22" font-weight="300" fill="#888896">${e(desc.substring(0, 90))}</text>
    <text x="56" y="612" font-family="Inter,ui-sans-serif,system-ui,sans-serif" font-size="15" font-weight="300" fill="#5c5c6e">${e(date)} · ${e(readTime)} · blog</text>
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

  return new Response(png, { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=31536000, immutable" } });
}