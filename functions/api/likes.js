/**
 * /api/likes — blog post like counter backed by Cloudflare D1.
 *
 * Semantics (product decision, 2026-10-31):
 *   • Like-only. The count only ever goes up; there is no unlike.
 *   • Each visitor contributes at most 10 likes per post. Clicks 1–10 each
 *     +1; the 11th is rejected server-side and never increments the count.
 *
 * D1 binding (dashboard-configured — see docs/like-counter.md):
 *   • LIKES_DB    — the D1 database
 *   • LIKES_SALT  — random secret used to HMAC the visitor IP; the raw IP is
 *                   never stored, logged, or returned.
 *
 * Schema (created via the wrangler commands in docs/like-counter.md):
 *   CREATE TABLE like_counts  (slug TEXT PRIMARY KEY, count INTEGER NOT NULL);
 *   CREATE TABLE like_actions (visitor_hash TEXT NOT NULL, slug TEXT NOT NULL,
 *     likes_given INTEGER NOT NULL, last_ts INTEGER NOT NULL,
 *     PRIMARY KEY (visitor_hash, slug));
 *
 * GET  /api/likes?slug=<slug>           → 200 {slug, count}
 * POST /api/likes  body {slug}           → 200 {slug, count}  (count after +1)
 *                                         429 {error:"limit-reached"}
 * Anything wrong returns 4xx/5xx JSON with a sanitized message — never the
 * visitor hash, the IP, or D1 error text.
 */

const MAX_LIKES_PER_VISITOR = 10;
const RATE_LIMIT_MAX = 20;        // requests per visitor per minute (all /api/likes calls)
const RATE_LIMIT_WINDOW_MS = 60_000;
const ACTION_RETENTION_MS = 30 * 24 * 60 * 60_000; // per-visitor caps reset after 30d
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i;

const json = (data, status) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

function slugFromSearch(url) {
  const slug = (url.searchParams.get("slug") ?? "").trim();
  if (!slug || slug.length > 160 || !SLUG_PATTERN.test(slug)) return null;
  return slug;
}

async function readSlugFromPost(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return null;
  }
  const slug = typeof body?.slug === "string" ? body.slug.trim() : "";
  if (!slug || slug.length > 160 || !SLUG_PATTERN.test(slug)) return null;
  return slug;
}

/** HMAC the visitor IP with the configured salt — irreversible per-visitor key. */
async function visitorHash(request, salt) {
  const ip =
    request.headers.get("cf-connecting-ip") ?? "unknown";
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(salt),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(ip)
  );
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Fixed-window rate limit, one row per visitor in D1. Returns true when the
 * request is allowed. Window state is tiny; rows are rewritten, not appended.
 */
async function allowRate(db, hash, now) {
  const windowStart = Math.floor(now / RATE_LIMIT_WINDOW_MS) * RATE_LIMIT_WINDOW_MS;
  const row = await db
    .prepare(
      "SELECT hits FROM like_rate WHERE visitor_hash = ? AND window_start = ?"
    )
    .bind(hash, windowStart)
    .first();
  const hits = row?.hits ?? 0;
  if (hits >= RATE_LIMIT_MAX) return false;
  await db
    .prepare(
      `INSERT INTO like_rate (visitor_hash, window_start, hits) VALUES (?, ?, 1)
       ON CONFLICT(visitor_hash, window_start) DO UPDATE SET hits = hits + 1`
    )
    .bind(hash, windowStart)
    .run();
  return true;
}

async function getCount(db, slug) {
  const row = await db
    .prepare("SELECT count FROM like_counts WHERE slug = ?")
    .bind(slug)
    .first();
  return typeof row?.count === "number" ? row.count : 0;
}

async function addLike(db, hash, slug, now) {
  // Atomic cap: the upsert's WHERE clause refuses the 11th like, so two
  // racing requests can never push one visitor past the limit. Only when the
  // actions row was written does the count row increment — both in one batch
  // (D1 batches are sequential + atomic).
  const actions = await db
    .prepare(
      `INSERT INTO like_actions (visitor_hash, slug, likes_given, last_ts)
       VALUES (?, ?, 1, ?)
       ON CONFLICT(visitor_hash, slug) DO UPDATE
         SET likes_given = likes_given + 1, last_ts = ?
         WHERE likes_given < ${MAX_LIKES_PER_VISITOR}
       RETURNING likes_given`
    )
    .bind(hash, slug, now, now)
    .first();

  if (!actions) return { limitReached: true };

  const counts = await db
    .prepare(
      `INSERT INTO like_counts (slug, count) VALUES (?, 1)
       ON CONFLICT(slug) DO UPDATE SET count = count + 1
       RETURNING count`
    )
    .bind(slug)
    .first();

  return { limitReached: false, count: counts?.count ?? null };
}

/** Opportunistic cleanup: expired visitor caps + stale rate rows. */
async function purge(db, now) {
  const actionCutoff = now - ACTION_RETENTION_MS;
  const rateCutoff = now - RATE_LIMIT_WINDOW_MS * 2;
  await db
    .prepare("DELETE FROM like_actions WHERE last_ts < ?")
    .bind(actionCutoff)
    .run();
  await db
    .prepare("DELETE FROM like_rate WHERE window_start < ?")
    .bind(rateCutoff)
    .run();
}

function envProblem(env) {
  if (!env.LIKES_DB) return "LIKES_DB binding not configured";
  if (!env.LIKES_SALT) return "LIKES_SALT not configured";
  return null;
}

export async function onRequestGet({ request, env }) {
  const problem = envProblem(env);
  if (problem) return json({ error: problem }, 500);

  const slug = slugFromSearch(new URL(request.url));
  if (!slug) return json({ error: "invalid slug" }, 400);

  try {
    const count = await getCount(env.LIKES_DB, slug);
    return json({ slug, count }, 200);
  } catch {
    return json({ error: "likes read failed" }, 500);
  }
}

export async function onRequestPost({ request, env, waitUntil }) {
  const problem = envProblem(env);
  if (problem) return json({ error: problem }, 500);

  const slug = await readSlugFromPost(request);
  if (!slug) return json({ error: "invalid slug" }, 400);

  const now = Date.now();
  let hash;
  try {
    hash = await visitorHash(request, env.LIKES_SALT);
  } catch {
    return json({ error: "likes write failed" }, 500);
  }

  try {
    const db = env.LIKES_DB;
    if (!(await allowRate(db, hash, now))) {
      return json({ error: "rate-limited" }, 429);
    }

    const result = await addLike(db, hash, slug, now);
    if (result.limitReached) {
      const count = await getCount(db, slug);
      return json({ error: "limit-reached", slug, count }, 429);
    }
    if (result.count === null) {
      return json({ error: "likes write failed" }, 500);
    }

    waitUntil?.(purge(db, now).catch(() => {}));
    return json({ slug, count: result.count }, 200);
  } catch {
    return json({ error: "likes write failed" }, 500);
  }
}
