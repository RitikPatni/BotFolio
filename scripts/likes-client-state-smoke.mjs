import assert from "node:assert/strict";
import { loadCount, personalStateFromStorage, renderPersonalState } from "../src/utils/likeButton.client.ts";

const now = 1_800_000_000_000;
const retention = 30 * 24 * 60 * 60_000;

assert.deepEqual(personalStateFromStorage(JSON.stringify({ count: 10, lastAcceptedAt: now - retention - 1 }), now), {
  count: 0,
  lastAcceptedAt: 0,
});
assert.deepEqual(personalStateFromStorage(JSON.stringify({ count: 10, lastAcceptedAt: now - retention + 1 }), now), {
  count: 10,
  lastAcceptedAt: now - retention + 1,
});
assert.deepEqual(personalStateFromStorage("10", now), { count: 0, lastAcceptedAt: 0 });
assert.deepEqual(personalStateFromStorage("invalid", now), { count: 0, lastAcceptedAt: 0 });

const storage = new Map([["botfolio:likes:open-post", JSON.stringify({ count: 10, lastAcceptedAt: now })]]);
const timerCallbacks = new Map();
let nextTimerId = 0;
let scheduledDelay = 0;
let currentTime = now;
const originalDateNow = Date.now;
const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
const previousLocalStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
Date.now = () => currentTime;
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
  },
});
Object.defineProperty(globalThis, "window", {
  configurable: true,
  value: {
    setTimeout: (callback, delay) => {
      scheduledDelay = delay;
      const id = ++nextTimerId;
      timerCallbacks.set(id, callback);
      return id;
    },
    clearTimeout: (id) => timerCallbacks.delete(id),
  },
});
const button = {
  dataset: {},
  style: { setProperty() {} },
  classList: { toggle() {} },
  disabled: false,
  isConnected: true,
  parentElement: null,
  querySelector: () => null,
};
try {
  renderPersonalState(button, "open-post");
  assert.equal(button.disabled, true);
  assert.equal(button.dataset.likeMine, "10");
  assert.equal(scheduledDelay, 2_147_000_000);
  assert.equal(timerCallbacks.size, 1);

  const runNextTimer = () => {
    const [id, callback] = timerCallbacks.entries().next().value;
    timerCallbacks.delete(id);
    callback();
  };
  currentTime = now + scheduledDelay;
  runNextTimer(); // Long timeouts must reschedule rather than silently expire.
  assert.equal(button.disabled, true);
  assert.equal(button.dataset.likeMine, "10");
  assert.equal(scheduledDelay, retention - 2_147_000_000);
  assert.equal(timerCallbacks.size, 1);

  currentTime = now + retention;
  runNextTimer(); // Simulates the page staying open until the reset timer fires.
  assert.equal(button.disabled, false);
  assert.equal(button.dataset.likeMine, "0");
  assert.equal(timerCallbacks.size, 0);
} finally {
  Date.now = originalDateNow;
  if (previousWindow) Object.defineProperty(globalThis, "window", previousWindow);
  else delete globalThis.window;
  if (previousLocalStorage) Object.defineProperty(globalThis, "localStorage", previousLocalStorage);
  else delete globalThis.localStorage;
}

const previousFetch = Object.getOwnPropertyDescriptor(globalThis, "fetch");
let publicCountLabel = "0";
Object.defineProperty(globalThis, "fetch", {
  configurable: true,
  value: async (url, options) => {
    assert.equal(url, "/api/likes?slug=open-post");
    assert.deepEqual(options.headers, { accept: "application/json" });
    return { ok: true, json: async () => ({ count: 42 }) };
  },
});
try {
  await loadCount({
    dataset: {},
    querySelector: () => ({ set textContent(value) { publicCountLabel = value; } }),
  }, "open-post");
  assert.equal(publicCountLabel, "42");
} finally {
  if (previousFetch) Object.defineProperty(globalThis, "fetch", previousFetch);
  else delete globalThis.fetch;
}

console.log("CLIENT STATE SMOKE PASSED");
