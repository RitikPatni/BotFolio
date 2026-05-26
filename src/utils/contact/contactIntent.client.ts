export function initContactIntentClient() {
  const root = document.querySelector<HTMLElement>("[data-contact-root]");

  if (!root || root.dataset.contactIntentInit === "true") {
    return;
  }

  root.dataset.contactIntentInit = "true";

  const intentButtons = Array.from(
    root.querySelectorAll<HTMLButtonElement>("[data-intent]"),
  );
  const socialLinks = Array.from(
    root.querySelectorAll<HTMLAnchorElement>("[data-channel-intents]"),
  );
  const intentDescription = root.querySelector<HTMLElement>(
    "[data-intent-description]",
  );

  if (!intentButtons.length || !socialLinks.length || !intentDescription) {
    return;
  }

  const validIntents = new Set(
    intentButtons.map((button) => button.dataset.intent).filter(Boolean),
  );
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  );

  const normalizeIntent = (intent: string) =>
    validIntents.has(intent) ? intent : "general";

  const animateIntentDescription = () => {
    if (prefersReducedMotion.matches) {
      return;
    }

    intentDescription.animate(
      [
        { opacity: 0.65, transform: "translateY(2px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      {
        duration: 200,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    );
  };

  const animateSocialCard = (link: HTMLAnchorElement, isMatch: boolean) => {
    if (prefersReducedMotion.matches) {
      return;
    }

    const translateYFrom = isMatch ? "2px" : "0";
    const opacityFrom = isMatch ? 0.78 : 0.58;
    const opacityTo = isMatch ? 1 : 0.55;

    link.animate(
      [
        { opacity: opacityFrom, transform: `translateY(${translateYFrom})` },
        { opacity: opacityTo, transform: "translateY(0)" },
      ],
      {
        duration: 220,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    );
  };

  const updateIntent = (intent: string, animate = true) => {
    const normalizedIntent = normalizeIntent(intent);

    intentButtons.forEach((button) => {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.intent === normalizedIntent),
      );
    });

    socialLinks.forEach((link) => {
      const supportedIntents = link.dataset.channelIntents?.split(" ") ?? [];
      const isMatch = supportedIntents.includes(normalizedIntent);
      const wasMatch = link.classList.contains("contact__social-link--active");

      link.classList.toggle("contact__social-link--active", isMatch);
      link.classList.toggle("contact__social-link--dim", !isMatch);

      if (animate && wasMatch !== isMatch) {
        animateSocialCard(link, isMatch);
      }
    });

    const activeButton = intentButtons.find(
      (button) => button.dataset.intent === normalizedIntent,
    );
    intentDescription.textContent = activeButton?.dataset.description ?? "";

    if (animate) {
      animateIntentDescription();
    }
  };

  intentButtons.forEach((button) => {
    button.addEventListener("click", () => {
      updateIntent(button.dataset.intent ?? "general");
    });
  });

  const defaultIntent =
    intentButtons.find((button) => button.dataset.intent === "frontend")
      ?.dataset.intent ??
    intentButtons[0]?.dataset.intent ??
    "general";

  updateIntent(defaultIntent, false);
}
