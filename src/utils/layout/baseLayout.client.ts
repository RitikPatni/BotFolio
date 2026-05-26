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

const updatePersonaUi = (persona: PersonaMode) => {
  const brandLink = document.querySelector<HTMLAnchorElement>(
    "[data-persona-brand]",
  );
  const toggleButtons = document.querySelectorAll<HTMLButtonElement>(
    "[data-persona-toggle]",
  );

  if (brandLink) {
    brandLink.href = persona === "field" ? "/photography" : "/coding";
  }

  toggleButtons.forEach((toggleButton) => {
    const iconElement = toggleButton.querySelector<HTMLElement>(
      ".base-layout__persona-toggle-thumb-icon",
    );

    toggleButton.setAttribute(
      "aria-pressed",
      persona === "field" ? "true" : "false",
    );

    if (iconElement) {
      iconElement.classList.add("base-layout__persona-toggle-thumb-icon--swap");
      window.setTimeout(() => {
        iconElement.textContent = persona === "field" ? "📷" : "⌨";
        iconElement.classList.remove(
          "base-layout__persona-toggle-thumb-icon--swap",
        );
      }, 120);
    }

    toggleButton.setAttribute(
      "aria-label",
      persona === "field"
        ? "Switch to developer profile"
        : "Switch to photography profile",
    );
    toggleButton.setAttribute(
      "title",
      persona === "field" ? "Developer profile" : "Photography profile",
    );
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
  const toggleButtons = document.querySelectorAll<HTMLButtonElement>(
    "[data-persona-toggle]",
  );

  if (toggleButtons.length === 0) {
    return;
  }

  toggleButtons.forEach((toggleButton) => {
    if (toggleButton.dataset.jsBound === "true") {
      return;
    }

    toggleButton.dataset.jsBound = "true";
    toggleButton.addEventListener("click", () => {
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      );

      const current =
        document.documentElement.getAttribute("data-persona") === "field"
          ? "field"
          : "studio";
      const next: PersonaMode = current === "field" ? "studio" : "field";

      applyPersona(next);
      updatePersonaUi(next);

      try {
        localStorage.setItem(personaStorageKey, next);
      } catch {
        // Ignore storage write issues; persona still applies for the session.
      }

      const targetBasePath = next === "field" ? "/photography" : "/coding";
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
  bindThemeToggle();
  bindPersonaToggle();

  if (shouldAnimateReveals) {
    animateReveals();
  }
}
