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
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { onRequestGet, onRequestPost } from "../functions/api/likes.js";

const SCHEMA = ["0001_likes.sql", "0002_likes_cleanup_indexes.sql"]
  .map((name) => readFileSync(new URL(`../migrations/${name}`, import.meta.url), "utf8"))
  .join("\n");

/** Minimal D1-compatible wrapper over node:sqlite. */
class FakeD1 {
  constructor() {
    this.db = new DatabaseSync(":memory:");
    this.db.exec(SCHEMA);
    this.batchQueue = Promise.resolve();
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
    const operation = this.batchQueue.then(async () => {
      this.db.exec("BEGIN");
      try {
        const results = [];
        for (const statement of statements) results.push(await statement.all());
        this.db.exec("COMMIT");
        return results;
      } catch (error) {
        this.db.exec("ROLLBACK");
        throw error;
      }
    });
    this.batchQueue = operation.catch(() => {});
    return operation;
  }
}

const SALT = "test-salt";
const TOKEN_A = "a".repeat(64);
const TOKEN_B = "b".repeat(64);
const TOKEN_C = "c".repeat(64);
const TOKEN_D = "d".repeat(64);
const publishedSlugs = new Set([
  "token-required", "bad-token", "my-post", "race-post", "cap-post", "other-post",
  "ok-slug", "token-leak-post", "no-ip-needed", "building-quality-gated-ai-code-review-loops",
  ...Array.from({ length: 21 }, (_, index) => `rate-post-${index}`),
]);
const env = () => ({
  LIKES_DB: new FakeD1(),
  LIKES_SALT: SALT,
  ASSETS: {
    fetch: async () => new Response(JSON.stringify([...publishedSlugs]), {
      headers: { "content-type": "application/json" },
    }),
  },
});
const waitUntil = () => {};
let e;
let res;
let body;

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

await check("local Wrangler config is ignored and the safe template is explicit", () => {
  assert.equal(execFileSync("git", ["check-ignore", "--no-index", "wrangler.toml"], { encoding: "utf8" }).trim(), "wrangler.toml");
  assert.ok(existsSync(new URL("../wrangler.local.toml.example", import.meta.url)));
});

await check("test D1 batch rolls back if a later statement violates schema", async () => {
  const db = new FakeD1();
  await assert.rejects(db.batch([
    db.prepare("INSERT INTO like_counts (slug, count) VALUES (?, ?)").bind("atomic", 1),
    db.prepare("INSERT INTO like_counts (slug, count) VALUES (?, ?)").bind("invalid", -1),
  ]));
  assert.equal(db.db.prepare("SELECT COUNT(*) AS count FROM like_counts WHERE slug = 'atomic'").get().count, 0);
});

await check("cleanup migration indexes expiry columns", () => {
  const migration = readFileSync(new URL("../migrations/0002_likes_cleanup_indexes.sql", import.meta.url), "utf8");
  assert.match(migration, /ON like_actions\s*\(last_ts\)/i);
  assert.match(migration, /ON like_rate\s*\(window_start\)/i);
});

await check("30-day inactivity lets the same visitor like again at the exact reset boundary", async () => {
  const testEnv = env();
  const originalNow = Date.now;
  let now = 1_800_000_000_000;
  Date.now = () => now;
  try {
    for (let index = 0; index < 10; index += 1) {
      const result = await post(testEnv, "my-post", TOKEN_C);
      assert.equal(result.status, 200);
    }
    testEnv.LIKES_DB.db.prepare("UPDATE like_actions SET last_ts = ? WHERE slug = ?")
      .run(now - 30 * 24 * 60 * 60_000 + 1, "my-post");
    const justBefore = await post(testEnv, "my-post", TOKEN_C);
    assert.equal(justBefore.status, 429);
    assert.equal((await justBefore.json()).resetAt, now + 1);

    now += 1;
    const atBoundary = await post(testEnv, "my-post", TOKEN_C);
    assert.equal(atBoundary.status, 200);
    assert.equal((await atBoundary.json()).count, 11);
  } finally {
    Date.now = originalNow;
  }
});

