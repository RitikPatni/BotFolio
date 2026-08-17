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
  try {
    return localStorage.getItem(personaStorageKey) === "field"
      ? "field"
      : "studio";
  } catch {
    return "studio";
  }
};

const applyPersona = (persona: PersonaMode) => {
  document.documentElement.setAttribute("data-persona", persona);
};

const clearPersonaTransitionClasses = () => {
  document.documentElement.classList.remove(personaSwitchClassName);
  document.documentElement.classList.remove(personaEntryClassName);
};

const applyPersonaEntryTransition = () => {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  );

  if (prefersReducedMotion.matches) {
    try {
      sessionStorage.removeItem(personaTransitionStorageKey);
    } catch {
      // Ignore storage write issues.
    }
    return;
  }

  let shouldAnimateEntry = false;

  try {
    shouldAnimateEntry =
      sessionStorage.getItem(personaTransitionStorageKey) === "1";
    sessionStorage.removeItem(personaTransitionStorageKey);
  } catch {
    shouldAnimateEntry = false;
  }

  if (!shouldAnimateEntry) {
    return;
  }

  document.documentElement.classList.add(personaEntryClassName);
  window.setTimeout(() => {
    document.documentElement.classList.remove(personaEntryClassName);
  }, personaEntryDurationMs);
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
const STUDIO_ROUTES = ["/coding", "/blog"];
const FIELD_ROUTES = ["/photography", "/library"];

const guardPersonaRoute = () => {
  const persona = readStoredPersona();
  const path = window.location.pathname.replace(/\/$/, "") || "/";
  const isStudioOnly = STUDIO_ROUTES.some(
    (r) => path === r || path.startsWith(`${r}/`),
  );
  const isFieldOnly = FIELD_ROUTES.some(
    (r) => path === r || path.startsWith(`${r}/`),
  );

  if (persona === "field" && isStudioOnly) {
    void navigateTo("/photography");
    return;
  }

  if (persona === "studio" && isFieldOnly) {
    void navigateTo("/coding");
    return;
  }
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
        persona === "field"
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

    runThemeTransition();
    applyTheme(next);

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

      try {
        localStorage.setItem(personaStorageKey, next);
      } catch {
        // Ignore storage write issues; persona still applies for the session.
      }

      const targetBasePath = next === "field" ? "/photography" : "/";
      const currentPath = window.location.pathname.replace(/\/$/, "") || "/";

      if (currentPath !== targetBasePath) {
        if (prefersReducedMotion.matches) {
          void navigateTo(targetBasePath);
          return;
        }

        try {
          sessionStorage.setItem(personaTransitionStorageKey, "1");
        } catch {
          // Ignore storage write issues and continue with in-place animation.
        }

        document.documentElement.classList.add(personaSwitchClassName);
        window.setTimeout(() => {
          void navigateTo(targetBasePath);
        }, personaSwitchDurationMs);
      }
    });
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

  clearPersonaTransitionClasses();
  applyPersonaEntryTransition();
  applyStoredTheme();
  applyStoredPersona();
  guardPersonaRoute();
  bindThemeToggle();
  bindPersonaToggle();

  if (shouldAnimateReveals) {
    animateReveals();
  }
}
