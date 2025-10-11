import { getData, saveData, getDefaultTeams, getDefaultGameState } from './storage.js';

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
      const teams = await getData(gameId, 'teams') || getDefaultTeams();
      res.status(200).json(teams);

    } else if (req.method === 'POST' || req.method === 'PUT') {
      // Save draft results
      const { teams } = req.body;

      if (!teams || typeof teams !== 'object') {
        return res.status(400).json({ error: 'Teams data is required' });
      }

      // Save teams
      await saveData(gameId, 'teams', teams);

      // Mark draft as complete in game state only if teams is not empty (not a reset)
      const isReset = Object.keys(teams).length === 0;
      if (!isReset) {
        let gameState = await getData(gameId, 'game-state') || getDefaultGameState();
        gameState.draft_complete = true;
        gameState.updated_at = new Date().toISOString();
        await saveData(gameId, 'game-state', gameState);
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
