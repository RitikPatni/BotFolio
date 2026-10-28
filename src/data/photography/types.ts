export type PhotoMetadata = {
  camera?: string;
  lens?: string;
  focalLength?: string;
  aperture?: string;
  shutterSpeed?: string;
  iso?: string | number;
};

export type GalleryImage = {
  filename: string;
  title: string;
  category: string;
  tags: string[];
  alt: string;
  date: string;
  /**
   * Editorial rating (1-5), from the 2026-10-28 three-judge blind audit.
   * Drives ordering: the best frames surface first on the home page and in
   * each gallery section. Unrated entries sink to the end.
   */
  rating?: number;
  metadata?: PhotoMetadata;
};

export type PortfolioCategory = {
  id: string;
  label: string;
  description: string;
};

export type PhotographyCategoryManifestEntry = PortfolioCategory & {
  items: GalleryImage[];
};
