import type {
  GalleryImage,
  PhotographyCategoryManifestEntry,
  PortfolioCategory,
} from "./types";

import birdsGalleryPartOne from "./birds-part-1.json";
import birdsGalleryPartTwo from "./birds-part-2.json";
import macroGalleryData from "./macro.json";
import wildlifeGalleryData from "./wildlife.json";

const birdsGalleryData = [
  ...(birdsGalleryPartOne as GalleryImage[]),
  ...(birdsGalleryPartTwo as GalleryImage[]),
];

export const photographyCategoryManifest: PhotographyCategoryManifestEntry[] = [
  {
    id: "birds",
    label: "Birds",
    description: "Flight studies, wetlands, and quiet perches.",
    items: birdsGalleryData,
  },
  {
    id: "wildlife",
    label: "Wildlife",
    description: "Encounters from safaris and field trails.",
    items: wildlifeGalleryData as GalleryImage[],
  },
  {
    id: "macro",
    label: "Macro",
    description: "Tiny details and textures up close.",
    items: macroGalleryData as GalleryImage[],
  },
  {
    id: "landscape",
    label: "Landscape",
    description: "Light, atmosphere, and larger scenes.",
    items: [],
  },
  {
    id: "travel",
    label: "Travel",
    description: "Places and moments along the way.",
    items: [],
  },
];

export const photographyCategories: PortfolioCategory[] =
  photographyCategoryManifest.map(({ id, label, description }) => ({
    id,
    label,
    description,
  }));
