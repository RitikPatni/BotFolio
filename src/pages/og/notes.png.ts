import { Resvg } from "@resvg/resvg-js";
import fs from "node:fs";
import path from "node:path";

const FONT_DIR = path.resolve(process.cwd(), "src/assets/og-fonts");
const FONT_FILES = fs
  .readdirSync(FONT_DIR)
  .filter((f) => f.endsWith(".ttf"))
  .map((f) => path.join(FONT_DIR, f));

/* Same card as the post OG images (og/blog/[slug].png.ts), for the /blog index. */
const PAPER = "#f7f4ed";
const INK = "#1d1b16";
const MOSS = "#5f7350";
const MOSS_DEEP = "#46573a";
const MUTED = "#8a8371";

/* Keep in sync with the hero lead in src/pages/blog/index.astro. */
const LEAD = "Clean notes on frontend engineering, systems, and photography.";

function svg(): string {
  return `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="${PAPER}"/>
  <rect x="0" y="0" width="6" height="630" fill="${MOSS_DEEP}"/>
  <text x="64" y="86" font-family="Newsreader" font-size="30" font-weight="400" fill="${INK}">Ritik Patni</text>
  <text x="1136" y="84" font-family="Plex Mono" font-size="19" font-weight="500" fill="${MUTED}" text-anchor="end" letter-spacing="3">NOTES</text>
  <line x1="64" y1="112" x2="1136" y2="112" stroke="${INK}" stroke-width="1.5" opacity="0.75"/>
  <text x="60" y="330" font-family="Newsreader" font-size="140" font-weight="400" fill="${INK}" letter-spacing="-3">Notes</text>
  <rect x="64" y="384" width="120" height="5" fill="${MOSS}"/>
  <text x="64" y="470" font-family="Newsreader" font-size="34" fill="${MUTED}">${LEAD}</text>
  <text x="64" y="606" font-family="Plex Mono" font-size="18" fill="${MUTED}" letter-spacing="2">RITIKPATNI.ME/BLOG</text>
</svg>`;
}

export async function GET() {
  const png = new Resvg(svg(), {
    fitTo: { mode: "width", value: 1200 },
    font: { loadSystemFonts: false, fontFiles: FONT_FILES, defaultFontFamily: "Newsreader" },
  }).render().asPng();
  /* Not immutable: the URL has no version, so a lead change must reach caches. */
  return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=86400" } });
}
