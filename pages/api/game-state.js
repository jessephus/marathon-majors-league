import { getGameState, updateGameState, getPlayerRankings, getDraftTeams, getRaceResults, verifyAnonymousSession, hasCommissionerAccess } from './db';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const gameId = req.query.gameId || 'default';
  
  // Get session token from query parameter or Authorization header
  const sessionToken = req.query.session 
    || req.headers.authorization?.replace('Bearer ', '')
    || null;

  try {
    if (req.method === 'GET') {
      // Get game state from Postgres
      const gameState = await getGameState(gameId);
      const rankings = await getPlayerRankings(gameId);
      const teams = await getDraftTeams(gameId);
      const results = await getRaceResults(gameId);
      
      // Verify session if provided
      let sessionInfo = null;
      if (sessionToken) {
        sessionInfo = await verifyAnonymousSession(sessionToken);
      }

      res.status(200).json({
        players: gameState?.players || [],
        draftComplete: gameState?.draft_complete || false,
        resultsFinalized: gameState?.results_finalized || false,
        rankings,
        teams,
        results,
        // Include session info if valid
        session: sessionInfo ? {
          type: sessionInfo.type,
          displayName: sessionInfo.displayName,
          expiresAt: sessionInfo.expiresAt,
          daysUntilExpiry: sessionInfo.daysUntilExpiry
        } : null
      });

    } else if (req.method === 'POST' || req.method === 'PUT') {
      // Check commissioner access for updates
      if (sessionToken) {
        const hasAccess = await hasCommissionerAccess(gameId, sessionToken);
        if (!hasAccess) {
          return res.status(403).json({ 
            error: 'Forbidden',
            message: 'You do not have commissioner access to this game'
          });
        }
      }
      
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
