#!/usr/bin/env node
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const booksDir = path.join(repoRoot, "src", "content", "books");

const args = process.argv.slice(2);
const command = args[0];

function parseArgs(rest) {
  const out = {};
  for (let i = 0; i < rest.length; i += 1) {
    const token = rest[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = rest[i + 1];
    if (!next || next.startsWith("--")) {
      out[key] = true;
      continue;
    }
    out[key] = next;
    i += 1;
  }
  return out;
}

function extractFrontmatter(content) {
  const m = content.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return null;
  return { raw: m[1], body: content.slice(m[0].length) };
}

function unquote(value) {
  const trimmed = String(value ?? "").trim();
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
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line.trim()) continue;

    const keyMatch = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(.*)$/);
    if (!keyMatch) continue;

    const key = keyMatch[1];
    const rawValue = keyMatch[2];

    if (key === "tags" || key === "genres") {
      if (!rawValue || rawValue.trim() === "") {
        const list = [];
        i += 1;
        while (i < lines.length) {
          const listMatch = lines[i].match(/^\s*-\s*(.*)$/);
          if (!listMatch) {
            i -= 1;
            break;
          }
          list.push(unquote(listMatch[1]));
          i += 1;
        }
        data[key] = list;
        continue;
      }
      data[key] = rawValue.trim() === "[]" ? [] : [unquote(rawValue)];
      continue;
    }

    if (key === "draft") {
      data.draft = rawValue.trim().toLowerCase() === "true";
      continue;
    }

    data[key] = unquote(rawValue);
  }
  return data;
}

function yamlEscape(v) {
  return JSON.stringify(v ?? "");
}

function pushYamlList(lines, key, values) {
  if (!Array.isArray(values) || values.length === 0) {
    lines.push(`${key}: []`);
    return;
  }
  lines.push(`${key}:`);
  for (const value of values) {
    lines.push(`  - ${yamlEscape(String(value))}`);
  }
}

function serializeFrontmatter(record) {
  const lines = [
    "---",
    `title: ${yamlEscape(record.title ?? "")}`,
    `description: ${yamlEscape(record.description ?? "")}`,
    `date: ${yamlEscape(record.date ?? "")}`,
    `draft: ${record.draft ? "true" : "false"}`,
  ];

  pushYamlList(lines, "tags", record.tags);
  lines.push(`source_path: ${yamlEscape(record.source_path ?? "")}`);
  lines.push(`source_url: ${yamlEscape(record.source_url ?? "")}`);
  lines.push(`category: ${yamlEscape(record.category ?? "books")}`);

  lines.push(`author: ${yamlEscape(record.author ?? "")}`);
  lines.push(`language: ${yamlEscape(record.language ?? "")}`);
  lines.push(`reading_status: ${yamlEscape(record.reading_status ?? "")}`);
  lines.push(`reading_start_date: ${yamlEscape(record.reading_start_date ?? "")}`);
  lines.push(`reading_end_date: ${yamlEscape(record.reading_end_date ?? "")}`);
  pushYamlList(lines, "genres", record.genres);
  lines.push(`published_year: ${yamlEscape(record.published_year ?? "")}`);
  lines.push(`isbn13: ${yamlEscape(record.isbn13 ?? "")}`);
  lines.push(`isbn10: ${yamlEscape(record.isbn10 ?? "")}`);
  lines.push(`publisher: ${yamlEscape(record.publisher ?? "")}`);
  lines.push(`openlibrary_url: ${yamlEscape(record.openlibrary_url ?? "")}`);

  lines.push("---", "");
  return lines.join("\n");
}

function slugifyTitle(title) {
  return String(title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/--+/g, "-");
}

function normalizeDate(s) {
  const t = String(s || "").trim();
  if (!t) return "";
  const m = t.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return "";
  return t;
}

function todayIST() {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(new Date());
}

async function listBooks() {
  const entries = await fs.readdir(booksDir, { withFileTypes: true });
  const out = [];

  for (const e of entries) {
    if (!e.isFile() || !e.name.endsWith(".md")) continue;
    const full = path.join(booksDir, e.name);
    const raw = await fs.readFile(full, "utf8");
    const fm = extractFrontmatter(raw);
    if (!fm) continue;
    const data = parseFrontmatter(fm.raw);
    out.push({
      file: e.name,
      title: data.title || "",
      reading_status: (data.reading_status || "").toLowerCase(),
      reading_start_date: data.reading_start_date || "",
      reading_end_date: data.reading_end_date || "",
    });
  }

  out.sort((a, b) => a.title.localeCompare(b.title));
  return out;
}

