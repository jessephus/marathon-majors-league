/**
 * Session Suspend/Reactivate Endpoint - For Salary Cap Draft Teams
 * 
 * This endpoint TOGGLES the is_active status of a team:
 *   - If active → suspends (sets is_active = false)
 *   - If suspended → reactivates (sets is_active = true)
 *   - ALWAYS keeps all roster data in salary_cap_teams
 * 
 * For permanent deletion, use /api/session/hard-delete instead.
 * 
 * Used by:
 *   - TeamsOverviewPanel.tsx (Suspend/Reactivate buttons)
 *   - Modern commissioner dashboard
 * 
 * For legacy snake draft teams, use /api/teams/delete instead.
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
    console.log(`[Session Suspend/Reactivate] Toggling status for player ${playerCode} in game ${gameId}`);

    // First, get the current status
    const currentStatus = await sql`
      SELECT is_active FROM anonymous_sessions
      WHERE game_id = ${gameId}
        AND player_code = ${playerCode}
        AND session_type = 'player'
    `;

    if (currentStatus.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const isCurrentlyActive = currentStatus[0].is_active;
    const newStatus = !isCurrentlyActive; // Toggle the status

    // Update the status
    const sessionResult = await sql`
      UPDATE anonymous_sessions
      SET is_active = ${newStatus},
          updated_at = CURRENT_TIMESTAMP
      WHERE game_id = ${gameId}
        AND player_code = ${playerCode}
        AND session_type = 'player'
      RETURNING player_code, display_name, is_active
    `;

    const updatedSession = sessionResult[0];
    const action = newStatus ? 'reactivated' : 'suspended';
    
    console.log(`[Session Toggle] ${action} session for ${updatedSession.player_code} (is_active: ${updatedSession.is_active})`);
    console.log(`[Session Toggle] Roster data retained in salary_cap_teams`);

    return res.status(200).json({
      message: `Team ${action} successfully`,
      playerCode: updatedSession.player_code,
      teamName: updatedSession.display_name || 'Unknown Team',
      isActive: updatedSession.is_active
    });

  } catch (error) {
    console.error('[Session Suspend] Error suspending team:', error);
    return res.status(500).json({ 
      error: 'Failed to suspend team',
      details: error.message 
    });
  }
}
