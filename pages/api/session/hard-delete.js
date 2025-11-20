/**
 * Session Hard Delete Endpoint - Permanent Deletion
 * 
 * This endpoint PERMANENTLY DELETES a team:
 *   - Deletes the session from anonymous_sessions
 *   - Deletes all roster data from salary_cap_teams (CASCADE)
 *   - Cannot be undone
 * 
 * Accepts either:
 *   - sessionToken (preferred, unique identifier)
 *   - playerCode + gameId (legacy, ambiguous if multiple suspended teams)
 * 
 * For soft delete (suspend), use /api/session/delete instead.
 * 
 * Used by:
 *   - TeamsOverviewPanel.tsx (Delete button)
 *   - Commissioner dashboard for cleanup
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

  const { sessionToken, gameId, playerCode } = req.body;

  // Require either sessionToken OR (gameId + playerCode)
  if (!sessionToken && (!gameId || !playerCode)) {
    return res.status(400).json({ 
      error: 'Either sessionToken OR (gameId + playerCode) is required' 
    });
  }

  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    return res.status(500).json({ error: 'DATABASE_URL not configured' });
  }

  const sql = neon(DATABASE_URL);

  try {
    console.log(`[Hard Delete] Permanently deleting team: ${sessionToken ? `session ${sessionToken}` : `player ${playerCode} in game ${gameId}`}`);

    // Get session id using sessionToken (preferred) or gameId + playerCode (legacy)
    const sessionQuery = sessionToken
      ? await sql`
          SELECT id, player_code, display_name FROM anonymous_sessions
          WHERE session_token = ${sessionToken}
            AND session_type = 'player'
        `
      : await sql`
          SELECT id, player_code, display_name FROM anonymous_sessions
          WHERE game_id = ${gameId}
            AND player_code = ${playerCode}
            AND session_type = 'player'
        `;

    if (sessionQuery.length === 0) {
      return res.status(404).json({ 
        error: 'Team not found',
        message: 'No team exists with the specified identifier'
      });
    }

    const session = sessionQuery[0];
    const sessionId = session.id;

    console.log(`[Hard Delete] Found session ${sessionId} for ${session.player_code}`);

    // Delete the session - this will CASCADE delete from salary_cap_teams due to FK constraint
    const deleteSessionResult = await sql`
      DELETE FROM anonymous_sessions
      WHERE id = ${sessionId}
    `;

    const sessionsDeleted = deleteSessionResult.count || 0;
    console.log(`[Hard Delete] Deleted ${sessionsDeleted} session(s) (roster data CASCADE deleted via FK)`);

    // Success response
    return res.status(200).json({ 
      success: true,
      message: 'Team permanently deleted',
      deleted: {
        sessionId: sessionId,
        playerCode: session.player_code,
        teamName: session.display_name,
        sessions: sessionsDeleted
      }
    });

  } catch (error) {
    console.error('[Hard Delete] Error:', error);
    return res.status(500).json({ 
      error: 'Failed to delete team',
      message: error.message 
    });
  }
}
