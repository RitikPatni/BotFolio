import { navigate } from "astro:transitions/client";
import { createLightboxRenderer } from "./photographyLightbox.render";
import {
  resolveElements,
  type GalleryDialogImage,
} from "./photographyLightbox.types";

/* Horizontal travel (px) before a touch drag counts as a swipe, and the
   fling speed (px/ms) that commits a shorter one. */
const SWIPE_DISTANCE = 56;
const SWIPE_VELOCITY = 0.45;

/* Bound once per page view: ClientRouter swaps pages without reloading this
   module, so init runs on every astro:page-load and tears down its window /
   document listeners on the next swap. */
export function bindPhotographyLightbox() {
  let teardown: (() => void) | undefined;

  document.addEventListener("astro:page-load", () => {
    teardown?.();
    teardown = initPhotographyLightbox();
  });
  document.addEventListener("astro:before-swap", () => {
    teardown?.();
    teardown = undefined;
  });
}

/* The router numbers the history entries it creates (history.state.index,
   0 for the first page of the visit). Above 0, the entry before this one is
   another page on the site, e.g. a post that linked to a frame. Read at
   init, before the viewer pushes any entries of its own. */
const cameFromSitePage = () => {
  const index = (window.history.state as { index?: unknown } | null)?.index;
  return typeof index === "number" && index > 0;
};

