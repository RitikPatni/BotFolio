#!/usr/bin/env node
/**
 * Standard.site (AT Protocol) publish helper for BotFolio.
 *
 * What it does (always, no secret needed):
 *  - Reads blog posts from src/content/blog/*.md (frontmatter + body),
 *    skipping drafts (`draft: true`): those never leave the repo.
 *  - Emits public/.well-known/site.standard.publication (the publication AT-URI).
 *  - Emits public/standard-site/records.json (publication + per-post document
 *    records) and public/standard-site/links.json (the <link> tags to inject).
 *
 * What it does ONLY with `BLUESKY_APP_PASSWORD` set + `--publish`:
 *  - Authenticates to the AT Proto PDS and syncs the records live: upserts one
 *    document per published post under a stable key, and deletes any document
 *    record that no longer matches a published post (removed posts, drafts,
 *    keys from older runs).
 *  This script NEVER fabricates credentials and NEVER publishes unless you pass
 *  --publish AND the env var is present.
 *
 * Docs: https://standard.site/docs/quick-start/
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  STANDARD_SITE_DID,
  PUBLICATION_RKEY,
  PUBLICATION_URI,
  documentRkey,
} from "../src/utils/standardSite.mjs";

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

// Parse a single Markdown file's frontmatter + raw body. Handles the shapes the
// content uses: `key: value` scalars and `key:` followed by `  - item` lists.
function parsePost(file) {
  const raw = readFileSync(file, "utf8");
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return null;
  const unquote = (v) => v.trim().replace(/^["']|["']$/g, "").trim();
  const fm = {};
  let listKey = null;
  for (const line of m[1].split(/\r?\n/)) {
    const item = line.match(/^\s+-\s+(.*)$/);
    if (item && listKey) {
      fm[listKey].push(unquote(item[1]));
      continue;
    }
    const kv = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
    if (!kv) continue;
    if (kv[2].trim() === "") {
      listKey = kv[1];
      fm[listKey] = [];
    } else {
      listKey = null;
      fm[kv[1]] = unquote(kv[2]);
    }
  }
  const slug = file.split("/").pop().replace(/\.md$/, "");
  const tags = Array.isArray(fm.tags)
    ? fm.tags
    : String(fm.tags || "").replace(/^\[|\]$/g, "").split(",").map(unquote);
  return {
    slug,
    draft: String(fm.draft).toLowerCase() === "true",
    title: fm.title || slug,
    description: typeof fm.description === "string" ? fm.description : "",
    date: fm.date,
    tags: tags.filter(Boolean),
    body: m[2].trim(),
  };
}

async function main() {
  const env = loadEnv();
  const DID = STANDARD_SITE_DID;
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
    // Drafts never get a record: records.json is served publicly and the
    // records themselves are public on the network.
    if (post && !post.draft) posts.push(post);
  }

  const publicationRKey = PUBLICATION_RKEY;
  const publicationUri = PUBLICATION_URI;

  const publication = {
    $type: "site.standard.publication",
    url: SITE_URL,
    name: "Ritik Patni",
    description: "Writing, notes, and a reading shelf from Ritik Patni.",
    preferences: { showInDiscover: true },
  };

  const documents = posts.map((p) => {
    if (!p.date) {
      throw new Error(`Post "${p.slug}" has no date, so it can't get a stable record key.`);
    }
    return {
      rkey: documentRkey(p.slug, p.date),
      $type: "site.standard.document",
      site: publicationUri,
      title: p.title,
      path: `/blog/${p.slug}`,
      description: p.description,
      publishedAt: new Date(p.date).toISOString(),
      tags: p.tags,
      textContent: p.body.slice(0, 20000),
    };
  });

  const seenKeys = new Map();
  for (const doc of documents) {
    if (seenKeys.has(doc.rkey)) {
      throw new Error(`Record key collision: ${doc.path} and ${seenKeys.get(doc.rkey)} -> ${doc.rkey}`);
    }
    seenKeys.set(doc.rkey, doc.path);
  }

  mkdirSync(OUT_DIR, { recursive: true });
  mkdirSync(WELL_KNOWN_DIR, { recursive: true });

  // .well-known endpoint returning the publication AT-URI (verification).
  writeFileSync(resolve(WELL_KNOWN_DIR, "site.standard.publication"), publicationUri);

  writeFileSync(
    resolve(OUT_DIR, "records.json"),
    JSON.stringify(
      { publication, documents: documents.map(({ rkey, ...record }) => record) },
      null,
      2,
    ),
  );

  // <link> tags to inject into each post's <head>.
  const links = documents.map((d) => ({
    path: d.path,
    link: `<link rel="site.standard.document" href="at://${DID}/site.standard.document/${d.rkey}" />`,
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
      // The DID never changes; the handle has (ritikpatni.bsky.social ->
      // ritikpatni.me), and a stale handle fails to sign in.
      identifier: DID,
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
   Real publish against a Bluesky/PDS XRPC endpoint. Every document has a
   stable rkey (documentRkey), so putRecord updates on re-runs instead of
   duplicating, and anything in the collection without a matching post is
   deleted. */

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

