import type { CollectionEntry } from "astro:content";

export type HighlightSourceType =
  | "readwise-books"
  | "readwise-articles"
  | "readwise-tweets";

export const HIGHLIGHT_SOURCE_LABELS: Record<HighlightSourceType, string> = {
  "readwise-books": "Book notes",
  "readwise-articles": "Articles",
  "readwise-tweets": "Tweets",
};

const IMAGE_PATTERN = /!\[[^\]]*\]\(([^)]+)\)/;
const DEVENAGARI_PATTERN = /[\u0900-\u097F]/;
const BOOK_DESCRIPTION_NOISE = [
  /^Genre::/i,
  /^Author:/i,
  /^👀\s*Next Assessment Date::/i,
];

const normalizeWhitespace = (value: string) =>
  value.replace(/\s+/g, " ").trim();

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const extractSection = (body: string, heading: string) => {
  const pattern = new RegExp(
    `^## ${escapeRegExp(heading)}\\n\\n([\\s\\S]*?)(?=\\n## |$)`,
    "m",
  );
  return body.match(pattern)?.[1].trim() ?? "";
};

const parseMetadataSection = (body: string) => {
  const section = extractSection(body, "Metadata");
  const metadata = new Map<string, string>();

  section.split("\n").forEach((line) => {
    const match = line.match(/^-\s+([^:]+):\s*(.+)$/);
    if (!match) {
      return;
    }

    metadata.set(match[1].trim().toLowerCase(), match[2].trim());
  });

  return metadata;
};

const parseHighlightBlocks = (body: string) => {
  const section = extractSection(body, "Highlights");
  const lines = section.split("\n");
  const blocks: string[] = [];
  let current: string[] = [];

  const flush = () => {
    const next = current.join("\n").trim();
    if (next) {
      blocks.push(next);
    }
    current = [];
  };

  lines.forEach((line) => {
    if (/^-\s/.test(line)) {
      flush();
      current.push(line);
      return;
    }

    if (!current.length) {
      return;
    }

    if (/^\s{2,}\S/.test(line) || line === "") {
      current.push(line);
      return;
    }

    flush();
  });

  flush();

  return blocks;
};

const stripMarkdown = (value: string) =>
  normalizeWhitespace(
    value
      .replace(/^-[\s]*/, "")
      .replace(/!\[[^\]]*\]\(([^)]+)\)/g, "")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
      .replace(/https?:\/\/\S+/g, "")
      .replace(/[_*`>#]/g, " ")
      .replace(/\(\s*\)/g, " "),
  );

const cleanAuthor = (value: string) => {
  const trimmed = value.replace(/^Author:\s*/i, "").trim();
  if (!trimmed.includes("/")) {
    return trimmed;
  }

  const parts = trimmed
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.at(-1) ?? trimmed;
};

export const extractCoverImage = (body: string) =>
  body.match(IMAGE_PATTERN)?.[1] ?? "";

export const normalizeBookDescription = (description: string) => {
  const trimmed = description.trim();
  if (
    !trimmed ||
    BOOK_DESCRIPTION_NOISE.some((pattern) => pattern.test(trimmed))
  ) {
    return "";
  }
  return trimmed;
};

export const getHighlightMeta = (item: CollectionEntry<"highlights">) => {
  const metadata = parseMetadataSection(item.body);
  const blocks = parseHighlightBlocks(item.body);
  const preview = blocks.length ? stripMarkdown(blocks[0]) : "";
  const author = cleanAuthor(
    metadata.get("author") || item.data.description || "Unknown source",
  );
  const sourceUrl = metadata.get("url") || item.data.source_url || "";
  const sourceType = (item.data.category ||
    "readwise-articles") as HighlightSourceType;
  const language = DEVENAGARI_PATTERN.test(`${item.data.title} ${preview}`)
    ? "hindi"
    : "english";

  return {
    author,
    coverImage: extractCoverImage(item.body),
    highlightCount: blocks.length,
    language,
    preview,
    sourceType,
    sourceLabel: HIGHLIGHT_SOURCE_LABELS[sourceType] ?? "Highlights",
    sourceUrl,
  };
};
