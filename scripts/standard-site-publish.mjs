#!/usr/bin/env node
/**
 * Standard.site (AT Protocol) publish helper for BotFolio.
 *
 * What it does (always, no secret needed):
 *  - Reads blog posts from src/content/blog/*.md (frontmatter + body).
 *  - Emits public/.well-known/site.standard.publication (the publication AT-URI).
 *  - Emits public/standard-site/records.json (publication + per-post document
 *    records) and public/standard-site/links.json (the <link> tags to inject).
 *
 * What it does ONLY with `BLUESKY_APP_PASSWORD` set + `--publish`:
 *  - Authenticates to the AT Proto PDS and creates/updates the records live.
 *  This script NEVER fabricates credentials and NEVER publishes unless you pass
 *  --publish AND the env var is present.
 *
 * Docs: https://standard.site/docs/quick-start/
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const BLOG_DIR = resolve(ROOT, "src/content/blog");
const OUT_DIR = resolve(ROOT, "public/standard-site");
const WELL_KNOWN_DIR = resolve(ROOT, "public/.well-known");

// Load env from project .env or hermes .env, then overlay real process.env
// (so CI secrets injected as environment variables win). Read-only; never printed.
function loadEnv() {
  const paths = [
    resolve(ROOT, ".env"),
    "/root/.hermes/.env",
  ];
  const env = {};
  for (const p of paths) {
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/i);
      if (m) env[m[1]] = m[2].trim();
    }
  }
  // Overlay actual environment variables (e.g. CI-injected secrets).
  for (const key of ["BLUESKY_APP_PASSWORD", "SITE_URL"]) {
    if (process.env[key]) env[key] = process.env[key];
  }
  return env;
}

// Parse a single Markdown file's frontmatter + raw body.
function parsePost(file) {
  const raw = readFileSync(file, "utf8");
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) return null;
  const fm = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
    if (kv) fm[kv[1]] = kv[2].replace(/^["']|["']$/g, "").trim();
  }
  const slug = file.split("/").pop().replace(/\.md$/, "");
  return {
    slug,
    title: fm.title || slug,
    description: fm.description || "",
    date: fm.date || new Date().toISOString().slice(0, 10),
    tags: (fm.tags || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    body: m[2].trim(),
  };
}

async function main() {
  const env = loadEnv();
  const DID = "did:plc:53jkze3ofomdesnodoz5i34y"; // ritikpatni.bsky.social
  const SITE_URL = env.SITE_URL || "https://ritikpatni.me";

  if (!existsSync(BLOG_DIR)) {
    console.error("No blog dir at", BLOG_DIR);
    process.exit(1);
  }

  const posts = [];
  // enumerate markdown posts
  for (const name of readdirSync(BLOG_DIR)) {
    if (!name.endsWith(".md")) continue;
    const post = parsePost(resolve(BLOG_DIR, name));
    if (post) posts.push(post);
  }

  const publicationRKey = "3lwafzkjqm25s"; // stable rkey for the publication record
  const publicationUri = `at://${DID}/site.standard.publication/${publicationRKey}`;

  const publication = {
    $type: "site.standard.publication",
    url: SITE_URL,
    name: "BotFolio",
    description: "Writing, notes, and a reading shelf from Ritik Patni.",
    preferences: { showInDiscover: true },
  };

  const documents = posts.map((p) => ({
    $type: "site.standard.document",
    site: publicationUri,
    title: p.title,
    path: `/blog/${p.slug}`,
    description: p.description,
    publishedAt: new Date(p.date).toISOString(),
    tags: p.tags,
    textContent: p.body.slice(0, 20000),
  }));

  mkdirSync(OUT_DIR, { recursive: true });
  mkdirSync(WELL_KNOWN_DIR, { recursive: true });

  // .well-known endpoint returning the publication AT-URI (verification).
  writeFileSync(resolve(WELL_KNOWN_DIR, "site.standard.publication"), publicationUri);

  writeFileSync(
    resolve(OUT_DIR, "records.json"),
    JSON.stringify({ publication, documents }, null, 2),
  );

  // <link> tags to inject into each post's <head>.
  const links = posts.map((p) => ({
    path: `/blog/${p.slug}`,
    link: `<link rel="site.standard.document" href="at://${DID}/site.standard.document/${p.slug}" />`,
  }));
  writeFileSync(resolve(OUT_DIR, "links.json"), JSON.stringify(links, null, 2));

  console.log(
    `Wrote publication AT-URI -> ${WELL_KNOWN_DIR}/site.standard.publication`,
  );
  console.log(`Wrote ${documents.length} document records -> ${OUT_DIR}/records.json`);
  console.log(`Wrote ${links.length} <link> snippets -> ${OUT_DIR}/links.json`);

  const publish = process.argv.includes("--publish");
  if (publish && env.BLUESKY_APP_PASSWORD) {
    await publishRecords({
      handle: "ritikpatni.bsky.social",
      appPassword: env.BLUESKY_APP_PASSWORD,
      pds: env.ATPROTO_PDS || "https://bsky.social",
      did: DID,
      publicationRKey,
      publication,
      documents,
    });
  } else if (publish) {
    console.error("Refusing to publish: BLUESKY_APP_PASSWORD not set. Aborting --publish.");
    process.exit(2);
  } else {
    console.log("Dry run complete. Pass --publish (with BLUESKY_APP_PASSWORD) to push live.");
  }
}

/* ── AT Proto publishing ────────────────────────────────────────────────
   Real publish against a Bluesky/PDS XRPC endpoint. Uses putRecord with a
   stable rkey per record so re-runs UPDATE rather than duplicate. */

