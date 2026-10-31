import assert from "node:assert/strict";

const base = (process.argv[2] ?? "http://127.0.0.1:8788").replace(/\/$/, "");
const run = Math.random().toString(36).slice(2, 10);
const slug = `smoke-${run}`;
const ip = "203.0.113.41";
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
async function post(target, sourceIp = ip) {
  return fetch(`${base}/api/likes`, {
    method: "POST",
    headers: { "content-type": "application/json", "cf-connecting-ip": sourceIp },
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

const secondSlug = `${slug}-other`;
response = await post(secondSlug);
await check("same visitor can like another post", async () => {
  assert.equal(response.status, 200);
  assert.equal((await response.json()).count, 1);
});

const rateIp = "198.51.100.24";
for (let index = 0; index < 20; index += 1) {
  response = await post(`${slug}-rate-${index}`, rateIp);
  assert.equal(response.status, 200, `rate request ${index + 1}: ${await response.text()}`);
}
response = await post(`${slug}-rate-over`, rateIp);
body = await response.json();
await check("local D1 rate-limits request 21", () => {
  assert.equal(response.status, 429);
  assert.equal(body.error, "rate-limited");
});

response = await get("not-valid"); // valid route slug shape, zero state
await check("valid slug accepted", () => assert.equal(response.status, 200));
response = await get("bad.slug");
await check("invalid slug rejected", () => assert.equal(response.status, 400));

const captured = JSON.stringify(body);
await check("rate-limit response contains no raw IP", () => {
  assert.ok(!captured.includes(rateIp));
  assert.ok(!/[0-9a-f]{64}/.test(captured));
});

console.log(checks.join("\n"));
console.log(process.exitCode ? "PAGES D1 SMOKE FAILED" : "PAGES D1 SMOKE PASSED");
