// Vercel serverless proxy for live aircraft states. Tries OpenSky
// first (their CORS policy blocks browsers, and they sometimes block
// datacenter IPs), then falls back to the adsb.lol community feed,
// normalized into OpenSky's "states" array shape.
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const num = (v, d) => (isFinite(+v) ? +v : d);
  const lamin = num(req.query.lamin, 38.9), lamax = num(req.query.lamax, 39.8);
  const lomin = num(req.query.lomin, -85.1), lomax = num(req.query.lomax, -83.5);
  const now = Math.floor(Date.now() / 1000);

  try {
    const url = `https://opensky-network.org/api/states/all?lamin=${lamin}&lomin=${lomin}&lamax=${lamax}&lomax=${lomax}`;
    const r = await fetch(url, { headers: { 'User-Agent': 'tickr/1.0' }, signal: AbortSignal.timeout(8000) });
    if (!r.ok) throw new Error(`opensky HTTP ${r.status}`);
    const json = await r.json();
    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=240');
    return res.status(200).json(json);
  } catch (err) {
    console.log('opensky failed:', err.message);
  }

  try {
    const clat = (lamin + lamax) / 2, clon = (lomin + lomax) / 2;
    // radius covering the box, in nautical miles (capped at adsb.lol's 250)
    const nm = Math.min(250, Math.ceil((lamax - lamin) / 2 * 60) + 15);
    const r = await fetch(`https://api.adsb.lol/v2/point/${clat.toFixed(3)}/${clon.toFixed(3)}/${nm}`, {
      headers: { 'User-Agent': 'tickr/1.0' }, signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) throw new Error(`adsb.lol HTTP ${r.status}`);
    const j = await r.json();
    const states = (j.ac || [])
      .filter(a => a.lat != null && a.lon != null &&
                   a.lat >= lamin && a.lat <= lamax && a.lon >= lomin && a.lon <= lomax)
      .map(a => {
        const ground = a.alt_baro === 'ground';
        const altM = ground || a.alt_baro == null ? 0 : a.alt_baro * 0.3048;
        return [a.hex || '', (a.flight || '').trim(), '', now - (a.seen_pos || 0),
                now - (a.seen_pos || 0), a.lon, a.lat, altM, ground,
                (a.gs || 0) * 0.5144, a.track != null ? a.track : 0,
                (a.baro_rate || 0) * 0.00508];
      });
    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=240');
    return res.status(200).json({ time: now, states, source: 'adsb.lol' });
  } catch (err) {
    return res.status(502).json({ error: err.message });
  }
}
