// Vercel serverless proxy for pollen.com's forecast endpoint — the only
// workable free US pollen source. It requires browsery headers with a
// matching Referer. Returns a trimmed {index, triggers, city}.
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const zip = String(req.query.zip || '45040').replace(/\D/g, '').slice(0, 5) || '45040';
  try {
    const r = await fetch(`https://www.pollen.com/api/forecast/current/pollen/${zip}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
        'Referer': `https://www.pollen.com/forecast/current/pollen/${zip}`,
        'Accept': 'application/json',
      },
    });
    if (!r.ok) throw new Error(`upstream HTTP ${r.status}`);
    const j = await r.json();
    const today = ((j.Location || {}).periods || []).find(p => p.Type === 'Today');
    if (!today) throw new Error('no Today period');
    res.setHeader('Cache-Control', 's-maxage=10800, stale-while-revalidate=21600');
    res.status(200).json({
      index: today.Index,
      triggers: (today.Triggers || []).map(t => t.Name).slice(0, 3),
      city: (j.Location || {}).City || '',
    });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
}
