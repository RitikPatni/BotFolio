// Bird journal data pipeline: eBird import, sticker selection, validation.
// Only names, a stable slug and sighting years leave the eBird export.

export const LIFE_LIST_KEYS = ["slug", "commonName", "scientificName", "years"];
const PHOTO_ROLES = new Set(["featured", "record"]);
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** RFC 4180 CSV → array of objects keyed by the header row. */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  const src = text.replace(/^﻿/, "");
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(field); rows.push(row); row = []; field = "";
    } else field += c;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  const [header, ...body] = rows.filter((r) => r.some((v) => v !== ""));
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ""])));
}

export function slugify(name) {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function yearOf(date) {
  const match = /\b(\d{4})\s*$/.exec(date.trim());
  const year = match ? Number(match[1]) : NaN;
  if (!(year >= 1900 && year <= 2100)) throw new Error(`Cannot read a sighting year from row date`);
  return year;
}

/** eBird life-list CSV → sanitized species records sorted by common name. */
export function importLifeList(csvText) {
  const bySci = new Map();
  for (const row of parseCsv(csvText)) {
    const category = row["Category"]?.trim();
    if (category !== "species") throw new Error(`Unsupported eBird category "${category}" (only species are imported)`);
    const scientificName = row["Scientific Name"]?.trim();
    const commonName = row["Common Name"]?.trim();
    if (!scientificName) throw new Error("Row is missing a scientific name");
    if (!commonName) throw new Error(`Row for ${scientificName} is missing a common name`);
    const year = yearOf(row["Date"] ?? "");
    const entry = bySci.get(scientificName) ?? { slug: slugify(commonName), commonName, scientificName, years: [] };
    if (!entry.years.includes(year)) entry.years.push(year);
    bySci.set(scientificName, entry);
  }
  const list = [...bySci.values()];
  for (const s of list) s.years.sort((a, b) => a - b);
  return list.sort((a, b) => a.commonName.localeCompare(b.commonName, "en"));
}

/** huashu-bird-sticker data/species.csv → stickers for life-list species. Exact scientific name only. */
export function selectStickers(speciesCsvText, lifeList) {
  const bySci = new Map(lifeList.map((s) => [s.scientificName, s]));
  const picked = [];
  for (const row of parseCsv(speciesCsvText)) {
    const species = bySci.get(row.scientific_name);
    if (!species) continue;
    if (row.meets_quality_bar !== "True") continue;
    if (row.sticker_license !== "CC-BY-4.0" || row.sticker_kind !== "ai-illustration") continue;
    if (!/^stickers\/[A-Za-z_/]+\.webp$/.test(row.sticker_file)) continue;
    picked.push({
      slug: species.slug,
      scientificName: species.scientificName,
      file: row.sticker_file.split("/").pop(),
      upstreamPath: row.sticker_file,
      license: "CC-BY-4.0",
      meetsQualityBar: true,
    });
  }
  return picked.sort((a, b) => a.slug.localeCompare(b.slug));
}

/** Returns a list of human-readable errors; empty means valid. */
export function validateJournal({ lifeList, photos, stickers, photoExists, stickerExists, expectedCount }) {
  const errors = [];
  const slugs = new Map();
  const scis = new Set();

  if (lifeList.length !== expectedCount) errors.push(`Life list has ${lifeList.length} species, expected ${expectedCount}`);
  for (const s of lifeList) {
    const extra = Object.keys(s).filter((k) => !LIFE_LIST_KEYS.includes(k));
    if (extra.length) errors.push(`${s.slug}: unexpected field(s) ${extra.join(", ")}`);
    if (!SLUG_RE.test(s.slug ?? "")) errors.push(`Invalid slug "${s.slug}"`);
    if (slugs.has(s.slug)) errors.push(`duplicate slug ${s.slug}`);
    if (scis.has(s.scientificName)) errors.push(`duplicate scientific name ${s.scientificName}`);
    if (!s.commonName || !s.scientificName) errors.push(`${s.slug}: missing common or scientific name`);
    if (!Array.isArray(s.years) || !s.years.length || !s.years.every((y) => Number.isInteger(y) && y >= 1900 && y <= 2100)) {
      errors.push(`${s.slug}: years must be a non-empty list of integer year values`);
    }
    slugs.set(s.slug, s);
    scis.add(s.scientificName);
  }

  const featured = new Map();
  const files = new Set();
  for (const p of photos) {
    const label = `photo ${p.file}`;
    if (!slugs.has(p.slug)) errors.push(`${label}: unknown species slug ${p.slug}`);
    if (!PHOTO_ROLES.has(p.role)) errors.push(`${label}: role must be featured or record`);
    if (!p.alt?.trim()) errors.push(`${label}: alt text required`);
    if (!p.evidence?.trim()) errors.push(`${label}: identification evidence required`);
    if (!Number.isInteger(p.year)) errors.push(`${label}: year must be an integer`);
    if (files.has(p.file)) errors.push(`${label}: listed twice`);
    if (!photoExists(p.file)) errors.push(`${label}: missing photo asset`);
    if (p.role === "featured") {
      if (featured.has(p.slug)) errors.push(`${p.slug}: more than one featured photo`);
      featured.set(p.slug, p);
    }
    files.add(p.file);
  }

  const stickered = new Set();
  for (const st of stickers) {
    const species = slugs.get(st.slug);
    if (!species) errors.push(`sticker ${st.file}: unknown species slug ${st.slug}`);
    else if (species.scientificName !== st.scientificName) errors.push(`sticker ${st.file}: scientific name does not match ${st.slug}`);
    if (st.meetsQualityBar !== true) errors.push(`sticker ${st.file}: fails the upstream quality bar`);
    if (st.license !== "CC-BY-4.0") errors.push(`sticker ${st.file}: license must be CC-BY-4.0`);
    if (stickered.has(st.slug)) errors.push(`${st.slug}: more than one sticker`);
    if (!stickerExists(st.file)) errors.push(`sticker ${st.file}: missing sticker asset`);
    stickered.add(st.slug);
  }
  return errors;
}

/** True when a JPEG's EXIF IFD0 carries a GPS IFD pointer (tag 0x8825). */
export function jpegHasGps(buf) {
  if (buf[0] !== 0xff || buf[1] !== 0xd8) return false;
  let off = 2;
  while (off + 4 <= buf.length && buf[off] === 0xff) {
    const marker = buf[off + 1];
    if (marker === 0xd9 || marker === 0xda) break;
    const len = buf.readUInt16BE(off + 2);
    if (marker === 0xe1 && buf.toString("latin1", off + 4, off + 10) === "Exif\0\0") {
      const t = off + 10;
      const le = buf.toString("latin1", t, t + 2) === "II";
      const u16 = (o) => (le ? buf.readUInt16LE(o) : buf.readUInt16BE(o));
      const u32 = (o) => (le ? buf.readUInt32LE(o) : buf.readUInt32BE(o));
      const ifd = t + u32(t + 4);
      const count = u16(ifd);
      for (let i = 0; i < count; i++) if (u16(ifd + 2 + i * 12) === 0x8825) return true;
    }
    off += 2 + len;
  }
  return false;
}