async function xrpcGet(pds, token, method, params) {
  const res = await fetch(`${pds}/xrpc/${method}?${new URLSearchParams(params)}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} failed (${res.status}): ${text.slice(0, 200)}`);
  return JSON.parse(text);
}

async function listRkeys(pds, token, did, collection) {
  const rkeys = [];
  let cursor;
  do {
    const page = await xrpcGet(pds, token, "com.atproto.repo.listRecords", {
      repo: did,
      collection,
      limit: "100",
      ...(cursor ? { cursor } : {}),
    });
    for (const record of page.records ?? []) rkeys.push(record.uri.split("/").pop());
    cursor = page.records?.length ? page.cursor : undefined;
  } while (cursor);
  return rkeys;
}

async function publishRecords(opts) {
  const { identifier, appPassword, pds, did, publicationRKey, publication, documents } = opts;

  console.log(`Authenticating to ${pds} as ${identifier}...`);
  const session = await xrpc(pds, null, "com.atproto.server.createSession", {
    identifier,
    password: appPassword,
  });
  const token = session.accessJwt;
  if (session.did !== did) {
    throw new Error(`Session DID ${session.did} != expected ${did}; refusing to write to another repo.`);
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
  for (const { rkey, ...record } of documents) {
    try {
      await xrpc(pds, token, "com.atproto.repo.putRecord", {
        repo: did,
        collection: "site.standard.document",
        rkey,
        record,
      });
      ok++;
    } catch (e) {
      failed.push({ path: record.path, error: e.message });
      console.error(`FAILED ${record.path}: ${e.message}`);
    }
  }

  // Prune after upserting, and only when every upsert landed, so a partial run
  // never leaves a live post without a record.
  let pruned = 0;
  if (failed.length === 0) {
    const wanted = new Set(documents.map((d) => d.rkey));
    const stale = (await listRkeys(pds, token, did, "site.standard.document")).filter(
      (rkey) => !wanted.has(rkey),
    );
    for (const rkey of stale) {
      try {
        await xrpc(pds, token, "com.atproto.repo.deleteRecord", {
          repo: did,
          collection: "site.standard.document",
          rkey,
        });
        pruned++;
      } catch (e) {
        failed.push({ path: `(stale ${rkey})`, error: e.message });
        console.error(`FAILED to delete stale ${rkey}: ${e.message}`);
      }
    }
  } else {
    console.error("Skipping stale-record cleanup because some upserts failed.");
  }

  if (failed.length > 0) {
    console.error(`\n${failed.length} operation(s) FAILED:`);
    for (const f of failed) console.error(` - ${f.path}: ${f.error}`);
    process.exitCode = 3; // non-zero so the Action shows red, but partial progress is kept
  }
  console.log(`Published ${ok}/${documents.length} document records, deleted ${pruned} stale. Done.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
