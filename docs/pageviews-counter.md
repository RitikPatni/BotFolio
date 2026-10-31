# Footer lifetime pageviews

A lifetime "Page views" total in the shared footer, served by a Cloudflare
Pages Function that reads the **self-hosted Umami** stats API (Umami Cloud's
API is Pro-only, so the site runs its own instance at
`analytics.ritikpatni.me`; see the umami-infra repo for that stack).

## Pieces

- `functions/api/pageviews.js` — `GET /api/pageviews` returns
  `{ pageviews }` from Umami `/api/websites/{id}/stats?startAt=0`,
  cached one hour at the edge. Token stays server-side. Any failure → 5xx
  JSON; the footer line stays hidden (never a placeholder or zero).
- `src/utils/layout/pageviews.client.ts` — fetches `/api/pageviews` on
  `astro:page-load` (initial load + every client-side navigation), formats
  with `Intl.NumberFormat`, reveals the line only on a real number.
- `BaseLayout.astro` — the footer line itself, plus a tracker script whose
  `src`/`data-website-id` now default to Umami Cloud but can be pointed at
  the self-hosted instance via build-time env vars, so cutover is a config
  change, not a code change.

## Cloudflare Pages env vars

Server-side (function):

- `UMAMI_API_BASE` — e.g. `https://analytics.ritikpatni.me/api`
- `UMAMI_WEBSITE_ID` — website id in the self-hosted instance
- `UMAMI_API_TOKEN` — API key (`x-umami-api-key`) or JWT; both headers are sent

Build-time (tracker cutover; unset = current Umami Cloud values):

- `PUBLIC_UMAMI_SRC` — e.g. `https://analytics.ritikpatni.me/script.js`
- `PUBLIC_UMAMI_WEBSITE_ID` — the new website id

## Cutover order

1. Self-hosted Umami live behind the tunnel; cloud CSV history imported
   (or the gap flagged) — see umami-infra.
2. Set the two `PUBLIC_UMAMI_*` vars in Pages and redeploy → tracker flips.
3. Set the three server-side vars → footer count goes live.
4. Verify: two page loads in a private window show "PAGE VIEWS · N"; the
   Umami dashboard for the new website records both loads.

No `wrangler.toml` is committed on purpose — adding one would take over the
Pages project's existing dashboard bindings.
