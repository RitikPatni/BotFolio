import type { GalleryImage } from "./types";
import { photographyCategories } from "./manifest";
import { photographyCategoryManifest } from "./manifest";

export type { GalleryImage, PhotoMetadata, PortfolioCategory } from "./types";
export { photographyCategories };

export const photographyGalleryData: GalleryImage[] =
  photographyCategoryManifest
    .flatMap((category) => category.items)
    // Stable sort: highest editorial rating first; equal ratings keep
    // manifest/category order so ties stay deterministic.
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
