import { Resvg } from "@resvg/resvg-js";
import fs from "node:fs";
import path from "node:path";
import { getCollection } from "astro:content";
import { formatDisplayDate } from "../../../utils/date";
import { readingTimeMinutes } from "../../../utils/readingTime";

const FONT_DIR = path.resolve(process.cwd(), "src/assets/og-fonts");
const FONT_FILES = fs
  .readdirSync(FONT_DIR)
  .filter((f) => f.endsWith(".ttf"))
  .map((f) => path.join(FONT_DIR, f));

const INK = "#f5f5f0";
const PAPER = "#f5f5f0";
const BLACK = "#111111";
const YELLOW = "#ffd400";
const MUTED = "#9a9a94";

const e = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Split a title into at most 2 BALANCED heavy caps lines (greedy fill to half). */
function twoLines(title: string): [string, string] {
  const words = title.toUpperCase().split(/\s+/);
  const total = words.reduce((a, w) => a + w.length + 1, 0) - 1;
  const half = total / 2;
  const l1: string[] = [];
  const l2: string[] = [];
  let acc = 0;
  words.forEach((w) => {
    if (l2.length === 0 && (acc === 0 || acc + 1 + w.length <= half + 3)) {
      l1.push(w);
      acc += (acc === 0 ? 0 : 1) + w.length;
    } else {
      l2.push(w);
    }
  });
  return [l1.join(" "), l2.join(" ")];
}

/** The phrase rendered inside the yellow block; weekly reads keep THIS WEEK. */
function accentWord(title: string): string {
  if (/week/i.test(title) || /reading/i.test(title)) return "THIS WEEK";
  const words = title.toUpperCase().split(/\s+/);
  const last = words[words.length - 1].replace(/[^A-Z0-9']/g, "");
  if (last && last.length <= 12) return last;
  return "NEW POST";
}

/** Heuristic Inter Black width: chars * size * 0.72 (+ letterspacing -4/char). Fits within maxW. */
function fitSize(text: string, maxW: number, cap: number, floor: number): number {
  if (!text) return cap;
  const n = Math.max(text.length, 1);
  const size = Math.floor(maxW / (n * 0.72));
  return Math.min(cap, Math.max(floor, size));
}

function blogSvg(title: string, desc: string, date: string, readTime: string, slug: string): string {
  const [l1, l2] = twoLines(title);
  const accent = accentWord(title);
  const safe = (t: string) => e(t);
  const maxW = 1100; // 44 left margin, ~56 right margin
  // Uniform scale for both lines (Swiss discipline): longest line drives the size.
  const longest = l1.length >= (l2 || "").length ? l1 : l2 || l1;
  const size = fitSize(longest, maxW, 128, 40);
  const line1Y = l2 ? 268 : 372;
  const line2Y = l2 ? 396 : 0;
  // Accent block always on its OWN row below the headline: never clips, never collides.
  const accentY = l2 ? 452 : 428;
  const accentWidth = Math.max(220, accent.length * 34 + 56);
  const accentWordX = 44 + Math.floor(accentWidth / 2);
  const descY = 584;
  const slugDisplay = slug.length > 46 ? `${slug.substring(0, 46)}...` : slug;
  const meta = `${e(date)} · ${e(readTime)}`;
  return `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="${BLACK}"/>
  <rect x="0" y="0" width="1200" height="96" fill="${PAPER}"/>
  <text x="48" y="64" font-family="Inter" font-size="36" font-weight="900" fill="${BLACK}" letter-spacing="5">RITIK PATNI</text>
  <text x="1152" y="64" font-family="Inter" font-size="28" font-weight="800" fill="${BLACK}" text-anchor="end">BLOG</text>
  <text x="44" y="${line1Y}" font-family="Inter" font-size="${size}" font-weight="900" fill="${INK}" letter-spacing="-3">${safe(l1)}</text>
  ${l2 ? `<text x="44" y="${line2Y}" font-family="Inter" font-size="${size}" font-weight="900" fill="${INK}" letter-spacing="-3">${safe(l2)}</text>` : ""}
  <rect x="44" y="${accentY}" width="${accentWidth}" height="76" fill="${YELLOW}"/>
  <text x="${accentWordX}" y="${accentY + 56}" font-family="Inter" font-size="46" font-weight="900" fill="${BLACK}" text-anchor="middle">${safe(accent)}</text>
  <rect x="0" y="534" width="1200" height="96" fill="#181818"/>
  <text x="48" y="${descY}" font-family="Inter" font-size="21" font-weight="500" fill="${MUTED}">${safe(desc.substring(0, 66))}</text>
  <text x="1152" y="${descY}" font-family="Inter" font-size="18" font-weight="500" fill="${MUTED}" text-anchor="end">${meta}</text>
  <text x="48" y="60" font-family="Inter" font-size="0" fill="${BLACK}">.</text>
</svg>`;
}

export async function getStaticPaths() {
  const posts = await getCollection("blog", ({ data }) => !data.draft);
  return posts.map((post) => ({ params: { slug: post.id.replace(/\.md$/, "") }, props: { post } }));
}

export async function GET({ props }: { props: { post: any } }) {
  const { post } = props;
  const date = formatDisplayDate(post.data.date);
  const min = Math.max(1, Math.ceil(readingTimeMinutes(post.body || "") || 1));
  const slug = post.id.replace(/\.md$/, "");

  const png = new Resvg(blogSvg(post.data.title, post.data.description || "", date, `${min} min`, slug), {
    fitTo: { mode: "width", value: 1200 },
    font: { loadSystemFonts: false, fontFiles: FONT_FILES, defaultFontFamily: "Inter" },
  }).render().asPng();

  return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=31536000, immutable" } });
}