export function initPhotographyLightbox(): (() => void) | undefined {
  const root = document.querySelector<HTMLElement>("[data-gallery-root]");
  const dataElement = document.getElementById("photographyGalleryData");

  if (!root || !dataElement || root.dataset.galleryReady === "true") {
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
    imageElement,
  } = elements;
  const statusElement = root.querySelector<HTMLElement>("[data-gallery-status]");
  const openStatusElement = root.querySelector<HTMLElement>(
    "[data-gallery-open-status]",
  );
  const lifecycle = new AbortController();
  const { signal } = lifecycle;

  const clearGalleryLoading = (trigger: HTMLElement | null) => {
    trigger?.removeAttribute("aria-busy");
    dialog.removeAttribute("aria-busy");
    for (const status of [statusElement, openStatusElement]) {
      if (status) {
        status.hidden = true;
        status.textContent = "";
      }
    }
  };

  const setGalleryImageState = (
    imageState: "loading" | "loaded" | "error",
  ) => {
    imageElement.dataset.imageState = imageState;

    if (imageState === "loading") {
      dialog.setAttribute("aria-busy", "true");
      if (statusElement) {
        statusElement.hidden = false;
        statusElement.textContent = "Loading image…";
      }
      return;
    }

    dialog.removeAttribute("aria-busy");

    if (!statusElement) {
      return;
    }

    statusElement.hidden = imageState !== "error";
    statusElement.textContent =
      imageState === "error"
        ? "This image could not load. Try another photo."
        : "";
  };

  const state = {
    activeIndex: 0,
    activeTag: null as string | null,
  };
  let lastTrigger: HTMLElement | null = null;
  /* True while the open frame owns a history entry we pushed, so closing
     steps back over it instead of leaving a dead #slug entry behind. */
  let ownsHistoryEntry = false;
  /* True while the viewer was opened by a link from another page on the site
     (e.g. a frame linked from a post). The visitor came for one photo, not the whole
     gallery, so closing steps back to where they came from. */
  let returnToReferrer = false;

  const { renderImage } = createLightboxRenderer({
    images,
    elements,
    state,
    onImageState: setGalleryImageState,
    onNavigate: (index) => goTo(index),
  });

  /* ─── Deep links: #<slug> on whichever page hosts the viewer ──── */

  const slugIndex = new Map(images.map((image) => [image.slug, image.index]));

  const indexFromHash = () => {
    let slug: string;
    try {
      slug = decodeURIComponent(window.location.hash.slice(1));
    } catch {
      /* Malformed escape (e.g. "#%"): not a frame, never a crash. */
      return undefined;
    }
    return slug ? slugIndex.get(slug) : undefined;
  };

  const frameHash = (index: number) => `#${images[index].slug}`;

  /* Pushes go through the router so its notion of the current URL stays in
     sync; a raw pushState makes the next Back trigger a full page swap.
     Replaces keep the entry's existing state, which also covers entries the
     browser made for a typed #fragment (state null), where the router's own
     replace throws. */
  const writeFrameHash = (index: number, history: "push" | "replace") => {
    if (window.location.hash === frameHash(index)) {
      return;
    }
    if (history === "replace") {
      window.history.replaceState(
        window.history.state,
        "",
        window.location.pathname + window.location.search + frameHash(index),
      );
      return;
    }
    void navigate(frameHash(index), { history });
  };

  /* Returns true when it stepped back through history (async), so the
     caller can wait for that to land before restoring focus. */
  const clearFrameHash = (): boolean => {
    if (returnToReferrer) {
      returnToReferrer = false;
      ownsHistoryEntry = false;
      window.history.back();
      return true;
    }

    if (indexFromHash() === undefined) {
      ownsHistoryEntry = false;
      return false;
    }

    if (ownsHistoryEntry) {
      ownsHistoryEntry = false;
      window.history.back();
      return true;
    }

    window.history.replaceState(
      window.history.state,
      "",
      window.location.pathname + window.location.search,
    );
    return false;
  };

  /* ─── Scroll lock ─────────────────────────────────────────────── */

  /* overflow:hidden on <html> removes the scrollbar; padding the body by its
     width keeps the page (and sticky header) from shifting underneath. */
  const lockScroll = () => {
    const html = document.documentElement;
    const scrollbarWidth = window.innerWidth - html.clientWidth;
    html.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingInlineEnd = `${scrollbarWidth}px`;
    }
  };

  const unlockScroll = () => {
    document.documentElement.style.removeProperty("overflow");
    document.body.style.removeProperty("padding-inline-end");
  };

  /* ─── Chrome + metadata ───────────────────────────────────────── */

  const isFullscreenActive = () => document.fullscreenElement === lightboxShell;

  const setChromeVisibility = (isVisible: boolean) => {
    lightboxShell.dataset.uiVisible = String(isVisible);
  };

  const updateFullscreenButton = () => {
    const isFullscreen = isFullscreenActive();
    const label = isFullscreen ? "Exit full screen" : "Full screen";
    fullscreenToggle.setAttribute("aria-label", label);
    fullscreenToggle.dataset.tooltip = label;
  };

  const setMetadataVisibility = (isVisible: boolean) => {
    metadataElement.classList.toggle("is-visible", isVisible);
    metadataScrim.classList.toggle("is-visible", isVisible);
    lightboxShell.dataset.metadataVisible = String(isVisible);
    metadataToggle.setAttribute("aria-expanded", String(isVisible));
    const label = isVisible ? "Hide metadata" : "Show metadata";
    metadataToggle.setAttribute("aria-label", label);
    metadataToggle.dataset.tooltip = label;

    if (isVisible) {
      setChromeVisibility(true);
    }
  };

  const isMetadataVisible = () => metadataElement.classList.contains("is-visible");

  /* ─── Open / move / close ─────────────────────────────────────── */

  const triggerFor = (index: number) =>
    triggers.find(
      (trigger) => Number(trigger.dataset.galleryIndex) === index,
    ) ?? null;

  const openDialog = (
    index: number,
    trigger: HTMLElement | null,
    history: "push" | "none" = "push",
  ) => {
    if (dialog.open) {
      renderImage(index);
      return;
    }

    lastTrigger = trigger ?? triggerFor(index);
    clearGalleryLoading(lastTrigger);
    renderImage(index);
    setChromeVisibility(true);
    setMetadataVisibility(false);
    lockScroll();
    dialog.showModal();

    if (history === "push") {
      ownsHistoryEntry = true;
      writeFrameHash(index, "push");
    }
  };

  const goTo = (index: number) => {
    renderImage(index);
    writeFrameHash(index, "replace");
  };

  const move = (direction: number) => {
    goTo((state.activeIndex + direction + images.length) % images.length);
  };

  triggers.forEach((trigger) => {
    trigger.addEventListener(
      "click",
      (event) => {
        const index = Number(trigger.getAttribute("data-gallery-index"));

        if (Number.isNaN(index)) {
          return;
        }

        /* Link triggers (the home strip) keep their href as the no-JS and
           new-tab fallback; a plain click opens the viewer right here. */
        if (trigger instanceof HTMLAnchorElement) {
          if (
            event.button !== 0 ||
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey
          ) {
            return;
          }
          /* Also stops the ClientRouter, which skips prevented clicks. */
          event.preventDefault();
        }

        openDialog(index, trigger);
      },
      { signal },
    );
  });

  metadataToggle.addEventListener(
    "click",
    () => setMetadataVisibility(!isMetadataVisible()),
    { signal },
  );
  metadataCloseButton.addEventListener(
    "click",
    () => setMetadataVisibility(false),
    { signal },
  );
  metadataScrim.addEventListener(
    "click",
    () => setMetadataVisibility(false),
    { signal },
  );

  /* Hide where the Fullscreen API is missing (iPhone Safari). */
  fullscreenToggle.hidden = !document.fullscreenEnabled;
  fullscreenToggle.addEventListener(
    "click",
    async () => {
      if (isFullscreenActive()) {
        await document.exitFullscreen();
        return;
      }

      await lightboxShell.requestFullscreen?.();
    },
    { signal },
  );

  closeButton.addEventListener("click", () => dialog.close(), { signal });
  previousButton.addEventListener("click", () => move(-1), { signal });
  nextButton.addEventListener("click", () => move(1), { signal });

  /* Hidden chrome is faded, not removed, so keyboard and screen-reader users
     can still reach it; bring it back as soon as focus lands on a control. */
  lightboxShell.addEventListener(
    "focusin",
    (event) => {
      if (
        lightboxShell.dataset.uiVisible === "false" &&
        event.target instanceof HTMLButtonElement
      ) {
        setChromeVisibility(true);
      }
    },
    { signal },
  );

  /* ─── Touch: swipe to navigate, with the photo following the finger ── */

  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;
  let dragAxis: "x" | "y" | null = null;
  let suppressClickUntil = 0;

  const resetDrag = () => {
    imageElement.classList.remove("is-dragging");
    imageElement.style.removeProperty("transform");
    dragAxis = null;
  };

  frameElement.addEventListener(
    "touchstart",
    (event) => {
      if (event.touches.length !== 1) {
        resetDrag();
        return;
      }
      touchStartX = event.touches[0].clientX;
      touchStartY = event.touches[0].clientY;
      touchStartTime = event.timeStamp;
      dragAxis = null;
    },
    { passive: true, signal },
  );

  frameElement.addEventListener(
    "touchmove",
    (event) => {
      if (event.touches.length !== 1) {
        return;
      }
      const dx = event.touches[0].clientX - touchStartX;
      const dy = event.touches[0].clientY - touchStartY;

      if (dragAxis === null && Math.hypot(dx, dy) > 8) {
        dragAxis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      }

      if (dragAxis === "x" && images.length > 1) {
        imageElement.classList.add("is-dragging");
        imageElement.style.transform = `translate3d(${dx}px, 0, 0)`;
      }
    },
    { passive: true, signal },
  );

  frameElement.addEventListener(
    "touchend",
    (event) => {
      const wasDragging = dragAxis === "x";
      const dx = event.changedTouches[0].clientX - touchStartX;
      const velocity = Math.abs(dx) / Math.max(1, event.timeStamp - touchStartTime);
      resetDrag();

      if (!wasDragging) {
        return;
      }

      suppressClickUntil = event.timeStamp + 400;

      if (Math.abs(dx) > SWIPE_DISTANCE || velocity > SWIPE_VELOCITY) {
        move(dx > 0 ? -1 : 1);
      }
    },
    { passive: true, signal },
  );

  frameElement.addEventListener("touchcancel", resetDrag, { passive: true, signal });

  /* ─── Clicks: photo toggles chrome, bare backdrop closes ───────── */

  lightboxShell.addEventListener(
    "click",
    (event) => {
      const target = event.target;

      if (!(target instanceof Element) || event.timeStamp < suppressClickUntil) {
        return;
      }

      if (isMetadataVisible()) {
        /* composedPath, not contains(): tag buttons re-render on click, so
           by the time this runs the target is already detached. */
        const path = event.composedPath();
        if (!path.includes(metadataElement) && !path.includes(metadataToggle)) {
          setMetadataVisibility(false);
        }
        return;
      }

      if (target === imageElement) {
        setChromeVisibility(lightboxShell.dataset.uiVisible === "false");
        return;
      }

      if (target === frameElement || target === lightboxShell) {
        dialog.close();
      }
    },
    { signal },
  );

  dialog.addEventListener(
    "close",
    () => {
      resetDrag();
      setChromeVisibility(true);
      setMetadataVisibility(false);
      imageElement.removeAttribute("data-image-state");
      unlockScroll();

      if (isFullscreenActive()) {
        void document.exitFullscreen();
      }

      const leavingPage = returnToReferrer;
      const focusTarget = triggerFor(state.activeIndex) ?? lastTrigger;
      const steppedBack = clearFrameHash();

      /* Return to the frame being viewed, not the one that opened the viewer.
         Skipped when we're heading back to the referring page: focusing a
         grid tile would scroll the gallery just before it swaps out. */
      if (leavingPage) {
        return;
      }

      /* After history.back() the router restores the scroll position saved
         for the opener's entry, which would leave the focused tile off-screen
         after paging; focus once that has landed. */
      if (steppedBack) {
        window.addEventListener(
          "popstate",
          () => requestAnimationFrame(() => focusTarget?.focus()),
          { once: true, signal },
        );
        return;
      }

      focusTarget?.focus();
    },
    { signal },
  );

  /* Back / forward across a #slug entry opens or closes the viewer. */
  window.addEventListener(
    "popstate",
    () => {
      /* Any history move means we're no longer on the entry the referring
         page pushed (Back already left, or a typed #fragment sits on top),
         so a later close must not step back again. */
      returnToReferrer = false;
      const index = indexFromHash();

      if (index === undefined) {
        ownsHistoryEntry = false;
        if (dialog.open) {
          dialog.close();
        }
        return;
      }

      /* Only entries the router pushed carry state. A fragment the visitor
         typed (state null) may sit on top of another frame entry, so stepping
         back on close would reopen that frame; clear the hash instead.
         Updated before the open-dialog branch: a fragment typed while the
         viewer is open changes which entry we're on too. */
      ownsHistoryEntry = window.history.state !== null;

      if (dialog.open) {
        if (index !== state.activeIndex) {
          renderImage(index);
        }
        return;
      }

      openDialog(index, null, "none");
    },
    { signal },
  );

  document.addEventListener("fullscreenchange", updateFullscreenButton, { signal });

  window.addEventListener(
    "keydown",
    (event) => {
      /* Modified keys belong to the browser (Cmd/Ctrl+F is find, not full
         screen; Alt+Arrow is history). */
      if (
        !dialog.open ||
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey
      ) {
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        move(-1);
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        move(1);
      }

      if (event.key.toLowerCase() === "f" && !fullscreenToggle.hidden) {
        event.preventDefault();
        fullscreenToggle.click();
      }
    },
    { signal },
  );

  updateFullscreenButton();
  root.dataset.galleryReady = "true";

  /* Landing on /photography#<slug> from another page on the site: open on the
     entry the router already pushed, and let close / Back return there.
     A fresh landing (shared link, new tab) has nowhere on-site to go back
     to, so swap the entry for the bare page and push the frame on top:
     Back closes the viewer rather than leaving the site. */
  const initialIndex = indexFromHash();
  if (initialIndex !== undefined && cameFromSitePage()) {
    returnToReferrer = true;
    openDialog(initialIndex, null, "none");
  } else if (initialIndex !== undefined) {
    window.history.replaceState(
      window.history.state,
      "",
      window.location.pathname + window.location.search,
    );
    openDialog(initialIndex, null);
  }

  return () => {
    lifecycle.abort();
    if (dialog.open) {
      ownsHistoryEntry = false;
      returnToReferrer = false;
      dialog.close();
    }
    unlockScroll();
    delete root.dataset.galleryReady;
  };
}
