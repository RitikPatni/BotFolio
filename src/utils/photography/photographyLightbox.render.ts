import type { GalleryDialogImage, GalleryElements, GalleryLightboxMetadata } from "./photographyLightbox.types";

export type LightboxRenderState = {
  activeIndex: number;
  activeTag: string | null;
};

type RenderContext = {
  images: GalleryDialogImage[];
  elements: GalleryElements;
  state: LightboxRenderState;
};

export function createLightboxRenderer({ images, elements, state }: RenderContext) {
  const {
    imageElement,
    counterElement,
    categoryElement,
    titleElement,
    dateElement,
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
      ["Location", metadata.location],
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

  const renderImage = (index: number) => {
    const image = images[index];

    if (!image) {
      return;
    }

    state.activeIndex = index;

    // Avoid the "last image lingers then refreshes" flash: fade the current
    // image out, then only swap metadata + reveal once the new source is ready.
    const swapIn = () => {
      counterElement.textContent = `${index + 1} / ${images.length}`;
      categoryElement.textContent = image.category;
      titleElement.textContent = image.title;
      dateElement.hidden = !image.date;
      dateElement.textContent = image.date || "";
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
    };

    imageElement.classList.add("is-swapping");

    // Point the element at the new source first.
    imageElement.src = image.src;
    imageElement.srcset = image.srcSet;
    imageElement.sizes = "(max-width: 60rem) 100vw, 75vw";
    imageElement.width = image.width;
    imageElement.height = image.height;
    imageElement.alt = image.alt;

    // If the new source is already decoded (cached), swap metadata immediately.
    // Otherwise wait for load so the stale frame never paints.
    if (imageElement.complete && imageElement.naturalWidth > 0) {
      swapIn();
    } else {
      const onReady = () => {
        imageElement.removeEventListener("load", onReady);
        imageElement.removeEventListener("error", onReady);
        swapIn();
      };
      imageElement.addEventListener("load", onReady);
      imageElement.addEventListener("error", onReady);
    }
  };

  return { renderImage };
}
