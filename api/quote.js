// Vercel serverless proxy for Yahoo Finance quotes (browsers can't hit
// Yahoo directly — no CORS). Returns the v8 chart payload with open CORS.
export default async function handler(req, res) {
  const symbol = String(req.query.symbol || 'AAPL').toUpperCase().slice(0, 10);
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=5m&range=1d`;
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (tickr)' } });
    if (!r.ok) throw new Error(`upstream HTTP ${r.status}`);
    const json = await r.json();
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    res.status(200).json(json);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
}
