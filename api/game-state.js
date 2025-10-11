import { getData, saveData, getDefaultGameState, getDefaultRankings, getDefaultTeams, getDefaultResults } from './storage.js';

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
      // Get game state from blob storage
      const gameState = await getData(gameId, 'game-state') || getDefaultGameState();
      const rankings = await getData(gameId, 'rankings') || getDefaultRankings();
      const teams = await getData(gameId, 'teams') || getDefaultTeams();
      const results = await getData(gameId, 'results') || getDefaultResults();

      res.status(200).json({
        players: gameState.players,
        draftComplete: gameState.draft_complete,
        rankings,
        teams,
        results
      });

    } else if (req.method === 'POST' || req.method === 'PUT') {
      // Update game state
      const { players, draftComplete } = req.body;

      // Get existing game state or create new
      let gameState = await getData(gameId, 'game-state') || getDefaultGameState();

      // Update fields
      if (players !== undefined) {
        gameState.players = players;
      }
      if (draftComplete !== undefined) {
        gameState.draft_complete = draftComplete;
      }
      gameState.updated_at = new Date().toISOString();

      // Save updated game state
      await saveData(gameId, 'game-state', gameState);

      res.status(200).json({ message: 'Game state updated successfully' });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Game state error:', error);
    res.status(500).json({ error: error.message });
  }
}
