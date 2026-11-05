#!/usr/bin/env node
// Validates the bird journal data: 43 species, privacy whitelist, photo and
// sticker references, and no GPS EXIF in journal source photos.
import { readFileSync, existsSync } from "node:fs";
import { validateJournal, jpegHasGps } from "./lib.mjs";

const root = new URL("../../", import.meta.url);
const read = (rel) => JSON.parse(readFileSync(new URL(rel, root), "utf8"));
const photos = read("src/data/birds/photos.json");
const errors = validateJournal({
  lifeList: read("src/data/birds/life-list.json"),
  photos,
  stickers: read("src/data/birds/stickers.json"),
  photoExists: (f) => existsSync(new URL(`src/assets/photography/${f}`, root)),
  stickerExists: (f) => existsSync(new URL(`src/assets/birds/stickers/${f}`, root)),
  expectedCount: 43,
});
for (const p of photos) {
  const file = new URL(`src/assets/photography/${p.file}`, root);
  if (existsSync(file) && jpegHasGps(readFileSync(file))) errors.push(`photo ${p.file}: source carries GPS EXIF`);
}
if (errors.length) {
  console.error(`Bird journal validation failed (${errors.length}):\n- ${errors.join("\n- ")}`);
  process.exit(1);
}
console.log(`Bird journal OK: 43 species, ${photos.length} photos, ${read("src/data/birds/stickers.json").length} stickers`);
