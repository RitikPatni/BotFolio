import { createLightboxRenderer } from "./photographyLightbox.render";
import {
  resolveElements,
  type GalleryDialogImage,
} from "./photographyLightbox.types";

export function initPhotographyLightbox() {
  const root = document.querySelector<HTMLElement>("[data-gallery-root]");
  const dataElement = document.getElementById("photographyGalleryData");

  if (!root || !dataElement) {
    return;
  }

  const images = JSON.parse(
    dataElement.textContent || "[]",
  ) as GalleryDialogImage[];

  if (images.length === 0) {
    return;
  }

  const elements = resolveElements(root);

  if (!elements) {
    return;
  }

  const {
    dialog,
    lightboxShell,
    triggers,
    metadataElement,
    metadataToggle,
    metadataCloseButton,
    metadataScrim,
    fullscreenToggle,
    closeButton,
    previousButton,
    nextButton,
    frameElement,
  } = elements;

  const state = {
    activeIndex: 0,
    activeTag: null as string | null,
  };
  let lastTrigger: HTMLElement | null = null;
  let chromeTimer: number | null = null;

  const isFullscreenActive = () => document.fullscreenElement === lightboxShell;

  const clearChromeTimer = () => {
    if (chromeTimer !== null) {
      window.clearTimeout(chromeTimer);
      chromeTimer = null;
    }
  };

  const setChromeVisibility = (isVisible: boolean) => {
    lightboxShell.dataset.uiVisible = String(isVisible);
  };

  const scheduleChromeHide = () => {
    clearChromeTimer();

    if (!isFullscreenActive() || !metadataElement.classList.contains('is-visible')) {
      setChromeVisibility(true);
      return;
    }

    chromeTimer = window.setTimeout(() => {
      setChromeVisibility(false);
    }, 2200);
  };

  const revealChrome = () => {
    setChromeVisibility(true);
    scheduleChromeHide();
  };

  const updateFullscreenButton = () => {
    const isFullscreen = isFullscreenActive();
    fullscreenToggle.setAttribute("aria-pressed", String(isFullscreen));
    const label = isFullscreen ? "Exit full screen" : "Full screen";
    fullscreenToggle.setAttribute("aria-label", label);
    fullscreenToggle.dataset.tooltip = label;
  };

  const { renderImage } = createLightboxRenderer({ images, elements, state });

  const setMetadataVisibility = (isVisible: boolean) => {
    metadataElement.classList.toggle('is-visible', isVisible);
    metadataScrim.classList.toggle('is-visible', isVisible);
    lightboxShell.dataset.metadataVisible = String(isVisible);
    metadataToggle.setAttribute("aria-expanded", String(isVisible));
    const label = isVisible ? "Hide metadata" : "Show metadata";
    metadataToggle.setAttribute("aria-label", label);
    metadataToggle.dataset.tooltip = label;

    if (isVisible) {
      revealChrome();
      return;
    }

    scheduleChromeHide();
  };

  const openDialog = (index: number, trigger: HTMLElement | null) => {
    lastTrigger = trigger instanceof HTMLElement ? trigger : null;
    renderImage(index);
    setChromeVisibility(true);
    setMetadataVisibility(false);
    dialog.showModal();
  };

  const move = (direction: number) => {
    const nextIndex =
      (state.activeIndex + direction + images.length) % images.length;
    renderImage(nextIndex);
  };

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const index = Number(trigger.getAttribute("data-gallery-index"));

      if (Number.isNaN(index)) {
        return;
      }

      openDialog(index, trigger);
    });
  });

  metadataToggle.addEventListener("click", () => {
    setMetadataVisibility(!metadataElement.classList.contains('is-visible'));
  });

  metadataCloseButton.addEventListener("click", () => {
    setMetadataVisibility(false);
  });

  metadataScrim.addEventListener("click", () => {
    setMetadataVisibility(false);
  });

  fullscreenToggle.addEventListener("click", async () => {
    if (isFullscreenActive()) {
      await document.exitFullscreen();
      return;
    }

    if (lightboxShell.requestFullscreen) {
      await lightboxShell.requestFullscreen();
    }
  });

  frameElement.addEventListener("pointermove", () => {
    if (isFullscreenActive()) {
      revealChrome();
    }
  });

  let touchStartX = 0;
  let touchStartY = 0;

  frameElement.addEventListener(
    "touchstart",
    (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;

      if (isFullscreenActive()) {
        revealChrome();
      }
    },
    { passive: true },
  );

  frameElement.addEventListener(
    "touchend",
    (e) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;

      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
        move(dx > 0 ? -1 : 1);
      }
    },
    { passive: true },
  );

  frameElement.addEventListener("click", () => {
    if (!isFullscreenActive()) {
      return;
    }

    const isVisible = lightboxShell.dataset.uiVisible !== "false";
    setChromeVisibility(!isVisible);

    if (!isVisible) {
      scheduleChromeHide();
    }
  });

  dialog.addEventListener("focusin", () => {
    if (isFullscreenActive()) {
      revealChrome();
    }
  });

  closeButton.addEventListener("click", () => {
    dialog.close();
  });

  previousButton.addEventListener("click", () => {
    move(-1);
  });

  nextButton.addEventListener("click", () => {
    move(1);
  });

  lightboxShell.addEventListener("click", (event) => {
    if (!metadataElement.classList.contains('is-visible')) {
      return;
    }

    const target = event.target;

    if (!(target instanceof Node)) {
      return;
    }

    if (metadataElement.contains(target) || metadataToggle.contains(target)) {
      return;
    }

    setMetadataVisibility(false);
  });

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      dialog.close();
    }
  });

  dialog.addEventListener("close", () => {
    clearChromeTimer();
    setChromeVisibility(true);

    if (isFullscreenActive()) {
      void document.exitFullscreen();
    }

    if (lastTrigger instanceof HTMLElement) {
      lastTrigger.focus();
    }
  });

  document.addEventListener("fullscreenchange", () => {
    updateFullscreenButton();

    if (isFullscreenActive()) {
      revealChrome();
      return;
    }

    clearChromeTimer();
    setChromeVisibility(true);
  });

  window.addEventListener("keydown", (event) => {
    if (!dialog.open) {
      return;
    }

    if (isFullscreenActive()) {
      revealChrome();
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      move(-1);
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      move(1);
    }

    if (event.key.toLowerCase() === "f") {
      event.preventDefault();
      fullscreenToggle.click();
    }
  });

  updateFullscreenButton();
}
