#!/usr/bin/env node

import { fileURLToPath } from "node:url";
import { promises as fs } from "node:fs";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const booksDir = path.join(repoRoot, "src", "content", "books");

const args = new Set(process.argv.slice(2));
const writeMode = args.has("--write") || args.has("--fix");
const jsonMode = args.has("--json") || args.has("--ci");

function extractFrontmatter(content) {
  const m = content.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return null;
  return { raw: m[1], body: content.slice(m[0].length), envelope: m[0] };
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

      const inline = rawValue.trim();
      if (inline === "[]") {
        data[key] = [];
      } else {
        data[key] = [unquote(inline)];
      }
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

function yamlEscape(value) {
  return JSON.stringify(value ?? "");
}

function pushYamlList(lines, key, values) {
  if (!values || values.length === 0) {
    lines.push(`${key}: []`);
    return;
  }
  lines.push(`${key}:`);
  for (const v of values) lines.push(`  - ${yamlEscape(v)}`);
}

function serializeFrontmatter(record) {
  const lines = [
    "---",
    `title: ${yamlEscape(record.title ?? "")}`,
    `description: ${yamlEscape(record.description ?? "")}`,
    `date: ${yamlEscape(record.date ?? "")}`,
    `draft: ${record.draft ? "true" : "false"}`,
  ];

  pushYamlList(lines, "tags", Array.isArray(record.tags) ? record.tags : []);

  lines.push(`source_url: ${yamlEscape(record.source_url ?? "")}`);
  lines.push(`category: ${yamlEscape(record.category ?? "books")}`);

  lines.push(`author: ${yamlEscape(record.author ?? "")}`);
  lines.push(`language: ${yamlEscape(record.language ?? "")}`);
  pushYamlList(lines, "genres", Array.isArray(record.genres) ? record.genres : []);
  lines.push(`published_year: ${yamlEscape(record.published_year ?? "")}`);
  lines.push(`isbn13: ${yamlEscape(record.isbn13 ?? "")}`);
  lines.push(`isbn10: ${yamlEscape(record.isbn10 ?? "")}`);
  lines.push(`publisher: ${yamlEscape(record.publisher ?? "")}`);
  lines.push(`openlibrary_url: ${yamlEscape(record.openlibrary_url ?? "")}`);

  lines.push("---", "");
  return lines.join("\n");
}

function normalizeTitle(s) {
  return String(s ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function scoreCandidate(title, doc) {
  const want = normalizeTitle(title);
  const got = normalizeTitle(doc?.title ?? "");
  if (!want || !got) return -100;

  let score = 0;
  if (want === got) score += 200;
  if (got.startsWith(want) || want.startsWith(got)) score += 60;
  if (got.includes(want) || want.includes(got)) score += 30;

  const wl = want.split(" ").filter(Boolean);
  const gl = new Set(got.split(" ").filter(Boolean));
  const overlap = wl.filter((t) => gl.has(t)).length;
  score += overlap * 8;

  if (doc.first_publish_year) score += 2;
  if (Array.isArray(doc.author_name) && doc.author_name.length) score += 4;
  if (Array.isArray(doc.isbn) && doc.isbn.length) score += 2;

  return score;
}

function pickBestDoc(title, docs) {
  if (!Array.isArray(docs) || docs.length === 0) return null;
  let best = null;
  let bestScore = -999;
  for (const doc of docs) {
    const s = scoreCandidate(title, doc);
    if (s > bestScore) {
      bestScore = s;
      best = doc;
    }
  }
  if (bestScore < 40) return null;
  return best;
}

function cleanGenre(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .replace(/[;:,.]+$/g, "")
    .trim();
}

const HINDI_TITLE_HINTS = [
  "raavan",
  "sita",
  "ishvaku",
  "musafir",
  "kulfi",
  "chaurasi",
  "darbar",
  "baaghi",
  "ballia",
];

function inferLanguageFromRecord(title, doc) {
  const code = Array.isArray(doc?.language) && doc.language.length
    ? String(doc.language[0]).toLowerCase()
    : "";

  if (code === "eng") return "english";
  if (code === "hin") return "hindi";

  const text = normalizeTitle(title);
  if (HINDI_TITLE_HINTS.some((hint) => text.includes(hint))) {
    return "hindi";
  }

  return "english";
}

function extractGenreFromDescription(description) {
  const m = String(description ?? "").match(/#genre\/([a-z0-9-]+)/i);
  if (!m) return [];
  return [m[1].replace(/-/g, " ")];
}

function pickIsbn(isbns, len) {
  if (!Array.isArray(isbns)) return "";
  for (const raw of isbns) {
    const cleaned = String(raw).replace(/[^0-9X]/gi, "");
    if (cleaned.length === len) return cleaned;
  }
  return "";
}

async function searchOpenLibrary(title) {
  const url = `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&limit=12`;
  const res = await fetch(url, {
    headers: { "user-agent": "BotFolioMetadataEnricher/1.0" },
  });
  if (!res.ok) throw new Error(`OpenLibrary search failed (${res.status})`);
  return res.json();
}

async function fetchEditionsByWork(workKey) {
  if (!workKey) return null;
  const url = `https://openlibrary.org${workKey}/editions.json?limit=25`;
  const res = await fetch(url, {
    headers: { "user-agent": "BotFolioMetadataEnricher/1.0" },
  });
  if (!res.ok) return null;
  return res.json();
}

function pickFromEditionData(editionsPayload) {
  const out = { isbn13: "", isbn10: "", publisher: "" };
  const entries = Array.isArray(editionsPayload?.entries) ? editionsPayload.entries : [];
  for (const ed of entries) {
    if (!out.isbn13 && Array.isArray(ed?.isbn_13) && ed.isbn_13.length) {
      out.isbn13 = pickIsbn(ed.isbn_13, 13);
    }
    if (!out.isbn10 && Array.isArray(ed?.isbn_10) && ed.isbn_10.length) {
      out.isbn10 = pickIsbn(ed.isbn_10, 10);
    }
    if (!out.publisher && Array.isArray(ed?.publishers) && ed.publishers.length) {
      out.publisher = String(ed.publishers[0]);
    }
    if (out.isbn13 && out.isbn10 && out.publisher) break;
  }
  return out;
}

async function main() {
  const fileNames = (await fs.readdir(booksDir, { withFileTypes: true }))
    .filter((e) => e.isFile() && e.name.endsWith(".md"))
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b));

  const stats = {
    scanned: 0,
    changed: 0,
    enriched: 0,
    matchedOpenLibrary: 0,
    unmatched: 0,
  };

  const issues = [];
  const changedFiles = [];

  for (const fileName of fileNames) {
    const filePath = path.join(booksDir, fileName);
    const original = await fs.readFile(filePath, "utf8");
    stats.scanned += 1;

    const extracted = extractFrontmatter(original);
    if (!extracted) {
      issues.push(`${fileName}: missing frontmatter delimiters`);
      continue;
    }

    const data = parseFrontmatter(extracted.raw);
    const title = String(data.title ?? "").trim();
    if (!title) {
      issues.push(`${fileName}: missing title`);
      continue;
    }

    let best = null;
    try {
      const payload = await searchOpenLibrary(title);
      best = pickBestDoc(title, payload.docs ?? []);
      if (best) stats.matchedOpenLibrary += 1;
      else stats.unmatched += 1;
    } catch (error) {
      stats.unmatched += 1;
      issues.push(`${fileName}: lookup error (${error.message})`);
    }

    const next = { ...data };

    const nextAuthor = Array.isArray(best?.author_name) ? best.author_name.slice(0, 3).join(", ") : "";
    const nextLanguage = inferLanguageFromRecord(title, best);
    const nextGenres = Array.isArray(best?.subject)
      ? best.subject.map(cleanGenre).filter(Boolean).slice(0, 6)
      : extractGenreFromDescription(data.description);
    const nextPublishedYear = best?.first_publish_year ? String(best.first_publish_year) : "";
    let nextIsbn13 = pickIsbn(best?.isbn, 13);
    let nextIsbn10 = pickIsbn(best?.isbn, 10);
    let nextPublisher = Array.isArray(best?.publisher) && best.publisher.length ? String(best.publisher[0]) : "";
    const nextOpenLibraryUrl = best?.key ? `https://openlibrary.org${best.key}` : "";

    if (best?.key && (!nextIsbn13 || !nextIsbn10 || !nextPublisher)) {
      const editions = await fetchEditionsByWork(best.key);
      const fromEditions = pickFromEditionData(editions);
      if (!nextIsbn13 && fromEditions.isbn13) nextIsbn13 = fromEditions.isbn13;
      if (!nextIsbn10 && fromEditions.isbn10) nextIsbn10 = fromEditions.isbn10;
      if (!nextPublisher && fromEditions.publisher) nextPublisher = fromEditions.publisher;
    }

    if (!String(next.author ?? "").trim() && nextAuthor) next.author = nextAuthor;
    if (!String(next.language ?? "").trim() && nextLanguage) next.language = nextLanguage;
    if ((!Array.isArray(next.genres) || next.genres.length === 0) && nextGenres.length) next.genres = nextGenres;
    if (!String(next.published_year ?? "").trim() && nextPublishedYear) next.published_year = nextPublishedYear;
    if (!String(next.isbn13 ?? "").trim() && nextIsbn13) next.isbn13 = nextIsbn13;
    if (!String(next.isbn10 ?? "").trim() && nextIsbn10) next.isbn10 = nextIsbn10;
    if (!String(next.publisher ?? "").trim() && nextPublisher) next.publisher = nextPublisher;
    if (!String(next.openlibrary_url ?? "").trim() && nextOpenLibraryUrl) next.openlibrary_url = nextOpenLibraryUrl;

    // Ensure keys exist even if still unknown.
    next.author = String(next.author ?? "").trim();
    next.language = String(next.language ?? "").trim().toLowerCase();
    next.genres = Array.isArray(next.genres) ? next.genres.map((g) => String(g).trim()).filter(Boolean) : [];
    next.published_year = String(next.published_year ?? "").trim();
    next.isbn13 = String(next.isbn13 ?? "").trim();
    next.isbn10 = String(next.isbn10 ?? "").trim();
    next.publisher = String(next.publisher ?? "").trim();
    next.openlibrary_url = String(next.openlibrary_url ?? "").trim();

    const nextContent = `${serializeFrontmatter(next)}${extracted.body.replace(/^\n*/, "")}`;
    if (nextContent !== original) {
      stats.changed += 1;
      stats.enriched += 1;
      changedFiles.push(path.relative(repoRoot, filePath));
      if (writeMode) await fs.writeFile(filePath, nextContent, "utf8");
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
    console.log(`Book metadata enrichment (${report.mode}) — scanned ${stats.scanned} | matched ${stats.matchedOpenLibrary} | changed ${stats.changed} | unmatched ${stats.unmatched}`);
    if (changedFiles.length) {
      console.log(`\nFiles updated (${changedFiles.length}):`);
      for (const f of changedFiles) console.log(`- ${f}`);
    }
    if (issues.length) {
      console.log(`\nIssues (${issues.length}):`);
      for (const i of issues) console.log(`- ${i}`);
    }
  }

  const hasBlocking = issues.length > 0 || (!writeMode && stats.changed > 0);
  if (!writeMode && stats.changed > 0) {
    console.error(`\nFound ${stats.changed} files to enrich. Re-run with --write.`);
  }
  process.exit(hasBlocking ? 1 : 0);
}

main().catch((error) => {
  console.error("Book metadata enrichment failed:", error);
  process.exit(1);
});