await check("cleanup is sampled and expires caps only after 30 days of inactivity", async () => {
  const testEnv = env();
  const db = testEnv.LIKES_DB.db;
  const originalNow = Date.now;
  const now = 1_800_000_000_000;
  Date.now = () => now;
  const originalRandom = Math.random;
  db.prepare("INSERT INTO like_actions (visitor_hash, slug, likes_given, last_ts) VALUES (?, ?, ?, ?)")
    .run("expired-hash", "my-post", 1, now - 31 * 24 * 60 * 60_000);
  db.prepare("INSERT INTO like_actions (visitor_hash, slug, likes_given, last_ts) VALUES (?, ?, ?, ?)")
    .run("recent-hash", "other-post", 1, now - 29 * 24 * 60 * 60_000);
  db.prepare("INSERT INTO like_actions (visitor_hash, slug, likes_given, last_ts) VALUES (?, ?, ?, ?)")
    .run("boundary-hash", "boundary-post", 1, now - 30 * 24 * 60 * 60_000);
  db.prepare("INSERT INTO like_rate (visitor_hash, window_start, hits) VALUES (?, ?, ?)")
    .run("expired-rate", now - 3 * 60_000, 1);

  const scheduled = [];
  const request = () => new Request("https://site.test/api/likes", {
    method: "POST",
    headers: { "content-type": "application/json", "x-like-visitor-token": TOKEN_A },
    body: JSON.stringify({ slug: "my-post" }),
  });
  try {
    Math.random = () => 0.99;
    res = await onRequestPost({ request: request(), env: testEnv, waitUntil: (promise) => scheduled.push(promise) });
    assert.equal(res.status, 200);
    assert.equal(scheduled.length, 0);
    assert.equal(db.prepare("SELECT COUNT(*) AS count FROM like_actions WHERE visitor_hash = 'expired-hash'").get().count, 1);
    assert.equal(db.prepare("SELECT COUNT(*) AS count FROM like_rate WHERE visitor_hash = 'expired-rate'").get().count, 0);

    Math.random = () => 0;
    res = await onRequestPost({ request: request(), env: testEnv, waitUntil: (promise) => scheduled.push(promise) });
    assert.equal(res.status, 200);
    await Promise.all(scheduled);
    assert.equal(db.prepare("SELECT COUNT(*) AS count FROM like_actions WHERE visitor_hash = 'expired-hash'").get().count, 0);
    assert.equal(db.prepare("SELECT COUNT(*) AS count FROM like_actions WHERE visitor_hash = 'recent-hash'").get().count, 1);
    assert.equal(db.prepare("SELECT COUNT(*) AS count FROM like_actions WHERE visitor_hash = 'boundary-hash'").get().count, 0);
    assert.equal(db.prepare("SELECT COUNT(*) AS count FROM like_rate WHERE visitor_hash = 'expired-rate'").get().count, 0);
  } finally {
    Math.random = originalRandom;
    Date.now = originalNow;
  }
});

await check("public count reads use short edge cache and writes invalidate it", async () => {
  const previousCaches = Object.getOwnPropertyDescriptor(globalThis, "caches");
  const entries = new Map();
  const cache = {
    match: async (request) => entries.get(request.url)?.clone() ?? undefined,
    put: async (request, response) => entries.set(request.url, response.clone()),
    delete: async (request) => entries.delete(request.url),
  };
  Object.defineProperty(globalThis, "caches", { configurable: true, value: { default: cache } });
  const testEnv = env();
  const pending = [];
  const originalRandom = Math.random;
  const read = () => onRequestGet({
    request: new Request("https://site.test/api/likes?slug=my-post"),
    env: testEnv,
    waitUntil: (promise) => pending.push(promise),
  });
  try {
    Math.random = () => 0.99;
    res = await read();
    assert.match(res.headers.get("cache-control"), /s-maxage=10/);
    assert.equal((await res.json()).count, 0);
    await Promise.all(pending.splice(0));

    testEnv.LIKES_DB.db.prepare("INSERT INTO like_counts (slug, count) VALUES (?, ?)").run("my-post", 7);
    res = await read();
    assert.equal((await res.json()).count, 0);

    res = await onRequestPost({
      request: new Request("https://site.test/api/likes", {
        method: "POST",
        headers: { "content-type": "application/json", "x-like-visitor-token": TOKEN_A },
        body: JSON.stringify({ slug: "my-post" }),
      }),
      env: testEnv,
      waitUntil: (promise) => pending.push(promise),
    });
    assert.equal(res.status, 200);
    await Promise.all(pending.splice(0));
    res = await read();
    assert.equal((await res.json()).count, 8);
  } finally {
    Math.random = originalRandom;
    if (previousCaches) Object.defineProperty(globalThis, "caches", previousCaches);
    else delete globalThis.caches;
  }
});

// 1. Unknown but well-formed slugs must not create aggregate or action rows.
e = env();
res = await get(e, "unpublished-post");
await check("GET rejects an unpublished slug without creating a count row", async () => {
  assert.equal(res.status, 404);
  assert.equal((await res.json()).error, "not-found");
  assert.equal(e.LIKES_DB.db.prepare("SELECT COUNT(*) AS count FROM like_counts").get().count, 0);
});
res = await post(e, "unpublished-post", TOKEN_A);
await check("POST rejects an unpublished slug without creating database rows", async () => {
  assert.equal(res.status, 404);
  assert.equal((await res.json()).error, "not-found");
  assert.equal(e.LIKES_DB.db.prepare("SELECT COUNT(*) AS count FROM like_counts").get().count, 0);
  assert.equal(e.LIKES_DB.db.prepare("SELECT COUNT(*) AS count FROM like_actions").get().count, 0);
});

