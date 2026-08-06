# tickr

A virtual 192×32 LED ticker in a single HTML file — a tiny TV station for your
desk. Eighteen data channels rotate like programming: weather, forecasts, live
NWS-style radar, moon phase (pixelized from a real photograph), animated
sunrise/sunset, stocks, Bitcoin, gas prices, rocket launch countdowns, an ISS
tracker with local orbit propagation, live air traffic, real sports scores,
motorsport, and more.

**Live:** https://tickr-travis-westboldcoms-projects.vercel.app

## Highlights

- **RGB565 framebuffer** — a `Uint16Array` is the single source of truth,
  quantized like real LED-matrix hardware and streamable to a physical panel.
  Tidbyt-style round-LED or crisp square pixel rendering.
- **Arcade 5×7 bitmap font**, cross-hatch dithered pixel art, subtle
  animations on a 4 Hz beat.
- **Channel scheduler** with buffer-level transitions (wipe, beam, push,
  dissolve, blinds, curtain, random), drag-to-reorder programme blocks,
  per-channel dwell times, tri-state on/off/override checks, and arrow-key
  channel surfing.
- **Free, keyless data sources** (Open-Meteo, RainViewer, Launch Library,
  wheretheiss.at, Coinbase, ESPN, adsb.lol, Hacker News, zippopotam.us), with
  small Vercel serverless proxies (`api/`) for sources that lack HTTPS or
  CORS. Every channel renders clearly-tagged sample data offline.
- **Localized by ZIP code** — weather, radar centering, sun times, gas
  prices, ISS passes, air traffic, and the clock's timezone all follow it.

See `PRD.md` for the display spec and channel contract.

## Run it

Open `index.html` in a browser — that's it. Deploy with `vercel` if you want
the `api/` proxies (stocks, gas, crew count, air traffic) under your own URL,
and point `DEPLOY_BASE` in `index.html` at it.
