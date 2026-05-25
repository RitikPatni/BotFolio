#!/usr/bin/env node
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const booksDir = path.join(repoRoot, "src", "content", "books");

const args = new Set(process.argv.slice(2));
const writeMode = args.has("--write") || args.has("--fix");
const jsonMode = args.has("--json") || args.has("--ci");

const COVER_BY_SLUG = {
  "a-game-of-thrones": "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1562726234i/13496.jpg",
  "big-magic": "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1451446242i/24453082.jpg",
  "book-the-white-tiger": "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1710937569i/1768603.jpg",
  "house-of-earth-and-blood-crescent-city-1": "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1559142847i/44778083.jpg",
  "make-time-how-to-focus-on-what-matters-every-day": "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1524067121i/37880811.jpg",
  "man-s-search-for-meaning": "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1535419394i/4069.jpg",
  "moonwalking-with-einstein-the-art-and-science-of-remembering-everything": "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1630575238i/6346975.jpg",
  "outliers-the-story-of-success": "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1344266315i/3228917.jpg",
  "weapons-of-math-destruction-how-big-data-increases-inequality-and-threatens-democracy": "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1456091964i/28186015.jpg",
  "why-we-sleep-unlocking-the-power-of-sleep-and-dreams": "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1527506265i/36709369.jpg"
};

function classifyUrl(url) {
  if (!url) return "missing";
  if (url.includes("blank-133x176")) return "placeholder";
  if (url.includes("goodreads.com") || url.includes("gr-assets.com") || url.includes("m.media-amazon.com/images/S/compressed.photo.goodreads.com/")) return "goodreads";
  return "non_goodreads";
}

function parseFrontmatter(content) {
  const m = content.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return null;
  const frontmatter = m[1];
  const body = content.slice(m[0].length);
  const titleMatch = frontmatter.match(/^title:\s*"([^"]+)"\s*$/m);
  const title = titleMatch ? titleMatch[1] : "Book";
  return { frontmatter, body, title, envelope: m[0] };
}

function extractImageLineInfo(body) {
  const lines = body.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line.startsWith("![")) continue;
    const urls = [...line.matchAll(/https?:\/\/[^)\s]+/g)].map((m) => m[0]);
    const url = urls.length ? urls[urls.length - 1] : "";
    return { index: i, originalLine: lines[i], url };
  }
  return null;
}

function buildImageLine(title, url) {
  return `![${title} Cover Art](${url})`;
}

async function main() {
  const entries = (await fs.readdir(booksDir, { withFileTypes: true }))
    .filter((e) => e.isFile() && e.name.endsWith(".md"))
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b));

  const stats = {
    scanned: 0,
    changed: 0,
    unchanged: 0,
    autoFixed: 0,
    missingMap: 0,
    infos: 0
  };

  const changedFiles = [];
  const issues = [];
  const infos = [];

  for (const fileName of entries) {
    const slug = fileName.replace(/\.md$/, "");
    const filePath = path.join(booksDir, fileName);
    const original = await fs.readFile(filePath, "utf8");
    stats.scanned += 1;

    const parsed = parseFrontmatter(original);
    if (!parsed) {
      issues.push(`${fileName}: missing frontmatter delimiters`);
      continue;
    }

    const imageInfo = extractImageLineInfo(parsed.body);
    const currentUrl = imageInfo?.url ?? "";
    const currentState = classifyUrl(currentUrl);
    const mappedUrl = COVER_BY_SLUG[slug] ?? "";

    let nextBody = parsed.body;
    let changed = false;

    if ((currentState === "missing" || currentState === "non_goodreads" || (currentState === "placeholder" && mappedUrl)) && mappedUrl) {
      const nextLine = buildImageLine(parsed.title, mappedUrl);
      const bodyLines = parsed.body.split(/\r?\n/);
      if (imageInfo) {
        bodyLines[imageInfo.index] = nextLine;
      } else {
        bodyLines.unshift(nextLine, "");
      }
      nextBody = bodyLines.join("\n");
      changed = nextBody !== parsed.body;
      if (changed) stats.autoFixed += 1;
    }

    if (currentState === "placeholder" && !mappedUrl) {
      stats.infos += 1;
      infos.push(`${fileName}: Goodreads placeholder image retained (no real cover available yet)`);
    }

    if ((currentState === "missing" || currentState === "non_goodreads") && !mappedUrl) {
      stats.missingMap += 1;
      issues.push(`${fileName}: ${currentState} cover and no mapping found in script`);
    }

    const nextFull = `${parsed.envelope}${nextBody.replace(/^\n*/, "")}`;
    if (nextFull !== original) {
      stats.changed += 1;
      changedFiles.push(path.relative(repoRoot, filePath));
      if (writeMode) {
        await fs.writeFile(filePath, nextFull, "utf8");
      }
    } else {
      stats.unchanged += 1;
    }
  }

  const report = {
    ok: issues.length === 0 && (writeMode || stats.changed === 0),
    mode: writeMode ? "write" : "check",
    stats,
    changed_files: changedFiles,
    issue_count: issues.length,
    info_count: infos.length,
    issues,
    infos
  };

  if (jsonMode) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(`Goodreads cover parity (${report.mode}) — scanned ${stats.scanned} | changed ${stats.changed} | autoFixed ${stats.autoFixed} | missingMap ${stats.missingMap}`);
    if (changedFiles.length) {
      console.log(`\nFiles requiring sync (${changedFiles.length}):`);
      for (const f of changedFiles) console.log(`- ${f}`);
    }
    if (infos.length) {
      console.log(`\nInfo (${infos.length}):`);
      for (const msg of infos) console.log(`- ${msg}`);
    }
    if (issues.length) {
      console.log(`\nIssues (${issues.length}):`);
      for (const issue of issues) console.log(`- ${issue}`);
    } else {
      console.log("\n✅ Goodreads cover parity check passed.");
    }
  }

  const hasBlocking = issues.length > 0 || (!writeMode && stats.changed > 0);
  if (!writeMode && stats.changed > 0) {
    console.error(`\nFound ${stats.changed} files needing Goodreads cover normalization. Run with --write.`);
  }

  process.exit(hasBlocking ? 1 : 0);
}

main().catch((error) => {
  console.error("Goodreads cover parity script failed:", error);
  process.exit(1);
});
