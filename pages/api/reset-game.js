import { neon } from '@neondatabase/serverless';
import { DEFAULT_GAME_ID } from '../../config/constants';

const sql = neon(process.env.DATABASE_URL);

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

  const gameId = req.query.gameId || DEFAULT_GAME_ID;    // Safety check: don't allow resetting without explicit gameId
    if (!gameId || gameId.trim() === '') {
        return res.status(400).json({ 
            error: 'Game ID is required',
            details: 'Must specify a gameId to reset'
        });
    }

    try {
        console.log(`[Reset Game] Starting complete reset for game: ${gameId}`);

        // Delete all game-related data
        // Order matters: delete child tables first to avoid foreign key issues

        // 1. Delete race results (includes scoring data)
        const resultsDeleted = await sql`
            DELETE FROM race_results 
            WHERE game_id = ${gameId}
        `;
        console.log(`[Reset Game] Deleted ${resultsDeleted.length} race results`);

        // 2. Delete league standings (cached leaderboard)
        const standingsDeleted = await sql`
            DELETE FROM league_standings 
            WHERE game_id = ${gameId}
        `;
        console.log(`[Reset Game] Deleted ${standingsDeleted.length} league standings entries`);

        // 3. Delete salary cap teams (salary cap draft rosters)
        const salaryCapTeamsDeleted = await sql`
            DELETE FROM salary_cap_teams 
            WHERE game_id = ${gameId}
        `;
        console.log(`[Reset Game] Deleted ${salaryCapTeamsDeleted.length} salary cap team entries`);

        // 4. Delete draft teams (player rosters from old snake draft system)
        const teamsDeleted = await sql`
            DELETE FROM draft_teams 
            WHERE game_id = ${gameId}
        `;
        console.log(`[Reset Game] Deleted ${teamsDeleted.length} draft team entries`);

        // 5. Delete player rankings (draft preferences)
        const rankingsDeleted = await sql`
            DELETE FROM player_rankings 
            WHERE game_id = ${gameId}
        `;
        console.log(`[Reset Game] Deleted ${rankingsDeleted.length} player rankings`);

        // 6. Delete anonymous sessions for this game (team sessions)
        const sessionsDeleted = await sql`
            DELETE FROM anonymous_sessions 
            WHERE game_id = ${gameId}
        `;
        console.log(`[Reset Game] Deleted ${sessionsDeleted.length} anonymous sessions`);

        // 7. Reset the game state (but keep the game record for history)
        const gameUpdated = await sql`
            UPDATE games 
            SET 
                players = '{}',
                draft_complete = FALSE,
                results_finalized = FALSE,
                updated_at = CURRENT_TIMESTAMP
            WHERE game_id = ${gameId}
        `;
        console.log(`[Reset Game] Reset game state: ${gameUpdated.length} games updated`);

        console.log(`[Reset Game] Complete reset finished for game: ${gameId}`);

        res.status(200).json({
            message: 'Game reset successfully',
            gameId: gameId,
            deleted: {
                raceResults: resultsDeleted.length,
                leagueStandings: standingsDeleted.length,
                salaryCapTeams: salaryCapTeamsDeleted.length,
                draftTeams: teamsDeleted.length,
                playerRankings: rankingsDeleted.length,
                anonymousSessions: sessionsDeleted.length
            },
            updated: {
                games: gameUpdated.length
            }
        });

    } catch (error) {
        console.error('[Reset Game] Error resetting game:', error);
        res.status(500).json({ 
            error: 'Failed to reset game',
            details: error.message 
        });
    }
}
