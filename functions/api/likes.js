/**
 * /api/likes — blog post like counter backed by Cloudflare D1.
 *
 *   • Each browser token contributes at most 10 accepted likes per post in
 *     30 days of inactivity. Requests after that interval can start a new cap.
 *     Client-minted tokens can bypass this per-token limit.
 *
 * D1 binding and schema are dashboard-configured; see docs/like-counter.md
 * and migrations/0001_likes.sql + migrations/0002_likes_cleanup_indexes.sql.
 * LIKES_SALT HMACs a random first-party token; neither raw token nor IP is stored.
 * Action digests are scoped per post; rate digests are scoped per minute window.
 *
 * GET  /api/likes?slug=<slug>           → 200 {slug, count}
 * POST /api/likes (x-like-visitor-token) body {slug}
 *                                       → 200 {slug, count}  (count after +1)
 *                                         429 {error:"limit-reached", count, resetAt}
 * Anything wrong returns sanitized JSON; never disclose token, digest, IP,
 * binding names, or D1 error details.
 */

const MAX_LIKES_PER_VISITOR = 10;
const RATE_LIMIT_MAX = 20; // POST requests per browser-token window, across posts
const RATE_LIMIT_WINDOW_MS = 60_000;
const ACTION_RETENTION_MS = 30 * 24 * 60 * 60_000; // per-browser caps reset after 30d
const MAX_BODY_BYTES = 1024;
const CACHE_TTL_SECONDS = 10;
const CLEANUP_SAMPLE_RATE = 0.01;
const RATE_CLEANUP_BATCH_SIZE = 500;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const VISITOR_TOKEN_PATTERN = /^[0-9a-f]{64}$/;

const json = (data, status, headers = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
      ...headers,
    },
  });

function slugFromSearch(url) {
  const slug = (url.searchParams.get("slug") ?? "").trim();
  if (!slug || slug.length > 160 || !SLUG_PATTERN.test(slug)) return null;
  return slug;
}

async function readSlugFromPost(request) {
  const length = Number(request.headers.get("content-length"));
  if (Number.isFinite(length) && length > MAX_BODY_BYTES) return { tooLarge: true };

  const reader = request.body?.getReader();
  if (!reader) return null;
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) {
        try {
          await reader.cancel();
        } catch {
          // The size check remains authoritative if transport cancellation fails.
        }
        return { tooLarge: true };
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    const body = JSON.parse(new TextDecoder().decode(bytes));
    const slug = typeof body?.slug === "string" ? body.slug.trim() : "";
    if (!slug || slug.length > 160 || !SLUG_PATTERN.test(slug)) return null;
    return { slug };
  } catch {
    return null;
  }
}

async function isPublishedSlug(request, env, slug) {
  try {
    const asset = new URL("/api/likes-posts.json", request.url);
    const response = await env.ASSETS.fetch(asset);
    if (!response.ok) return null;
    const slugs = await response.json();
    if (!Array.isArray(slugs) || !slugs.every((value) => typeof value === "string")) return null;
    return slugs.includes(slug);
  } catch {
    return null;
  }
}

function unavailable() {
  return json({ error: "likes service unavailable" }, 503);
}

/** HMAC the random first-party browser token; never use a network identifier. */
async function visitorHash(token, salt, scope) {
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
    new TextEncoder().encode(`${scope}\0${token}`)
  );
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/** Prune at most 500 rate rows older than two windows via indexed window_start. */
async function pruneRateRows(db, now) {
  const cutoff = now - RATE_LIMIT_WINDOW_MS * 2;
  await db
    .prepare(
      `DELETE FROM like_rate
       WHERE rowid IN (
         SELECT rowid FROM like_rate
         WHERE window_start < ?
         ORDER BY window_start
         LIMIT ${RATE_CLEANUP_BATCH_SIZE}
       )`
    )
    .bind(cutoff)
    .run();
}

async function allowRate(db, hash, now) {
  const windowStart = Math.floor(now / RATE_LIMIT_WINDOW_MS) * RATE_LIMIT_WINDOW_MS;
  const result = await db
    .prepare(
      `INSERT INTO like_rate (visitor_hash, window_start, hits) VALUES (?, ?, 1)
       ON CONFLICT(visitor_hash, window_start) DO UPDATE SET hits = hits + 1
       WHERE hits < ${RATE_LIMIT_MAX}
       RETURNING hits`
    )
    .bind(hash, windowStart)
    .first();
  return result !== null;
}

async function getCount(db, slug) {
  const row = await db
    .prepare("SELECT count FROM like_counts WHERE slug = ?")
    .bind(slug)
    .first();
  return typeof row?.count === "number" ? row.count : 0;
}

