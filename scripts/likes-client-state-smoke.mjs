import assert from "node:assert/strict";
import { initLikeButtons, loadCount, personalStateFromStorage, renderPersonalState } from "../src/utils/likeButton.client.ts";

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
const previousDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
currentTime = now;
Date.now = () => currentTime;
const postRequests = [];
const delayedCountReads = [];
let delayNextCountRead = false;
let failNextPost = false;
let failedPostAttempts = 0;
const eventListeners = new Map();
const windowListeners = new Map();
const windowTimers = new Map();
let fakeTimerId = 0;
let serverCount = 100;
storage.set("botfolio:likes:cap-post", JSON.stringify({ count: 9, lastAcceptedAt: now }));
const countLabel = { textContent: "0", classList: { add() {} }, cloneNode() { return { ...this }; }, replaceWith() {} };
const hint = { textContent: "" };
const makeButton = (slug, count = 0) => ({
  dataset: { likeSlug: slug, likeCount: String(count) },
  style: { setProperty() {} },
  classList: { toggle() {}, remove() {}, add() {} },
  disabled: false,
  isConnected: true,
  parentElement: { querySelector: () => hint },
  querySelector: (selector) => selector === "[data-like-count-value]" ? countLabel : null,
  closest: () => null,
  addEventListener(name, callback) { eventListeners.set(`${slug}:${name}`, callback); },
});
const queuedButton = makeButton("queued-post");
const capButton = makeButton("cap-post");
const holdButton = makeButton("hold-post");
Object.defineProperty(globalThis, "fetch", {
  configurable: true,
  value: async (url, options = {}) => {
    if (options.method === "POST") {
      if (failNextPost) {
        failNextPost = false;
        failedPostAttempts += 1;
        throw new Error("network unreachable");
      }
      let resolve;
      const response = new Promise((finish) => { resolve = finish; });
      postRequests.push({ url, options, resolve });
      return response;
    }
    if (delayNextCountRead) {
      delayNextCountRead = false;
      let resolve;
      const response = new Promise((finish) => { resolve = finish; });
      delayedCountReads.push({ resolve });
      return response;
    }
    return { ok: true, json: async () => ({ slug: "queued-post", count: serverCount }) };
  },
});
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
    addEventListener: (name, callback) => windowListeners.set(name, callback),
    setTimeout: (callback, delay) => {
      const id = ++fakeTimerId;
      windowTimers.set(id, { callback, delay });
      return id;
    },
    clearTimeout: (id) => windowTimers.delete(id),
  },
});
Object.defineProperty(globalThis, "document", {
  configurable: true,
  value: {
    hidden: false,
    addEventListener() {},
    querySelector: () => null,
    querySelectorAll: () => [queuedButton, capButton, holdButton],
  },
});
const flush = async () => new Promise((resolve) => setTimeout(resolve, 0));
const waitFor = async (predicate) => {
  for (let attempt = 0; attempt < 20 && !predicate(); attempt += 1) await flush();
  assert.ok(predicate(), "expected queued request did not start");
};
const reply = (request, status, data) => request.resolve({ ok: status >= 200 && status < 300, status, json: async () => data });
const replyWithoutJson = (request, status) => request.resolve({ ok: false, status, json: async () => { throw new Error("non-JSON edge response"); } });
const fireTimer = async (id) => {
  const timer = windowTimers.get(id);
  assert.ok(timer, `timer ${id} should be pending`);
  windowTimers.delete(id);
  timer.callback();
  await flush();
};
const timerIdForDelay = (delay, occurrence = 0) => [...windowTimers]
  .filter(([, timer]) => timer.delay === delay)[occurrence]?.[0];
