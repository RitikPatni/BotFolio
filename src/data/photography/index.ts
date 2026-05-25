import type { GalleryImage } from "./types";
import { photographyCategories } from "./manifest";
import { photographyCategoryManifest } from "./manifest";

export type { GalleryImage, PhotoMetadata, PortfolioCategory } from "./types";
export { photographyCategories };

export const photographyGalleryData: GalleryImage[] =
  photographyCategoryManifest.flatMap((category) => category.items);
