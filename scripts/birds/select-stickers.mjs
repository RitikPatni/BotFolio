#!/usr/bin/env node
// Usage: node scripts/birds/select-stickers.mjs <huashu species.csv> <downloaded-stickers-dir>
// Picks huashu-bird-sticker art for life-list species by exact scientific name
// with meets_quality_bar=True, writes src/data/birds/stickers.json and copies
// the matching .webp files into src/assets/birds/stickers/.
// Download only the listed files (stickers/<path>.webp) from the pinned release.
import { readFileSync, writeFileSync, copyFileSync, existsSync } from "node:fs";
import path from "node:path";
import { selectStickers } from "./lib.mjs";

const [csvPath, srcDir] = process.argv.slice(2);
if (!csvPath || !srcDir) {
  console.error("Usage: node scripts/birds/select-stickers.mjs <species.csv> <stickers-dir>");
  process.exit(2);
}
const root = new URL("../../", import.meta.url);
const lifeList = JSON.parse(readFileSync(new URL("src/data/birds/life-list.json", root), "utf8"));
const picked = selectStickers(readFileSync(csvPath, "utf8"), lifeList).filter((s) => {
  const ok = existsSync(path.join(srcDir, s.file));
  if (!ok) console.warn(`skip ${s.slug}: ${s.file} not downloaded`);
  return ok;
});
for (const s of picked) copyFileSync(path.join(srcDir, s.file), new URL(`src/assets/birds/stickers/${s.file}`, root));
writeFileSync(new URL("src/data/birds/stickers.json", root), `${JSON.stringify(picked, null, 2)}\n`);
const missing = lifeList.filter((s) => !picked.some((p) => p.slug === s.slug)).map((s) => s.slug);
console.log(`Selected ${picked.length} stickers; text-only: ${missing.join(", ") || "none"}`);
