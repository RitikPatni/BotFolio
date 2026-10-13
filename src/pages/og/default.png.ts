import { Resvg } from "@resvg/resvg-js";
import fs from "node:fs";
import path from "node:path";

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

function svg(): string {
  return `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="${BLACK}"/>
  <rect x="0" y="0" width="1200" height="96" fill="${PAPER}"/>
  <text x="48" y="64" font-family="Inter" font-size="36" font-weight="900" fill="${BLACK}" letter-spacing="5">RITIK PATNI</text>
  <text x="1152" y="64" font-family="Inter" font-size="28" font-weight="800" fill="${BLACK}" text-anchor="end">ritikpatni.me</text>
  <text x="44" y="330" font-family="Inter" font-size="150" font-weight="900" fill="${INK}" letter-spacing="-6">RITIK</text>
  <rect x="44" y="366" width="380" height="70" fill="${YELLOW}"/>
  <text x="234" y="420" font-family="Inter" font-size="44" font-weight="900" fill="${BLACK}" text-anchor="middle">PATNI</text>
  <text x="48" y="486" font-family="Inter" font-size="24" font-weight="500" fill="${MUTED}">Frontend developer · wildlife/macro photographer</text>
  <rect x="0" y="534" width="1200" height="96" fill="#181818"/>
  <text x="48" y="592" font-family="Inter" font-size="26" font-weight="700" fill="${INK}">Clean notes on frontend, systems, and photography</text>
  <rect x="1080" y="586" width="72" height="4" fill="${YELLOW}"/>
</svg>`;
}

export async function GET() {
  const png = new Resvg(svg(), {
    fitTo: { mode: "width", value: 1200 },
    font: { loadSystemFonts: false, fontFiles: FONT_FILES, defaultFontFamily: "Inter" },
  }).render().asPng();
  return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=31536000, immutable" } });
}