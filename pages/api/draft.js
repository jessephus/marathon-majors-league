/**
 * Draft API - Snake draft execution and results
 * 
 * ⚠️ DEPRECATED: This endpoint is part of the legacy snake draft system.
 * 
 * After all players submit their preference rankings, the commissioner uses this
 * endpoint to execute the automated snake draft. The draft algorithm assigns
 * athletes to players based on draft order and preferences, storing results
 * in the draft_teams table.
 * 
 * The modern salary cap draft mode eliminates this step - players directly
 * select their team via /api/salary-cap-draft without automated assignment.
 * 
 * This endpoint is maintained only for backward compatibility with existing
 * season league games that use the ranking + snake draft workflow.
 * 
 * Endpoints:
 * - GET /api/draft?gameId={id} - Get draft results
 * - POST /api/draft?gameId={id} - Execute/save draft
 * 
 * @deprecated Use /api/salary-cap-draft for new games
 */
import { getDraftTeams, saveDraftTeams, updateGameState, hasCommissionerAccess } from './db.js';

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
      // Get draft results - no authentication required for viewing
      const teams = await getDraftTeams(gameId);
      res.status(200).json(teams);

    } else if (req.method === 'POST' || req.method === 'PUT') {
      // Verify commissioner access for draft operations
      if (sessionToken) {
        const hasAccess = await hasCommissionerAccess(gameId, sessionToken);
        if (!hasAccess) {
          return res.status(403).json({ 
            error: 'Forbidden',
            message: 'Only commissioners can execute the draft'
          });
        }
      }
      
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
