// Bird journal data tests. Run: node --test scripts/birds/
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import {
  parseCsv,
  slugify,
  importLifeList,
  selectStickers,
  validateJournal,
  jpegHasGps,
  LIFE_LIST_KEYS,
} from "./lib.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const readJson = (rel) => JSON.parse(readFileSync(path.join(root, rel), "utf8"));

const EBIRD_FIXTURE = [
  "Row #,Taxon Order,Category,Common Name,Scientific Name,Count,Location,S/P,Date,LocID,SubID,Exotic,Countable",
  '1,100,species,Common Kingfisher,Alcedo atthis,2,Home(Hyderabad),IN-TG,21 Feb 2025,L1234567,S7654321,,1',
  '2,101,species,Eurasian Collared-Dove,Streptopelia decaocto,X,"Home, Hyderabad",IN-TG,03 Jan 2024,L1234568,S7654322,,1',
  '3,100,species,Common Kingfisher,Alcedo atthis,1,Home,IN-TG,02 Mar 2023,L1234569,S7654323,,1',
].join("\n");

test("parseCsv handles quoted commas", () => {
  const rows = parseCsv('a,b\n"x, y",2\n');
  assert.deepEqual(rows, [{ a: "x, y", b: "2" }]);
});

test("slugify is stable for eBird hyphenated names", () => {
  assert.equal(slugify("Eurasian Collared-Dove"), "eurasian-collared-dove");
  assert.equal(slugify("Indian Pond-Heron"), "indian-pond-heron");
  assert.equal(slugify("Oriental Magpie-Robin"), "oriental-magpie-robin");
});

test("importLifeList whitelists names, slug and years only", () => {
  const list = importLifeList(EBIRD_FIXTURE);
  assert.equal(list.length, 2);
  for (const entry of list) assert.deepEqual(Object.keys(entry).sort(), [...LIFE_LIST_KEYS].sort());
  const kingfisher = list.find((s) => s.slug === "common-kingfisher");
  assert.deepEqual(kingfisher, {
    slug: "common-kingfisher",
    commonName: "Common Kingfisher",
    scientificName: "Alcedo atthis",
    years: [2023, 2025],
  });
  const json = JSON.stringify(list);
  for (const leaked of ["Hyderabad", "Home", "L1234567", "S7654321", "IN-TG", "Feb", "21 ", "100"]) {
    assert.ok(!json.includes(leaked), `leaked ${leaked}`);
  }
});

test("importLifeList rejects non-species rows and bad dates", () => {
  const header = EBIRD_FIXTURE.split("\n")[0];
  assert.throws(() => importLifeList(`${header}\n1,1,spuh,kingfisher sp.,Alcedinidae sp.,1,Home,IN,01 Jan 2025,L1,S1,,1`), /category/);
  assert.throws(() => importLifeList(`${header}\n1,1,species,Rock Pigeon,Columba livia,1,Home,IN,sometime,L1,S1,,1`), /year/);
  assert.throws(() => importLifeList(`${header}\n1,1,species,Rock Pigeon,,1,Home,IN,01 Jan 2025,L1,S1,,1`), /scientific/i);
});

test("selectStickers matches exact scientific name and quality bar only", () => {
  const lifeList = [
    { slug: "common-kingfisher", commonName: "Common Kingfisher", scientificName: "Alcedo atthis", years: [2025] },
    { slug: "ashy-prinia", commonName: "Ashy Prinia", scientificName: "Prinia socialis", years: [2025] },
    { slug: "shikra", commonName: "Shikra", scientificName: "Tachyspiza badia", years: [2025] },
  ];
  const csv = [
    "scientific_name,name_en,sticker_file,sticker_kind,sticker_license,meets_quality_bar",
    "Alcedo atthis,Common Kingfisher,stickers/C/A/Alcedo_atthis.webp,ai-illustration,CC-BY-4.0,True",
    "Prinia socialis,Ashy Prinia,stickers/P/C/Prinia_socialis.webp,ai-illustration,CC-BY-4.0,False",
    // Same common name, different scientific name: must not match.
    "Accipiter badius,Shikra,stickers/A/A/Accipiter_badius.webp,ai-illustration,CC-BY-4.0,True",
  ].join("\n");
  const picked = selectStickers(csv, lifeList);
  assert.deepEqual(picked.map((s) => s.slug), ["common-kingfisher"]);
  assert.equal(picked[0].file, "Alcedo_atthis.webp");
  assert.equal(picked[0].upstreamPath, "stickers/C/A/Alcedo_atthis.webp");
  assert.equal(picked[0].meetsQualityBar, true);
  assert.equal(picked[0].license, "CC-BY-4.0");
});

const base = () => ({
  lifeList: [
    { slug: "common-kingfisher", commonName: "Common Kingfisher", scientificName: "Alcedo atthis", years: [2025] },
    { slug: "rock-pigeon", commonName: "Rock Pigeon", scientificName: "Columba livia", years: [2024] },
  ],
  photos: [{ slug: "common-kingfisher", file: "birds/k.jpg", role: "featured", alt: "A kingfisher", year: 2025, evidence: "title" }],
  stickers: [{ slug: "rock-pigeon", scientificName: "Columba livia", file: "Columba_livia.webp", upstreamPath: "stickers/x/Columba_livia.webp", license: "CC-BY-4.0", meetsQualityBar: true }],
  photoExists: () => true,
  stickerExists: () => true,
  expectedCount: 2,
});

