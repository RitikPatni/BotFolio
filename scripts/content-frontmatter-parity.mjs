#!/usr/bin/env node
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const contentRoot = path.join(repoRoot, "src", "content");

const collections = ["blog", "newsletter", "books", "highlights"];
const canonicalKeys = {
  base: [
    "title",
    "description",
    "date",
    "draft",
    "tags",
    "source_path",
    "source_url",
    "category",
  ],
  booksExtra: [
    "author",
    "genres",
    "published_year",
    "isbn13",
    "isbn10",
    "publisher",
    "openlibrary_url",
  ],
};

const args = new Set(process.argv.slice(2));
const writeMode = args.has("--write") || args.has("--fix");
const jsonMode = args.has("--json") || args.has("--ci");

const stats = {
  scanned: 0,
  changed: 0,
  unchanged: 0,
  parseErrors: 0,
  invalidRecords: 0,
  filesByCollection: Object.fromEntries(collections.map((c) => [c, 0])),
};

const issues = [];
const changedFiles = [];

function extractFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return null;
  return {
    raw: match[1],
    body: content.slice(match[0].length),
  };
}

function unquote(value) {
  const trimmed = value.trim();

  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed.slice(1, -1);
    }
  }

  if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return trimmed.slice(1, -1).replace(/\\'/g, "'");
  }

  return trimmed;
}

function parseFrontmatter(raw) {
  const data = {};
  const lines = raw.split(/\r?\n/);
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i += 1;
      continue;
    }

    const keyMatch = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(.*)$/);
    if (!keyMatch) {
      throw new Error(`Unrecognized frontmatter line: ${line}`);
    }

    const key = keyMatch[1];
    const rawValue = keyMatch[2];

    if (key === "tags" || key === "genres") {
      if (!rawValue || rawValue.trim() === "") {
        const values = [];
        i += 1;
        while (i < lines.length) {
          const listLine = lines[i];
          const listMatch = listLine.match(/^\s*-\s*(.*)$/);
          if (!listMatch) break;
          values.push(unquote(listMatch[1]));
          i += 1;
        }
        data[key] = values;
        continue;
      }

      const inline = rawValue.trim();
      if (inline === "[]") {
        data[key] = [];
      } else if (inline.startsWith("[") && inline.endsWith("]")) {
        const inner = inline.slice(1, -1).trim();
        data[key] = inner
          ? inner
              .split(",")
              .map((v) => unquote(v))
              .map((v) => v.trim())
              .filter(Boolean)
          : [];
      } else {
        data[key] = [unquote(inline)];
      }

      i += 1;
      continue;
    }

    if (key === "draft") {
      const normalized = rawValue.trim().toLowerCase();
      if (normalized === "true") data.draft = true;
      else if (normalized === "false") data.draft = false;
      else data.draft = normalized === "1" || normalized === "yes";
      i += 1;
      continue;
    }

    data[key] = unquote(rawValue);
    i += 1;
  }

  return data;
}

function yamlEscape(value) {
  return JSON.stringify(value ?? "");
}

function normalizeDate(value) {
  const text = String(value ?? "").trim();
  if (!text) return "";
  const d = new Date(text);
  if (!Number.isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10);
  }
  return text;
}

function normalizeList(value) {
  if (!Array.isArray(value)) return [];
  return value.map((t) => String(t).trim()).filter(Boolean);
}

function normalizeRecord(data, collectionName, filePath) {
  const missingRequired = [];
  for (const key of ["title", "description", "date"]) {
    if (!Object.prototype.hasOwnProperty.call(data, key) || String(data[key]).trim() === "") {
      missingRequired.push(key);
    }
  }

  if (missingRequired.length > 0) {
    issues.push(`${filePath}: missing required keys [${missingRequired.join(", ")}]`);
  }

  const normalized = {
    title: String(data.title ?? "").trim(),
    description: String(data.description ?? "").trim(),
    date: normalizeDate(data.date ?? ""),
    draft: Boolean(data.draft ?? false),
    tags: normalizeList(data.tags),
    source_path: String(data.source_path ?? "").trim(),
    source_url: String(data.source_url ?? "").trim(),
    category: String(data.category ?? collectionName).trim() || collectionName,
  };

  if (collectionName === "books") {
    normalized.author = String(data.author ?? "").trim();
    normalized.genres = normalizeList(data.genres);
    normalized.published_year = String(data.published_year ?? "").trim();
    normalized.isbn13 = String(data.isbn13 ?? "").trim();
    normalized.isbn10 = String(data.isbn10 ?? "").trim();
    normalized.publisher = String(data.publisher ?? "").trim();
    normalized.openlibrary_url = String(data.openlibrary_url ?? "").trim();

    if (normalized.published_year && !/^\d{4}$/.test(normalized.published_year)) {
      issues.push(`${filePath}: published_year must be YYYY when present ('${normalized.published_year}')`);
    }
    if (normalized.openlibrary_url && !/^https?:\/\//.test(normalized.openlibrary_url)) {
      issues.push(`${filePath}: openlibrary_url must start with http(s), got '${normalized.openlibrary_url}'`);
    }
  }

  if (normalized.source_url && !/^https?:\/\//.test(normalized.source_url)) {
    issues.push(`${filePath}: source_url must start with http(s), got '${normalized.source_url}'`);
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized.date)) {
    issues.push(`${filePath}: date is not strict YYYY-MM-DD ('${normalized.date}')`);
  }

  return normalized;
}

