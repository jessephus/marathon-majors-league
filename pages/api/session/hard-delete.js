import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

/**
 * Hard Delete Session Endpoint
 * 
 * Permanently removes a team from the database by deleting:
 * 1. All athletes from salary_cap_teams
 * 2. The session from anonymous_sessions
 * 
 * This is a destructive operation and cannot be undone.
 * Use soft delete (suspend) via /api/session/delete for reversible deletion.
 */
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { gameId, playerCode } = req.body;

    // Validation
    if (!gameId) {
      return res.status(400).json({ error: 'gameId is required' });
    }

    if (!playerCode) {
      return res.status(400).json({ error: 'playerCode is required' });
    }

    console.log(`[Hard Delete] Permanently deleting team: gameId=${gameId}, playerCode=${playerCode}`);

    // Step 1: Delete all athletes from salary_cap_teams
    const deleteAthletesResult = await sql`
      DELETE FROM salary_cap_teams
      WHERE game_id = ${gameId}
        AND player_code = ${playerCode}
    `;

    const athletesDeleted = deleteAthletesResult.count || 0;
    console.log(`[Hard Delete] Deleted ${athletesDeleted} athletes from salary_cap_teams`);

    // Step 2: Delete the session from anonymous_sessions
    const deleteSessionResult = await sql`
      DELETE FROM anonymous_sessions
      WHERE game_id = ${gameId}
        AND player_code = ${playerCode}
    `;

    const sessionsDeleted = deleteSessionResult.count || 0;
    console.log(`[Hard Delete] Deleted ${sessionsDeleted} session(s) from anonymous_sessions`);

    // Check if anything was actually deleted
    if (athletesDeleted === 0 && sessionsDeleted === 0) {
      return res.status(404).json({ 
        error: 'Team not found',
        message: 'No team exists with the specified gameId and playerCode'
      });
    }

    // Success response
    return res.status(200).json({ 
      success: true,
      message: 'Team permanently deleted',
      deleted: {
        athletes: athletesDeleted,
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