async function findBookFileByTitle(title) {
  const targetSlug = slugifyTitle(title);
  const entries = await fs.readdir(booksDir, { withFileTypes: true });

  for (const e of entries) {
    if (!e.isFile() || !e.name.endsWith(".md")) continue;
    if (e.name.replace(/\.md$/, "") === targetSlug) {
      return path.join(booksDir, e.name);
    }
  }

  for (const e of entries) {
    if (!e.isFile() || !e.name.endsWith(".md")) continue;
    const full = path.join(booksDir, e.name);
    const raw = await fs.readFile(full, "utf8");
    const fm = extractFrontmatter(raw);
    if (!fm) continue;
    const data = parseFrontmatter(fm.raw);
    if (String(data.title || "").trim().toLowerCase() === String(title).trim().toLowerCase()) {
      return full;
    }
  }

  return null;
}

async function updateBook(title, updater) {
  const filePath = await findBookFileByTitle(title);
  if (!filePath) throw new Error(`Book not found by title: ${title}`);

  const original = await fs.readFile(filePath, "utf8");
  const extracted = extractFrontmatter(original);
  if (!extracted) throw new Error(`Missing frontmatter: ${filePath}`);

  const data = parseFrontmatter(extracted.raw);
  const next = updater({ ...data });

  next.language = String(next.language || "").toLowerCase();
  next.reading_status = String(next.reading_status || "").toLowerCase();

  const rewritten = `${serializeFrontmatter(next)}${extracted.body.replace(/^\n*/, "")}`;
  await fs.writeFile(filePath, rewritten, "utf8");

  return { filePath, title: next.title || title, next };
}

async function appendLogEntry(title, note) {
  const filePath = await findBookFileByTitle(title);
  if (!filePath) throw new Error(`Book not found by title: ${title}`);

  const original = await fs.readFile(filePath, "utf8");
  const istDate = todayIST();
  const entry = `- ${istDate}: ${note}`;

  let updated;
  if (/\n##\s*Reading Log\s*\n/i.test(original)) {
    updated = original.replace(/(\n##\s*Reading Log\s*\n)/i, `$1${entry}\n`);
  } else {
    const suffix = original.endsWith("\n") ? "" : "\n";
    updated = `${original}${suffix}\n## Reading Log\n${entry}\n`;
  }

  await fs.writeFile(filePath, updated, "utf8");
  return { filePath, entry };
}

async function main() {
  if (!command || command === "help" || command === "--help") {
    console.log(`Usage:
  node scripts/books-reading-log.mjs status --title "Book Title" --state currently-reading|completed|to-read|paused|dropped [--start YYYY-MM-DD] [--end YYYY-MM-DD]
  node scripts/books-reading-log.mjs log --title "Book Title" --note "your note"
  node scripts/books-reading-log.mjs current
  node scripts/books-reading-log.mjs list`);
    process.exit(0);
  }

  if (command === "list") {
    const rows = await listBooks();
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
  }

  if (command === "current") {
    const rows = await listBooks();
    const current = rows.filter((r) => r.reading_status === "currently-reading");
    console.log(JSON.stringify(current, null, 2));
    process.exit(0);
  }

  if (command === "status") {
    const a = parseArgs(args.slice(1));
    const title = String(a.title || "").trim();
    const state = String(a.state || "").trim().toLowerCase();
    const start = normalizeDate(a.start || "");
    const end = normalizeDate(a.end || "");

    if (!title) throw new Error("Missing --title");
    if (!["to-read", "currently-reading", "completed", "paused", "dropped"].includes(state)) {
      throw new Error("--state must be one of to-read|currently-reading|completed|paused|dropped");
    }

    const result = await updateBook(title, (next) => {
      next.reading_status = state;

      if (state === "currently-reading") {
        next.reading_start_date = start || next.reading_start_date || todayIST();
        if (!a.end) next.reading_end_date = "";
      }

      if (state === "completed") {
        if (start) next.reading_start_date = start;
        next.reading_end_date = end || todayIST();
      }

      if (state === "to-read") {
        if (start) next.reading_start_date = start;
        if (end) next.reading_end_date = end;
      }

      if (state === "paused" || state === "dropped") {
        if (start) next.reading_start_date = start;
        if (end) next.reading_end_date = end;
      }

      return next;
    });

    console.log(JSON.stringify({
      ok: true,
      action: "status",
      title: result.title,
      file: path.relative(repoRoot, result.filePath),
      reading_status: result.next.reading_status,
      reading_start_date: result.next.reading_start_date,
      reading_end_date: result.next.reading_end_date,
    }, null, 2));
    process.exit(0);
  }

  if (command === "log") {
    const a = parseArgs(args.slice(1));
    const title = String(a.title || "").trim();
    const note = String(a.note || "").trim();

    if (!title) throw new Error("Missing --title");
    if (!note) throw new Error("Missing --note");

    const result = await appendLogEntry(title, note);
    console.log(JSON.stringify({
      ok: true,
      action: "log",
      file: path.relative(repoRoot, result.filePath),
      entry: result.entry,
    }, null, 2));
    process.exit(0);
  }

  throw new Error(`Unknown command: ${command}`);
}

main().catch((error) => {
  console.error(`books-reading-log failed: ${error.message}`);
  process.exit(1);
});
