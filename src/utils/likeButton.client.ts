/**
 * Like button client behaviour: per-browser progress only (no public
 * aggregate), heart fill toward the 10-like personal cap (server-enforced;
 * localStorage mirrors confirmed likes only).
 */

const MAX_MINE = 10;
const ACTION_RETENTION_MS = 30 * 24 * 60 * 60_000;
const MAX_TIMER_DELAY_MS = 2_147_000_000;
const HOLD_START_DELAY_MS = 400; // hold this long before repeats begin
const HOLD_REPEAT_MS = 300;      // cadence between repeated likes
const storageKey = (slug: string) => `botfolio:likes:${slug}`;
const VISITOR_STORAGE_KEY = "botfolio:like-visitor";
const VISITOR_TOKEN_PATTERN = /^[0-9a-f]{64}$/;
let fallbackVisitorToken: string | null = null;
type PersonalState = { count: number; lastAcceptedAt: number };
type QueuedAction = { completesPersonalProgress: boolean };
type LikeQueue = {
  slug: string;
  button: HTMLButtonElement;
  actions: QueuedAction[];
  pending: number;
  inFlight: boolean;
  confirmedMine: number;
  lastAcceptedAt: number;
};
const EMPTY_PERSONAL_STATE: PersonalState = { count: 0, lastAcceptedAt: 0 };
const fallbackMine = new Map<string, PersonalState>();
const resetTimers = new WeakMap<HTMLButtonElement, number>();
const likeQueues = new WeakMap<HTMLButtonElement, LikeQueue>();

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

type LikesResponse = { error?: string; resetAt?: number };

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

export function personalStateFromStorage(raw: string | null, now = Date.now()): PersonalState {
  if (raw === null) return { ...EMPTY_PERSONAL_STATE };

  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      // Legacy count-only values have no trustworthy age. Let the server decide
      // whether the token is still capped; it supplies resetAt on rejection.
      return { ...EMPTY_PERSONAL_STATE };
    }
    const record = value as { count?: unknown; lastAcceptedAt?: unknown };
    if (typeof record.count !== "number" || typeof record.lastAcceptedAt !== "number") {
      return { ...EMPTY_PERSONAL_STATE };
    }
    const count = Math.min(Math.max(Math.floor(record.count), 0), MAX_MINE);
    if (count === 0) return { ...EMPTY_PERSONAL_STATE };
    const lastAcceptedAt = Number.isFinite(record.lastAcceptedAt)
      ? Math.min(record.lastAcceptedAt, now)
      : 0;
    if (lastAcceptedAt <= now - ACTION_RETENTION_MS) return { ...EMPTY_PERSONAL_STATE };
    return { count, lastAcceptedAt };
  } catch {
    return { ...EMPTY_PERSONAL_STATE };
  }
}

function personalStateFromStorageKey(slug: string): PersonalState {
  try {
    const raw = localStorage.getItem(storageKey(slug));
    if (raw === null) {
      const fallback = fallbackMine.get(slug);
      return fallback ? personalStateFromStorage(JSON.stringify(fallback)) : { ...EMPTY_PERSONAL_STATE };
    }
    const state = personalStateFromStorage(raw);
    if (raw !== JSON.stringify(state)) localStorage.setItem(storageKey(slug), JSON.stringify(state));
    fallbackMine.delete(slug);
    return state;
  } catch {
    const fallback = fallbackMine.get(slug);
    if (!fallback) return { ...EMPTY_PERSONAL_STATE };
    const state = personalStateFromStorage(JSON.stringify(fallback));
    fallbackMine.set(slug, state);
    return state;
  }
}

function mineFromStorage(slug: string): number {
  return personalStateFromStorageKey(slug).count;
}

function queueFor(button: HTMLButtonElement, slug: string): LikeQueue {
  let queue = likeQueues.get(button);
  if (!queue) {
    const personal = personalStateFromStorageKey(slug);
    queue = {
      slug,
      button,
      actions: [],
      pending: 0,
      inFlight: false,
      confirmedMine: personal.count,
      lastAcceptedAt: personal.lastAcceptedAt,
    };
    likeQueues.set(button, queue);
  }
  return queue;
}