try {
  await initLikeButtons();
  await flush(); // initial public count read
  const click = (button) => eventListeners.get(`${button.dataset.likeSlug}:click`)();
  delayNextCountRead = true;
  const staleCountRead = loadCount(queuedButton, "queued-post");
  assert.equal(delayedCountReads.length, 1);

  click(capButton);
  click(capButton);
  assert.equal(capButton.dataset.likeMine, "10", "the final available personal slot is reserved immediately");
  assert.equal(capButton.disabled, true, "queued likes cannot exceed the local 10-like cap");
  assert.equal(JSON.parse(storage.get("botfolio:likes:cap-post")).count, 9, "pending actions are not persisted as accepted across reloads");
  assert.equal(postRequests.length, 1, "a rapid second click after the cap does not enqueue another POST");
  serverCount = 101;
  reply(postRequests[0], 200, { slug: "cap-post", count: serverCount });
  await flush();
  assert.equal(capButton.dataset.likeMine, "10");
  assert.equal(capButton.disabled, true);
  assert.equal(JSON.parse(storage.get("botfolio:likes:cap-post")).count, 10);
  click(queuedButton);
  click(queuedButton);
  click(queuedButton);
  assert.equal(queuedButton.dataset.likeMine, "3", "three rapid taps reserve three personal slots immediately");
  assert.equal(storage.has("botfolio:likes:queued-post"), false, "unconfirmed taps are not persisted as accepted progress");
  assert.equal(postRequests.length, 2, "only one POST is in flight while the rest queue");
  assert.equal(queuedButton.dataset.likeCount, "103", "queued taps remain visible in the optimistic total");
  serverCount = 101; // The in-flight POST has reached D1, but its response is delayed.
  await loadCount(queuedButton, "queued-post");
  assert.equal(queuedButton.dataset.likeCount, "103", "a read cannot double-count an in-flight optimistic action");

  serverCount = 101;
  reply(postRequests[1], 200, { slug: "queued-post", count: serverCount });
  await waitFor(() => postRequests.length === 3);
  assert.equal(JSON.parse(storage.get("botfolio:likes:queued-post")).count, 1, "only the confirmed like is persisted while others remain queued");
  assert.equal(queuedButton.dataset.likeCount, "103", "the first response must not erase remaining optimistic taps");
  serverCount = 102;
  reply(postRequests[2], 200, { slug: "queued-post", count: serverCount });
  await waitFor(() => postRequests.length === 4);
  serverCount = 103;
  reply(postRequests[3], 200, { slug: "queued-post", count: serverCount });
  await flush();
  assert.equal(queuedButton.dataset.likeMine, "3");
  assert.equal(queuedButton.dataset.likeCount, "103");
  assert.equal(JSON.parse(storage.get("botfolio:likes:queued-post")).count, 3);
  delayedCountReads[0].resolve({ ok: true, json: async () => ({ slug: "queued-post", count: 100 }) });
  await staleCountRead;
  assert.equal(queuedButton.dataset.likeCount, "103", "a stale pre-mutation GET cannot overwrite later POST responses");

  click(queuedButton);
  click(queuedButton);
  await waitFor(() => postRequests.length === 5);
  replyWithoutJson(postRequests[4], 429);
  await flush();
  assert.equal(postRequests.length, 5, "a 429 stops queued requests instead of retrying them");
  assert.equal(queuedButton.dataset.likeMine, "3", "rejected and unsent taps roll back to confirmed personal progress");
  assert.equal(queuedButton.dataset.likeCount, "103", "a rejected burst restores the last confirmed aggregate");
  assert.match(hint.textContent, /service is busy/, "non-JSON edge 429s still show rate-limit feedback");

  click(queuedButton);
  click(queuedButton);
  await waitFor(() => postRequests.length === 6);
  serverCount = 104; // The server may commit before the response is lost.
  reply(postRequests[5], 503, { error: "likes service unavailable" });
  await flush();
  assert.equal(postRequests.length, 6, "an ambiguous server error stops rather than replaying queued actions");
  assert.equal(queuedButton.dataset.likeMine, "3", "an ambiguous error never persists unconfirmed progress toward the cap");
  assert.equal(JSON.parse(storage.get("botfolio:likes:queued-post")).count, 3, "ambiguous failures cannot build toward a 30-day lockout");
  assert.match(hint.textContent, /could not confirm/);
  await flush();
  assert.equal(queuedButton.dataset.likeCount, "104", "a read reconciles the aggregate after an ambiguous response");

  failNextPost = true;
  click(queuedButton);
  await flush();
  assert.equal(failedPostAttempts, 1, "a network-level failure reaches the ambiguous path");
  assert.equal(queuedButton.dataset.likeMine, "3", "a network failure must not persist unconfirmed progress");
  assert.equal(JSON.parse(storage.get("botfolio:likes:queued-post")).count, 3);
  assert.match(hint.textContent, /could not confirm/);
  serverCount = 105;
  click(queuedButton);
  await waitFor(() => postRequests.length === 7);
  reply(postRequests[6], 200, { slug: "queued-post", count: serverCount });
  await flush();
  assert.equal(queuedButton.dataset.likeMine, "4", "the next successful like after a network failure is still accepted");
  assert.equal(JSON.parse(storage.get("botfolio:likes:queued-post")).count, 4);

  click(queuedButton);
  click(queuedButton);
  await waitFor(() => postRequests.length === 8);
  reply(postRequests[7], 429, { error: "limit-reached", slug: "queued-post", count: 105, resetAt: now + retention });
  await flush();
  assert.equal(postRequests.length, 8, "a limit-reached response stops the queued burst");
  assert.equal(queuedButton.dataset.likeMine, "10", "the server cap is applied immediately");
  assert.equal(queuedButton.disabled, true);
  assert.deepEqual(JSON.parse(storage.get("botfolio:likes:queued-post")), { count: 10, lastAcceptedAt: now }, "resetAt is converted to the accepted-at timestamp");

  eventListeners.get("hold-post:pointerdown")({ button: 0 });
  const firstHoldStart = timerIdForDelay(400);
  assert.ok(firstHoldStart);
  windowListeners.get("pointerup")(); // release before the 400ms hold threshold
  click(holdButton); // normal tap
  await waitFor(() => postRequests.length === 9);
  eventListeners.get("hold-post:pointerdown")({ button: 0 }); // press again before the old timer fires
  const secondHoldStart = timerIdForDelay(400, 1);
  assert.ok(secondHoldStart);

  await fireTimer(firstHoldStart);
  assert.equal(holdButton.dataset.likeMine, "1", "a cancelled pre-threshold hold cannot wake inside the next hold");
  await fireTimer(secondHoldStart);
  assert.equal(holdButton.dataset.likeMine, "2");
  const repeatTimer = timerIdForDelay(300);
  assert.ok(repeatTimer);
  await fireTimer(repeatTimer);
  assert.equal(holdButton.dataset.likeMine, "3", "hold repeat queues at 300ms cadence while the first response is delayed");
  windowListeners.get("pointerup")();
  click(holdButton); // the trailing click must not enqueue beyond the held actions
  assert.equal(holdButton.dataset.likeMine, "3");
  assert.equal(postRequests.length, 9, "only the first held request is in flight");

  serverCount = 105;
  reply(postRequests[8], 200, { slug: "hold-post", count: serverCount });
  await waitFor(() => postRequests.length === 10);
  serverCount = 106;
  reply(postRequests[9], 200, { slug: "hold-post", count: serverCount });
  await waitFor(() => postRequests.length === 11);
  serverCount = 107;
  reply(postRequests[10], 200, { slug: "hold-post", count: serverCount });
  await flush();
  assert.equal(holdButton.dataset.likeMine, "3");
} finally {
  Date.now = originalDateNow;
  if (previousFetch) Object.defineProperty(globalThis, "fetch", previousFetch);
  else delete globalThis.fetch;
  if (previousDocument) Object.defineProperty(globalThis, "document", previousDocument);
  else delete globalThis.document;
  if (previousWindow) Object.defineProperty(globalThis, "window", previousWindow);
  else delete globalThis.window;
  if (previousLocalStorage) Object.defineProperty(globalThis, "localStorage", previousLocalStorage);
  else delete globalThis.localStorage;
}

console.log("CLIENT STATE SMOKE PASSED");
