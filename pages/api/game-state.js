/**
 * Game State API - Manages game configuration and state
 * 
 * ⚠️ SIMPLIFIED API - Snake draft features removed:
 * This endpoint was primarily used by the legacy site (public/app.js, now removed).
 * 
 * The snake draft features (rankings, draft_teams) have been removed.
 * For salary cap draft teams:
 *   - Use /api/salary-cap-draft endpoint instead
 *   - Query anonymous_sessions table directly
 *   - See TeamsOverviewPanel.tsx for reference implementation
 * 
 * This endpoint now only manages core game state:
 *   - roster_lock_time
 *   - results_finalized
 *   - draft_complete (legacy field, kept for compatibility)
 *   - active_race_id (the active race for this game)
 */
import { getGameState, updateGameState, getRaceResults, verifyAnonymousSession, hasCommissionerAccess } from './db';

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
      const results = await getRaceResults(gameId);
      
      // Verify session if provided
      let sessionInfo = null;
      if (sessionToken) {
        sessionInfo = await verifyAnonymousSession(sessionToken);
      }

      // Set cache headers for game state (moderate caching with stale-while-revalidate)
      // Game state changes moderately during roster lock/draft/finalization
      res.setHeader('Cache-Control', 'public, max-age=30, s-maxage=60, stale-while-revalidate=300');
      res.setHeader('CDN-Cache-Control', 'max-age=60');
      res.setHeader('Vary', 'Accept-Encoding');

      res.status(200).json({
        draftComplete: gameState?.draft_complete || false,
        resultsFinalized: gameState?.results_finalized || false,
        rosterLockTime: gameState?.roster_lock_time || null,
        activeRaceId: gameState?.active_race_id || null,
        activeRace: gameState?.active_race || null,
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
      const { players, draftComplete, resultsFinalized, rosterLockTime, activeRaceId } = req.body;

      await updateGameState(gameId, {
        players,
        draft_complete: draftComplete,
        results_finalized: resultsFinalized,
        roster_lock_time: rosterLockTime,
        active_race_id: activeRaceId
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
