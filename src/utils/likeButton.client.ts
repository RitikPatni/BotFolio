/**
 * Like button client behaviour: load the real count, optimistic +1 with a
 * heart pop and count roll, revert + shake on failure, hard stop at 10
 * personal likes (server-enforced; localStorage mirrors it).
 */

const MAX_MINE = 10;
const HOLD_START_DELAY_MS = 400; // hold this long before repeats begin
const HOLD_REPEAT_MS = 300;      // cadence between repeated likes
const storageKey = (slug: string) => `botfolio:likes:${slug}`;
const VISITOR_STORAGE_KEY = "botfolio:like-visitor";
const VISITOR_TOKEN_PATTERN = /^[0-9a-f]{64}$/;
let fallbackVisitorToken: string | null = null;
const fallbackMine = new Map<string, number>();

function createVisitorToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function visitorToken(): string {
  try {
    const stored = localStorage.getItem(VISITOR_STORAGE_KEY);
    if (stored && VISITOR_TOKEN_PATTERN.test(stored)) return stored;
    const token = createVisitorToken();
    localStorage.setItem(VISITOR_STORAGE_KEY, token);
    return token;
  } catch {
    // Keep the control usable if storage is blocked; this fallback lasts until reload.
    fallbackVisitorToken ??= createVisitorToken();
    return fallbackVisitorToken;
  }
}

type LikesResponse = { slug?: string; count?: number; error?: string };

