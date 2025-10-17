import { getDraftTeams, saveDraftTeams, updateGameState } from './db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const gameId = req.query.gameId || 'default';

  try {
    if (req.method === 'GET') {
      // Get draft results
      const teams = await getDraftTeams(gameId);
      res.status(200).json(teams);

    } else if (req.method === 'POST' || req.method === 'PUT') {
      // Save draft results
      const { teams } = req.body;

      if (!teams || typeof teams !== 'object') {
        return res.status(400).json({ error: 'Teams data is required' });
      }

      // Save teams
      await saveDraftTeams(gameId, teams);

      // Mark draft as complete in game state only if teams is not empty (not a reset)
      const isReset = Object.keys(teams).length === 0;
      if (!isReset) {
        await updateGameState(gameId, { draft_complete: true });
      }

      res.status(200).json({ message: 'Draft results saved successfully' });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Draft error:', error);
    res.status(500).json({ error: error.message });
  }
}
