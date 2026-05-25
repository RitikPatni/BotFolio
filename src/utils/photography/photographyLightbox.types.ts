export type GalleryLightboxMetadata = {
  date?: string;
  location?: string;
  camera?: string;
  lens?: string;
  focalLength?: string;
  aperture?: string;
  shutterSpeed?: string;
  iso?: string;
  category: string;
  resolution: string;
};

export type GalleryDialogImage = {
  index: number;
  title: string;
  alt: string;
  category: string;
  date: string;
  src: string;
  srcSet: string;
  thumbSrc: string;
  width: number;
  height: number;
  metadata: GalleryLightboxMetadata;
  tags: string[];
};

export type GalleryElements = {
  dialog: HTMLDialogElement;
  lightboxShell: HTMLElement;
  triggers: HTMLElement[];
  imageElement: HTMLImageElement;
  counterElement: HTMLElement;
  categoryElement: HTMLElement;
  titleElement: HTMLElement;
  dateElement: HTMLElement;
  metadataElement: HTMLElement;
  metadataListElement: HTMLElement;
  tagsSectionElement: HTMLElement;
  tagListElement: HTMLElement;
  relatedSectionElement: HTMLElement;
  relatedTitleElement: HTMLElement;
  relatedGridElement: HTMLElement;
  metadataToggle: HTMLButtonElement;
  metadataCloseButton: HTMLButtonElement;
  fullscreenToggle: HTMLButtonElement;
  closeButton: HTMLButtonElement;
  previousButton: HTMLButtonElement;
  nextButton: HTMLButtonElement;
  frameElement: HTMLElement;
};

export function resolveElements(root: HTMLElement): GalleryElements | null {
  const dialog = root.querySelector("[data-gallery-dialog]");
  const lightboxShell = root.querySelector("[data-gallery-shell]");
  const triggers = Array.from(root.querySelectorAll<HTMLElement>("[data-gallery-trigger]"));
  const imageElement = root.querySelector("[data-gallery-image]");
  const counterElement = root.querySelector("[data-gallery-counter]");
  const categoryElement = root.querySelector("[data-gallery-category]");
  const titleElement = root.querySelector("[data-gallery-title]");
  const dateElement = root.querySelector("[data-gallery-date]");
  const metadataElement = root.querySelector("[data-gallery-metadata]");
  const metadataListElement = root.querySelector("[data-gallery-metadata-list]");
  const tagsSectionElement = root.querySelector("[data-gallery-tags-section]");
  const tagListElement = root.querySelector("[data-gallery-tag-list]");
  const relatedSectionElement = root.querySelector("[data-gallery-related]");
  const relatedTitleElement = root.querySelector("[data-gallery-related-title]");
  const relatedGridElement = root.querySelector("[data-gallery-related-grid]");
  const metadataToggle = root.querySelector("[data-gallery-metadata-toggle]");
  const metadataCloseButton = root.querySelector("[data-gallery-metadata-close]");
  const fullscreenToggle = root.querySelector("[data-gallery-fullscreen-toggle]");
  const closeButton = root.querySelector("[data-gallery-close]");
  const previousButton = root.querySelector("[data-gallery-prev]");
  const nextButton = root.querySelector("[data-gallery-next]");
  const frameElement = root.querySelector("[data-gallery-frame]");

  if (
    !(dialog instanceof HTMLDialogElement) ||
    !(lightboxShell instanceof HTMLElement) ||
    !(imageElement instanceof HTMLImageElement) ||
    !(counterElement instanceof HTMLElement) ||
    !(categoryElement instanceof HTMLElement) ||
    !(titleElement instanceof HTMLElement) ||
    !(dateElement instanceof HTMLElement) ||
    !(metadataElement instanceof HTMLElement) ||
    !(metadataListElement instanceof HTMLElement) ||
    !(tagsSectionElement instanceof HTMLElement) ||
    !(tagListElement instanceof HTMLElement) ||
    !(relatedSectionElement instanceof HTMLElement) ||
    !(relatedTitleElement instanceof HTMLElement) ||
    !(relatedGridElement instanceof HTMLElement) ||
    !(metadataToggle instanceof HTMLButtonElement) ||
    !(metadataCloseButton instanceof HTMLButtonElement) ||
    !(fullscreenToggle instanceof HTMLButtonElement) ||
    !(closeButton instanceof HTMLButtonElement) ||
    !(previousButton instanceof HTMLButtonElement) ||
    !(nextButton instanceof HTMLButtonElement) ||
    !(frameElement instanceof HTMLElement)
  ) {
    return null;
  }

  return {
    dialog,
    lightboxShell,
    triggers,
    imageElement,
    counterElement,
    categoryElement,
    titleElement,
    dateElement,
    metadataElement,
    metadataListElement,
    tagsSectionElement,
    tagListElement,
    relatedSectionElement,
    relatedTitleElement,
    relatedGridElement,
    metadataToggle,
    metadataCloseButton,
    fullscreenToggle,
    closeButton,
    previousButton,
    nextButton,
    frameElement,
  };
}
