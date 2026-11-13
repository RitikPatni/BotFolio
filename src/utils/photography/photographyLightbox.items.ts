import { getImage } from "astro:assets";
import type { GalleryImage, PhotoMetadata } from "../../data/photography";
import type {
  GalleryDialogImage,
  GalleryLightboxMetadata,
} from "./photographyLightbox.types";

/* Build-time only: turns gallery frames into the JSON the lightbox reads.
   Shared by /photography and the home contact strip so both viewers show the
   same image sizes, caption and metadata for a frame. */

/* One exposure line from the frame's own EXIF; missing fields are left out,
   never filled in. */
export const exposureOf = (meta?: PhotoMetadata) =>
  [meta?.aperture, meta?.shutterSpeed, meta?.iso != null ? `ISO ${meta.iso}` : undefined]
    .filter(Boolean)
    .join(" | ");

/* Deep-link id (#<slug>): the asset filename without its extension. */
export const frameSlug = (image: GalleryImage) => image.filename.replace(/\.[^.]+$/, "");

const lightboxMetadata = (
  image: GalleryImage,
  categoryLabel: string,
  asset: ImageMetadata,
) =>
  ({
    date: image.date || undefined,
    camera: image.metadata?.camera,
    lens: image.metadata?.lens,
    focalLength: image.metadata?.focalLength,
    aperture: image.metadata?.aperture,
    shutterSpeed: image.metadata?.shutterSpeed,
    iso: image.metadata?.iso ? String(image.metadata.iso) : undefined,
    category: categoryLabel,
    /* images:optimize records the camera resolution before shrinking an
       original; fall back to the file's own size. */
    resolution: image.metadata?.resolution ?? `${asset.width} × ${asset.height}`,
  }) satisfies GalleryLightboxMetadata;

/* `index` is the frame's position in the list handed to the lightbox: the
   viewer pages, counts and links related frames by it. */
export async function toLightboxItem(
  image: GalleryImage,
  categoryLabel: string,
  asset: ImageMetadata,
  index: number,
): Promise<GalleryDialogImage> {
  const [lightboxImage, relatedThumb] = await Promise.all([
    getImage({ src: asset, widths: [960, 1440, 1920, 2560], sizes: "92vw", quality: "high" }),
    getImage({ src: asset, width: 240, quality: "high" }),
  ]);

  return {
    index,
    slug: frameSlug(image),
    title: image.title,
    alt: image.alt,
    category: categoryLabel,
    date: image.date,
    src: lightboxImage.src,
    srcSet: lightboxImage.srcSet.attribute,
    thumbSrc: relatedThumb.src,
    width: Number(lightboxImage.attributes.width),
    height: Number(lightboxImage.attributes.height),
    exposure: exposureOf(image.metadata),
    metadata: lightboxMetadata(image, categoryLabel, asset),
    tags: image.tags,
  } satisfies GalleryDialogImage;
}
