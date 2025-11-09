/**
 * Session Delete Endpoint - For Salary Cap Draft Teams
 * 
 * This is the MODERN delete endpoint for salary cap draft teams.
 * 
 * What it does:
 *   1. Soft deletes anonymous_sessions (sets is_active = false)
 *   2. Hard deletes salary_cap_teams roster data
 *   3. Does NOT touch games.players[] array (deprecated)
 * 
 * Used by:
 *   - TeamsOverviewPanel.tsx (delete button)
 *   - Modern commissioner dashboard
 * 
 * For legacy snake draft teams, use /api/teams/delete instead.
 * 
 * Note: Does NOT update games.players[] because that array is deprecated
 * for salary cap draft. Teams are tracked via anonymous_sessions table.
 * The legacy site (app.js) will show stale data, which is expected behavior.
 */
import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { gameId, playerCode } = req.body;

  if (!gameId || !playerCode) {
    return res.status(400).json({ error: 'gameId and playerCode are required' });
  }

  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    return res.status(500).json({ error: 'DATABASE_URL not configured' });
  }

  const sql = neon(DATABASE_URL);

  try {
    console.log(`[Session Delete] Deleting session for player ${playerCode} in game ${gameId}`);

    // 1. Soft delete the anonymous session (main record)
    const sessionResult = await sql`
      UPDATE anonymous_sessions
      SET is_active = FALSE,
          updated_at = CURRENT_TIMESTAMP
      WHERE game_id = ${gameId}
        AND player_code = ${playerCode}
        AND session_type = 'player'
      RETURNING player_code, display_name
    `;

    if (sessionResult.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const deletedSession = sessionResult[0];
    
    // 2. Also delete salary cap team roster data for complete cleanup
    const teamResult = await sql`
      DELETE FROM salary_cap_teams
      WHERE game_id = ${gameId}
        AND player_code = ${playerCode}
    `;
    
    console.log(`[Session Delete] Soft deleted session for ${deletedSession.player_code}`);
    console.log(`[Session Delete] Deleted ${teamResult.length} roster records from salary_cap_teams`);

    return res.status(200).json({
      message: 'Team deleted successfully',
      playerCode: deletedSession.player_code,
      teamName: deletedSession.display_name || 'Unknown Team',
      deletedRecords: {
        sessions: 1,
        rosterEntries: teamResult.length
      }
    });

  } catch (error) {
    console.error('Error deleting team:', error);
    return res.status(500).json({ 
      error: 'Failed to delete team',
      details: error.message 
    });
  }
}
