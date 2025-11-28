// /api/seat-count.js
export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const gistRes = await fetch(
      `https://api.github.com/gists/${process.env.GITHUB_GIST_ID}`,
      {
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
          'User-Agent': 'SaaSy Seat Counter',
        },
      }
    );

    if (!gistRes.ok) {
      console.error('Failed to fetch Gist:', gistRes.status, gistRes.statusText);
      return res.status(500).json({ error: 'Failed to load seat data' });
    }

    const gist = await gistRes.json();
    const content = gist.files?.['elite-approved-customers.txt']?.content || '';

    // Count non-empty lines
    const lines = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    const totalSeats = 150;
    const claimed = lines.length;

    res.status(200).json({
      claimed,
      total: totalSeats,
      available: totalSeats - claimed,
      percentage: Math.round((claimed / totalSeats) * 100),
    });
  } catch (err) {
    console.error('Seat count error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
