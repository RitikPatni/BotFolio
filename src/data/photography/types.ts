export type PhotoMetadata = {
  location?: string;
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
