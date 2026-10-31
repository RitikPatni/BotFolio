# Blog likes prototype

A floating, like-only control on published blog posts. It counts with D1; it does not use Umami. No deployment, production database, or Cloudflare binding is part of this prototype.

## Behavior and privacy

- One browser/device token may add at most 10 likes per post. The server enforces this; there is no unlike. Clearing site data removes the first-party token and resets that browser's cap; another browser/device gets a separate token.
- The browser creates a random 256-bit token with Web Crypto and stores it in first-party `localStorage`. The API HMACs it with `LIKES_SALT`; D1 stores only that digest. The app does not use IP addresses, accounts, or fingerprints for identity, and never logs or returns the raw token. If browser storage is blocked, the fallback token lasts for the current page session.
- Counts are public. POSTs are limited to 20 requests per browser-token hash per minute. Old per-browser action rows are opportunistically removed after 30 days; totals remain.
- The floating control is visible while the article is in view, and hides outside the article. It has a 44px minimum target, keyboard focus, a labeled button, light/dark tokens, and reduced-motion handling.

## Schema

Apply `migrations/0001_likes.sql`. It defines `like_counts`, `like_actions` and `like_rate`. The visitor-hash rows in the latter two tables are operational data, not analytics; do not expose them in responses or logs.

## Local verification (no Cloudflare account)

Requires Node 22+ and Wrangler 4. From the repository root:

```sh
npm run build
npx wrangler pages dev dist --local
```

The checked-in `wrangler.toml` is local-only: it binds the fake D1 UUID as `LIKES_DB`, sets a throwaway `LIKES_SALT`, and pins compatibility to `2026-10-30`. Do not deploy this config; production requires a real D1 ID and a Pages secret. Both commands below use Wrangler's default `.wrangler/state` persistence, so migration and dev share the same local database.

In a second terminal, apply the migration locally:

```sh
npx wrangler d1 execute botfolio-likes --local --file=migrations/0001_likes.sql
```

Then run the endpoint smoke script:

```sh
npx --yes --package=node@22 node scripts/likes-smoke.mjs
npx --yes --package=node@22 node scripts/likes-pages-smoke.mjs http://127.0.0.1:8788
```

It checks token validation, zero-count GET, increments, ten-like cap and rejected 11th like, simultaneous requests, rate limit, separate browser tokens/posts, malformed slugs, missing bindings, and raw-token non-disclosure. To review the UI, verify a random token persists across reloads, clearing site data generates a new token, and the heart progress/final pulse/reduced-motion states work as documented above.

## Production activation — human gate, not run by this prototype

Only after review/approval, create a D1 database in Ritik's Cloudflare account, apply the migration with `wrangler d1 execute <database> --remote --file=migrations/0001_likes.sql`, and bind it as `LIKES_DB` to the Pages project. Set `LIKES_SALT` as a Pages secret (use a cryptographically random value generated outside this repository; never commit it). Validate the production binding and secret before any deployment. No live Cloudflare account changes have been made.
