/**
 * Smoke test for functions/api/likes.js — exercises the real Pages Function
 * handlers against an in-memory SQLite database that speaks the D1 surface
 * (prepare/bind/first/run). No network, no Cloudflare account needed.
 *
 * Covers browser-token identity, zero-state GET, increments to the 10 cap,
 * rejected 11th like, concurrent requests, rate limits, slug validation,
 * unconfigured env, and token non-disclosure.
 *
 * Run (Node 22+, for node:sqlite):
 *   npx --yes --package=node@22 node scripts/likes-smoke.mjs
 */
import { DatabaseSync } from "node:sqlite";
import assert from "node:assert/strict";
import { onRequestGet, onRequestPost } from "../functions/api/likes.js";

const SCHEMA = `
CREATE TABLE like_counts (
  slug TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE like_actions (
  visitor_hash TEXT NOT NULL,
  slug TEXT NOT NULL,
  likes_given INTEGER NOT NULL DEFAULT 0,
  last_ts INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (visitor_hash, slug)
);
CREATE TABLE like_rate (
  visitor_hash TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  hits INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (visitor_hash, window_start)
);
`;

/** Minimal D1-compatible wrapper over node:sqlite. */
class FakeD1 {
  constructor() {
    this.db = new DatabaseSync(":memory:");
    this.db.exec(SCHEMA);
  }

  prepare(sql) {
    const statement = this.db.prepare(sql);
    return {
      bind: (...params) => ({
        first: async () => statement.get(...params) ?? null,
        run: async () => statement.run(...params),
        all: async () => ({ results: statement.all(...params) }),
      }),
      first: async () => statement.get() ?? null,
      run: async () => statement.run(),
    };
  }

  async batch(statements) {
    return Promise.all(statements.map((statement) => statement.all()));
  }
}

const SALT = "test-salt";
const TOKEN_A = "a".repeat(64);
const TOKEN_B = "b".repeat(64);
const TOKEN_C = "c".repeat(64);
const TOKEN_D = "d".repeat(64);
const env = () => ({ LIKES_DB: new FakeD1(), LIKES_SALT: SALT });
const waitUntil = () => {};

const get = (e, slug) =>
  onRequestGet({
    request: new Request(`https://site.test/api/likes?slug=${slug}`),
    env: e,
  });
const post = (e, slug, token = TOKEN_A, ip = "203.0.113.7") => {
  const headers = { "content-type": "application/json", "x-like-visitor-token": token };
  if (ip !== null) headers["cf-connecting-ip"] = ip;
  return onRequestPost({
    request: new Request("https://site.test/api/likes", {
      method: "POST",
      headers,
      body: JSON.stringify({ slug }),
    }),
    env: e,
    waitUntil,
  });
};

const checks = [];
const check = async (name, fn) => {
  try {
    await fn();
    checks.push(`PASS  ${name}`);
  } catch (error) {
    checks.push(`FAIL  ${name}  (${error.message})`);
    process.exitCode = 1;
  }
};

// POST identity is a random first-party browser token, never the connection IP.
let e = env();
let res = await onRequestPost({
  request: new Request("https://site.test/api/likes", {
    method: "POST",
    headers: { "content-type": "application/json", "cf-connecting-ip": "203.0.113.55" },
    body: JSON.stringify({ slug: "token-required" }),
  }),
  env: e,
  waitUntil,
});
await check("missing browser token is rejected even when an IP header exists", async () => {
  assert.equal(res.status, 400);
  assert.equal((await res.json()).error, "visitor-token-required");
});
res = await post(e, "bad-token", "not-a-256-bit-hex-token");
await check("malformed browser token rejected", async () => {
  assert.equal(res.status, 400);
  assert.equal((await res.json()).error, "invalid visitor token");
});

// 1. Zero-state GET.
e = env();
res = await get(e, "my-post");
let body = await res.json();
await check("zero-state GET → 200 {count:0}", () => {
  assert.equal(res.status, 200);
  assert.deepEqual(body, { slug: "my-post", count: 0 });
});

// 2. POSTs increment; cap at 10 per visitor.
let lastCount;
for (let i = 1; i <= 10; i++) {
  res = await post(e, "my-post");
  body = await res.json();
  lastCount = body.count;
}
await check("ten likes accepted, count reaches 10", () => assert.equal(lastCount, 10));

// 3. The 11th like is rejected and the count does not move.
res = await post(e, "my-post");
body = await res.json();
await check("11th like → 429 limit-reached", () => {
  assert.equal(res.status, 429);
  assert.equal(body.error, "limit-reached");
  assert.equal(body.count, 10);
});
res = await get(e, "my-post");
await check("count still 10 after rejection", async () => assert.equal((await res.json()).count, 10));

