# Tickr — Product Requirements

A web-based virtual LED ticker: a 192×32 RGB565 display that rotates through
"channels" (weather, clock, headlines, …) like a tiny TV station. Lives in a
single `index.html`; deployed on Vercel with small serverless proxies under
`/api/` for data sources that lack HTTPS or CORS.

## Display

- **Framebuffer**: 192×32, 16-bit RGB565 (`Uint16Array`), the single source of
  truth. All drawing quantizes into it; `blit()` expands 5/6/5 to screen RGB.
  The buffer is hardware-ready (streamable to a physical matrix as-is).
- **Pixel styles**: `round` (default — Tidbyt-style LED dots on a faint unlit
  grid) and `square` (crisp 1:1 pixels). On-screen size 1080×180.
- **Font**: one arcade-style 5×7 variable-width bitmap font, drawn via
  `drawText(str, x, y, color, scale)`. Every glyph carries a 1px black outline
  so text stays legible over art. `measureText` for layout; text at scale 1
  for detail rows (y = 1, 9, 17, 25), scale 2 for hero numbers.
- **Art style**: cross-hatch (checkerboard) dithering for shading/gradients;
  subtle animations on a 4 Hz beat (`Math.floor(f / 5)`).

## Engine

- 20 fps global tick. Each channel renders a full frame into an offscreen
  buffer; the scheduler composes transitions between outgoing/incoming buffers
  at the RGB565 level (wipe, beam, push, dissolve, blinds, curtain, cut, or
  random — resolved once per switch).
- Channels are draggable blocks in the control panel; order = programme order.
  Per-channel on/off + dwell seconds. Config persists in localStorage
  (`tickr-config`), merged over defaults so new channels appear for old saves.
- Arrow keys flip programme forward/back with a fast transition.

## Channel contract

Each channel is `{ id, name, render(f), resume? }` in the `channels` array,
plus a `DEFAULT_CFG.channels` entry and a spot in `DEFAULT_CFG.order`.

- `render(f)` draws one complete frame; `f` is the channel's frame counter
  (20 fps). Never blit or clear globally — the scheduler owns composition.
- **Resume rule (required going forward)**: channels with *progressive*
  content — marquees, rotating card decks, playlists — MUST set
  `resume: true`. Their `f` then comes from a persistent per-channel clock
  that only advances while the channel is on screen, so the content picks up
  exactly where it left off on the next cycle (a marquee keeps scrolling; a
  card deck shows the next card). Channels whose content is a pure function
  of the current time (clock, countdowns, live positions) or a short loop
  (radar sweep) omit it and get a fresh counter each showing.
  - Current `resume` channels: headlines, esports, motorsport.
- **Data**: fetch from free, CORS-open APIs where possible; route HTTP-only or
  CORS-blocked sources through a `/api/*` Vercel function. Refresh on a
  sensible interval (respect rate limits). Every channel MUST render something
  meaningful offline: an embedded or generated fallback clearly tagged
  `SAMPLE`/`DEMO` in dim grey. Use relative times in samples so countdowns
  stay alive.
- Location-aware channels key off the shared ZIP setting (`cfg.zip` → `place`)
  and should re-derive on location change.
- Layout convention: graphic/logo in a ~26px box on the left, text content
  from x≈36; right-align secondary facts to x=190.

## Current channels

Default programme order groups related channels (IA rule — keep it when
adding channels; bump `orderVersion` if the default grouping changes):

- Weather block: weather, radar (RainViewer), sunrise/sunset, moon phase
- Time + news: clock, headlines (HN)
- Money: stocks (Yahoo via proxy), bitcoin (Coinbase), gas (AAA via proxy)
- Sky & space: rocket launch (Launch Library), ISS tracker (wheretheiss.at +
  local orbit propagation), air traffic (OpenSky/adsb.lol via proxy)
- Sports: motorsport (ESPN F1/NASCAR/IndyCar), esports (demo data)
