# Blog likes prototype

A floating, like-only control on published blog posts. It counts with D1; it does not use Umami. No deployment, production database, or Cloudflare binding is part of this prototype.

## Behavior and privacy

- One browser visitor may add at most 10 likes per post. The server enforces this; clearing local storage does not bypass the limit. There is no unlike.
- The heart fill shows that visitor's own 0–10 progress; the adjacent number remains the public aggregate. Only the accepted 10th like plays the completion pop and single halo pulse. Loading an already-maxed state does not replay it.
- Counts are public. Visitor identity is an HMAC-SHA-256 of Cloudflare's `cf-connecting-ip`, using `LIKES_SALT`; only that digest is stored. The raw IP is neither stored nor logged nor returned. If Cloudflare omits the header, requests share an `unknown` bucket.
- POSTs are limited to 20 requests per visitor hash per minute. Old per-visitor action rows are opportunistically removed after 30 days; totals remain.
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

It checks zero-count GET, increments, ten-like cap and rejected 11th like, rate limit, independent posts/visitors, invalid slugs, missing bindings, and IP/hash non-disclosure. To review the UI, open a published post in the local Pages preview, verify the heart at 0/1/5/9/10 personal likes (separate from the public count), confirm only a successful 10th like gets the completion pulse, then test rejected 11th, 390px layout, keyboard activation, and reduced motion.

## Production activation — human gate, not run by this prototype

Only after review/approval, create a D1 database in Ritik's Cloudflare account, apply the migration with `wrangler d1 execute <database> --remote --file=migrations/0001_likes.sql`, and bind it as `LIKES_DB` to the Pages project. Set `LIKES_SALT` as a Pages secret (use a cryptographically random value generated outside this repository; never commit it). Validate the production binding and secret before any deployment. No live Cloudflare account changes have been made.