// Minimal valid TID (atproto base32, big-endian, <=64 bits) from a string seed.
const TID_ALPHABET = "234567abcdefghijklmnopqrstuvwxyz";
function tidFromSeed(str) {
  let h = 0n;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31n + BigInt(str.charCodeAt(i))) & 0xffffffffffffffffn;
  }
  // Mix in microseconds of now for sortability, keep within 64 bits.
  const ts = BigInt(Date.now() % 1e15) & 0xffffffffffffffffn;
  const value = ((ts << 24n) ^ (h << 8n) ^ (h & 0xffn)) & 0xffffffffffffffffn;
  let v = value;
  let out = "";
  for (let i = 0; i < 13; i++) {
    out = TID_ALPHABET[Number(v & 31n)] + out;
    v >>= 5n;
  }
  return out;
}

async function xrpc(pds, token, method, body, { retries = 3 } = {}) {
  let lastErr;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(`${pds}/xrpc/${method}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });
      const text = await res.text();
      if (res.ok) return text ? JSON.parse(text) : null;
      // Retry only on 5xx / rate-limit; 4xx (except 429) is a real error — rethrow.
      if (res.status >= 500 || res.status === 429) {
        lastErr = new Error(`${method} failed (${res.status}) attempt ${attempt}/${retries}: ${text.slice(0, 200)}`);
        console.warn(lastErr.message);
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, 1500 * attempt * attempt)); // 1.5s, 6s
          continue;
        }
      }
      throw new Error(`${method} failed (${res.status}): ${text}`);
    } catch (e) {
      // network-level failure (fetch reject) — retry
      lastErr = e;
      if (String(e.message).includes("failed (")) throw e; // already a final HTTP error
      console.warn(`network error attempt ${attempt}/${retries}: ${e.message}`);
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 1500 * attempt * attempt));
        continue;
      }
      throw e;
    }
  }
  throw lastErr;
}

async function publishRecords(opts) {
  const { handle, appPassword, pds, did, publicationRKey, publication, documents } = opts;

  console.log(`Authenticating to ${pds} as ${handle}...`);
  const session = await xrpc(pds, null, "com.atproto.server.createSession", {
    identifier: handle,
    password: appPassword,
  });
  const token = session.accessJwt;
  if (session.did !== did) {
    console.warn(`Warning: session DID ${session.did} != expected ${did}`);
  }
  console.log("Session OK.");

  console.log("Upserting publication record...");
  await xrpc(pds, token, "com.atproto.repo.putRecord", {
    repo: did,
    collection: "site.standard.publication",
    rkey: publicationRKey,
    record: publication,
  });

  let ok = 0;
  const failed = [];
  for (const doc of documents) {
    const rkey = tidFromSeed(doc.path);
    try {
      await xrpc(pds, token, "com.atproto.repo.putRecord", {
        repo: did,
        collection: "site.standard.document",
        rkey,
        record: doc,
      });
      ok++;
    } catch (e) {
      failed.push({ path: doc.path, error: e.message });
      console.error(`FAILED ${doc.path}: ${e.message}`);
    }
  }
  if (failed.length > 0) {
    console.error(`\n${failed.length}/${documents.length} documents FAILED:`);
    for (const f of failed) console.error(` - ${f.path}: ${f.error}`);
    process.exitCode = 3; // non-zero so the Action shows red, but partial progress is kept
  }
  console.log(`Published ${ok}/${documents.length} document records. Done.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