function storeMine(slug: string, mine: number, lastAcceptedAt = Date.now()): void {
  const state = mine > 0
    ? { count: Math.min(mine, MAX_MINE), lastAcceptedAt }
    : { ...EMPTY_PERSONAL_STATE };
  try {
    localStorage.setItem(storageKey(slug), JSON.stringify(state));
    fallbackMine.delete(slug);
  } catch {
    fallbackMine.set(slug, state);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function scheduleCapReset(button: HTMLButtonElement, slug: string, state: PersonalState): void {
  const existing = resetTimers.get(button);
  if (existing !== undefined) window.clearTimeout(existing);
  resetTimers.delete(button);

  if (state.count < MAX_MINE || state.lastAcceptedAt <= 0) return;
  const remaining = state.lastAcceptedAt + ACTION_RETENTION_MS - Date.now();
  if (remaining <= 0) return;
  const timer = window.setTimeout(() => {
    resetTimers.delete(button);
    if (button.isConnected) renderPersonalState(button, slug);
  }, Math.min(remaining, MAX_TIMER_DELAY_MS));
  resetTimers.set(button, timer);
}

export function renderPersonalState(button: HTMLButtonElement, slug: string, animateProgress = false): void {
  const queue = likeQueues.get(button);
  const state = queue && queue.pending > 0
    ? { count: queue.confirmedMine + queue.pending, lastAcceptedAt: Date.now() }
    : personalStateFromStorageKey(slug);
  const mine = state.count;
  scheduleCapReset(button, slug, state);
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

async function sendLike(slug: string): Promise<{ ok: boolean; status: number; data: LikesResponse } | null> {
  try {
    const response = await fetch("/api/likes", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-like-visitor-token": visitorToken(),
      },
      body: JSON.stringify({ slug }),
    });
    let data: LikesResponse = {};
    try {
      const parsed: unknown = await response.json();
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) data = parsed as LikesResponse;
    } catch {
      // Preserve the HTTP status even when an edge-generated body is not JSON.
    }
    return { ok: response.ok, status: response.status, data };
  } catch {
    return null;
  }
}

function showLikeFailure(queue: LikeQueue, message: string): void {
  queue.button.dataset.likeQueueFailed = "true";
  const hint = queue.button.parentElement?.querySelector<HTMLElement>("[data-like-hint]");
  if (hint) hint.textContent = message;
  shake(queue.button);
}

function clearPendingLikes(queue: LikeQueue, mine: number, lastAcceptedAt: number): void {
  queue.actions.length = 0;
  queue.pending = 0;
  queue.confirmedMine = mine;
  queue.lastAcceptedAt = lastAcceptedAt;
  storeMine(queue.slug, mine, lastAcceptedAt);
  renderPersonalState(queue.button, queue.slug);
}

