// Vercel serverless proxy: scrapes AAA's state-average gas prices
// (no public API exists without paid keys). Returns current + week-ago
// averages for regular / mid / premium / diesel.
export default async function handler(req, res) {
  const state = String(req.query.state || 'OH').toUpperCase().slice(0, 2);
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const r = await fetch(`https://gasprices.aaa.com/?state=${state}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36' },
    });
    if (!r.ok) throw new Error(`upstream HTTP ${r.status}`);
    const html = await r.text();
    const row = label => {
      const m = html.match(new RegExp(`${label}(.*?)</tr>`, 's'));
      return m ? (m[1].match(/\$([0-9.]+)/g) || []).map(p => +p.slice(1)) : [];
    };
    const cur = row('Current Avg\\.'), week = row('Week Ago Avg\\.');
    if (cur.length < 4) throw new Error('parse failed');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200');
    res.status(200).json({
      state,
      regular: cur[0], mid: cur[1], premium: cur[2], diesel: cur[3],
      weekAgo: week[0] || null,
    });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
}