function formatCount(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function setCount(button: HTMLElement, value: number): void {
  const label = button.querySelector<HTMLElement>("[data-like-count-value]");
  if (!label) return;
  label.textContent = formatCount(value);
  button.dataset.likeCount = String(value);
}

function rollCount(button: HTMLElement): void {
  const label = button.querySelector<HTMLElement>("[data-like-count-value]");
  if (!label) return;
  // Re-trigger the one-shot roll animation (cloning resets it cleanly).
  // The animation class is only ever present on post-click renders — the
  // initial page-load count must not animate.
  const clone = label.cloneNode(true) as HTMLElement;
  clone.classList.add("floating-like__count--roll");
  label.replaceWith(clone);
}

function popHeart(button: HTMLElement): void {
  const heart = button.querySelector<HTMLElement>("[data-like-heart]");
  if (!heart) return;
  heart.classList.remove("floating-like__heart--pop");
  void heart.offsetWidth; // restart the keyframe
  heart.classList.add("floating-like__heart--pop");
}

function shake(button: HTMLElement): void {
  button.classList.remove("floating-like__button--error");
  void button.offsetWidth;
  button.classList.add("floating-like__button--error");
}

function completeHeart(button: HTMLButtonElement): void {
  const heart = button.querySelector<HTMLElement>("[data-like-heart]");
  if (!heart) return;
  heart.classList.remove("floating-like__heart--pop", "floating-like__heart--complete");
  void heart.offsetWidth;
  heart.classList.add("floating-like__heart--complete");
  window.setTimeout(() => heart.classList.remove("floating-like__heart--complete"), 320);
}

function mineFromStorage(slug: string): number {
  try {
    const raw = localStorage.getItem(storageKey(slug));
    if (raw !== null) {
      const mine = Number.parseInt(raw, 10);
      return Number.isFinite(mine) ? Math.min(Math.max(mine, 0), MAX_MINE) : 0;
    }
  } catch {
    // Use the page-session mirror when browser storage is unavailable.
  }
  return fallbackMine.get(slug) ?? 0;
}

function storeMine(slug: string, mine: number): void {
  try {
    localStorage.setItem(storageKey(slug), String(mine));
    fallbackMine.delete(slug);
  } catch {
    fallbackMine.set(slug, mine);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function renderPersonalState(button: HTMLButtonElement, slug: string, animateProgress = false): void {
  const mine = mineFromStorage(slug);
  button.dataset.likeMine = String(mine);
  if (animateProgress) button.dataset.likeProgressAnimate = "true";
  const progress = mine / MAX_MINE;
  button.style.setProperty("--like-progress", String(progress));
  button.style.setProperty(
    "--like-heart-color",
    `color-mix(in srgb, var(--like-heart-from) ${(1 - progress) * 100}%, var(--like-heart-to) ${progress * 100}%)`,
  );
  const maxed = mine >= MAX_MINE;
  button.classList.toggle("floating-like__button--maxed", maxed);
  button.classList.toggle("floating-like__button--liked", mine > 0);
  button.disabled = maxed;
  const hint = button.parentElement?.querySelector<HTMLElement>("[data-like-hint]");
  if (hint) hint.textContent = maxed ? "You’ve reached your 10-like limit for this post." : "";
}

async function loadCount(button: HTMLButtonElement, slug: string): Promise<void> {
  try {
    const response = await fetch(`/api/likes?slug=${encodeURIComponent(slug)}`, {
      headers: { accept: "application/json" },
    });
    if (!response.ok) return;
    const data = (await response.json()) as LikesResponse;
    if (typeof data.count === "number" && data.count >= 0) {
      setCount(button, data.count);
    }
  } catch {
    // No count yet — keep the initial state; the button still works.
  }
}

async function sendLike(slug: string): Promise<LikesResponse | null> {
  try {
    const response = await fetch("/api/likes", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-like-visitor-token": visitorToken(),
      },
      body: JSON.stringify({ slug }),
    });
    return (await response.json()) as LikesResponse;
  } catch {
    return null;
  }
}

async function like(button: HTMLButtonElement, slug: string): Promise<void> {
  if (button.dataset.likePending === "true") return;
  const mine = mineFromStorage(slug);
  if (mine >= MAX_MINE) {
    renderPersonalState(button, slug);
    return;
  }

  const before = Number.parseInt(button.dataset.likeCount ?? "0", 10) || 0;
  const completesPersonalProgress = mine === MAX_MINE - 1;
  button.dataset.likePending = "true";
  setCount(button, before + 1);
  if (!completesPersonalProgress) popHeart(button);
  rollCount(button);

  const data = await sendLike(slug);
  delete button.dataset.likePending;
  if (data?.error === "limit-reached") {
    if (typeof data.count === "number") setCount(button, data.count);
    storeMine(slug, MAX_MINE);
    renderPersonalState(button, slug);
    return;
  }

  if (data && typeof data.count === "number") {
    setCount(button, data.count);
    storeMine(slug, mine + 1);
    renderPersonalState(button, slug, true);
    if (completesPersonalProgress) completeHeart(button);
    return;
  }

  // Failure (network, rate limit, server cap already hit): revert + shake.
  setCount(button, before);
  shake(button);
  renderPersonalState(button, slug);
}

export async function initLikeButtons(): Promise<void> {
  document.querySelectorAll<HTMLButtonElement>("[data-like-button]").forEach((button) => {
    if (button.dataset.likeReady === "true") return;
    button.dataset.likeReady = "true";

    const slug = button.dataset.likeSlug;
    if (!slug) return;

    renderPersonalState(button, slug);
    void loadCount(button, slug);

    const dock = button.closest<HTMLElement>("[data-floating-like]");
    const article = document.querySelector(".slug-prose");
    if (dock && article && "IntersectionObserver" in window) {
      const observer = new IntersectionObserver(([entry]) => {
        dock.hidden = !entry.isIntersecting;
      }, { threshold: 0.01 });
      observer.observe(article);
    } else if (dock) {
      dock.hidden = false;
    }

    // Hold-to-repeat: keep firing likes while the button stays pressed.
    // Requests are serialized (the loop awaits each like), so the count
    // never desyncs from server responses.
    let holding = false;
    let holdDelivered = 0;
    const stopHold = () => {
      holding = false;
    };
    const runHold = async (): Promise<void> => {
      await sleep(HOLD_START_DELAY_MS);
      while (holding && button.isConnected && !button.disabled && mineFromStorage(slug) < MAX_MINE) {
        await like(button, slug);
        holdDelivered += 1;
        if (!holding || mineFromStorage(slug) >= MAX_MINE) break;
        await sleep(HOLD_REPEAT_MS);
      }
    };
    const startHold = () => {
      holding = true;
      holdDelivered = 0;
      void runHold();
    };

    button.addEventListener("click", () => {
      if (button.disabled) return;
      // A completed hold already delivered its likes; the trailing click
      // (pointer or keyboard) must not add one more.
      if (holdDelivered > 0) {
        holdDelivered = 0;
        return;
      }
      void like(button, slug);
    });

    button.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      startHold();
    });
    window.addEventListener("pointerup", stopHold);
    window.addEventListener("pointercancel", stopHold);
    window.addEventListener("blur", stopHold);
    // Touch long-press must not open the browser context menu here.
    button.addEventListener("contextmenu", (event) => event.preventDefault());

    button.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      // Our timer drives the repeat cadence; suppress OS key auto-repeat.
      if (event.repeat) {
        event.preventDefault();
        return;
      }
      startHold();
    });
    button.addEventListener("keyup", (event) => {
      if (event.key === "Enter" || event.key === " ") stopHold();
    });
  });
}
