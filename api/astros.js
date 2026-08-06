// Vercel serverless proxy for Open Notify's people-in-space count
// (that API is HTTP-only, which HTTPS pages can't fetch directly).
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const r = await fetch('http://api.open-notify.org/astros.json');
    if (!r.ok) throw new Error(`upstream HTTP ${r.status}`);
    const json = await r.json();
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200');
    res.status(200).json(json);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
}
