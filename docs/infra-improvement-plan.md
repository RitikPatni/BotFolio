# BotFolio infra improvement plan (parked)

## Cloudflare R2 / Images for photography assets (parked 2026-10-14)
Current state (measured): 39 originals (162MB) -> 364 build-time derivatives (webp/avif),
248MB in deploy, served by CF Pages CDN, hash-keyed immutable caching. Largest file 10.9MB
(Pages limit 25MB, files limit 20k — ~50x headroom). Build cost ~14s.

Trigger conditions to revisit (any ONE):
1. Photography library grows past ~150 images / originals > 500MB total — deploys get heavy.
2. Need on-the-fly variants (client-specific crops/sizes for portfolio pitches) -> Cloudflare IMAGES (transformations), not raw R2.
3. Selling/serving full-resolution originals to visitors -> R2 + signed URLs, keep originals out of repo.

Not worth it for current scale: R2 adds bucket/domain config + upload pipeline + invalidation
handling for zero tangible gain; the CDN path is already optimal.

## Font trim (done 2026-10-14)
- og-fonts: 5 Inter TTFs (~2.1MB) removed; defaultFontFamily = Fraunces.
- og-fonts now: Fraunces 500/600, Newsreader 400, IBM Plex Mono 400/500 (~536KB total).

## Google-Fonts CSS (site): trimmed dead families (Archivo/Playfair) in P1.
