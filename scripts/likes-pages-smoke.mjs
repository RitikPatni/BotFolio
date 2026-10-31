import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";

const base = (process.argv[2] ?? "http://127.0.0.1:8788").replace(/\/$/, "");
const run = Math.random().toString(36).slice(2, 10);
const slug = `smoke-${run}`;
const tokenA = randomBytes(32).toString("hex");
const tokenB = randomBytes(32).toString("hex");
const tokenC = randomBytes(32).toString("hex");
const tokenD = randomBytes(32).toString("hex");
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

const htmlResponse = await fetch(`${base}/blog/building-quality-gated-ai-code-review-loops`);
const articleHtml = await htmlResponse.text();
await check("rendered control carries slug on the initialized button", () => {
  assert.equal(htmlResponse.status, 200);
  assert.match(articleHtml, /<button[^>]*data-like-button[^>]*data-like-slug="building-quality-gated-ai-code-review-loops"/);
  assert.match(articleHtml, /class="floating-like"[^>]*hidden/);
});
await check("rendered page includes progressive fill and completion animation hooks", () => {
  assert.ok(articleHtml.includes("data-like-fill-window"));
  assert.ok(articleHtml.includes("floating-like__heart--pop"));
  assert.ok(articleHtml.includes("floating-like__count--roll"));
  assert.ok(articleHtml.includes("floating-like__heart--complete"));
  assert.ok(articleHtml.includes("floating-like-complete-halo"));
  assert.ok(articleHtml.includes("floating-like__button--error"));
});

let response = await get(slug);
let body = await response.json();
await check("local Pages D1 zero-state GET", () => {
  assert.equal(response.status, 200);
  assert.deepEqual(body, { slug, count: 0 });
});

for (let index = 0; index < 10; index += 1) {
  response = await post(slug);
  body = await response.json();
  assert.equal(response.status, 200, `like ${index + 1}: ${JSON.stringify(body)}`);
}
await check("ten local likes increment D1 aggregate", async () => {
  const result = await get(slug);
  assert.equal((await result.json()).count, 10);
});

response = await post(slug);
body = await response.json();
await check("local D1 rejects the 11th like without increment", async () => {
  assert.equal(response.status, 429);
  assert.equal(body.error, "limit-reached");
  const result = await get(slug);
  assert.equal((await result.json()).count, 10);
});

response = await post(slug, tokenB);
await check("second browser token can like the same post", async () => {
  assert.equal(response.status, 200);
  assert.equal((await response.json()).count, 11);
});

const secondSlug = `${slug}-other`;
response = await post(secondSlug, tokenA);
await check("same browser token can like another post", async () => {
  assert.equal(response.status, 200);
  assert.equal((await response.json()).count, 1);
});

const concurrentSlug = `${slug}-concurrent`;
const concurrent = await Promise.all(Array.from({ length: 20 }, () => post(concurrentSlug, tokenD)));
const concurrentBodies = await Promise.all(concurrent.map((result) => result.json()));
await check("concurrent D1 requests accept exactly ten for one token", async () => {
  assert.equal(concurrent.filter((result) => result.status === 200).length, 10);
  assert.equal(concurrent.filter((result) => result.status === 429).length, 10);
  assert.equal(concurrentBodies.filter((item) => item.error === "limit-reached").length, 10);
  const result = await get(concurrentSlug);
  assert.equal((await result.json()).count, 10);
});

for (let index = 0; index < 20; index += 1) {
  response = await post(`${slug}-rate-${index}`, tokenC);
  assert.equal(response.status, 200, `rate request ${index + 1}: ${await response.text()}`);
}
response = await post(`${slug}-rate-over`, tokenC);
body = await response.json();
const rateLimitResponseBody = JSON.stringify(body);
await check("local D1 rate-limits request 21", () => {
  assert.equal(response.status, 429);
  assert.equal(body.error, "rate-limited");
});

response = await fetch(`${base}/api/likes`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ slug: `${slug}-missing-token` }),
});
await check("POST without browser token rejected", async () => {
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error, "visitor-token-required");
});

response = await post(`${slug}-bad-token`, "invalid");
await check("malformed browser token rejected", async () => {
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error, "invalid visitor token");
});

response = await get("not-valid"); // valid route slug shape, zero state
await check("valid slug accepted", () => assert.equal(response.status, 200));
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
