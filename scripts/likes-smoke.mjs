/**
 * Smoke test for functions/api/likes.js — exercises the real Pages Function
 * handlers against an in-memory SQLite database that speaks the D1 surface
 * (prepare/bind/first/run). No network, no Cloudflare account needed.
 *
 * Covers: zero-state GET, like increments to the 10 cap, 11th-like rejection
 * without count movement, rate limit, slug validation, unconfigured env,
 * separate visitors, and that no response ever leaks the IP or visitor hash.
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
const env = () => ({ LIKES_DB: new FakeD1(), LIKES_SALT: SALT });
const waitUntil = () => {};

const get = (e, slug) =>
  onRequestGet({
    request: new Request(`https://site.test/api/likes?slug=${slug}`),
    env: e,
  });
const post = (e, slug, ip = "203.0.113.7") =>
  onRequestPost({
    request: new Request("https://site.test/api/likes", {
      method: "POST",
      headers: { "content-type": "application/json", "cf-connecting-ip": ip },
      body: JSON.stringify({ slug }),
    }),
    env: e,
    waitUntil,
  });

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

// 1. Zero-state GET.
let e = env();
let res = await get(e, "my-post");
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

// 4. A different visitor gets their own 10.
for (let i = 0; i < 10; i++) {
  res = await post(e, "my-post", "198.51.100.9");
}
res = await get(e, "my-post");
await check("second visitor adds 10 more → count 20", async () =>
  assert.equal((await res.json()).count, 20));

// 5. Per-post caps are independent.
res = await post(e, "other-post");
await check("capped visitor can like a different post", async () => {
  assert.equal(res.status, 200);
  assert.equal((await res.json()).count, 1);
});

// 6. Rate limit: fresh visitor, hammer past 20 requests in the window.
for (let i = 0; i < 20; i++) {
  res = await post(e, `rate-post-${i}`, "192.0.2.50");
  assert.equal(res.status, 200, `request ${i + 1} should be allowed`);
}
res = await post(e, "rate-post-20", "192.0.2.50");
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
res = await post(e, "ok-slug");
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

// 9. No IP or visitor hash appears in any response.
e = env();
const seen = [];
for (let i = 0; i < 12; i++) {
  res = await post(e, "leak-post", "203.0.113.99");
  seen.push(res.status, JSON.stringify(await res.json()));
}
res = await get(e, "leak-post");
seen.push(res.status, JSON.stringify(await res.json()));
await check("no IP or hash in any response body", () => {
  const all = seen.join(" ");
  assert.ok(!all.includes("203.0.113.99"));
  assert.ok(!/[0-9a-f]{64}/.test(all)); // raw or hex hmac digest
});

// 10. Missing IP header still works (anonymous bucket).
e = env();
res = await onRequestPost({
  request: new Request("https://site.test/api/likes", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ slug: "anon" }),
  }),
  env: e,
  waitUntil,
});
await check("missing cf-connecting-ip degrades to shared bucket", () =>
  assert.equal(res.status, 200));

console.log(checks.join("\n"));
console.log(process.exitCode ? "SMOKE TEST FAILED" : "SMOKE TEST PASSED");
