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

/* Atomic flip: every transition is suspended (BaseLayout.scss
   html[data-theme-switching]) while the new theme's styles are committed, so
   surfaces and text change in the same frame — never bone-on-cream mid-flip. */
const flipTheme = (theme: "light" | "dark") => {
  const root = document.documentElement;
  root.setAttribute("data-theme-switching", "");
  applyTheme(theme);
  getComputedStyle(root).color; // commit the new styles before transitions return
  window.requestAnimationFrame(() =>
    window.requestAnimationFrame(() =>
      root.removeAttribute("data-theme-switching"),
    ),
  );
};

const systemThemeQuery = (): MediaQueryList | null =>
  typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-color-scheme: dark)")
    : null;

/* Resolution order (mirrors the pre-paint script in BaseLayout.astro):
   stored choice → system preference → light. */
const resolveTheme = (): "light" | "dark" =>
  readStoredTheme() ?? (systemThemeQuery()?.matches ? "dark" : "light");

const applyResolvedTheme = () => {
  applyTheme(resolveTheme());
};

/* Until the visitor makes an explicit choice, follow live OS changes; once a
   choice is stored it always wins and system changes are ignored. */
let systemThemeBound = false;
const bindSystemTheme = () => {
  const query = systemThemeQuery();

  if (systemThemeBound || !query) {
    return;
  }

  systemThemeBound = true;
  query.addEventListener("change", (event) => {
    if (readStoredTheme()) {
      return;
    }

    flipTheme(event.matches ? "dark" : "light");
    const toggleButton = document.getElementById("themeToggle");
    if (toggleButton instanceof HTMLButtonElement) {
      syncThemeToggle(toggleButton);
    }
  });
};

const syncThemeToggle = (toggleButton: HTMLButtonElement) => {
  const isLight = document.documentElement.getAttribute("data-theme") === "light";
  const icon = toggleButton.querySelector<HTMLElement>(
    ".base-layout__theme-icon",
  );

  if (icon) {
    icon.textContent = isLight ? "☾" : "☼";
  }

  toggleButton.setAttribute(
    "aria-label",
    isLight ? "Switch to dark theme" : "Switch to light theme",
  );
  toggleButton.setAttribute(
    "title",
    isLight ? "Switch to dark theme" : "Switch to light theme",
  );
  toggleButton.setAttribute("aria-pressed", String(isLight));
};

const bindThemeToggle = () => {
  const toggleButton = document.getElementById("themeToggle");

  if (!(toggleButton instanceof HTMLButtonElement)) {
    return;
  }

  syncThemeToggle(toggleButton);

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

    flipTheme(next);
    syncThemeToggle(toggleButton);

    try {
      localStorage.setItem(storageKey, next);
    } catch {
      // Ignore storage write issues; theme still applies for the session.
    }
  });
};

/* Nav overflow: the single-row nav scrolls sideways when its links outgrow
   the bar (narrow screens). Flags drive the edge masks; the hint shows only
   while links remain hidden to the right. The hint is a real <button>: it
   captures the tap (never the link beneath it) and smooth-scrolls the nav
   to its end, so every hidden link is revealed in one step. The scroll
   events then land here, hide the hint at the end, and hand keyboard focus
   to the first link that was hidden. */
let navHintFocusTarget: HTMLElement | null = null;

const syncNavOverflow = () => {
  const nav = document.querySelector<HTMLElement>("[data-nav-scroller]");
  const hint = document.querySelector<HTMLElement>("[data-nav-scroll-hint]");

  if (!nav) {
    return;
  }

  const overflowing = nav.scrollWidth > nav.clientWidth + 1;
  const atEnd = nav.scrollLeft + nav.clientWidth >= nav.scrollWidth - 4;
  nav.dataset.navOverflowing = String(overflowing);
  nav.dataset.navScrolled = String(nav.scrollLeft > 4);
  nav.dataset.navAtEnd = String(atEnd);

  if (hint) {
    const hide = !overflowing || atEnd;
    if (hide && document.activeElement === hint && navHintFocusTarget) {
      navHintFocusTarget.focus({ preventScroll: true });
    }
    if (hide) navHintFocusTarget = null;
    hint.hidden = hide;
  }
};

const scrollNavToEnd = () => {
  const nav = document.querySelector<HTMLElement>("[data-nav-scroller]");
  if (!nav) return;

  const visibleRight = nav.getBoundingClientRect().right;
  navHintFocusTarget =
    Array.from(nav.querySelectorAll<HTMLElement>("a")).find(
      (link) => link.getBoundingClientRect().right > visibleRight - 1,
    ) ?? null;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  nav.scrollTo({ left: nav.scrollWidth, behavior: reduceMotion ? "auto" : "smooth" });
};

const bindNavOverflow = () => {
  const nav = document.querySelector<HTMLElement>("[data-nav-scroller]");
  const hint = document.querySelector<HTMLElement>("[data-nav-scroll-hint]");

  if (nav && nav.dataset.overflowBound !== "true") {
    nav.dataset.overflowBound = "true";
    nav.addEventListener("scroll", syncNavOverflow, { passive: true });
    if (typeof ResizeObserver !== "undefined") {
      new ResizeObserver(syncNavOverflow).observe(nav);
    }
  }

  if (hint && hint.dataset.jsBound !== "true") {
    hint.dataset.jsBound = "true";
    hint.addEventListener("click", scrollNavToEnd);
  }

  syncNavOverflow();
  window.requestAnimationFrame(syncNavOverflow);
};

const animateReveals = () => {
  /* Field Notes: per-page entry stagger removed — janky on navigation. */
};

/* Single source of truth for --header-h: the SCSS value (BaseLayout.scss
   :root) is a fallback; the rendered header height depends on fonts and
   viewport, so measure it and pin it inline on <html>. Consumers: the root
   scroll-padding (anchor jumps clear the sticky bar) and the home hero's
   first-viewport height. */
let headerHeightObserver: ResizeObserver | null = null;
let observedHeader: HTMLElement | null = null;
const syncHeaderHeight = (header: HTMLElement) => {
  const h = header.offsetHeight;
  if (h > 0) document.documentElement.style.setProperty("--header-h", `${h}px`);
};
const bindHeaderHeight = () => {
  const header = document.querySelector<HTMLElement>(".base-layout__header");
  if (!header) return;
  syncHeaderHeight(header);
  if (typeof ResizeObserver === "undefined" || header === observedHeader) return;
  headerHeightObserver?.disconnect();
  headerHeightObserver = new ResizeObserver(() => syncHeaderHeight(header));
  headerHeightObserver.observe(header);
  observedHeader = header;
};

export function initBaseLayoutClient(options: BaseLayoutInitOptions = {}) {
  const { animateReveals: shouldAnimateReveals = true } = options;
  const shell = document.querySelector<HTMLElement>("[data-page-shell]");

  if (!shell) {
    return;
  }

  applyResolvedTheme();
  bindSystemTheme();
  bindThemeToggle();
  bindNavOverflow();
  bindHeaderHeight();

  if (shouldAnimateReveals) {
    animateReveals();
  }
}
