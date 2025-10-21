import { getPlayerRankings, savePlayerRankings, clearAllRankings } from './db';

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
      const rankings = await getPlayerRankings(gameId, playerCode);

      if (playerCode) {
        if (rankings && Object.keys(rankings).length > 0) {
          res.status(200).json(rankings);
        } else {
          res.status(404).json({ error: 'Rankings not found' });
        }
      } else {
        res.status(200).json(rankings);
      }

    } else if (req.method === 'POST' || req.method === 'PUT') {
      // Save or update rankings
      const { playerCode: bodyPlayerCode, men, women, rankings: resetRankings } = req.body;
      const code = bodyPlayerCode || playerCode;

      // Check if this is a reset operation
      if (resetRankings !== undefined) {
        // Reset all rankings
        await clearAllRankings(gameId);
        return res.status(200).json({ message: 'Rankings reset successfully' });
      }

      if (!code) {
        return res.status(400).json({ error: 'Player code is required' });
      }

      // Save player rankings
      await savePlayerRankings(gameId, code, men || [], women || []);

      res.status(200).json({ message: 'Rankings saved successfully' });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Rankings error:', error);
    res.status(500).json({ error: error.message });
  }
}
