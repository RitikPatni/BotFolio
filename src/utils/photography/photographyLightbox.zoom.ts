import Panzoom, { type PanzoomObject } from "@panzoom/panzoom";

/* Zoom for the open frame, built on Panzoom (pinch, wheel, drag-to-pan).
   Panzoom transforms the stage, a wrapper that fills the frame, rather than
   the <img>: the swipe drag owns the photo's own transform, and Panzoom's
   focal-point maths assume the zoomed element fills its parent. */

const MAX_SCALE = 4;
/* Double-click / double-tap lands here: close enough to read feathers,
   not so close that the frame turns to mush. */
const TOGGLE_SCALE = 2.5;
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const DURATION = 220;

type ZoomOptions = {
  frame: HTMLElement;
  stage: HTMLElement;
  image: HTMLImageElement;
  zoomInButton: HTMLButtonElement | null;
  zoomOutButton: HTMLButtonElement | null;
  signal: AbortSignal;
};

export type LightboxZoom = {
  isZoomed: () => boolean;
  zoomIn: () => void;
  zoomOut: () => void;
  /* Zoom in on a point (client coordinates), or back out when zoomed. */
  toggleAt: (point: { clientX: number; clientY: number }) => void;
  reset: (options?: { animate?: boolean }) => void;
  destroy: () => void;
};

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function createLightboxZoom({
  frame,
  stage,
  image,
  zoomInButton,
  zoomOutButton,
  signal,
}: ZoomOptions): LightboxZoom {
  /* Panzoom only animates zoomIn/zoomOut/reset; zoomToPoint (double-click)
     always lands instantly. This flag lets any single call ease instead. */
  let animateNext = false;
  /* Widest `sizes` handed to the photo for this frame, so zooming in pulls
     a sharper srcset candidate instead of upscaling the screen-sized one. */
  let sizesWidth = 0;

  const panzoom: PanzoomObject = Panzoom(stage, {
    maxScale: MAX_SCALE,
    minScale: 1,
    /* The stage never leaves a gap at the frame's edges while zoomed. */
    contain: "outside",
    /* At 1x a one-finger drag is a swipe between frames, not a pan. */
    panOnlyWhenZoomed: true,
    /* Cursors come from the stylesheet (zoom-in / grab), keyed off
       .is-zoomed below. */
    cursor: "",
    step: 0.5,
    duration: DURATION,
    easing: EASE,
    setTransform: (element: HTMLElement | SVGElement, { scale, x, y }) => {
      if (animateNext) {
        element.style.transition = prefersReducedMotion()
          ? "none"
          : `transform ${DURATION}ms ${EASE}`;
        animateNext = false;
      }
      element.style.transform = `scale(${scale}) translate(${x}px, ${y}px)`;
    },
  });

  const isZoomed = () => panzoom.getScale() > 1.01;

  const animate = () => !prefersReducedMotion();

  const sync = () => {
    const scale = panzoom.getScale();
    const zoomed = scale > 1.01;
    stage.classList.toggle("is-zoomed", zoomed);
    zoomOutButton?.setAttribute("aria-disabled", String(!zoomed));
    zoomInButton?.setAttribute("aria-disabled", String(scale >= MAX_SCALE - 0.01));

    if (zoomed) {
      /* The rect already includes the stage's scale. */
      const width = Math.ceil(image.getBoundingClientRect().width);
      if (width > sizesWidth * 1.25) {
        sizesWidth = width;
        image.sizes = `${width}px`;
      }
    }
  };

  stage.addEventListener("panzoomchange", sync, { signal });

  /* Plain wheel and trackpad pinch (a ctrl+wheel) both zoom at the
     pointer; the viewer has nothing to scroll. */
  frame.addEventListener("wheel", (event) => panzoom.zoomWithWheel(event), {
    passive: false,
    signal,
  });

  const reset = ({ animate: animated = false } = {}) => {
    sizesWidth = 0;
    if (panzoom.getScale() === 1) {
      const { x, y } = panzoom.getPan();
      if (x === 0 && y === 0) {
        return;
      }
    }
    animateNext = animated;
    panzoom.reset({ animate: false });
  };

  /* Containment depends on the frame's size, so a resize (or entering full
     screen) starts the frame over at 1x. */
  window.addEventListener("resize", () => reset(), { signal });

  return {
    isZoomed,
    zoomIn: () => panzoom.zoomIn({ animate: animate() }),
    zoomOut: () => {
      /* Snap the last step home so 1x is exact and swipes work again. */
      if (panzoom.getScale() / Math.exp(0.5) <= 1.05) {
        reset({ animate: animate() });
        return;
      }
      panzoom.zoomOut({ animate: animate() });
    },
    toggleAt: (point) => {
      if (isZoomed()) {
        reset({ animate: animate() });
        return;
      }
      animateNext = animate();
      panzoom.zoomToPoint(TOGGLE_SCALE, point);
    },
    reset,
    destroy: () => {
      panzoom.destroy();
      panzoom.resetStyle();
      stage.style.removeProperty("transform");
      stage.style.removeProperty("transition");
    },
  };
}
