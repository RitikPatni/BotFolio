import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";

const base = (process.argv[2] && !process.argv[2].startsWith("--")
  ? process.argv[2]
  : "http://127.0.0.1:8788").replace(/\/$/, "");
const allowNonLocal = process.argv.includes("--allow-nonlocal");
const targetHost = new URL(base).hostname;
if (!["localhost", "127.0.0.1", "[::1]", "::1"].includes(targetHost) && !allowNonLocal) {
  console.error(`Refusing non-local likes smoke target ${targetHost}; pass --allow-nonlocal only for an intentional test.`);
  process.exit(2);
}
const slug = "building-quality-gated-ai-code-review-loops";
const tokenA = randomBytes(32).toString("hex");
const tokenB = randomBytes(32).toString("hex");
const tokenC = randomBytes(32).toString("hex");
const tokenD = randomBytes(32).toString("hex");
const tokenE = randomBytes(32).toString("hex");
const checks = [];

async function check(name, action) {
  try {
    await action();
    checks.push(`PASS  ${name}`);
  } catch (error) {
    checks.push(`FAIL  ${name}: ${error.message}`);
    process.exitCode = 1;
  }
}

async function get(target) {
  return fetch(`${base}/api/likes?slug=${encodeURIComponent(target)}`);
}
async function post(target, visitorToken = tokenA) {
  return fetch(`${base}/api/likes`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-like-visitor-token": visitorToken,
    },
    body: JSON.stringify({ slug: target }),
  });
}

async function waitForRateWindowStart() {
  const phase = Date.now() % 60_000;
  const targetPhase = 3_000;
  const delay = phase <= targetPhase ? targetPhase - phase : 60_000 - phase + targetPhase;
  if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
}

const manifestResponse = await fetch(`${base}/api/likes-posts.json`);
const publishedSlugs = manifestResponse.ok ? await manifestResponse.json() : [];
const otherSlug = publishedSlugs.find((candidate) => candidate !== slug);
await check("static published-slug manifest is served alongside the likes Function", () => {
  assert.equal(manifestResponse.status, 200);
  assert.match(manifestResponse.headers.get("content-type") ?? "", /application\/json/);
  assert.ok(Array.isArray(publishedSlugs));
  assert.ok(publishedSlugs.includes(slug));
  assert.ok(otherSlug, "at least two published posts are required for cap/rate tests");
  assert.equal(new Set(publishedSlugs).size, publishedSlugs.length);
});

const htmlResponse = await fetch(`${base}/blog/building-quality-gated-ai-code-review-loops`);
const articleHtml = await htmlResponse.text();
await check("rendered control carries slug on the initialized button", () => {
  assert.equal(htmlResponse.status, 200);
  assert.match(articleHtml, /<button[^>]*data-like-button[^>]*data-like-slug="building-quality-gated-ai-code-review-loops"/);
  assert.match(articleHtml, /class="floating-like"[^>]*hidden/);
});
await check("rendered like control exposes personal progress without a public aggregate", () => {
  assert.ok(articleHtml.includes("data-like-hint"));
  assert.ok(articleHtml.includes("The heart fill shows your personal progress toward 10 likes on this post."));
  assert.ok(!articleHtml.includes("data-like-count-value"));
  assert.ok(!articleHtml.includes("data-like-total-label"));
  assert.ok(!articleHtml.includes(">total<"));
});

await check("rendered page includes progressive fill and completion animation hooks", () => {
  assert.ok(articleHtml.includes("data-like-fill-window"));
  assert.ok(articleHtml.includes("floating-like__heart--pop"));
  assert.ok(articleHtml.includes("floating-like__heart--complete"));
  assert.ok(!articleHtml.includes("floating-like__halo"));
  assert.ok(articleHtml.includes('class="floating-like__status visually-hidden"'));
  assert.ok(articleHtml.includes("floating-like__button--error"));
});

let response = await get(slug);
let body = await response.json();
const initialCount = body.count;
await check("local Pages D1 serves a published slug at its current baseline", () => {
  assert.equal(response.status, 200);
  assert.deepEqual(body, { slug, count: initialCount });
});

response = await post(slug);
body = await response.json();
await check("a successful POST invalidates the cached public total", async () => {
  assert.equal(response.status, 200);
  assert.equal(body.count, initialCount + 1);
  const result = await get(slug);
  assert.equal((await result.json()).count, initialCount + 1);
});

for (let index = 1; index < 10; index += 1) {
  response = await post(slug);
  body = await response.json();
  assert.equal(response.status, 200, `like ${index + 1}: ${JSON.stringify(body)}`);
}
await check("ten local likes increment the D1 aggregate", async () => {
  const result = await get(slug);
  assert.equal((await result.json()).count, initialCount + 10);
});


