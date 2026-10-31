# Blog likes

A floating like-only control on published blog posts. Counts are stored in Cloudflare D1; this feature does not use Umami.

## Behavior, limits, and privacy

- Each browser token may add at most 10 likes per post. Its cap resets after 30 days without an accepted like; the public total never resets. Clearing site data or using another browser creates a fresh token and cap.
- The client stores its personal count with the last accepted like timestamp and re-enables at the 30-day reset, including while the page remains open. Older count-only localStorage entries are reset locally; the server remains authoritative and returns the actual reset time when a cap is reached. Public GETs never carry visitor identity.
- The client creates a random 256-bit token with Web Crypto and stores it in first-party `localStorage`. The server HMACs it with `LIKES_SALT`; D1 stores only digests. Action digests are scoped per post; rate-limit digests are separately scoped to a fixed minute window, so requests in that same minute remain linkable through that rate row. No IP address, account, or fingerprint is used for identity; raw tokens are not stored, logged, or returned. If browser storage is blocked, the fallback token lasts only for the page session.
- **These are per-token courtesy limits, not person-level abuse prevention.** A client can mint fresh tokens and bypass both the 10-like cap and request limit. HMAC does not prevent token minting. Before public launch, an authorized operator should consider a privacy-compatible edge rate-limit rule or challenge that does not persist IP addresses. No such Cloudflare control was configured as part of this code change.
- Public count reads use a 10-second edge-cache TTL; a successful write attempts to invalidate the count in its serving location. Other edge locations may continue serving a stale count until their TTL expires. The Cache API may not provide the same behavior on `pages.dev` preview hosts.
- Expired per-post action rows are removed opportunistically on 1% of successful likes using an indexed cleanup query; during low traffic, expired rows can remain stored beyond 30 days even though the server-side cap has reset. Rate-window rows older than two minutes are pruned on each POST in indexed batches of at most 500; stale rows can remain if the service is idle. Rate digests rotate each minute and are domain-separated from post action digests.
- The floating control is visible while the article is in view and hides outside it. It has a 44px minimum target, keyboard focus, a labeled button, light/dark tokens, and reduced-motion handling. The UI shows only per-browser progress toward the 10-like cap (heart fill); it does not display the public aggregate, and the client never fetches it.

## Schema and existing production configuration

`migrations/0001_likes.sql` defines `like_counts`, `like_actions`, and `like_rate`. `migrations/0002_likes_cleanup_indexes.sql` adds indexes for expiry cleanup. The initial schema has already been applied to the production D1 database, and the Pages `LIKES_DB` binding and `LIKES_SALT` secret are already configured. Do not create a second database or replace those settings. An authorized human must apply migration 0002 before deploying the revised code. This change does not apply migrations or modify live Cloudflare resources.

Visitor-hash rows are operational data, not analytics; do not expose them in responses or logs. The aggregate counts are public.

## Local development (no production resources)

Requires Node 22+ and Wrangler 4. No root `wrangler.toml` is checked in: Pages treats a Wrangler config as deployment configuration, so a fake local database binding must not be able to replace dashboard-managed production settings.

Copy the explicit local-only template to the ignored root config Wrangler requires. Never commit that generated file:

```sh
cp wrangler.local.toml.example wrangler.toml
npm run build
npx wrangler d1 migrations apply botfolio-likes --local
npx wrangler pages dev dist --local
```

The local config uses a fake database ID and throwaway salt. It exists only on your machine, is ignored by Git, and must never be used for a remote command or deployment. Local D1 state persists under `.wrangler/`.

In another terminal, run the function smoke tests against the in-memory schema and the local Pages+D1 instance:

```sh
npx --yes --package=node@22.23.4 -c 'node scripts/likes-smoke.mjs'
npx --yes --package=node@22.23.4 -c 'node scripts/likes-client-state-smoke.mjs'
npx --yes --package=node@22.23.4 -c 'node scripts/likes-pages-smoke.mjs http://127.0.0.1:8788'
```

The tests cover the published-slug manifest, D1 increments/caps/races/rate limits, oversized requests, cached reads and write invalidation, and token non-disclosure. They use published posts from the built site; draft and unknown slugs must not create database rows.

## Human release gates

This change does not deploy or modify live Cloudflare resources. Before an approved deployment, an authorized operator must apply only migration 0002 to the already-configured production D1 database. Because migration 0001 was applied separately and may not be recorded in Wrangler's migration history, do not blindly run `wrangler d1 migrations apply --remote`; use `wrangler d1 execute botfolio-likes --remote --file=migrations/0002_likes_cleanup_indexes.sql` after verifying the target and current schema. Also review the Pages deployment configuration and decide whether privacy-compatible edge mitigation is needed for token-minting abuse. Never deploy the local Wrangler template.
