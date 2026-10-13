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

/* Field Notes palette — matches the site tokens (v2-tokens.scss) */
const PAPER = "#f7f4ed"; // cream
const CARD = "#fffdf8"; // raised paper
const INK = "#1d1b16";
const MOSS = "#5f7350";
const MOSS_DEEP = "#46573a";
const MOSS_WASH = "#c2cdb2";
const MUTED = "#8a8371";

const e = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Word-wrap a title into serif lines that fit maxW at `size`. */
function wrapLines(title: string, size: number, maxW: number): string[] {
  const charW = size * 0.52; // Fraunces 600 mixed-case average
  const maxChars = Math.max(8, Math.floor(maxW / charW));
  const words = title.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length > maxChars && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = next;
    }
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 3);
}

/** Serif display sizing: bigger cap, floors lower — mixed case reads smaller. */
function displaySize(title: string): number {
  const n = Math.max(title.length, 1);
  const cap = 96;
  const floor = 44;
  return Math.min(cap, Math.max(floor, Math.floor(1300 / (n * 0.52))));
}

function blogSvg(title: string, desc: string, date: string, readTime: string, slug: string): string {
  const size = displaySize(title);
  const lines = wrapLines(title, size, 1040);
  const lineHeight = Math.round(size * 1.18);
  const linesTop = 210;
  const blockH = lines.length * lineHeight;
  // accent tick under the headline block
  const accentY = Math.min(500, linesTop + blockH + 34);
  const slugDisplay = slug.length > 46 ? `${slug.substring(0, 46)}...` : slug;
  const meta = `${e(date)} · ${e(readTime)}`;
  const descFlat = desc.replace(/\s+/g, " ").trim();
  const descClean = descFlat.length > 58 ? `${descFlat.substring(0, 58)}...` : descFlat;
  return `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="${PAPER}"/>
  <!-- moss spine -->
  <rect x="0" y="0" width="6" height="630" fill="${MOSS_DEEP}"/>
  <!-- masthead -->
  <text x="64" y="86" font-family="Fraunces" font-size="30" font-weight="600" fill="${INK}">Ritik Patni</text>
  <text x="1136" y="84" font-family="Plex Mono" font-size="19" font-weight="500" fill="${MUTED}" text-anchor="end" letter-spacing="3">${e(slug.toUpperCase().startsWith("2") ? "READING · W41" : "NOTES")}</text>
  <line x1="64" y1="112" x2="1136" y2="112" stroke="${INK}" stroke-width="1.5" opacity="0.75"/>
  <!-- headline -->
  ${lines
    .map(
      (l, i) =>
        `<text x="64" y="${linesTop + i * lineHeight}" font-family="Fraunces" font-size="${size}" font-weight="600" fill="${INK}" letter-spacing="-1.5">${e(l)}</text>`,
    )
    .join("\n  ")}
  <!-- moss tick -->
  <rect x="64" y="${accentY}" width="120" height="5" fill="${MOSS}"/>
  <!-- description -->
  <text x="64" y="560" font-family="Newsreader" font-size="25" fill="${MUTED}">${e(descClean)}</text>
  <!-- footer meta -->
  <text x="1136" y="560" font-family="Plex Mono" font-size="20" font-weight="500" fill="${MOSS_DEEP}" text-anchor="end">${meta}</text>
  <text x="64" y="606" font-family="Plex Mono" font-size="18" fill="${MUTED}" letter-spacing="2">RITIKPATNI.ME/BLOG/${e(slugDisplay.toUpperCase())}</text>
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