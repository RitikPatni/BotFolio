declare global {
  interface Window {
    __rpLenisInitialized?: boolean;
  }
}

const storageKey = "rp-theme";

interface BaseLayoutInitOptions {
  animateReveals?: boolean;
}

const readStoredTheme = (): "light" | "dark" | null => {
  try {
    const saved = localStorage.getItem(storageKey);
    return saved === "light" || saved === "dark" ? saved : null;
  } catch {
    return null;
  }
};

const applyTheme = (theme: "light" | "dark") => {
  document.documentElement.setAttribute("data-theme", theme);
};

const applyStoredTheme = () => {
  const saved = readStoredTheme();

  if (saved) {
    applyTheme(saved);
  }
};

const bindThemeToggle = () => {
  const toggleButton = document.getElementById("themeFab");

  if (!(toggleButton instanceof HTMLButtonElement)) {
    return;
  }

  if (toggleButton.dataset.jsBound === "true") {
    return;
  }

  toggleButton.dataset.jsBound = "true";
  toggleButton.addEventListener("click", () => {
    const current =
      document.documentElement.getAttribute("data-theme") === "light"
        ? "light"
        : "dark";
    const next = current === "light" ? "dark" : "light";

    applyTheme(next);

    try {
      localStorage.setItem(storageKey, next);
    } catch {
      // Ignore storage write issues; theme still applies for the session.
    }
  });
};

const initLenis = () => {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  );

  if (prefersReducedMotion.matches || window.__rpLenisInitialized) {
    return;
  }

  window.__rpLenisInitialized = true;

  import("lenis").then(({ default: Lenis }) => {
    const lenis = new Lenis({
      duration: 0.75,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    const raf = (time: number) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };

    requestAnimationFrame(raf);
  });
};

const animateReveals = () => {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  );

  if (prefersReducedMotion.matches) {
    return;
  }

  const revealTargets =
    document.querySelectorAll<HTMLElement>(".motion-reveal");

  revealTargets.forEach((element, index) => {
    if (element.dataset.motionRevealDone === "true") {
      return;
    }

    element.dataset.motionRevealDone = "true";
    element.animate(
      [
        { opacity: 0, transform: "translateY(5px)" },
        { opacity: 1, transform: "translateY(0px)" },
      ],
      {
        duration: 520,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        delay: index * 75,
        fill: "both",
      },
    );
  });
};

export function initBaseLayoutClient(options: BaseLayoutInitOptions = {}) {
  const { animateReveals: shouldAnimateReveals = true } = options;
  const shell = document.querySelector<HTMLElement>("[data-page-shell]");

  if (!shell) {
    return;
  }

  applyStoredTheme();
  bindThemeToggle();
  initLenis();

  if (shouldAnimateReveals) {
    animateReveals();
  }
}
