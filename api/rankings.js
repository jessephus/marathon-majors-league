import { getData, saveData, getDefaultRankings } from './storage.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const gameId = req.query.gameId || 'default';
  const playerCode = req.query.playerCode;

  try {
    if (req.method === 'GET') {
      // Get rankings for a player or all players
      const rankings = await getData(gameId, 'rankings') || getDefaultRankings();

      if (playerCode) {
        if (rankings[playerCode]) {
          res.status(200).json(rankings[playerCode]);
        } else {
          res.status(404).json({ error: 'Rankings not found' });
        }
      } else {
        res.status(200).json(rankings);
      }

    } else if (req.method === 'POST' || req.method === 'PUT') {
      // Save or update rankings
      const { playerCode: bodyPlayerCode, men, women } = req.body;
      const code = bodyPlayerCode || playerCode;

      if (!code) {
        return res.status(400).json({ error: 'Player code is required' });
      }

      // Get existing rankings or create new
      let rankings = await getData(gameId, 'rankings') || getDefaultRankings();

      // Update player rankings
      rankings[code] = {
        men: men,
        women: women,
        submitted_at: new Date().toISOString()
      };

      // Save updated rankings
      await saveData(gameId, 'rankings', rankings);

      res.status(200).json({ message: 'Rankings saved successfully' });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Rankings error:', error);
    res.status(500).json({ error: error.message });
  }
}
