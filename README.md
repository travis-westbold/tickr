# tickr

A virtual 192×32 LED ticker in a single HTML file — a tiny TV station for your
desk. Seventeen data channels rotate like programming, localized to your ZIP
code.

**Live:** https://tickr-travis-westboldcoms-projects.vercel.app

## Channels

Grouped into themed programme blocks:

- **Weather** — current conditions · day-parts forecast (morning→tonight,
  current part highlighted) · 5-day forecast · live NWS-palette radar with
  motion loop · animated sunrise/sunset scenes with shifting skies and
  twinkling stars · moon phase (the real near side, pixelized from a
  photograph, with earthshine)
- **Time & news** — analog + digital clock in the ZIP's timezone · Hacker
  News marquee
- **Money** — stocks (default S&P 500, any Yahoo symbol) with intraday
  sparkline · Bitcoin with a spinning embossed ₿ coin · AAA state gas
  averages with an animated pump
- **Sky & space** — next rocket launch T-minus clock with NASA/SpaceX pixel
  logos · ISS tracker (live position via local orbit propagation, crew count,
  next pass over your ZIP) · live air traffic radar with dead-reckoned planes
- **Sports** — live MLB/NFL/NBA/NHL/MLS scores in team colors · next
  F1/NASCAR/IndyCar events · esports match cards (demo data)

## The display

- **RGB565 framebuffer** (`Uint16Array`) quantized like real LED hardware and
  streamable to a physical panel; Tidbyt-style round LEDs (default) or crisp
  square pixels.
- Arcade 5×7 bitmap font, cross-hatch dithered pixel art, 4 Hz beat
  animations, buffer-level transitions (wipe, light beam, push, dissolve,
  blinds, curtain — Random by default).

## Controls

- Drag channel blocks to set the programme order; per-channel dwell seconds.
- Checkbox cycles **on → off → override (red)** — override channels take over
  the rotation entirely (one = parked, two = bounce between them).
- Click a channel's name to jump to it; ←/→ arrow keys flip channels.
- ZIP, transition, and pixel-style settings persist in localStorage; first
  visit asks for your ZIP.

## Data

Free, keyless sources (Open-Meteo, RainViewer, Launch Library, wheretheiss.at,
Coinbase, ESPN, adsb.lol, Hacker News, zippopotam.us) plus small Vercel
serverless proxies in `api/` for sources without HTTPS or CORS (Yahoo quotes,
AAA gas prices, Open Notify crew count, OpenSky/adsb.lol aircraft). Every
channel renders clearly-tagged sample data offline.

## Run / develop

Open `index.html` in a browser — that's it. Deploy your own with `vercel` and
point `DEPLOY_BASE` in `index.html` at your URL to use the `api/` proxies.

Headless render-testing: `node tools/simulate.js` dumps framebuffer frames as
ASCII. See `CLAUDE.md` for architecture notes and data-source quirks, and
`PRD.md` for the display spec and channel contract.
