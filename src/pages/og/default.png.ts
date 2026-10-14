import { Resvg } from "@resvg/resvg-js";
import fs from "node:fs";
import path from "node:path";

const FONT_DIR = path.resolve(process.cwd(), "src/assets/og-fonts");
const FONT_FILES = fs
  .readdirSync(FONT_DIR)
  .filter((f) => f.endsWith(".ttf"))
  .map((f) => path.join(FONT_DIR, f));

/* Field Notes identity card — cream paper, ink serif, moss tick */
const PAPER = "#f7f4ed";
const INK = "#1d1b16";
const MOSS = "#5f7350";
const MOSS_DEEP = "#46573a";
const MUTED = "#8a8371";

function svg(): string {
  return `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="${PAPER}"/>
  <rect x="0" y="0" width="6" height="630" fill="${MOSS_DEEP}"/>
  <text x="64" y="96" font-family="Fraunces" font-size="42" font-weight="600" fill="${INK}">The Weekly Read</text>
  <text x="1136" y="94" font-family="Plex Mono" font-size="19" font-weight="500" fill="${MUTED}" text-anchor="end" letter-spacing="3">FIELD NOTES</text>
  <line x1="64" y1="126" x2="1136" y2="126" stroke="${INK}" stroke-width="1.5" opacity="0.75"/>
  <text x="60" y="330" font-family="Fraunces" font-size="120" font-weight="600" fill="${INK}" letter-spacing="-2">Ritik Patni</text>
  <text x="64" y="412" font-family="Newsreader" font-size="64" fill="${MOSS_DEEP}">frontend developer, field photographer.</text>
  <rect x="64" y="462" width="120" height="5" fill="${MOSS}"/>
  <text x="64" y="540" font-family="Newsreader" font-size="27" fill="${MUTED}">Product surfaces and shipping notes · wildlife, birds, and macro studies</text>
  <text x="64" y="594" font-family="Plex Mono" font-size="19" fill="${MUTED}" letter-spacing="2">RITIKPATNI.ME</text>
</svg>`;
}

export async function GET() {
  const png = new Resvg(svg(), {
    fitTo: { mode: "width", value: 1200 },
    font: { loadSystemFonts: false, fontFiles: FONT_FILES, defaultFontFamily: "Fraunces" },
  }).render().asPng();
  return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=31536000, immutable" } });
}