response = await post(slug);
body = await response.json();
await check("local D1 rejects the 11th like without increment", async () => {
  assert.equal(response.status, 429);
  assert.equal(body.error, "limit-reached");
  const result = await get(slug);
  assert.equal((await result.json()).count, initialCount + 10);
});

response = await post(slug, tokenB);
await check("second browser token can like the same post", async () => {
  assert.equal(response.status, 200);
  assert.equal((await response.json()).count, initialCount + 11);
});

// Three likes from another browser make the public aggregate rise by 3; a fresh token then makes 13 requests to this published post.
const reportedSlug = otherSlug;
const otherInitialResponse = await get(otherSlug);
const otherInitialCount = (await otherInitialResponse.json()).count;
for (let index = 0; index < 3; index += 1) {
  response = await post(reportedSlug, tokenB);
  assert.equal(response.status, 200);
}
const sameTokenAttempts = [];
for (let index = 0; index < 13; index += 1) {
  response = await post(reportedSlug, tokenE);
  sameTokenAttempts.push({ status: response.status, body: await response.json() });
}
await check("D1: 10 accepted, requests 11–13 rejected for one token; total remains baseline + 13", async () => {
  assert.deepEqual(sameTokenAttempts.slice(0, 10).map(({ status }) => status), Array(10).fill(200));
  assert.deepEqual(sameTokenAttempts.slice(10).map(({ status }) => status), Array(3).fill(429));
  assert.equal(sameTokenAttempts[9].body.count, otherInitialCount + 13);
  assert.ok(sameTokenAttempts.slice(10).every(({ body }) => body.error === "limit-reached" && body.count === otherInitialCount + 13));
  const result = await get(reportedSlug);
  assert.equal((await result.json()).count, otherInitialCount + 13);
});

response = await post(otherSlug, tokenA);
await check("same browser token can like another post", async () => {
  assert.equal(response.status, 200);
  assert.equal((await response.json()).count, otherInitialCount + 14);
});

const concurrent = await Promise.all(Array.from({ length: 20 }, () => post(slug, tokenD)));
const concurrentBodies = await Promise.all(concurrent.map((result) => result.json()));
await check("concurrent D1 requests accept exactly ten for one token", async () => {
  assert.equal(concurrent.filter((result) => result.status === 200).length, 10);
  assert.equal(concurrent.filter((result) => result.status === 429).length, 10);
  assert.equal(concurrentBodies.filter((item) => item.error === "limit-reached").length, 10);
  const result = await get(slug);
  assert.equal((await result.json()).count, initialCount + 21);
});

await waitForRateWindowStart();
let rateLimitResponseBody = "";
await check("local D1 rate-limits request 21 across published posts", async () => {
  for (let index = 0; index < 10; index += 1) {
    response = await post(slug, tokenC);
    body = await response.json();
    assert.equal(response.status, 200, `first-post rate request ${index + 1}: ${JSON.stringify(body)}`);
  }
  for (let index = 0; index < 10; index += 1) {
    response = await post(otherSlug, tokenC);
    body = await response.json();
    assert.equal(response.status, 200, `second-post rate request ${index + 1}: ${JSON.stringify(body)}`);
  }
  response = await post(slug, tokenC);
  body = await response.json();
  rateLimitResponseBody = JSON.stringify(body);
  assert.equal(response.status, 429);
  assert.equal(body.error, "rate-limited");
});

response = await fetch(`${base}/api/likes`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ slug }),
});
await check("POST without browser token rejected", async () => {
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error, "visitor-token-required");
});

response = await post("not-a-published-post", tokenA);
await check("POST rejects a valid-shaped but unpublished slug", async () => {
  assert.equal(response.status, 404);
  assert.equal((await response.json()).error, "not-found");
});

response = await post(slug, "invalid");
await check("malformed browser token rejected", async () => {
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error, "invalid visitor token");
});

response = await get(slug);
await check("published slug accepted", () => assert.equal(response.status, 200));
response = await get("bad.slug");
await check("invalid slug rejected", () => assert.equal(response.status, 400));

const captured = `${rateLimitResponseBody} ${JSON.stringify(body)}`;
await check("error responses contain no browser token", () => {
  assert.ok(!captured.includes(tokenC));
  assert.ok(!captured.includes(tokenA));
  assert.ok(!captured.includes(tokenB));
  assert.ok(!captured.includes(tokenD));
});

console.log(checks.join("\n"));
console.log(process.exitCode ? "PAGES D1 SMOKE FAILED" : "PAGES D1 SMOKE PASSED");
