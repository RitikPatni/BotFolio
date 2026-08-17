const normalizeWhitespace = (value: string) =>
  value.replace(/\s+/g, " ").trim();

export const stripMarkdown = (value: string): string =>
  normalizeWhitespace(
    (value || "")
      .replace(/!\[[^\]]*\]\([^)]+\)/g, "") // images
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // links -> text
      .replace(/\[([^\]]+)\]\(?[^)]*\)?/g, "$1") // links with missing/partial paren
      .replace(/https?:\/\/\S+/g, "") // bare urls
      .replace(/^#{1,6}\s+/gm, "") // heading hashes
      .replace(/[📚😃✨⭐🔥💡🚀✅❌⚠️📝📖🔗👀]/gu, "") // emoji heading markers
      .replace(/\b(To Read|To Watch|Notes?|Links?|Resources?)\b\s*/gi, "") // leftover heading words
      .replace(/[*_~`>#]/g, " "), // residual markdown punctuation
  );

export const excerpt = (value: string, max = 160): string => {
  const clean = stripMarkdown(value || "");
  if (clean.length <= max) {
    return clean;
  }

  const slice = clean.slice(0, max);
  const lastSpace = slice.lastIndexOf(" ");
  const cut = lastSpace > 40 ? lastSpace : max;

  return `${clean.slice(0, cut).trimEnd()}…`;
};
