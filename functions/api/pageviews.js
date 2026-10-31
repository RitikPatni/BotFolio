/**
 * GET /api/pageviews → { pageviews } — lifetime total from the self-hosted
 * Umami stats API, cached one hour at the edge.
 *
 * Cloudflare Pages env vars (dashboard-configured; no wrangler.toml on
 * purpose — one would take over the project's existing dashboard bindings):
 *   • UMAMI_API_BASE      e.g. https://analytics.ritikpatni.me/api
 *   • UMAMI_WEBSITE_ID    website id in the self-hosted instance
 *   • UMAMI_API_TOKEN     API key (x-umami-api-key) or JWT — server-side only
 *
 * Any failure returns 5xx JSON; the footer renders nothing on failure —
 * no placeholder, no zero, no stale number.
 */

const CACHE_SECONDS = 3600;

const json = (data, status, extraHeaders = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", ...extraHeaders },
  });

function pageviewsEnv(env) {
  return {
    base: (env.UMAMI_API_BASE ?? "").replace(/\/+$/, ""),
    websiteId: env.UMAMI_WEBSITE_ID ?? "",
    token: env.UMAMI_API_TOKEN ?? "",
  };
}

async function fetchLifetimePageviews({ base, websiteId, token }) {
  // startAt=0 → the full lifetime of the instance (cloud history imported).
  const url = `${base}/websites/${encodeURIComponent(websiteId)}/stats?startAt=0&endAt=${Date.now()}`;
  const response = await fetch(url, {
    headers: {
      // API key and JWT auth shapes both accepted by Umami v2.
      "x-umami-api-key": token,
      authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error(`umami stats ${response.status}`);
  }
  const data = await response.json();
  const value = data?.pageviews?.value;
  if (typeof value !== "number" || value < 0) {
    throw new Error("umami stats: missing pageviews.value");
  }
  return value;
}

export async function onRequestGet({ env, waitUntil }) {
  const { base, websiteId, token } = pageviewsEnv(env);
  if (!base || !websiteId || !token) {
    return json({ error: "UMAMI_API_BASE / UMAMI_WEBSITE_ID / UMAMI_API_TOKEN not configured" }, 500);
  }

  const cache = caches.default;
  const cacheKey = new Request("https://pageviews.internal/api/pageviews", { method: "GET" });
  const hit = await cache.match(cacheKey);
  if (hit) return hit;

  try {
    const pageviews = await fetchLifetimePageviews({ base, websiteId, token });
    const response = json(
      { pageviews },
      200,
      {
        "cache-control": `public, max-age=${CACHE_SECONDS}, s-maxage=${CACHE_SECONDS}`,
      }
    );
    waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  } catch (error) {
    return json({ error: "pageviews read failed" }, 500);
  }
}