await check("POST body over 1 KiB is rejected before JSON parsing", async () => {
  const oversized = await onRequestPost({
    request: new Request("https://site.test/api/likes", {
      method: "POST",
      headers: { "content-type": "application/json", "x-like-visitor-token": TOKEN_A },
      body: JSON.stringify({ slug: "my-post", padding: "x".repeat(2048) }),
    }),
    env: env(),
    waitUntil,
  });
  assert.equal(oversized.status, 413);
  assert.deepEqual(await oversized.json(), { error: "request-too-large" });
});

// POST identity is a random first-party browser token, never the connection IP.
e = env();
res = await onRequestPost({
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
body = await res.json();
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
  assert.ok(Number.isSafeInteger(body.resetAt) && body.resetAt > Date.now());
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

// 7. Rate limit: freeze the clock so this burst cannot cross a minute boundary.
await check("21st request in a fixed window → 429 rate-limited", async () => {
  e = env();
  const originalNow = Date.now;
  Date.now = () => 1_800_000_000_000;
  try {
    for (let i = 0; i < 20; i++) {
      res = await post(e, `rate-post-${i}`, TOKEN_C);
      assert.equal(res.status, 200, `request ${i + 1} should be allowed`);
    }
    res = await post(e, "rate-post-20", TOKEN_C);
    body = await res.json();
    assert.equal(res.status, 429);
    assert.equal(body.error, "rate-limited");
    const row = e.LIKES_DB.db.prepare("SELECT MAX(hits) AS hits FROM like_rate").get();
    assert.equal(row.hits, 20);
  } finally {
    Date.now = originalNow;
  }
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
await check("missing LIKES_DB returns a generic service error", async () => {
  assert.equal(res.status, 503);
  assert.deepEqual(await res.json(), { error: "likes service unavailable" });
});
res = await post({ LIKES_DB: new FakeD1() }, "x");
await check("missing LIKES_SALT returns a generic service error", async () => {
  assert.equal(res.status, 503);
  assert.deepEqual(await res.json(), { error: "likes service unavailable" });
});

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

await check("rate-limit digests rotate across fixed windows", async () => {
  e = env();
  const originalNow = Date.now;
  let now = 1_800_000_000_000;
  Date.now = () => now;
  try {
    await post(e, "my-post", TOKEN_D);
    now += 60_000;
    await post(e, "other-post", TOKEN_D);
    const rows = e.LIKES_DB.db.prepare("SELECT visitor_hash, window_start FROM like_rate ORDER BY window_start").all();
    assert.equal(rows.length, 2);
    assert.notEqual(rows[0].visitor_hash, rows[1].visitor_hash);
  } finally {
    Date.now = originalNow;
  }
});

await check("action hashes are unlinkable across posts for the same token", async () => {
  e = env();
  await post(e, "my-post", TOKEN_D);
  await post(e, "other-post", TOKEN_D);
  const hashes = e.LIKES_DB.db.prepare("SELECT visitor_hash FROM like_actions ORDER BY slug").all();
  assert.equal(hashes.length, 2);
  assert.notEqual(hashes[0].visitor_hash, hashes[1].visitor_hash);
});

// 10. Requests do not need or key on a connection IP.
e = env();
res = await post(e, "no-ip-needed", TOKEN_A, null);
await check("valid browser token works without cf-connecting-ip", () => assert.equal(res.status, 200));

// 11. Thirteen requests from one opaque token: 10 personal actions accepted;
// a seeded public aggregate from other visitors may still show 13.
e = env();
const reportedSlug = "building-quality-gated-ai-code-review-loops";
const sameVisitorToken = randomBytes(32).toString("hex");
e.LIKES_DB.db.prepare("INSERT INTO like_counts (slug, count) VALUES (?, ?)").run(reportedSlug, 3);
const attempts = [];
for (let index = 0; index < 13; index += 1) {
  const response = await post(e, reportedSlug, sameVisitorToken, null);
  attempts.push({ status: response.status, body: await response.json() });
}
await check("same token: 10 accepted, requests 11–13 rejected; public aggregate stays 13", async () => {
  assert.deepEqual(attempts.slice(0, 10).map(({ status }) => status), Array(10).fill(200));
  assert.deepEqual(attempts.slice(10).map(({ status }) => status), Array(3).fill(429));
  assert.equal(attempts[9].body.count, 13);
  assert.ok(attempts.slice(10).every(({ body }) => body.error === "limit-reached" && body.count === 13));
  assert.equal((await (await get(e, reportedSlug)).json()).count, 13);
});

console.log(checks.join("\n"));
console.log(process.exitCode ? "SMOKE TEST FAILED" : "SMOKE TEST PASSED");
