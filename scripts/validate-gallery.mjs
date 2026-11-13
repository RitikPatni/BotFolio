#!/usr/bin/env node
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const dataRoot = path.join(repoRoot, "src", "data", "photography");
const assetsRoot = path.join(repoRoot, "src", "assets", "photography");
const manifestPath = path.join(dataRoot, "manifest.ts");

const imageExtRegex = /\.(jpg|jpeg|png|webp|avif|gif)$/i;

const args = new Set(process.argv.slice(2));
const strictMode = args.has("--strict") || args.has("--ci");
const jsonMode = args.has("--json") || args.has("--ci");

const errors = [];
const warnings = [];
const infos = [];

const isObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const kebabFileRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*\.(jpg|jpeg|png|webp|avif|gif)$/;
const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
const tagRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

function err(file, index, message) {
  errors.push(`${file}#${index + 1}: ${message}`);
}

function warn(file, index, message) {
  warnings.push(`${file}#${index + 1}: ${message}`);
}

function warnGlobal(message) {
  warnings.push(message);
}

function info(message) {
  infos.push(message);
}

/* The site renders exactly the JSON files manifest.ts imports, so that list
   (not a hardcoded one) is what gets validated. */
function parseManifestImports(tsContent) {
  return [...tsContent.matchAll(/from\s+["']\.\/([^"']+\.json)["']/g)].map((m) => m[1]);
}

async function listImageFiles(dir, prefix = "") {
  const out = [];
  let dirents = [];
  try {
    dirents = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const d of dirents) {
    const rel = prefix ? `${prefix}/${d.name}` : d.name;
    if (d.isDirectory()) {
      // eslint-disable-next-line no-await-in-loop
      out.push(...(await listImageFiles(path.join(dir, d.name), rel)));
    } else if (imageExtRegex.test(d.name)) {
      out.push(rel);
    }
  }
  return out;
}

function parseManifestCategories(tsContent) {
  const ids = [...tsContent.matchAll(/id:\s*"([a-z0-9-]+)"/g)].map((m) => m[1]);
  return new Set(ids);
}

async function readJsonArray(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error(`${path.basename(filePath)} is not a JSON array`);
  }
  return parsed;
}

function computeCategoryBalanceSummary(categoryCounts, total) {
  const entries = [...categoryCounts.entries()].sort((a, b) => b[1] - a[1]);

  // Portfolio intent (Ritik): birds + wildlife will be dominant by design.
  // Warn only if that dominance weakens unexpectedly.
  const birds = categoryCounts.get("birds") ?? 0;
  const wildlife = categoryCounts.get("wildlife") ?? 0;
  const dominantShare = (birds + wildlife) / Math.max(total, 1);

  if (total >= 10 && dominantShare < 0.7) {
    warnGlobal(
      `Portfolio drift warning: birds+wildlife share is ${(dominantShare * 100).toFixed(1)}% (< 70%).`,
    );
  }

  return {
    counts: Object.fromEntries(entries),
    percentages: Object.fromEntries(
      entries.map(([category, count]) => [category, Number(((count / Math.max(total, 1)) * 100).toFixed(1))]),
    ),
    birdsWildlifeSharePercent: Number((dominantShare * 100).toFixed(1)),
  };
}

