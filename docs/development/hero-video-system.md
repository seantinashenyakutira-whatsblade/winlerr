# Shared hero video

## Public hero inventory

The host-aware router sends `https://os.winlerr.vip/` to `/winlerros`; the other entries below are public marketing routes. Each entry renders one `HeroVideo`. Article, system-detail, login, callback, dashboard, and other internal routes stay static.

| Public URL | Hero renderer | Shared video |
| --- | --- | --- |
| `/` on `www.winlerr.vip` | `apps/web/src/components/hero.tsx` | Yes |
| `/about` | `apps/web/src/app/about/page.tsx` | Yes |
| `/systems` | `apps/web/src/app/systems/page.tsx` | Yes |
| `/systems/[slug]` (six system detail pages) | `apps/web/src/app/systems/[slug]/page.tsx` | Yes |
| `/docs` | `apps/web/src/app/docs/page.tsx` | Yes |
| `/get-started` | `apps/web/src/app/get-started/page.tsx` | Yes |
| `/` on `os.winlerr.vip` (rewrite to `/winlerros`) | `apps/web/src/app/winlerros/page.tsx` | Yes |

The hero layer is decorative, `aria-hidden`, cropped with `object-cover`, and washed with the same light gradient so the existing Winlerr palette, copy, and controls remain readable. It is rendered only by the listed hero routes, so it does not add requests to unrelated routes or put more than one background video on a page.

## Playback and fallback

`HeroVideo` paints the poster immediately. It mounts the video only after the hero intersects the viewport, and only when reduced motion is off and the browser does not report data saver, `2g`, or `slow-2g`. The video is muted, looping, inline, and has the autoplay attribute; the component also calls `play()` when visible. The poster fades only after the browser confirms playback through a `playing` event or a resolved `play()` promise. Leaving the viewport unmounts and pauses the video. A rejected play request, media error, unsupported codec, or slow media response leaves the poster visible. Motion preference and connection listeners and the intersection observer are cleaned up on unmount.

## Media and delivery

| File | Encoding / dimensions | Duration | Size |
| --- | --- | ---: | ---: |
| `apps/web/public/video/hero-loop.mp4` | MP4, H.264/AVC (`avc1`), 1280 × 720, ~612 kb/s average | 16 s | 1,223,548 bytes |
| `apps/web/public/video/hero-poster.jpg` | JPEG, 1280 × 720 | — | 11,709 bytes |

Both paths exist in `public/video/`. On 2026-10-11, the live `www.winlerr.vip` URLs returned HTTP 200, the expected `video/mp4` and `image/jpeg` content types, matching content lengths, and Vercel cache hits. Both are served inline with byte-range support. The poster is the immediate visual fallback and the video is requested only when an eligible hero is visible.
