#!/usr/bin/env node
import { promises as fs } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const dataRoot = path.join(repoRoot, "src", "data", "photography");
const assetsRoot = path.join(repoRoot, "src", "assets", "photography");

const USAGE = `Usage: npm run gallery:add -- <category> <path/to/photo.jpg> --title "Title" --alt "Descriptive alt text"
       [--tags a,b] [--rating 1-5] [--date YYYY-MM-DD] [--file birds-part-2.json] [--dry-run]`;

const kebab = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const VALUE_FLAGS = new Set(["title", "alt", "tags", "rating", "date", "file"]);

function parseArgs(argv) {
  const opts = { tags: [] };
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") opts.dryRun = true;
    else if (a.startsWith("--")) {
      /* An unknown flag must not swallow the next argument: a typo like
         --dryrun would otherwise run the real write. */
      if (!VALUE_FLAGS.has(a.slice(2))) {
        console.error(`error: unknown option ${a}\n${USAGE}`);
        process.exit(1);
      }
      opts[a.slice(2)] = argv[++i];
    } else positional.push(a);
  }
  if (typeof opts.tags === "string") opts.tags = opts.tags.split(",").map((t) => t.trim()).filter(Boolean);
  return { ...opts, category: positional[0], photo: positional[1] };
}

/* Minimal TIFF/EXIF reader: enough for the tags photography entries need. */
const EXIF_SIZES = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 9: 4, 10: 8 };
function parseExif(buf) {
  const start = buf.indexOf("Exif\u0000\u0000") === 0 ? 6 : 0;
  const magic = buf.toString("latin1", start, start + 4);
  if (magic !== "II*\u0000" && magic !== "MM\u0000*") throw new Error("no TIFF header");
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const le = magic.startsWith("II");
  const ifd = (offset) => {
    const out = {};
    for (let i = 0; i < dv.getUint16(start + offset, le); i++) {
      /* One bad entry (truncated EXIF) skips that tag, not the whole read. */
      try {
        const e = start + offset + 2 + i * 12;
        const [tag, type, n] = [dv.getUint16(e, le), dv.getUint16(e + 2, le), dv.getUint32(e + 4, le)];
        const off = (EXIF_SIZES[type] || 1) * n <= 4 ? e + 8 : start + dv.getUint32(e + 8, le);
        if (type === 2) out[tag] = buf.toString("latin1", off, off + n).replace(/\0[\s\S]*$/, "");
        else if (type === 3) out[tag] = dv.getUint16(off, le);
        else if (type === 4) out[tag] = dv.getUint32(off, le);
        else if (type === 5) out[tag] = [dv.getUint32(off, le), dv.getUint32(off + 4, le)];
      } catch {
        break;
      }
    }
    return out;
  };
  const zeroth = ifd(dv.getUint32(start + 4, le));
  return { ...zeroth, ...(zeroth[0x8769] !== undefined ? ifd(zeroth[0x8769]) : {}) };
}

