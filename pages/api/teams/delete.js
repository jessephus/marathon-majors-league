import { sql } from '@vercel/postgres';

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

  const { gameId, playerCode, sessionToken } = req.body;

  if (!gameId || !playerCode) {
    return res.status(400).json({ error: 'gameId and playerCode are required' });
  }

  try {
    console.log(`[Delete Team] Deleting player ${playerCode} from game ${gameId}`);

    // Delete from draft_teams
    const deleteTeamResult = await sql`
      DELETE FROM draft_teams
      WHERE game_id = ${gameId}
        AND player_code = ${playerCode}
    `;
    console.log(`[Delete Team] Deleted ${deleteTeamResult.rowCount} team records`);

    // Delete from player_rankings
    const deleteRankingsResult = await sql`
      DELETE FROM player_rankings
      WHERE game_id = ${gameId}
        AND player_code = ${playerCode}
    `;
    console.log(`[Delete Team] Deleted ${deleteRankingsResult.rowCount} ranking records`);

    // Delete from anonymous_sessions (if sessionToken provided)
    if (sessionToken) {
      const deleteSessionResult = await sql`
        DELETE FROM anonymous_sessions
        WHERE session_token = ${sessionToken}
          AND game_id = ${gameId}
          AND player_code = ${playerCode}
      `;
      console.log(`[Delete Team] Deleted ${deleteSessionResult.rowCount} session records`);
    }

    // Remove player from games.players array
    const gameResult = await sql`
      SELECT players FROM games WHERE game_id = ${gameId}
    `;

    if (gameResult.rows.length > 0) {
      const currentPlayers = gameResult.rows[0].players || [];
      const updatedPlayers = currentPlayers.filter(p => p !== playerCode);

      await sql`
        UPDATE games
        SET players = ${updatedPlayers}
        WHERE game_id = ${gameId}
      `;
      console.log(`[Delete Team] Removed ${playerCode} from games.players array`);
    }

    res.status(200).json({
      message: 'Team/player deleted successfully',
      playerCode,
      deletedRecords: {
        teams: deleteTeamResult.rowCount,
        rankings: deleteRankingsResult.rowCount,
        sessions: sessionToken ? 1 : 0
      }
    });

  } catch (error) {
    console.error('[Delete Team] Error:', error);
    res.status(500).json({ 
      error: 'Failed to delete team/player',
      details: error.message 
    });
  }
}
