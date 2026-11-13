import { Resvg } from "@resvg/resvg-js";
import fs from "node:fs";
import path from "node:path";

const FONT_DIR = path.resolve(process.cwd(), "src/assets/og-fonts");
const FONT_FILES = fs
  .readdirSync(FONT_DIR)
  .filter((f) => f.endsWith(".ttf"))
  .map((f) => path.join(FONT_DIR, f));

/* Ledger identity card — stone paper, ink serif, rust tick */
const PAPER = "#eeefed"; // --bg
const INK = "#18191a"; // --text
const ACCENT = "#a8401e"; // --accent-start
const ACCENT_DEEP = "#8a3216"; // --accent-end
const MUTED = "#5b5f62"; // --text-dim

function svg(): string {
  return `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="${PAPER}"/>
  <rect x="0" y="0" width="6" height="630" fill="${ACCENT_DEEP}"/>
  <text x="64" y="96" font-family="Newsreader" font-size="42" font-weight="400" fill="${INK}">The Weekly Read</text>
  <text x="1136" y="94" font-family="Newsreader" font-style="italic" font-size="24" fill="${MUTED}" text-anchor="end">Field notes</text>
  <line x1="64" y1="126" x2="1136" y2="126" stroke="${INK}" stroke-width="1.5" opacity="0.75"/>
  <text x="60" y="330" font-family="Newsreader" font-size="120" font-weight="400" fill="${INK}" letter-spacing="-2">Ritik Patni</text>
  <text x="64" y="412" font-family="Newsreader" font-size="64" fill="${ACCENT_DEEP}">frontend developer, field photographer.</text>
  <rect x="64" y="462" width="120" height="5" fill="${ACCENT}"/>
  <text x="64" y="540" font-family="Newsreader" font-size="27" fill="${MUTED}">Product surfaces and shipping notes\u2003wildlife, birds, and macro studies</text>
  <text x="64" y="594" font-family="Newsreader" font-style="italic" font-size="23" fill="${MUTED}">ritikpatni.me</text>
</svg>`;
}

export async function GET() {
  const png = new Resvg(svg(), {
    fitTo: { mode: "width", value: 1200 },
    font: { loadSystemFonts: false, fontFiles: FONT_FILES, defaultFontFamily: "Newsreader" },
  }).render().asPng();
  return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=31536000, immutable" } });
}