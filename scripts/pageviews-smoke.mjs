/**
 * Smoke test for functions/api/pageviews.js — invokes the exported Pages
 * Function handler in plain Node with a stubbed fetch and caches API.
 * Verifies: env validation, Umami URL shape, auth headers, cache-control,
 * happy-path parse, and that failures return 5xx (footer stays hidden).
 *
 * Run: node scripts/pageviews-smoke.mjs
 */
import { onRequestGet } from "../functions/api/pageviews.js";

const assertions = [];
const check = (name, actual, expected) => {
  const pass = actual === expected;
  assertions.push(`${pass ? "PASS" : "FAIL"}  ${name}  (got ${actual}, want ${expected})`);
  if (!pass) process.exitCode = 1;
};

const cacheStore = new Map();
globalThis.caches = { default: {
  match: async (key) => cacheStore.get(String(key)) ?? null,
  put: async (key, response) => cacheStore.set(String(key), response),
} };

let lastFetch;
const stubFetch = (status, body) => (url, init) => {
  lastFetch = { url, init };
  return Promise.resolve(new Response(JSON.stringify(body), { status }));
};

const waitUntil = () => {};

// 1. Missing env → 500, footer hides.
globalThis.fetch = stubFetch(200, {});
let res = await onRequestGet({ env: {}, waitUntil, caches });
check("missing env rejected", res.status, 500);

const env = {
  UMAMI_API_BASE: "https://analytics.ritikpatni.me/api/",
  UMAMI_WEBSITE_ID: "w-id-1",
  UMAMI_API_TOKEN: "secret-token",
};

// 2. Happy path: stats parsed from pageviews.value.
globalThis.fetch = stubFetch(200, { pageviews: { value: 12503 }, visitors: { value: 400 } });
res = await onRequestGet({ env, waitUntil, caches });
check("happy path status", res.status, 200);
check("happy path total", (await res.json()).pageviews, 12503);
check("cache-control set", res.headers.get("cache-control").includes("max-age=3600"), true);
check("umami url trimmed of trailing slash", lastFetch.url.startsWith("https://analytics.ritikpatni.me/api/websites/w-id-1/stats?"), true);
check("startAt=0 for lifetime", lastFetch.url.includes("startAt=0"), true);
check("api key header sent", lastFetch.init.headers["x-umami-api-key"], "secret-token");
check("bearer header sent", lastFetch.init.headers.authorization, "Bearer secret-token");

// 3. Second call served from cache (fetch must not run again).
let fetchRan = false;
globalThis.fetch = () => { fetchRan = true; return Promise.resolve(new Response("{}", { status: 200 })); };
res = await onRequestGet({ env, waitUntil, caches });
check("cached response reused", fetchRan, false);

// 4. Umami error → 5xx.
cacheStore.clear();
globalThis.fetch = stubFetch(403, { error: { code: "unauthorized", message: "private upstream detail" } });
res = await onRequestGet({ env, waitUntil, caches });
check("Umami auth failure → 502", res.status, 502);
const diagnostic = await res.json();
check("upstream status exposed", diagnostic.upstream_status, 403);
check("allowlisted upstream code exposed", diagnostic.upstream_code, "unauthorized");
check("secret excluded from diagnostic", JSON.stringify(diagnostic).includes("secret-token"), false);
check("upstream message excluded from diagnostic", JSON.stringify(diagnostic).includes("private upstream detail"), false);

// 5. Malformed payload → 5xx.
cacheStore.clear();
globalThis.fetch = stubFetch(200, { visitors: { value: 5 } });
res = await onRequestGet({ env, waitUntil, caches });
check("missing pageviews.value → 500", res.status, 500);

console.log(assertions.join("\n"));
console.log(process.exitCode ? "SMOKE TEST FAILED" : "SMOKE TEST PASSED");
