import { getGameState, updateGameState, getPlayerRankings, getDraftTeams, getRaceResults } from './db.js';

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
      // Get game state from Postgres
      const gameState = await getGameState(gameId);
      const rankings = await getPlayerRankings(gameId);
      const teams = await getDraftTeams(gameId);
      const results = await getRaceResults(gameId);

      res.status(200).json({
        players: gameState?.players || [],
        draftComplete: gameState?.draft_complete || false,
        resultsFinalized: gameState?.results_finalized || false,
        rankings,
        teams,
        results
      });

    } else if (req.method === 'POST' || req.method === 'PUT') {
      // Update game state
      const { players, draftComplete, resultsFinalized } = req.body;

      await updateGameState(gameId, {
        players,
        draft_complete: draftComplete,
        results_finalized: resultsFinalized
      });

      res.status(200).json({ message: 'Game state updated successfully' });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Game state error:', error);
    res.status(500).json({ error: error.message });
  }
}
