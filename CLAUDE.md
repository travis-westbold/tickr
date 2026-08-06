# CLAUDE.md — tickr project context

Read this (and `PRD.md`) before making changes. Everything lives in one
`index.html`; there is no build step.

## What this is

A virtual 192×32 LED ticker web app — a rotating "TV station" of 17 data
channels, deployed on Vercel with four serverless proxies under `api/`.

- **Live site:** https://tickr-travis-westboldcoms-projects.vercel.app
  (stable URL; per-deploy URLs like `tickr-xxxx-...` are frozen snapshots —
  never share those). Vercel Deployment Protection is DISABLED on purpose so
  the site and `/api/*` are public.
- **GitHub:** https://github.com/travis-westbold/tickr (public). Commit and
  push alongside deploys to keep it in sync.
- **Deploy:** `npx -y vercel@latest deploy --prod --yes` from the project dir
  (CLI is authed as travis-7780; project is linked via `.vercel/`).

## Architecture (all in index.html)

- **RGB565 framebuffer**: `fb` (Uint16Array 192×32) is the source of truth.
  All drawing goes through `pset/px/rect` into a `target` buffer;
  `blit()` renders square (putImageData) or round Tidbyt-style LED dots
  (6× canvas). Fractional coords are silent no-ops on typed arrays —
  `drawText` rounds x for this reason.
- **Font**: one arcade-style 5×7 variable-width bitmap font (`FONT`),
  `drawText(str, x, y, color, scale)` + `measureText`. No outlines (removed
  deliberately — they clipped neighboring glyphs).
- **Typography system**: labels in dim slate `#66707a`, values white, accent
  colors only where meaningful (HI red / LO blue, market green/red, LIVE red,
  countdown green `#9ef0a0`, cyan `#9ecbff` for times/coords).
- **Channels**: `channels` array of `{id, name, render(f), resume?}` — see
  PRD.md for the full contract (layout grid, sample-data rule, resume rule).
- **Scheduler**: 20 fps tick, per-channel dwell seconds, buffer-level
  transitions (`TRANSITIONS`, style resolved once per switch; 'random' is
  default). Arrow keys flip channels; clicking a chip name jumps to it.
- **Tri-state checks**: click cycles on → off → override (red). Any override
  channels commandeer the whole rotation (1 = parked, 2 = bounce between).
  NOTE: checkbox repaint must be deferred (`setTimeout 0`) because browsers
  restore checked state after `preventDefault`.
- **Config**: localStorage `tickr-config` — channels {on, secs, override},
  order, orderVersion, transition, pixels ('round' default), zip (45040),
  symbol (^GSPC). Saved order wins over defaults; bump `orderVersion` when
  changing the default grouping (weather / time+news / money / sky&space /
  sports blocks). First visit with no saved config shows the ZIP modal.
- **Timezone**: all wall-clock displays use `locNow()`/`toLoc()` (offset from
  Open-Meteo `utc_offset_seconds`) so the clock etc. follow the ZIP, not the
  browser. Countdowns always use absolute time — never a shifted Date.

## Data sources & quirks

| Source | Used for | Quirk |
|---|---|---|
| Open-Meteo | weather, day parts, 5-day, sun times, tz offset | keyless, CORS-open, one call for everything |
| zippopotam.us | ZIP → lat/lon/state | CORS-open |
| RainViewer | radar tiles | CORS-open; color scheme 6 = NEXRAD, smoothing 0; sampled per-pixel |
| Hacker News API | headlines | CORS-open |
| Yahoo Finance | stocks | NO CORS → `api/quote.js` proxy |
| Coinbase (exchange API) | bitcoin | CORS-open; Binance is US geo-blocked (451) |
| AAA gas prices page | gas | no API exists → `api/gas.js` scrapes state page |
| Launch Library 2 | rocket launches | CORS-open; anonymous rate limit → 30 min refresh |
| wheretheiss.at | ISS | CORS-open; we derive orbital elements from 2 samples and propagate locally (also powers pass prediction) |
| Open Notify | people in space | HTTP-only → `api/astros.js` proxy |
| OpenSky → adsb.lol | air traffic | OpenSky CORS is closed AND blocks datacenter IPs; `api/air.js` falls back to adsb.lol, normalized to OpenSky shape |
| ESPN hidden API | sports (MLB/NFL/NBA/NHL/MLS), motorsport (F1/NASCAR/IndyCar) | CORS-open, no key; team colors included |
| esports channel | DEMO data only | no free keyless esports API exists; `TOURNAMENT` object is hand-edited |

Every channel MUST render offline via a SAMPLE/DEMO-tagged fallback.
`DEPLOY_BASE` in index.html points the local file at the deployed proxies.

## Testing

`tools/simulate.js` runs the page headlessly in Node (stubs DOM/canvas/fetch)
and dumps the framebuffer as ASCII with a color legend — the main way to
verify rendering without a browser. Pattern: seed `localStorage.getItem` with
a config enabling only the channel under test, tick the 50 ms timer, dump.
All network calls fail in the sim, so channels render their sample data.

## Assets with provenance

- Moon channel: 27×27 12-shade map pixelized from the Wikimedia FullMoon2010
  photo (dithered, palette-indexed — `MOON_MAP`).
- ISS earth: 25×25 16-color map from NASA Blue Marble west hemisphere
  (`EARTH_MAP`). Regeneration pipeline was Python/PIL: crop disc → resize →
  saturation boost → median-cut quantize with Floyd–Steinberg.

## Ideas parked for later

- Favorite-teams pinning for the sports channel
- PandaScore key → live esports scores (wire through `api/`)
- Connect GitHub repo to Vercel for push-to-deploy
- Physical hardware: `ticker.buffer` is already stream-ready RGB565
