#!/usr/bin/env node
/* Shrink oversized gallery originals in place.
 *
 * Visitors never download these files: astro:assets resizes every frame at
 * build time (lightbox tops out at 1920px wide). Originals straight off the
 * camera (6192px, up to 11 MB) only bloat the repo and slow the build. This
 * caps the long edge (default 3840px, 2x the largest served width), keeping
 * the filename, the format and the EXIF, so no entry has to change its
 * filename and no orphan twin is left behind.
 *
 * The lightbox shows each frame's resolution. Before a file shrinks, its
 * original camera resolution is written to the entry's metadata.resolution,
 * which the gallery prefers over the file's own dimensions.
 *
 * Dry run by default; pass --write to apply.
 *   npm run images:optimize                  # report what would change
 *   npm run images:optimize -- --write       # resize + update entries
 *   npm run images:optimize -- --max 3200 --write
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import sharp from "sharp";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataRoot = path.join(repoRoot, "src", "data", "photography");
const assetsRoot = path.join(repoRoot, "src", "assets", "photography");

const argv = process.argv.slice(2);
const write = argv.includes("--write");
const maxIndex = argv.indexOf("--max");
const maxEdge = maxIndex >= 0 ? Number(argv[maxIndex + 1]) : 3840;

if (!Number.isInteger(maxEdge) || maxEdge < 1920) {
  console.error("--max must be an integer of at least 1920 (the largest width the site serves).");
  process.exit(1);
}

const mb = (bytes) => `${(bytes / 1e6).toFixed(1)} MB`;

/* Rewrites JSON entries, so refuse to mix them into uncommitted edits. */
if (write) {
  const dirty = execFileSync("git", ["status", "--porcelain", "--", "src/data/photography"], {
    cwd: repoRoot,
    encoding: "utf8",
  }).trim();
  if (dirty) {
    console.error("Uncommitted changes in src/data/photography; commit or stash them first.\n" + dirty);
    process.exit(1);
  }
}

const jsonFiles = (await fs.readdir(dataRoot)).filter((f) => f.endsWith(".json")).sort();
let planned = 0;
let savedBytes = 0;

for (const file of jsonFiles) {
  const jsonPath = path.join(dataRoot, file);
  const entries = JSON.parse(await fs.readFile(jsonPath, "utf8"));
  let fileChanged = false;

  for (const entry of entries) {
    const assetPath = path.join(assetsRoot, entry.category, entry.filename);
    let meta;
    try {
      meta = await sharp(assetPath).metadata();
    } catch {
      console.warn(`  skip (unreadable): ${entry.category}/${entry.filename}`);
      continue;
    }

    /* EXIF orientations 5-8 store the frame rotated; the displayed size swaps. */
    const rotated = (meta.orientation ?? 1) >= 5;
    const width = rotated ? meta.height : meta.width;
    const height = rotated ? meta.width : meta.height;
    if (Math.max(width, height) <= maxEdge) {
      continue;
    }

    planned += 1;
    const before = (await fs.stat(assetPath)).size;
    const label = `${entry.category}/${entry.filename} ${width}×${height} (${mb(before)})`;

    if (!write) {
      console.log(`  would resize: ${label}`);
      continue;
    }

    /* Resize on stored pixels (keepMetadata keeps the orientation tag with
       them), re-encode in the source format at high quality. */
    const scale = maxEdge / Math.max(meta.width, meta.height);
    let pipeline = sharp(assetPath)
      .resize(Math.round(meta.width * scale), Math.round(meta.height * scale))
      .keepMetadata();
    if (meta.format === "jpeg") pipeline = pipeline.jpeg({ quality: 92, mozjpeg: true });
    else if (meta.format === "webp") pipeline = pipeline.webp({ quality: 92 });
    else if (meta.format === "png") pipeline = pipeline.png({ compressionLevel: 9 });

    const tmpPath = `${assetPath}.tmp`;
    await pipeline.toFile(tmpPath);
    const after = (await fs.stat(tmpPath)).size;
    if (after >= before) {
      await fs.rm(tmpPath);
      console.log(`  kept (no saving): ${label}`);
      continue;
    }
    await fs.rename(tmpPath, assetPath);
    savedBytes += before - after;

    entry.metadata ??= {};
    entry.metadata.resolution ??= `${width} × ${height}`;
    fileChanged = true;
    console.log(`  resized: ${label} → ${mb(after)}`);
  }

  if (fileChanged) {
    await fs.writeFile(jsonPath, `${JSON.stringify(entries, null, 2)}\n`, "utf8");
  }
}

if (!write) {
  console.log(
    planned
      ? `\n${planned} original(s) exceed ${maxEdge}px. Re-run with --write to resize them.`
      : `\nNo originals exceed ${maxEdge}px.`,
  );
} else {
  console.log(`\nResized ${planned} original(s), saved ${mb(savedBytes)}. Run npm run gallery:validate next.`);
}
