// /api/check-access-elite.js
export default async function handler(req, res) {
  const email = req.query.email;
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Invalid email' });
  }

  try {
    const gistRes = await fetch(`https://api.github.com/gists/${process.env.GITHUB_GIST_ID}`, {
      headers: { Authorization: `token ${process.env.GITHUB_TOKEN}` },
    });

    if (!gistRes.ok) {
      console.error('Gist fetch failed for ELITE:', gistRes.status);
      return res.status(500).json({ error: 'Access system unavailable' });
    }

    const gist = await gistRes.json();
    const content = gist.files?.['elite-approved-customers.txt']?.content || '';
    const approved = content
      .split('\n')
      .map(e => e.trim())
      .includes(email.trim());

    res.status(200).json({ approved });
  } catch (err) {
    console.error('Elite access check error:', err);
    res.status(500).json({ error: 'Internal error' });
  }
}
