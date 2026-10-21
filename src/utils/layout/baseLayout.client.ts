const storageKey = "rp-theme";
const personaStorageKey = "rp-persona";
const personaTransitionStorageKey = "rp-persona-transition";
const personaSwitchClassName = "is-persona-switching";
const personaEntryClassName = "is-persona-entering";
const personaSwitchDurationMs = 360;
const personaEntryDurationMs = 620;
const themeSwitchClassName = "is-theme-switching";
const themeSwitchDurationMs = 220;

type PersonaMode = "studio" | "field";

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

const runThemeTransition = () => {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  );

  if (prefersReducedMotion.matches) {
    return;
  }

  document.documentElement.classList.add(themeSwitchClassName);
  window.setTimeout(() => {
    document.documentElement.classList.remove(themeSwitchClassName);
  }, themeSwitchDurationMs);
};

const readStoredPersona = (): PersonaMode => {
  /* Persona mode dissolved (Field Notes) — single identity. */
  return "studio";
};

const applyPersona = (persona: PersonaMode) => {
  document.documentElement.setAttribute("data-persona", "studio");
};

const clearPersonaTransitionClasses = () => {};
const applyPersonaEntryTransition = () => {
  /* persona mode dissolved — no entry transitions */
};
const navigateTo = async (targetPath: string) => {
  try {
    const transitionsClient = await import("astro:transitions/client");

    if (typeof transitionsClient.navigate === "function") {
      await transitionsClient.navigate(targetPath);
      return;
    }
  } catch {
    // Ignore dynamic import failures and fall back to location.assign.
  }

  window.location.assign(targetPath);
};

// Persona routing guard: studio-only pages are unreachable on the field
// persona and vice versa (About is shared). Redirect on mismatch.
// NOTE: /library is intentionally SHARED — both personas can reach it.
const STUDIO_ROUTES = ["/coding", "/blog"];
const FIELD_ROUTES = ["/photography"];

const guardPersonaRoute = () => {
  /* Persona routing dissolved (Field Notes): every route serves one identity. */
};

const updatePersonaUi = (persona: PersonaMode) => {
  const brandLink = document.querySelector<HTMLAnchorElement>(
    "[data-persona-brand]",
  );

  // Fix: studio home is "/" not "/coding"
  if (brandLink) {
    brandLink.href = persona === "field" ? "/photography" : "/";
  }

  // Fix: target the pill buttons, not the old emoji toggle
  const buttons = document.querySelectorAll<HTMLButtonElement>(
    ".nav-persona-btn",
  );

  buttons.forEach((btn) => {
    const btnPersona = btn.getAttribute("data-persona");
    const isActive = btnPersona === persona;

    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-pressed", String(isActive));

    // Update the button's own label for screen readers
    if (isActive) {
      btn.setAttribute(
        "aria-label",
        persona === "field"
          ? "Photography profile"
          : "Developer profile",
      );
    } else {
      btn.setAttribute(
        "aria-label",
        btnPersona === "field"
          ? "Switch to photography profile"
          : "Switch to developer profile",
      );
    }
  });
};

const applyStoredPersona = () => {
  const persona = readStoredPersona();
  applyPersona(persona);
  updatePersonaUi(persona);
};

const applyStoredTheme = () => {
  const saved = readStoredTheme();

  if (saved) {
    applyTheme(saved);
  }
};

const syncThemeToggle = (toggleButton: HTMLButtonElement) => {
  const isLight = document.documentElement.getAttribute("data-theme") === "light";
  const icon = toggleButton.querySelector<HTMLElement>(
    ".base-layout__theme-fab-icon",
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
  const toggleButton = document.getElementById("themeFab");

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

    runThemeTransition();
    applyTheme(next);
    syncThemeToggle(toggleButton);

    try {
      localStorage.setItem(storageKey, next);
    } catch {
      // Ignore storage write issues; theme still applies for the session.
    }
  });
};

const bindPersonaToggle = () => {
  const buttons = document.querySelectorAll<HTMLButtonElement>(
    ".nav-persona-btn",
  );

  if (buttons.length === 0) {
    return;
  }

  buttons.forEach((btn) => {
    if (btn.dataset.jsBound === "true") {
      return;
    }

    btn.dataset.jsBound = "true";
    btn.addEventListener("click", () => {
      const btnPersona = btn.getAttribute("data-persona") as PersonaMode | null;
      const current =
        document.documentElement.getAttribute("data-persona") === "field"
          ? "field"
          : "studio";

      // Only toggle when clicking the INACTIVE persona
      if (!btnPersona || btnPersona === current) {
        return;
      }

      const next: PersonaMode = btnPersona;

      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      );

      applyPersona(next);
      updatePersonaUi(next);
      syncNavOverflow();
      window.requestAnimationFrame(syncNavOverflow);

      try {
        localStorage.setItem(personaStorageKey, next);
      } catch {
        // Ignore storage write issues; persona still applies for the session.
      }

      const currentPath = window.location.pathname.replace(/\/$/, "") || "/";
      const isStudioOnly = STUDIO_ROUTES.some(
        (route) => currentPath === route || currentPath.startsWith(`${route}/`),
      );
      const isFieldOnly = FIELD_ROUTES.some(
        (route) => currentPath === route || currentPath.startsWith(`${route}/`),
      );
      const targetPath = next === "field" && isStudioOnly
        ? "/photography"
        : next === "studio" && isFieldOnly
          ? "/"
          : currentPath;

      if (currentPath !== targetPath) {
        if (prefersReducedMotion.matches) {
          void navigateTo(targetPath);
          return;
        }

        try {
          sessionStorage.setItem(personaTransitionStorageKey, "1");
        } catch {
          // Ignore storage write issues and continue with in-place animation.
        }

        document.documentElement.classList.add(personaSwitchClassName);
        window.setTimeout(() => {
          void navigateTo(targetPath);
        }, personaSwitchDurationMs);
      }
    });
  });
};