async function drainLikeQueue(queue: LikeQueue): Promise<void> {
  if (queue.inFlight) return;
  queue.inFlight = true;
  try {
    while (queue.actions.length > 0) {
      const action = queue.actions.shift()!;
      const result = await sendLike(queue.slug);
      if (result?.data.error === "limit-reached") {
        const lastAcceptedAt = typeof result.data.resetAt === "number" && Number.isSafeInteger(result.data.resetAt)
          ? result.data.resetAt - ACTION_RETENTION_MS
          : Date.now();
        clearPendingLikes(queue, MAX_MINE, lastAcceptedAt);
        break;
      }

      if (result?.ok) {
        queue.pending -= 1;
        queue.confirmedMine = Math.min(queue.confirmedMine + 1, MAX_MINE);
        queue.lastAcceptedAt = Date.now();
        storeMine(queue.slug, queue.confirmedMine, queue.lastAcceptedAt);
        renderPersonalState(queue.button, queue.slug, true);
        if (action.completesPersonalProgress) completeHeart(queue.button);
        continue;
      }

      if (result && result.status >= 400 && result.status < 500) {
        clearPendingLikes(queue, queue.confirmedMine, queue.lastAcceptedAt);
        showLikeFailure(
          queue,
          result.status === 429 || result.data.error === "rate-limited"
            ? "The likes service is busy. Unsent likes were removed; try again shortly."
            : "This like was rejected. Your unconfirmed likes were removed. Please try again."
        );
        break;
      }

      // A network/5xx failure may have committed, but the server remains the
      // cap authority. Drop all optimistic state, never retry automatically,
      // and let a later successful response or limit-reached response reconcile.
      clearPendingLikes(queue, queue.confirmedMine, queue.lastAcceptedAt);
      showLikeFailure(
        queue,
        "The server could not confirm this like. Queued likes were stopped; try again when the connection is stable."
      );
      break;
    }
  } finally {
    queue.inFlight = false;
  }
}

function like(button: HTMLButtonElement, slug: string): void {
  const queue = queueFor(button, slug);
  if (queue.pending === 0 && !queue.inFlight) {
    const personal = personalStateFromStorageKey(slug);
    queue.confirmedMine = personal.count;
    queue.lastAcceptedAt = personal.lastAcceptedAt;
  }
  const mine = queue.confirmedMine + queue.pending;
  if (mine >= MAX_MINE) {
    renderPersonalState(button, slug);
    return;
  }

  const completesPersonalProgress = mine === MAX_MINE - 1;
  queue.actions.push({ completesPersonalProgress });
  queue.pending += 1;
  if (!completesPersonalProgress) popHeart(button);
  renderPersonalState(button, slug, true);
  if (!queue.inFlight) void drainLikeQueue(queue);
}

function refreshPersonalStates(): void {
  document.querySelectorAll<HTMLButtonElement>("[data-like-button]").forEach((button) => {
    const slug = button.dataset.likeSlug;
    if (slug) renderPersonalState(button, slug);
  });
}

let capResetListenersInstalled = false;

export async function initLikeButtons(): Promise<void> {
  if (!capResetListenersInstalled) {
    window.addEventListener("focus", refreshPersonalStates);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) refreshPersonalStates();
    });
    capResetListenersInstalled = true;
  }

  document.querySelectorAll<HTMLButtonElement>("[data-like-button]").forEach((button) => {
    if (button.dataset.likeReady === "true") return;
    button.dataset.likeReady = "true";

    const slug = button.dataset.likeSlug;
    if (!slug) return;

    renderPersonalState(button, slug);

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

    // Hold-to-repeat queues each action at the configured cadence. A separate
    // per-button worker serializes POSTs without blocking the interaction.
    let holding = false;
    let holdDelivered = 0;
    let holdGeneration = 0;
    const stopHold = () => {
      holding = false;
      holdGeneration += 1;
    };
    const runHold = async (generation: number): Promise<void> => {
      await sleep(HOLD_START_DELAY_MS);
      while (generation === holdGeneration && holding && button.isConnected && !button.disabled && button.dataset.likeQueueFailed !== "true" && mineFromStorage(slug) < MAX_MINE) {
        like(button, slug);
        holdDelivered += 1;
        if (generation !== holdGeneration || !holding || button.disabled || button.dataset.likeQueueFailed === "true" || mineFromStorage(slug) >= MAX_MINE) break;
        await sleep(HOLD_REPEAT_MS);
      }
    };
    const startHold = () => {
      holding = true;
      holdDelivered = 0;
      delete button.dataset.likeQueueFailed;
      holdGeneration += 1;
      void runHold(holdGeneration);
    };

    button.addEventListener("click", () => {
      if (button.disabled) return;
      // A completed hold already delivered its likes; the trailing click
      // (pointer or keyboard) must not add one more.
      if (holdDelivered > 0) {
        holdDelivered = 0;
        return;
      }
      like(button, slug);
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
