// Standard.site (AT Protocol) identifiers shared by the site and
// scripts/standard-site-publish.mjs. Plain JS so the Node script can import it
// without a build step; both sides must agree on every record key.

/** The account that owns the publication (handle: ritikpatni.me). */
export const STANDARD_SITE_DID = "did:plc:53jkze3ofomdesnodoz5i34y";

/** Fixed record key of the site.standard.publication record. */
export const PUBLICATION_RKEY = "3lwafzkjqm25s";

export const PUBLICATION_URI = `at://${STANDARD_SITE_DID}/site.standard.publication/${PUBLICATION_RKEY}`;

const TID_ALPHABET = "234567abcdefghijklmnopqrstuvwxyz";

/* FNV-1a, 32-bit: a stable, dependency-free hash of the slug. */
function hash32(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

/**
 * Record key for a post's site.standard.document record.
 *
 * The lexicon requires a TID (13 base32-sortable chars: 53 bits of
 * microseconds since the epoch, then a 10-bit clock id). Deriving both from
 * the post's date and slug makes the key the same on every run, so the
 * publish script updates a record instead of duplicating it, and a page can
 * print its own record's AT-URI at build time.
 *
 * @param {string} slug
 * @param {Date | string | number} date
 * @returns {string}
 */
export function documentRkey(slug, date) {
  const ms = new Date(date).getTime();
  if (!Number.isFinite(ms) || ms < 0) {
    throw new Error(`documentRkey: invalid date for "${slug}": ${String(date)}`);
  }
  const h = hash32(slug);
  // The hash spreads posts that share a date across the sub-millisecond digits
  // and the clock id, so same-day posts still get distinct keys.
  const micros = BigInt(ms) * 1000n + BigInt(h % 1000);
  let value = (micros << 10n) | BigInt((h >>> 10) & 0x3ff);
  let out = "";
  for (let i = 0; i < 13; i++) {
    out = TID_ALPHABET[Number(value & 31n)] + out;
    value >>= 5n;
  }
  return out;
}

/**
 * @param {string} slug
 * @param {Date | string | number} date
 */
export const documentUri = (slug, date) =>
  `at://${STANDARD_SITE_DID}/site.standard.document/${documentRkey(slug, date)}`;