// 4. A different browser token gets its own 10; IP changes do not reset the first token.
res = await post(e, "my-post", TOKEN_A, "198.51.100.2");
await check("same browser token remains capped after IP changes", () => assert.equal(res.status, 429));
for (let i = 0; i < 10; i++) {
  res = await post(e, "my-post", TOKEN_B);
}
res = await get(e, "my-post");
await check("second browser token adds 10 more → count 20", async () =>
  assert.equal((await res.json()).count, 20));

// 5. Simultaneous requests for one browser token cannot exceed the cap.
e = env();
const concurrentResponses = await Promise.all(Array.from({ length: 20 }, () => post(e, "race-post", TOKEN_C)));
const concurrentBodies = await Promise.all(concurrentResponses.map((response) => response.json()));
res = await get(e, "race-post");
await check("concurrent same-token requests accept exactly ten", async () => {
  assert.equal(concurrentResponses.filter((response) => response.status === 200).length, 10);
  assert.equal(concurrentResponses.filter((response) => response.status === 429).length, 10);
  assert.ok(concurrentBodies.filter((body) => body.error === "limit-reached").length === 10);
  assert.equal((await res.json()).count, 10);
});

// 6. Caps are per post for each browser token.
e = env();
for (let i = 0; i < 10; i++) res = await post(e, "cap-post", TOKEN_A);
res = await post(e, "other-post", TOKEN_A);
await check("capped visitor can like a different post", async () => {
  assert.equal(res.status, 200);
  assert.equal((await res.json()).count, 1);
});

// 7. Rate limit: fresh browser token, hammer past 20 requests in the window.
e = env();
for (let i = 0; i < 20; i++) {
  res = await post(e, `rate-post-${i}`, TOKEN_C);
  assert.equal(res.status, 200, `request ${i + 1} should be allowed`);
}
res = await post(e, "rate-post-20", TOKEN_C);
body = await res.json();
await check("21st request in window → 429 rate-limited", () => {
  assert.equal(res.status, 429);
  assert.equal(body.error, "rate-limited");
});
await check("rate limit counter stops at 20", () => {
  const row = e.LIKES_DB.db.prepare("SELECT MAX(hits) AS hits FROM like_rate").get();
  assert.equal(row.hits, 20);
});

// 7. Slug validation.
for (const bad of ["", "UPPER", "has space", "a".repeat(161), "dot.slug", "semi;colon"]) {
  res = await get(e, encodeURIComponent(bad));
  check(`GET rejects invalid slug ${JSON.stringify(bad)} → 400`, () =>
    assert.equal(res.status, 400));
}
res = await post(env(), "ok-slug");
await check("valid slug shape accepted", () => assert.equal(res.status, 200));

// 8. Unconfigured env fails closed.
res = await onRequestGet({ request: new Request("https://site.test/api/likes?slug=x"), env: {} });
await check("missing LIKES_DB → 500 configured error", async () => {
  assert.equal(res.status, 500);
  assert.match((await res.json()).error, /not configured/);
});
res = await post({ LIKES_DB: new FakeD1() }, "x");
await check("missing LIKES_SALT → 500 configured error", () =>
  assert.equal(res.status, 500));

// 9. Raw browser tokens are not returned or stored in D1.
e = env();
const seen = [];
for (let i = 0; i < 12; i++) {
  res = await post(e, "token-leak-post", TOKEN_D);
  seen.push(res.status, JSON.stringify(await res.json()));
}
res = await get(e, "token-leak-post");
seen.push(res.status, JSON.stringify(await res.json()));
await check("no raw browser token in responses or D1", () => {
  const all = seen.join(" ");
  assert.ok(!all.includes(TOKEN_D));
  const rows = e.LIKES_DB.db.prepare("SELECT visitor_hash FROM like_actions").all();
  assert.ok(rows.length > 0);
  assert.ok(rows.every((row) => row.visitor_hash !== TOKEN_D && /^[0-9a-f]{64}$/.test(row.visitor_hash)));
});

// 10. Requests do not need or key on a connection IP.
e = env();
res = await post(e, "no-ip-needed", TOKEN_A, null);
await check("valid browser token works without cf-connecting-ip", () => assert.equal(res.status, 200));

console.log(checks.join("\n"));
console.log(process.exitCode ? "SMOKE TEST FAILED" : "SMOKE TEST PASSED");
