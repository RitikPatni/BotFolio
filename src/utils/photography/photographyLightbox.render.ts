import type { GalleryDialogImage, GalleryElements, GalleryLightboxMetadata } from "./photographyLightbox.types";

/* Matches the getImage() sizes in pages/photography/index.astro. */
const LIGHTBOX_SIZES = "92vw";

export type LightboxRenderState = {
  activeIndex: number;
  activeTag: string | null;
};

type RenderContext = {
  images: GalleryDialogImage[];
  elements: GalleryElements;
  state: LightboxRenderState;
  onImageState?: (state: "loading" | "loaded" | "error") => void;
};

export function createLightboxRenderer({
  images,
  elements,
  state,
  onImageState,
}: RenderContext) {
  const {
    imageElement,
    counterElement,
    titleElement,
    captionMetaElement,
    metadataListElement,
    tagsSectionElement,
    tagListElement,
    relatedSectionElement,
    relatedTitleElement,
    relatedGridElement,
    previousButton,
    nextButton,
  } = elements;

  const renderMetadata = (metadata: GalleryLightboxMetadata) => {
    metadataListElement.replaceChildren();

    const megapixels = computeMegapixels(metadata.resolution);
    const resolutionValue = megapixels
      ? `${metadata.resolution} · ${megapixels}`
      : metadata.resolution;

    const formattedDate = metadata.date
      ? formatGalleryDate(metadata.date)
      : undefined;

    const entries = [
      ["Date", formattedDate],
      ["Camera", metadata.camera],
      ["Lens", metadata.lens],
      ["Focal length", metadata.focalLength],
      ["Aperture", metadata.aperture],
      ["Shutter", metadata.shutterSpeed],
      ["ISO", metadata.iso],
      ["Category", metadata.category],
      ["Resolution", resolutionValue],
    ] as const;

    entries.forEach(([label, value]) => {
      if (!value) {
        return;
      }

      const term = document.createElement("dt");
      term.textContent = label;

      const description = document.createElement("dd");
      description.textContent = value;

      metadataListElement.append(term, description);
    });
  };

  const formatGalleryDate = (iso: string): string => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
      return iso;
    }
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const computeMegapixels = (resolution: string): string | undefined => {
    const match = resolution.match(/(\d+)\s*[×x]\s*(\d+)/i);
    if (!match) {
      return undefined;
    }
    const width = Number(match[1]);
    const height = Number(match[2]);
    if (!width || !height) {
      return undefined;
    }
    return `${((width * height) / 1_000_000).toFixed(1)} MP`;
  };

  /* Journal caption under the title: exposure line, then date · camera · lens.
     Only the frame's own fields — anything missing is left out, never filled. */
  const renderCaption = (image: GalleryDialogImage) => {
    const lines = [
      image.exposure ? image.exposure.split(" · ") : [],
      [
        image.date ? formatGalleryDate(image.date) : undefined,
        image.metadata.camera,
        image.metadata.lens,
      ].filter((part): part is string => Boolean(part)),
    ].filter((parts) => parts.length > 0);

    /* A word joiner after each hyphen keeps "F5.6-6.3" and "200-600mm" whole
       (U+2011 would be cleaner but Plex Mono has no glyph for it); a long
       part can still wrap at its spaces. */
    captionMetaElement.replaceChildren(
      ...lines.map((parts) => {
        const line = document.createElement("span");
        line.className = "photography__lightbox-caption-line";
        const list = document.createElement("span");
        list.className = "photography__lightbox-caption-parts";
        list.append(
          ...parts.map((text) => {
            const part = document.createElement("span");
            part.className = "photography__lightbox-caption-part";
            part.textContent = text.replaceAll("-", "-\u2060");
            return part;
          }),
        );
        line.append(list);
        return line;
      }),
    );
  };

  /* Warm the cache for the frames either side so prev/next swap instantly. */
  const preloaded = new Set<number>();
  const preloadNeighbors = (index: number) => {
    [index - 1, index + 1].forEach((offset) => {
      const neighborIndex = (offset + images.length) % images.length;
      const neighbor = images[neighborIndex];

      if (!neighbor || preloaded.has(neighborIndex)) {
        return;
      }

      preloaded.add(neighborIndex);
      const preload = new Image();
      preload.decoding = "async";
      preload.sizes = LIGHTBOX_SIZES;
      preload.srcset = neighbor.srcSet;
      preload.src = neighbor.src;
    });
  };

  const clearRelated = () => {
    state.activeTag = null;
    relatedSectionElement.hidden = true;
    relatedTitleElement.textContent = "";
    relatedGridElement.replaceChildren();
  };

  const renderRelated = (tag: string) => {
    const related = images
      .filter((item) => item.index !== state.activeIndex && item.tags.includes(tag))
      .slice(0, 6);

    state.activeTag = tag;
    relatedGridElement.replaceChildren();

    if (related.length === 0) {
      relatedSectionElement.hidden = true;
      relatedTitleElement.textContent = "";
      return;
    }

    relatedTitleElement.textContent = `More with ${tag}`;
    relatedSectionElement.hidden = false;

    related.forEach((item) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "photography__related-item";
      button.setAttribute("aria-label", `Open ${item.title}`);

      const image = document.createElement("img");
      image.className = "photography__related-image";
      image.src = item.thumbSrc;
      image.alt = "";
      image.decoding = "async";
      image.loading = "lazy";

      const label = document.createElement("span");
      label.className = "photography__related-label";
      label.textContent = item.title;

      button.append(image, label);
      button.addEventListener("click", () => {
        renderImage(item.index);
      });
      relatedGridElement.append(button);
    });
  };

  const renderTags = (tags: string[]) => {
    tagListElement.replaceChildren();

    if (tags.length === 0) {
      tagsSectionElement.hidden = true;
      clearRelated();
      return;
    }

    tagsSectionElement.hidden = false;

    tags.forEach((tag) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "photography__metadata-tag";
      button.textContent = tag;
      button.setAttribute("aria-pressed", String(state.activeTag === tag));
      button.addEventListener("click", () => {
        if (state.activeTag === tag) {
          clearRelated();
          renderTags(tags);
          return;
        }

        renderRelated(tag);
        renderTags(tags);
      });
      tagListElement.append(button);
    });
  };

  let currentRequest: symbol | undefined;

  const renderImage = (index: number) => {
    const image = images[index];

    if (!image) {
      return;
    }

    state.activeIndex = index;
    const requestToken = Symbol("gallery-image-request");
    currentRequest = requestToken;

    // Avoid the "last image lingers then refreshes" flash: fade the current
    // image out, then only swap metadata + reveal once the new source is ready.
    const swapIn = () => {
      if (currentRequest !== requestToken) {
        return;
      }

      counterElement.textContent = `${index + 1} / ${images.length}`;
      titleElement.textContent = image.title;
      renderCaption(image);
      renderMetadata(image.metadata);
      renderTags(image.tags);

      if (state.activeTag && image.tags.includes(state.activeTag)) {
        renderRelated(state.activeTag);
      } else {
        clearRelated();
        renderTags(image.tags);
      }

      previousButton.disabled = images.length <= 1;
      nextButton.disabled = images.length <= 1;

      imageElement.classList.remove("is-swapping");
      preloadNeighbors(index);
    };

    onImageState?.("loading");
    imageElement.classList.add("is-swapping");

    // Point the element at the new source first.
    imageElement.src = image.src;
    imageElement.srcset = image.srcSet;
    imageElement.sizes = LIGHTBOX_SIZES;
    imageElement.width = image.width;
    imageElement.height = image.height;
    imageElement.alt = image.alt;

    // If the new source is already decoded (cached), swap metadata immediately.
    // Otherwise wait for load so the stale frame never paints.
    if (imageElement.complete && imageElement.naturalWidth > 0) {
      swapIn();
      onImageState?.("loaded");
    } else {
      const onReady = (event: Event) => {
        imageElement.removeEventListener("load", onReady);
        imageElement.removeEventListener("error", onReady);

        if (currentRequest !== requestToken) {
          return;
        }

        swapIn();
        onImageState?.(event.type === "error" ? "error" : "loaded");
      };
      imageElement.addEventListener("load", onReady);
      imageElement.addEventListener("error", onReady);
    }
  };

  return { renderImage };
}