const syncNavOverflow = () => {
  const navs = Array.from(
    document.querySelectorAll<HTMLElement>("[data-persona-nav]"),
  );
  const visibleNav = navs.find((nav) => nav.getBoundingClientRect().width > 0);
  const hint = document.querySelector<HTMLElement>("[data-nav-scroll-hint]");

  navs.forEach((nav) => {
    const overflowing = nav.scrollWidth > nav.clientWidth + 1;
    nav.dataset.navOverflowing = String(overflowing);
    nav.dataset.navScrolled = String(nav.scrollLeft > 4);
  });

  if (!hint || !visibleNav) {
    return;
  }

  const overflowing = visibleNav.scrollWidth > visibleNav.clientWidth + 1;
  hint.hidden = !overflowing;
  hint.textContent = visibleNav.scrollLeft > 4 ? "More" : "Swipe for more";
};

const bindNavOverflow = () => {
  const navs = document.querySelectorAll<HTMLElement>("[data-persona-nav]");

  navs.forEach((nav) => {
    if (nav.dataset.overflowBound === "true") {
      return;
    }

    nav.dataset.overflowBound = "true";
    nav.addEventListener("scroll", syncNavOverflow, { passive: true });
  });

  syncNavOverflow();
  window.requestAnimationFrame(syncNavOverflow);
};

const animateReveals = () => {
  /* Field Notes: per-page entry stagger removed — janky on navigation. */
};

/* ═══ P1 SET 2 (C2) — scroll-aware header state ═══
   On pages with a full-bleed hero ([data-hero]) the header is fixed and
   transparent with pinned cream links while the photo band fills the header's
   box. Once the photo stops filling it, html gets data-header-solid and the
   header switches to the standard solid look (BaseLayout.scss). Non-hero pages
   never get the attribute, so their existing sticky header is untouched;
   scrolling back to the top removes the attribute and restores the transparent
   over-photo state. */
const syncHeaderSolid = () => {
  const html = document.documentElement;
  const hero = document.querySelector<HTMLElement>("[data-hero]");

  if (!hero) {
    html.removeAttribute("data-header-solid");
    return;
  }

  /* P1 SET 2: the transparent look is only sound while the photo band FILLS the
     header's box — the strip loses photo coverage from its bottom edge first (the
     links row sits low in the box), and the former heroBottom <= 0 threshold kept
     pinned cream links over the cream page across that split (a 1.0:1 ghost
     window). Flip to the solid header exactly when the photo stops covering it. */
  const headerH =
    document.querySelector<HTMLElement>(".base-layout__header")?.offsetHeight ?? 0;
  const pastPhotoBand = hero.getBoundingClientRect().bottom <= headerH;

  if (pastPhotoBand) {
    html.setAttribute("data-header-solid", "");
  } else {
    html.removeAttribute("data-header-solid");
  }
};

let headerSolidBound = false;
const bindHeaderSolid = () => {
  if (!headerSolidBound) {
    headerSolidBound = true;
    window.addEventListener("scroll", syncHeaderSolid, { passive: true });
    window.addEventListener("resize", syncHeaderSolid, { passive: true });
  }
  /* Re-sync on every init: covers navigations (astro:page-load), scroll
     restoration on load, and hero-less pages (attribute must not leak). */
  syncHeaderSolid();
};

export function initBaseLayoutClient(options: BaseLayoutInitOptions = {}) {
  const { animateReveals: shouldAnimateReveals = true } = options;
  const shell = document.querySelector<HTMLElement>("[data-page-shell]");

  if (!shell) {
    return;
  }

  clearPersonaTransitionClasses();
  applyPersonaEntryTransition();
  applyStoredTheme();
  applyStoredPersona();
  guardPersonaRoute();
  bindThemeToggle();
  bindPersonaToggle();
  bindNavOverflow();
  bindHeaderSolid();

  if (shouldAnimateReveals) {
    animateReveals();
  }
}
