/**
 * Team Details API - Get detailed roster and scoring for a specific team
 * 
 * Returns:
 * - Team metadata (player_code, rank, total_points, wins, top3)
 * - Complete roster with athlete details
 * - Individual athlete scoring and performance data
 */

import { neon } from '@neondatabase/serverless';
import { DEFAULT_GAME_ID } from '../../config/constants.js';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const gameId = req.query.gameId || DEFAULT_GAME_ID;
    const playerCode = req.query.playerCode;

    if (!playerCode) {
      return res.status(400).json({ error: 'playerCode parameter is required' });
    }

    // Get team roster from salary_cap_teams (prefer) or draft_teams (fallback)
    // 🔒 SECURITY: Only include teams from active sessions (not deleted/suspended)
    const salaryCapRoster = await sql`
      SELECT sct.athlete_id
      FROM salary_cap_teams sct
      INNER JOIN anonymous_sessions s ON sct.session_id = s.id
      WHERE sct.game_id = ${gameId}
        AND sct.player_code = ${playerCode}
        AND s.is_active = TRUE
    `;

    const draftRoster = await sql`
      SELECT athlete_id
      FROM draft_teams
      WHERE game_id = ${gameId}
        AND player_code = ${playerCode}
    `;

    // Use salary_cap_teams if available, otherwise fall back to draft_teams
    const roster = salaryCapRoster.length > 0 ? salaryCapRoster : draftRoster;

    if (roster.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const athleteIds = roster.map(r => r.athlete_id);

    // Get athlete details with race results
    const athletesWithResults = await sql`
      SELECT 
        a.id as athlete_id,
        a.name as athlete_name,
        a.country,
        a.gender,
        a.personal_best,
        a.headshot_url,
        a.world_athletics_id,
        a.marathon_rank,
        a.age,
        a.sponsor,
        rr.placement,
        rr.finish_time,
        rr.total_points,
        rr.breakdown,
        rr.split_5k,
        rr.split_10k,
        rr.split_half,
        rr.split_30k,
        rr.split_35k,
        rr.split_40k
      FROM athletes a
      LEFT JOIN race_results rr ON a.id = rr.athlete_id AND rr.game_id = ${gameId}
      WHERE a.id = ANY(${athleteIds})
      ORDER BY a.gender DESC, a.name ASC
    `;

    // Calculate team statistics
    const totalPoints = athletesWithResults.reduce((sum, a) => sum + (a.total_points || 0), 0);
    const wins = athletesWithResults.filter(a => a.placement === 1).length;
    const top3 = athletesWithResults.filter(a => a.placement !== null && a.placement <= 3).length;

    // Get team rank from standings
    const standings = await sql`
      SELECT 
        player_code,
        total_points,
        RANK() OVER (ORDER BY total_points DESC) as rank
      FROM (
        SELECT 
          sct.player_code,
          COALESCE(SUM(rr.total_points), 0) as total_points
        FROM salary_cap_teams sct
        INNER JOIN anonymous_sessions s ON sct.session_id = s.id
        LEFT JOIN race_results rr ON sct.athlete_id = rr.athlete_id AND rr.game_id = ${gameId}
        WHERE sct.game_id = ${gameId}
          AND s.is_active = TRUE
        GROUP BY sct.player_code
        
        UNION ALL
        
        SELECT 
          dt.player_code,
          COALESCE(SUM(rr.total_points), 0) as total_points
        FROM draft_teams dt
        LEFT JOIN race_results rr ON dt.athlete_id = rr.athlete_id AND rr.game_id = ${gameId}
        WHERE dt.game_id = ${gameId}
          AND dt.player_code NOT IN (
            SELECT DISTINCT player_code 
            FROM salary_cap_teams 
            WHERE game_id = ${gameId}
          )
        GROUP BY dt.player_code
      ) all_teams
    `;

    const teamRank = standings.find(s => s.player_code === playerCode);
    const rank = teamRank ? teamRank.rank : standings.length + 1;

    // Return team details
    return res.status(200).json({
      player_code: playerCode,
      rank,
      total_points: totalPoints,
      wins,
      top3,
      athletes: athletesWithResults.map(a => ({
        athlete_id: a.athlete_id,
        athlete_name: a.athlete_name,
        country: a.country,
        gender: a.gender,
        personal_best: a.personal_best,
        headshot_url: a.headshot_url,
        world_athletics_id: a.world_athletics_id,
        marathon_rank: a.marathon_rank,
        age: a.age,
        sponsor: a.sponsor,
        placement: a.placement,
        finish_time: a.finish_time,
        total_points: a.total_points || 0,
        breakdown: a.breakdown,
        splits: {
          split_5k: a.split_5k,
          split_10k: a.split_10k,
          split_half: a.split_half,
          split_30k: a.split_30k,
          split_35k: a.split_35k,
          split_40k: a.split_40k,
        },
      })),
    });
  } catch (error) {
    console.error('Error fetching team details:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch team details',
      details: error.message 
    });
  }
}