async function addLike(db, hash, slug, now) {
  // D1 batches run sequentially and atomically. The second statement reads
  // SQLite's changes() from the conditional action upsert, so a rejected cap
  // cannot increment the aggregate, even when requests race.
  const results = await db.batch([
    db
      .prepare(
        `INSERT INTO like_actions (visitor_hash, slug, likes_given, last_ts)
         VALUES (?, ?, 1, ?)
         ON CONFLICT(visitor_hash, slug) DO UPDATE
           SET likes_given = CASE
                 WHEN like_actions.last_ts <= ? THEN 1
                 ELSE like_actions.likes_given + 1
               END,
               last_ts = ?
           WHERE like_actions.last_ts <= ? OR like_actions.likes_given < ${MAX_LIKES_PER_VISITOR}
         RETURNING likes_given`
      )
      .bind(hash, slug, now, now - ACTION_RETENTION_MS, now, now - ACTION_RETENTION_MS),
    db
      .prepare(
        `INSERT INTO like_counts (slug, count)
         SELECT ?, 1 WHERE changes() = 1
         ON CONFLICT(slug) DO UPDATE SET count = count + 1
         RETURNING count`
      )
      .bind(slug),
  ]);

  const action = results[0]?.results?.[0];
  if (!action) {
    const existing = await db
      .prepare("SELECT last_ts FROM like_actions WHERE visitor_hash = ? AND slug = ?")
      .bind(hash, slug)
      .first();
    const lastAcceptedAt = Number(existing?.last_ts);
    return {
      limitReached: true,
      resetAt: Number.isSafeInteger(lastAcceptedAt)
        ? lastAcceptedAt + ACTION_RETENTION_MS
        : now + ACTION_RETENTION_MS,
    };
  }

  const count = results[1]?.results?.[0]?.count;
  return { limitReached: false, count: typeof count === "number" ? count : null };
}

/** Sampled cleanup of expired per-post action rows. */
async function purge(db, now) {
  const actionCutoff = now - ACTION_RETENTION_MS;
  await db
    .prepare("DELETE FROM like_actions WHERE last_ts <= ?")
    .bind(actionCutoff)
    .run();
}

async function cachedCount(request, env, slug, waitUntil) {
  const cache = globalThis.caches?.default;
  const keyUrl = new URL("/api/likes", request.url);
  keyUrl.searchParams.set("slug", slug);
  const key = new Request(keyUrl);

  if (cache) {
    try {
      const hit = await cache.match(key);
      if (hit) return hit;
    } catch {
      // Read through to D1 if the edge cache is unavailable.
    }
  }

  const count = await getCount(env.LIKES_DB, slug);
  const response = json(
    { slug, count },
    200,
    { "cache-control": `public, max-age=0, s-maxage=${CACHE_TTL_SECONDS}` }
  );
  if (cache) {
    const write = cache.put(key, response.clone()).catch(() => {});
    if (waitUntil) waitUntil(write);
    else await write;
  }
  return response;
}

async function invalidateCountCache(request, slug, waitUntil) {
  const cache = globalThis.caches?.default;
  if (!cache) return;
  const keyUrl = new URL("/api/likes", request.url);
  keyUrl.searchParams.set("slug", slug);
  const removal = cache.delete(new Request(keyUrl)).catch(() => {});
  if (waitUntil) waitUntil(removal);
  else await removal;
}

function cacheCleanup(db, now, waitUntil) {
  if (!waitUntil || Math.random() >= CLEANUP_SAMPLE_RATE) return;
  waitUntil(purge(db, now).catch(() => {}));
}

function envProblem(env, requireSalt = false) {
  if (!env.LIKES_DB) return true;
  if (requireSalt && !env.LIKES_SALT) return true;
  return false;
}

export async function onRequestGet({ request, env, waitUntil }) {
  if (envProblem(env)) return unavailable();

  const slug = slugFromSearch(new URL(request.url));
  if (!slug) return json({ error: "invalid slug" }, 400);

  const published = await isPublishedSlug(request, env, slug);
  if (published === null) return unavailable();
  if (!published) return json({ error: "not-found" }, 404);

  try {
    return await cachedCount(request, env, slug, waitUntil);
  } catch {
    return json({ error: "likes read failed" }, 500);
  }
}

export async function onRequestPost({ request, env, waitUntil }) {
  if (envProblem(env, true)) return unavailable();

  const parsed = await readSlugFromPost(request);
  if (parsed?.tooLarge) return json({ error: "request-too-large" }, 413);
  if (!parsed) return json({ error: "invalid slug" }, 400);
  const { slug } = parsed;

  const published = await isPublishedSlug(request, env, slug);
  if (published === null) return unavailable();
  if (!published) return json({ error: "not-found" }, 404);

  const token = request.headers.get("x-like-visitor-token");
  if (!token) return json({ error: "visitor-token-required" }, 400);
  if (!VISITOR_TOKEN_PATTERN.test(token)) return json({ error: "invalid visitor token" }, 400);

  const now = Date.now();
  let actionHash;
  let rateHash;
  try {
    const rateWindow = Math.floor(now / RATE_LIMIT_WINDOW_MS) * RATE_LIMIT_WINDOW_MS;
    [actionHash, rateHash] = await Promise.all([
      visitorHash(token, env.LIKES_SALT, `post:${slug}`),
      visitorHash(token, env.LIKES_SALT, `rate-limit:${rateWindow}`),
    ]);
  } catch {
    return json({ error: "likes write failed" }, 500);
  }

  try {
    const db = env.LIKES_DB;
    await pruneRateRows(db, now);
    if (!(await allowRate(db, rateHash, now))) {
      return json({ error: "rate-limited" }, 429);
    }

    const result = await addLike(db, actionHash, slug, now);
    if (result.limitReached) {
      const count = await getCount(db, slug);
      return json({ error: "limit-reached", slug, count, resetAt: result.resetAt }, 429);
    }
    if (result.count === null) {
      return json({ error: "likes write failed" }, 500);
    }

    await invalidateCountCache(request, slug, waitUntil);
    cacheCleanup(db, now, waitUntil);
    return json({ slug, count: result.count }, 200);
  } catch {
    return json({ error: "likes write failed" }, 500);
  }
}