test("validateJournal accepts a well-formed journal", () => {
  assert.deepEqual(validateJournal(base()), []);
});

test("validateJournal rejects bad references and leaks", () => {
  const cases = [
    [(j) => (j.photos[0].slug = "pied-kingfisher"), /unknown species/],
    [(j) => (j.photos[0].role = "hero"), /role/],
    [(j) => j.photos.push({ ...j.photos[0], file: "birds/k2.jpg" }), /featured/],
    [(j) => (j.photos[0].alt = ""), /alt/],
    [(j) => (j.photoExists = () => false), /missing photo/],
    [(j) => (j.stickers[0].scientificName = "Columba livia domestica"), /scientific/],
    [(j) => (j.stickers[0].meetsQualityBar = false), /quality/],
    [(j) => (j.stickerExists = () => false), /missing sticker/],
    [(j) => j.lifeList.push({ ...j.lifeList[0] }), /duplicate/],
    [(j) => (j.lifeList[1].location = "Home"), /field/],
    [(j) => (j.lifeList[1].years = ["2024-01-03"]), /year/],
    [(j) => (j.expectedCount = 43), /43/],
  ];
  for (const [mutate, pattern] of cases) {
    const journal = base();
    mutate(journal);
    const errors = validateJournal(journal);
    assert.ok(errors.some((e) => pattern.test(e)), `expected ${pattern} in ${JSON.stringify(errors)}`);
  }
});

function jpegWithIfd0Tag(tag) {
  // SOI, APP1 "Exif\0\0", little-endian TIFF with one IFD0 entry.
  const tiff = Buffer.alloc(8 + 2 + 12 + 4);
  tiff.write("II", 0, "latin1");
  tiff.writeUInt16LE(42, 2);
  tiff.writeUInt32LE(8, 4);
  tiff.writeUInt16LE(1, 8);
  tiff.writeUInt16LE(tag, 10);
  tiff.writeUInt16LE(4, 12);
  tiff.writeUInt32LE(1, 14);
  tiff.writeUInt32LE(0, 18);
  const payload = Buffer.concat([Buffer.from("Exif\0\0", "latin1"), tiff]);
  const len = Buffer.alloc(2);
  len.writeUInt16BE(payload.length + 2);
  return Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe1]), len, payload, Buffer.from([0xff, 0xd9])]);
}

test("jpegHasGps detects a GPS IFD pointer", () => {
  assert.equal(jpegHasGps(jpegWithIfd0Tag(0x8825)), true);
  assert.equal(jpegHasGps(jpegWithIfd0Tag(0x0110)), false);
  assert.equal(jpegHasGps(Buffer.from([0xff, 0xd8, 0xff, 0xd9])), false);
});

// ---- Committed data ----

const lifeList = readJson("src/data/birds/life-list.json");
const photos = readJson("src/data/birds/photos.json");
const stickers = readJson("src/data/birds/stickers.json");

test("committed life list has 43 unique, privacy-safe species", () => {
  assert.equal(lifeList.length, 43);
  assert.equal(new Set(lifeList.map((s) => s.slug)).size, 43);
  assert.equal(new Set(lifeList.map((s) => s.scientificName)).size, 43);
  const raw = readFileSync(path.join(root, "src/data/birds/life-list.json"), "utf8");
  assert.doesNotMatch(raw, /\d{4}-\d{2}-\d{2}|\d{1,2} (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/);
  assert.doesNotMatch(raw, /Hyderabad|"Home|location|latitude|longitude|LocID|SubID|\bL\d{5,}|\bS\d{6,}/i);
});

test("committed photo mapping is limited to explicitly identified frames", () => {
  const mapped = photos.map((p) => `${p.file}->${p.slug}`).sort();
  assert.deepEqual(mapped, [
    "birds/common-kingfisher-perch.jpg->common-kingfisher",
    "birds/starling-flight-material.jpg->black-drongo",
  ]);
  for (const generic of ["flamingo-flight", "kingfisher-golden-perch", "kingfisher-takeoff", "bulbul-backlit-perch", "wagtail-thorny-perch", "dove-fanned-tail"]) {
    assert.ok(!photos.some((p) => p.file.includes(generic)), `${generic} must stay unmatched`);
  }
});

test("committed journal validates against real assets", () => {
  const exists = (dir) => (file) => readdirSync(path.join(root, dir, path.dirname(file))).includes(path.basename(file));
  const errors = validateJournal({
    lifeList,
    photos,
    stickers,
    photoExists: exists("src/assets/photography"),
    stickerExists: exists("src/assets/birds/stickers"),
    expectedCount: 43,
  });
  assert.deepEqual(errors, []);
  // Unphotographed species stay in the list.
  const photographed = new Set(photos.map((p) => p.slug));
  assert.ok(lifeList.filter((s) => !photographed.has(s.slug)).length >= 41);
});

test("journal photos carry no GPS EXIF and no raw CSV is committed", () => {
  for (const p of photos) {
    assert.equal(jpegHasGps(readFileSync(path.join(root, "src/assets/photography", p.file))), false, p.file);
  }
  for (const dir of ["src/data/birds", "src/assets/birds", "scripts/birds"]) {
    assert.ok(!readdirSync(path.join(root, dir), { recursive: true }).some((f) => String(f).endsWith(".csv")), dir);
  }
});