async function main() {
  const manifestText = await fs.readFile(manifestPath, "utf8");
  const allowedCategories = parseManifestCategories(manifestText);
  const jsonFiles = parseManifestImports(manifestText);

  if (jsonFiles.length === 0) {
    errors.push("manifest.ts: no ./*.json imports found (parser out of date?)");
  }

  /* A JSON file manifest.ts doesn't import passes every entry check and then
     never renders (e.g. a new birds-part-3.json). */
  for (const file of (await fs.readdir(dataRoot)).filter((f) => f.endsWith(".json")).sort()) {
    if (!jsonFiles.includes(file)) {
      errors.push(`${file}: not imported by manifest.ts, so none of its entries render`);
    }
  }

  const seenFilenames = new Map();
  const seenSlugs = new Map();
  const referencedAssets = new Set();
  const seenTitleByCategory = new Set();
  const categoryCounts = new Map();

  let total = 0;
  let filesLoaded = 0;

  for (const file of jsonFiles) {
    const fullPath = path.join(dataRoot, file);
    const fileExists = await exists(fullPath);

    if (!fileExists) {
      errors.push(`${file}: imported by manifest.ts but missing`);
      continue;
    }

    const items = await readJsonArray(fullPath);
    filesLoaded += 1;
    total += items.length;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!isObject(item)) {
        err(file, i, "entry must be an object");
        continue;
      }

      const required = ["filename", "title", "category", "tags", "alt", "date"];
      for (const key of required) {
        if (!(key in item)) err(file, i, `missing required field '${key}'`);
      }

      const { filename, title, category, tags, alt, date, metadata, rating } = item;

      /* Rating drives ordering and the home strip picks the top frames;
         an unrated entry silently sinks to the end of everything. */
      if (rating === undefined) {
        warn(file, i, "missing 'rating' (1-5); unrated frames sort last and never reach the home strip");
      } else if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        err(file, i, "rating must be an integer from 1 to 5");
      }

      if (typeof filename !== "string" || !filename.trim()) {
        err(file, i, "filename must be a non-empty string");
      } else {
        if (!kebabFileRegex.test(filename)) {
          err(file, i, "filename must be lowercase kebab-case with image extension");
        }
        if (seenFilenames.has(filename)) {
          err(file, i, `duplicate filename also used in ${seenFilenames.get(filename)}`);
        } else {
          seenFilenames.set(filename, file);
          /* The deep-link id (/photography#<slug>) is the filename without its
             extension, so eagle.jpg + eagle.png collide even though the
             filenames differ; the build throws on it. */
          const slug = filename.replace(/\.[^.]+$/, "");
          if (seenSlugs.has(slug)) {
            err(file, i, `slug '${slug}' collides with ${seenSlugs.get(slug)} (deep links use the filename without extension)`);
          } else {
            seenSlugs.set(slug, `${filename} in ${file}`);
          }
        }
      }

      if (typeof title !== "string" || !title.trim()) {
        err(file, i, "title must be a non-empty string");
      }

      if (typeof category !== "string" || !allowedCategories.has(category)) {
        err(
          file,
          i,
          `category must be one of [${[...allowedCategories].join(", ")}]`,
        );
      } else {
        categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
      }

      if (!Array.isArray(tags) || tags.length === 0) {
        err(file, i, "tags must be a non-empty array");
      } else {
        for (const [tagIndex, tag] of tags.entries()) {
          if (typeof tag !== "string" || !tagRegex.test(tag)) {
            err(file, i, `tags[${tagIndex}] must be lowercase kebab-case`);
          }
        }
      }

      if (typeof alt !== "string" || alt.trim().length < 12) {
        err(file, i, "alt must be a descriptive string (>=12 chars)");
      }

      if (typeof date !== "string" || (!isoDateRegex.test(date) && date !== "")) {
        err(file, i, "date must be YYYY-MM-DD or empty string");
      }

      if (metadata !== undefined) {
        if (!isObject(metadata)) {
          err(file, i, "metadata must be an object when present");
        } else {
          /* Mirrors PhotoMetadata in src/data/photography/types.ts. */
          const knownMeta = [
            "camera",
            "lens",
            "focalLength",
            "aperture",
            "shutterSpeed",
            "iso",
          ];
          for (const key of Object.keys(metadata)) {
            if (!knownMeta.includes(key)) {
              warn(file, i, `metadata contains unknown key '${key}'`);
            }
          }
        }
      }

      if (typeof filename === "string" && typeof category === "string") {
        referencedAssets.add(`${category}/${filename}`);
        const imagePath = path.join(assetsRoot, category, filename);
        // eslint-disable-next-line no-await-in-loop
        if (!(await exists(imagePath))) {
          err(file, i, `missing image asset at src/assets/photography/${category}/${filename}`);
        }
      }

      if (typeof category === "string" && typeof title === "string" && title.trim()) {
        const key = `${category}::${title.trim().toLowerCase()}`;
        if (seenTitleByCategory.has(key)) {
          warn(file, i, `duplicate title within category: '${title}'`);
        } else {
          seenTitleByCategory.add(key);
        }
      }
    }
  }

  /* Orphans: image files no entry points at. They still ship in the repo
     (and often mean an entry was renamed or a webp twin was left behind). */
  for (const rel of (await listImageFiles(assetsRoot)).sort()) {
    if (!referencedAssets.has(rel)) {
      warnGlobal(`orphan asset: src/assets/photography/${rel} is not referenced by any entry`);
    }
  }

  const categorySummary = computeCategoryBalanceSummary(categoryCounts, total);
  const strictWarningFailure = strictMode && warnings.length > 0;
  const hasBlockingErrors = errors.length > 0;
  const exitCode = hasBlockingErrors || strictWarningFailure ? 1 : 0;

  const report = {
    ok: exitCode === 0,
    strictMode,
    jsonMode,
    totalEntries: total,
    manifestFilesChecked: filesLoaded,
    manifestFilesExpected: jsonFiles.length,
    categorySummary,
    counts: {
      errors: errors.length,
      warnings: warnings.length,
      info: infos.length,
    },
    errors,
    warnings,
    info: infos,
  };

  if (jsonMode) {
    console.log(JSON.stringify(report, null, 2));
    process.exit(exitCode);
  }

  console.log(
    `Gallery QA summary: ${total} entries checked across ${filesLoaded}/${jsonFiles.length} manifest files.`,
  );

  console.log(
    `\nCategory distribution: ${Object.entries(categorySummary.counts)
      .map(([category, count]) => `${category}: ${count} (${categorySummary.percentages[category]}%)`)
      .join(" · ") || "(empty)"}`,
  );

  if (warnings.length) {
    console.log(`\nWarnings (${warnings.length}):`);
    for (const w of warnings) console.log(`- ${w}`);
  }

  if (infos.length) {
    console.log(`\nInfo (${infos.length}):`);
    for (const i of infos) console.log(`- ${i}`);
  }

  if (errors.length) {
    console.log(`\nErrors (${errors.length}):`);
    for (const e of errors) console.log(`- ${e}`);
    process.exit(1);
  }

  if (strictWarningFailure) {
    console.log("\nStrict mode: warnings are treated as failures.");
    process.exit(1);
  }

  console.log("\n✅ Gallery QA passed (no blocking issues).");
}

main().catch((e) => {
  console.error("Gallery QA failed to run:", e.message);
  process.exit(1);
});