function pushYamlList(lines, key, values) {
  if (!values || values.length === 0) {
    lines.push(`${key}: []`);
    return;
  }
  lines.push(`${key}:`);
  for (const value of values) {
    lines.push(`  - ${yamlEscape(value)}`);
  }
}

function serializeFrontmatter(record, collectionName) {
  const lines = [
    "---",
    `title: ${yamlEscape(record.title)}`,
    `description: ${yamlEscape(record.description)}`,
    `date: ${yamlEscape(record.date)}`,
    `draft: ${record.draft ? "true" : "false"}`,
  ];

  pushYamlList(lines, "tags", record.tags);

  lines.push(`source_path: ${yamlEscape(record.source_path)}`);
  lines.push(`source_url: ${yamlEscape(record.source_url)}`);
  lines.push(`category: ${yamlEscape(record.category)}`);

  if (collectionName === "books") {
    lines.push(`author: ${yamlEscape(record.author)}`);
    pushYamlList(lines, "genres", record.genres);
    lines.push(`published_year: ${yamlEscape(record.published_year)}`);
    lines.push(`isbn13: ${yamlEscape(record.isbn13)}`);
    lines.push(`isbn10: ${yamlEscape(record.isbn10)}`);
    lines.push(`publisher: ${yamlEscape(record.publisher)}`);
    lines.push(`openlibrary_url: ${yamlEscape(record.openlibrary_url)}`);
  }

  lines.push("---");
  lines.push("");

  return `${lines.join("\n")}`;
}

async function processFile(filePath, collectionName) {
  const original = await fs.readFile(filePath, "utf8");
  stats.scanned += 1;
  stats.filesByCollection[collectionName] += 1;

  const extracted = extractFrontmatter(original);
  if (!extracted) {
    stats.parseErrors += 1;
    issues.push(`${filePath}: missing frontmatter delimiters`);
    return;
  }

  let parsed;
  try {
    parsed = parseFrontmatter(extracted.raw);
  } catch (error) {
    stats.parseErrors += 1;
    issues.push(`${filePath}: parse error: ${error.message}`);
    return;
  }

  const normalized = normalizeRecord(parsed, collectionName, filePath);
  const normalizedFrontmatter = serializeFrontmatter(normalized, collectionName);
  const normalizedContent = `${normalizedFrontmatter}${extracted.body.replace(/^\n*/, "")}`;

  if (normalizedContent !== original) {
    stats.changed += 1;
    changedFiles.push(path.relative(repoRoot, filePath));
    if (writeMode) {
      await fs.writeFile(filePath, normalizedContent, "utf8");
    }
  } else {
    stats.unchanged += 1;
  }
}

async function listMarkdownFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.endsWith(".md"))
    .map((e) => path.join(dir, e.name))
    .sort((a, b) => a.localeCompare(b));
}

async function main() {
  for (const collection of collections) {
    const dir = path.join(contentRoot, collection);
    const files = await listMarkdownFiles(dir);
    for (const filePath of files) {
      await processFile(filePath, collection);
    }
  }

  const report = {
    ok: issues.length === 0,
    mode: writeMode ? "write" : "check",
    stats,
    changed_files: changedFiles,
    issue_count: issues.length,
    issues,
  };

  if (jsonMode) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(
      `Frontmatter parity (${report.mode}) — scanned ${stats.scanned} files | changed ${stats.changed} | unchanged ${stats.unchanged} | parseErrors ${stats.parseErrors}`,
    );
    console.log(`Collections: ${JSON.stringify(stats.filesByCollection)}`);
    if (changedFiles.length > 0) {
      console.log(`\nFiles requiring normalization (${changedFiles.length}):`);
      for (const f of changedFiles) console.log(`- ${f}`);
    }
    if (issues.length > 0) {
      console.log(`\nIssues (${issues.length}):`);
      for (const issue of issues) console.log(`- ${issue}`);
    } else {
      console.log("\n✅ Frontmatter parity check passed.");
    }
  }

  const hasBlocking = issues.length > 0 || (!writeMode && stats.changed > 0);
  if (!writeMode && stats.changed > 0) {
    console.error(
      `\nFound ${stats.changed} files that are not in canonical frontmatter parity. Run with --write to normalize.`,
    );
  }

  process.exit(hasBlocking ? 1 : 0);
}

main().catch((error) => {
  console.error("Frontmatter parity script failed:", error);
  process.exit(1);
});
