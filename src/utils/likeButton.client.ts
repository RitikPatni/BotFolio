/**
 * Like button client behaviour: load the real count, optimistic +1 with a
 * heart pop and count roll, revert + shake on failure, hard stop at 10
 * personal likes (server-enforced; localStorage mirrors it).
 */

const MAX_MINE = 10;
const storageKey = (slug: string) => `botfolio:likes:${slug}`;

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
  clone.classList.add("like-button__count--roll");
  label.replaceWith(clone);
}

function popHeart(button: HTMLElement): void {
  const heart = button.querySelector<HTMLElement>("[data-like-heart]");
  if (!heart) return;
  heart.classList.remove("like-button__heart--pop");
  void heart.offsetWidth; // restart the keyframe
  heart.classList.add("like-button__heart--pop");
}

function shake(button: HTMLElement): void {
  button.classList.remove("like-button--error");
  void button.offsetWidth;
  button.classList.add("like-button--error");
}

function mineFromStorage(slug: string): number {
  try {
    const raw = localStorage.getItem(storageKey(slug));
    const mine = raw === null ? 0 : Number.parseInt(raw, 10);
    return Number.isFinite(mine) ? Math.min(Math.max(mine, 0), MAX_MINE) : 0;
  } catch {
    return 0;
  }
}

function renderPersonalState(button: HTMLButtonElement, slug: string): void {
  const mine = mineFromStorage(slug);
  button.dataset.likeMine = String(mine);
  const maxed = mine >= MAX_MINE;
  button.classList.toggle("like-button--maxed", maxed);
  button.disabled = maxed;
  const hint = button.parentElement?.querySelector<HTMLElement>("[data-like-hint]");
  if (hint) hint.textContent = maxed ? "That's all 10 of your likes" : "";
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
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug }),
    });
    return (await response.json()) as LikesResponse;
  } catch {
    return null;
  }
}

async function like(button: HTMLButtonElement, slug: string): Promise<void> {
  const mine = mineFromStorage(slug);
  if (mine >= MAX_MINE) {
    renderPersonalState(button, slug);
    return;
  }

  const before = Number.parseInt(button.dataset.likeCount ?? "0", 10) || 0;
  setCount(button, before + 1);
  popHeart(button);
  rollCount(button);

  const data = await sendLike(slug);
  if (data && typeof data.count === "number") {
    setCount(button, data.count);
    try {
      localStorage.setItem(storageKey(slug), String(mine + 1));
    } catch {
      /* private mode: server still enforces the cap */
    }
    renderPersonalState(button, slug);
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

    button.addEventListener("click", () => {
      if (button.disabled) return;
      void like(button, slug);
    });
  });
}
