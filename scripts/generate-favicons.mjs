/**
 * F2 favicon generator — four staggered bold tiger stripes (long/short/
 * long/short), ink on the third stripe. Ledger tokens only, flat fills.
 *
 *   light: rust · rust · graphite · rust on stone   #eeefed
 *   dark:  rust-dark · rust-dark · chalk · rust-dark on slate #141516
 *
 * 16px PNGs are pixel-hinted (integer rects, no anti-aliasing). 32/180/192/
 * 512 renders are anti-aliased via resvg. ICO files pack the 16 + 32 frames.
 *
 * Run: node scripts/generate-favicons.mjs   (writes into public/)
 */
import { deflateSync } from "node:zlib";
import { Resvg } from "@resvg/resvg-js";
import { writeFileSync } from "node:fs";

const THEMES = {
  light: { bg: "#eeefed", stripe: "#a8401e", ink: "#18191a" },
  dark: { bg: "#141516", stripe: "#ef8f68", ink: "#ebebe8" },
};

/** 32-unit master geometry: stripe width 6, gap 2, heights 20/12, staggered. */
const STRIPES_32 = [
  { x: 1, y: 3, w: 6, h: 20, ink: false },
  { x: 9, y: 14, w: 6, h: 12, ink: false },
  { x: 17, y: 5, w: 6, h: 20, ink: true },
  { x: 25, y: 16, w: 6, h: 12, ink: false },
];

/** 16px pixel-hinted geometry: 32-unit spec halved and floored to integers. */
const STRIPES_16 = STRIPES_32.map(({ x, y, w, h, ink }) => ({
  x: Math.floor(x / 2),
  y: Math.floor(y / 2),
  w: Math.floor(w / 2),
  h: Math.floor(h / 2),
  ink,
}));

function svgFor(theme) {
  const { bg, stripe, ink } = THEMES[theme];
  const rects = STRIPES_32
    .map((s) => `<rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" fill="${s.ink ? ink : stripe}"/>`)
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="${bg}"/>${rects}</svg>`;
}

function renderPng(svg, size) {
  return new Resvg(svg, { fitTo: { mode: "width", value: size } }).render().asPng();
}

// --- Minimal PNG encoder for the pixel-hinted 16px frames (no deps). ---
const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const head = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(head));
  return Buffer.concat([length, head, crc]);
}

function hexToRgb(hex) {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}

/** Encode a size x size RGBA raster with integer stripe rects (no AA). */
function encodePng(size, { bg, stripe, ink }) {
  const px = new Uint8Array(size * size * 4);
  const fill = (rect, rgb) => {
    for (let y = rect.y; y < rect.y + rect.h; y += 1) {
      for (let x = rect.x; x < rect.x + rect.w; x += 1) {
        const o = (y * size + x) * 4;
        px[o] = rgb[0];
        px[o + 1] = rgb[1];
        px[o + 2] = rgb[2];
        px[o + 3] = 255;
      }
    }
  };
  fill({ x: 0, y: 0, w: size, h: size }, hexToRgb(bg));
  const stripeRgb = hexToRgb(stripe);
  const inkRgb = hexToRgb(ink);
  for (const s of STRIPES_16) fill(s, s.ink ? inkRgb : stripeRgb);

  // One filter byte (0 = none) per scanline.
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y += 1) {
    raw[y * (size * 4 + 1)] = 0;
    Buffer.from(px.buffer, y * size * 4, size * 4).copy(raw, y * (size * 4 + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/** ICO container holding PNG frames (Vista+ style). */
function encodeIco(frames) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(frames.length, 4);
  const entries = [];
  const blobs = [];
  let offset = 6 + frames.length * 16;
  for (const { size, png } of frames) {
    const entry = Buffer.alloc(16);
    entry[0] = size >= 256 ? 0 : size;
    entry[1] = size >= 256 ? 0 : size;
    entry.writeUInt16LE(1, 4); // planes
    entry.writeUInt16LE(32, 6); // bpp
    entry.writeUInt32BE(png.length, 8);
    entry.writeUInt32BE(offset, 12);
    entries.push(entry);
    blobs.push(png);
    offset += png.length;
  }
  return Buffer.concat([header, ...entries, ...blobs]);
}

for (const theme of Object.keys(THEMES)) {
  const svg = svgFor(theme);
  const png16 = encodePng(16, THEMES[theme]);
  const png32 = renderPng(svg, 32);
  writeFileSync(`public/favicon-${theme}-16x16.png`, png16);
  writeFileSync(`public/favicon-${theme}-32x32.png`, png32);
  writeFileSync(`public/favicon-${theme}.png`, renderPng(svg, 512));
  writeFileSync(`public/favicon-${theme}.ico`, encodeIco([
    { size: 16, png: png16 },
    { size: 32, png: png32 },
  ]));
  writeFileSync(`public/apple-touch-icon-${theme}.png`, renderPng(svg, 180));
  writeFileSync(`public/android-chrome-${theme}-192x192.png`, renderPng(svg, 192));
  writeFileSync(`public/android-chrome-${theme}-512x512.png`, renderPng(svg, 512));
  console.log(`wrote F2 ${theme} set (16 pixel-hinted, 32/180/192/512 anti-aliased, ico 16+32)`);
}