function exifToFields(tags) {
  const ratio = (v) => (Array.isArray(v) && v[1] ? v[0] / v[1] : undefined);
  const meta = {};
  const dt = tags[0x9003]?.trim() || tags[0x0132]?.trim() || "";
  const date = /^\d{4}:\d{2}:\d{2}/.test(dt) ? dt.slice(0, 10).replace(/:/g, "-") : "";
  if (tags[0x0110]) meta.camera = String(tags[0x0110]).replace(/\s+/g, " ").trim();
  if (tags[0xa434]) meta.lens = String(tags[0xa434]).replace(/\s+/g, " ").trim();
  const focal = ratio(tags[0x920a]);
  if (focal) meta.focalLength = `${Math.round(focal)}mm`;
  const fnum = ratio(tags[0x829d]);
  if (fnum) meta.aperture = `f/${Number(fnum.toFixed(1))}`;
  const exp = ratio(tags[0x829a]);
  /* 1/N only when the exposure really is a unit fraction; 0.4s stays 0.4s. */
  if (exp) {
    const inverse = 1 / exp;
    meta.shutterSpeed =
      exp < 1 && Math.abs(inverse - Math.round(inverse)) < 0.05
        ? `1/${Math.round(inverse)}s`
        : `${Number(exp.toFixed(1))}s`;
  }
  if (tags[0x8827] !== undefined) meta.iso = tags[0x8827];
  return { date, ...(Object.keys(meta).length ? { metadata: meta } : {}) };
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.length === 0 || ["-h", "--help"].includes(argv[0])) {
    console.log(USAGE);
    process.exit(argv.length === 0 ? 1 : 0);
  }
  const opts = parseArgs(argv);
  const errors = [];
  const manifestText = await fs.readFile(path.join(dataRoot, "manifest.ts"), "utf8");
  const imports = [...manifestText.matchAll(/from\s+["']\.\/([^"']+\.json)["']/g)].map((m) => m[1]);
  const filesFor = (c) => imports.filter((f) => f === `${c}.json` || f.startsWith(`${c}-part`));
  const has = (p) => fs.access(p).then(() => true, () => false);

  if (!opts.category || !opts.photo) errors.push("expected <category> and <path/to/photo>");
  if (opts.category && filesFor(opts.category).length === 0) errors.push(`category '${opts.category}' has no JSON file imported by manifest.ts`);
  if (!opts.title) errors.push("--title is required");
  if (!opts.alt || opts.alt.trim().length < 12) errors.push("--alt is required and must be at least 12 characters");
  if (opts.rating !== undefined && !/^[1-5]$/.test(opts.rating)) errors.push("--rating must be an integer 1-5");
  if (opts.date && !/^\d{4}-\d{2}-\d{2}$/.test(opts.date)) errors.push("--date must be YYYY-MM-DD");
  if (opts.tags.some((t) => !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(t))) errors.push("--tags must be lowercase kebab-case");
  if (opts.file && !imports.includes(opts.file)) errors.push(`--file ${opts.file} is not imported by manifest.ts`);
  if (opts.photo && !/\.(jpe?g|png|webp|avif|gif)$/i.test(opts.photo)) errors.push("photo must have an image extension");
  if (opts.photo && !(await has(opts.photo))) errors.push(`photo not found: ${opts.photo}`);
  if (errors.length) {
    console.error([USAGE, ...errors.map((e) => `error: ${e}`)].join("\n"));
    process.exit(1);
  }
  if (opts.rating === undefined) console.log("warning: no --rating given; unrated frames sort last and never reach the home strip");

  const slug = kebab(opts.title);
  if (!slug) {
    console.error("error: --title has no latin letters or digits to build a filename from");
    process.exit(1);
  }
  const ext = path.extname(opts.photo).toLowerCase().replace("jpeg", "jpg");
  const filename = `${slug}${ext}`;
  let clash = null;
  for (const f of imports) {
    const hit = JSON.parse(await fs.readFile(path.join(dataRoot, f), "utf8")).find(
      (i) => i.filename.replace(/\.[^.]+$/, "") === slug,
    );
    if (hit) clash = `'${hit.filename}' in ${f}`;
  }
  for (const dir of await fs.readdir(assetsRoot).catch(() => [])) {
    if (clash) break;
    for (const f of await fs.readdir(path.join(assetsRoot, dir)).catch(() => [])) {
      if (f.replace(/\.[^.]+$/, "") === slug) clash = `${dir}/${f} on disk`;
    }
  }
  if (clash) {
    console.error(`error: slug '${slug}' already exists (${clash}); deep links use /photography#${slug}`);
    process.exit(1);
  }

  let exifFields = { date: "" };
  try {
    const meta = await sharp(opts.photo).metadata();
    if (meta.exif) exifFields = exifToFields(parseExif(meta.exif));
    else console.log('note: no EXIF in photo; using date ""');
  } catch (e) {
    console.log(`note: EXIF unreadable (${e.message}); using date ""`);
  }

  const entry = {
    filename,
    title: opts.title,
    category: opts.category,
    tags: opts.tags.length ? opts.tags : [opts.category],
    alt: opts.alt,
    date: opts.date ?? exifFields.date,
    ...(exifFields.metadata ? { metadata: exifFields.metadata } : {}),
    ...(opts.rating ? { rating: Number(opts.rating) } : {}),
  };
  /* Numeric-aware sort so birds-part-10 lands after birds-part-2. */
  const dataFile =
    opts.file ?? filesFor(opts.category).sort((a, b) => a.localeCompare(b, "en", { numeric: true })).at(-1);
  const dataPath = path.join(dataRoot, dataFile);
  const assetPath = path.join(assetsRoot, opts.category, filename);
  if (opts.dryRun) {
    console.log(`Dry run — would copy asset to ${path.relative(repoRoot, assetPath)} and append to ${path.relative(repoRoot, dataPath)}:`);
    console.log(JSON.stringify(entry, null, 2));
    return;
  }

  /* Build the new JSON before touching disk; any failure after the copy
     (unwritable JSON, failed validation) restores both files. */
  const originalJson = await fs.readFile(dataPath, "utf8");
  const items = JSON.parse(originalJson);
  items.push(entry);
  const rollback = async () => {
    await fs.writeFile(dataPath, originalJson).catch(() => {});
    await fs.rm(assetPath, { force: true });
  };

  try {
    await fs.mkdir(path.dirname(assetPath), { recursive: true });
    await fs.copyFile(opts.photo, assetPath);
    await fs.writeFile(dataPath, `${JSON.stringify(items, null, 2)}\n`);
  } catch (error) {
    await rollback();
    console.error(`error: ${error.message}; rolled back the JSON change and the copied asset.`);
    process.exit(1);
  }

  if (spawnSync("node", [path.join(__dirname, "validate-gallery.mjs")], { stdio: "inherit" }).status !== 0) {
    await rollback();
    console.error("Validation failed; rolled back the JSON change and the copied asset.");
    process.exit(1);
  }
  console.log(`Added ${filename} to ${dataFile} (${items.length} entries).`);
}

main().catch((e) => {
  console.error("gallery:add failed to run:", e.message);
  process.exit(1);
});
