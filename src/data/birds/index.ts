/* Bird journal data: the sanitized eBird life list joined to explicitly
   identified personal photos and quality-checked sticker illustrations.
   Kept separate from the curated gallery manifest. Regenerate or extend with
   scripts/birds/* and check with `npm run birds:validate`. */
import lifeListData from "./life-list.json";
import photoData from "./photos.json";
import stickerData from "./stickers.json";

export type PhotoRole = "featured" | "record";

export interface LifeListEntry {
  slug: string;
  commonName: string;
  scientificName: string;
  years: number[];
}

export interface BirdPhotoRecord {
  slug: string;
  /** Path under src/assets/photography/. */
  file: string;
  role: PhotoRole;
  alt: string;
  year: number;
  /** Why this frame is attributed to this species (owner-auditable). */
  evidence: string;
}

export interface BirdStickerRecord {
  slug: string;
  scientificName: string;
  /** File under src/assets/birds/stickers/. */
  file: string;
  upstreamPath: string;
  license: "CC-BY-4.0";
  meetsQualityBar: true;
}

export interface BirdPhoto extends BirdPhotoRecord {
  asset: ImageMetadata;
}

export interface BirdSticker extends BirdStickerRecord {
  asset: ImageMetadata;
}

export interface BirdSpecies extends LifeListEntry {
  featured?: BirdPhoto;
  records: BirdPhoto[];
  sticker?: BirdSticker;
}

export const STICKER_CREDIT = {
  project: "huashu-bird-sticker",
  author: "Huashu",
  url: "https://github.com/alchaincyf/huashu-bird-sticker",
  version: "v2.2.0",
  license: "CC BY 4.0",
  licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
} as const;

type AssetModule = { default: ImageMetadata };

const photoAssets = import.meta.glob<AssetModule>(
  "../../assets/photography/**/*.{jpg,jpeg,png,webp,avif}",
  { eager: true },
);
const stickerAssets = import.meta.glob<AssetModule>(
  "../../assets/birds/stickers/*.webp",
  { eager: true },
);

const resolve = (
  modules: Record<string, AssetModule>,
  prefix: string,
  file: string,
): ImageMetadata => {
  const asset = modules[`${prefix}${file}`]?.default;
  if (!asset) throw new Error(`Bird journal: missing asset ${prefix}${file}`);
  return asset;
};

const photos: BirdPhoto[] = (photoData as BirdPhotoRecord[]).map((p) => ({
  ...p,
  asset: resolve(photoAssets, "../../assets/photography/", p.file),
}));

const stickers = new Map<string, BirdSticker>(
  (stickerData as BirdStickerRecord[]).map((s) => [
    s.slug,
    { ...s, asset: resolve(stickerAssets, "../../assets/birds/stickers/", s.file) },
  ]),
);

export const birdSpecies: BirdSpecies[] = (lifeListData as LifeListEntry[]).map(
  (entry) => {
    const own = photos.filter((p) => p.slug === entry.slug);
    const sticker = stickers.get(entry.slug);
    if (sticker && sticker.scientificName !== entry.scientificName) {
      throw new Error(`Bird journal: sticker for ${entry.slug} does not match its scientific name`);
    }
    return {
      ...entry,
      featured: own.find((p) => p.role === "featured"),
      records: own
        .filter((p) => p.role === "record")
        .sort((a, b) => a.year - b.year),
      sticker,
    };
  },
);

export const yearRange = (years: number[]) =>
  years.length > 1 ? `${years[0]}–${years[years.length - 1]}` : String(years[0]);

export const formatYears = (years: number[]) => years.join(", ");
