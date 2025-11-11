/**
 * Rankings API - Player preference rankings for snake draft mode
 * 
 * ⚠️ DEPRECATED: This endpoint is part of the legacy snake draft system.
 * 
 * In snake draft mode, players submit preference rankings for athletes before
 * the commissioner executes an automated draft. This endpoint stores and retrieves
 * those preference rankings from the player_rankings table.
 * 
 * The modern salary cap draft mode does not use rankings - players directly
 * select their team within a budget constraint via /api/salary-cap-draft.
 * 
 * This endpoint is maintained only for backward compatibility with existing
 * season league games that use the ranking + snake draft workflow.
 * 
 * Endpoints:
 * - GET /api/rankings?gameId={id}&playerCode={code} - Get player's rankings
 * - POST /api/rankings?gameId={id} - Save player rankings
 * 
 * @deprecated Use /api/salary-cap-draft for new games
 */
import { getPlayerRankings, savePlayerRankings, clearAllRankings, verifyAnonymousSession, hasPlayerAccess, hasCommissionerAccess } from './db';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const gameId = req.query.gameId || 'default';
  const playerCode = req.query.playerCode;
  
  // Get session token from query parameter or Authorization header
  const sessionToken = req.query.session 
    || req.headers.authorization?.replace('Bearer ', '')
    || null;

  try {
    if (req.method === 'GET') {
      // Get rankings for a player or all players
      const rankings = await getPlayerRankings(gameId, playerCode);

      if (playerCode) {
        // Verify session has access to this player's rankings
        if (sessionToken) {
          const hasAccess = await hasPlayerAccess(gameId, playerCode, sessionToken);
          if (!hasAccess) {
            return res.status(403).json({ 
              error: 'Forbidden',
              message: 'You do not have access to this player\'s rankings'
            });
          }
        }
        
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

      // Check if this is a reset operation (commissioner only)
      if (resetRankings !== undefined) {
        if (sessionToken) {
          const hasAccess = await hasCommissionerAccess(gameId, sessionToken);
          if (!hasAccess) {
            return res.status(403).json({ 
              error: 'Forbidden',
              message: 'Only commissioners can reset rankings'
            });
          }
        }
        
        // Reset all rankings
        await clearAllRankings(gameId);
        return res.status(200).json({ message: 'Rankings reset successfully' });
      }

      if (!code) {
        return res.status(400).json({ error: 'Player code is required' });
      }
      
      // Verify session has access to save this player's rankings
      if (sessionToken) {
        const hasAccess = await hasPlayerAccess(gameId, code, sessionToken);
        if (!hasAccess) {
          return res.status(403).json({ 
            error: 'Forbidden',
            message: 'You do not have access to save this player\'s rankings'
          });
        }
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
