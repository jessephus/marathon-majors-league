/**
 * Standings API - League leaderboard with points
 */

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

/**
 * Calculate and update standings for a game
 */
async function calculateStandings(gameId) {
  // Get all players in the game
  const [game] = await sql`
    SELECT players FROM games WHERE game_id = ${gameId}
  `;
  
  if (!game || !game.players) {
    return [];
  }
  
  const players = game.players;
  const standings = [];
  
  // Calculate stats for each player
  for (const playerCode of players) {
    // Get player's team
    const team = await sql`
      SELECT athlete_id
      FROM draft_teams
      WHERE game_id = ${gameId} AND player_code = ${playerCode}
    `;
    
    if (team.length === 0) {
      continue;
    }
    
    const athleteIds = team.map(t => t.athlete_id);
    
    // Get results for this player's athletes
    const results = await sql`
      SELECT 
        placement,
        total_points,
        record_type,
        record_status
      FROM race_results
      WHERE game_id = ${gameId} 
        AND athlete_id = ANY(${athleteIds})
    `;
    
    // Calculate stats
    const totalPoints = results.reduce((sum, r) => sum + (r.total_points || 0), 0);
    const racesCount = results.filter(r => r.placement !== null).length;
    const wins = results.filter(r => r.placement === 1).length;
    const top3 = results.filter(r => r.placement !== null && r.placement <= 3).length;
    const worldRecords = results.filter(r => 
      (r.record_type === 'WORLD' || r.record_type === 'BOTH') && 
      r.record_status === 'confirmed'
    ).length;
    const courseRecords = results.filter(r => 
      (r.record_type === 'COURSE' || r.record_type === 'BOTH') && 
      r.record_status === 'confirmed' &&
      r.record_type !== 'WORLD' // Don't double count WR
    ).length;
    const averagePoints = racesCount > 0 ? totalPoints / racesCount : 0;
    
    // Get last race points (most recent result)
    const lastRacePoints = results.length > 0 
      ? results[results.length - 1].total_points || 0 
      : 0;
    
    standings.push({
      player_code: playerCode,
      races_count: racesCount,
      wins,
      top3,
      total_points: totalPoints,
      average_points: averagePoints,
      world_records: worldRecords,
      course_records: courseRecords,
      last_race_points: lastRacePoints
    });
  }
  
  // Sort by total points descending
  standings.sort((a, b) => b.total_points - a.total_points);
  
  // Assign ranks (with tie handling)
  let currentRank = 1;
  let prevPoints = null;
  
  standings.forEach((standing, index) => {
    if (prevPoints !== null && standing.total_points === prevPoints) {
      standing.rank = currentRank;
    } else {
      currentRank = index + 1;
      standing.rank = currentRank;
      prevPoints = standing.total_points;
    }
  });
  
  return standings;
}

/**
 * Update standings in database
 */
async function updateStandingsCache(gameId, standings) {
  // Clear existing standings
  await sql`
    DELETE FROM league_standings WHERE game_id = ${gameId}
  `;
  
  // Insert new standings
  for (const standing of standings) {
    await sql`
      INSERT INTO league_standings 
        (game_id, player_code, races_count, wins, top3, total_points, 
         average_points, world_records, course_records, last_race_points, last_updated_at)
      VALUES 
        (${gameId}, ${standing.player_code}, ${standing.races_count}, ${standing.wins},
         ${standing.top3}, ${standing.total_points}, ${standing.average_points},
         ${standing.world_records}, ${standing.course_records}, ${standing.last_race_points},
         CURRENT_TIMESTAMP)
    `;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const gameId = req.query.gameId || 'default';

  try {
    if (req.method === 'GET') {
      // Get standings (calculate fresh or return cached)
      const useCache = req.query.cached === 'true';
      
      let standings;
      
      if (useCache) {
        // Try to get from cache
        standings = await sql`
          SELECT 
            player_code,
            races_count,
            wins,
            top3,
            total_points,
            average_points,
            world_records,
            course_records,
            last_race_points,
            last_updated_at
          FROM league_standings
          WHERE game_id = ${gameId}
          ORDER BY total_points DESC, player_code ASC
        `;
        
        // Add ranks
        let currentRank = 1;
        let prevPoints = null;
        standings.forEach((standing, index) => {
          if (prevPoints !== null && standing.total_points === prevPoints) {
            standing.rank = currentRank;
          } else {
            currentRank = index + 1;
            standing.rank = currentRank;
            prevPoints = standing.total_points;
          }
        });
      }
      
      if (!standings || standings.length === 0) {
        // Calculate fresh standings
        standings = await calculateStandings(gameId);
        
        // Cache them
        if (standings.length > 0) {
          await updateStandingsCache(gameId, standings);
        }
      }
      
      res.status(200).json({
        gameId,
        standings,
        cached: useCache && standings.length > 0
      });

    } else if (req.method === 'POST') {
      // Force recalculation of standings
      const standings = await calculateStandings(gameId);
      
      // Update cache
      await updateStandingsCache(gameId, standings);
      
      res.status(200).json({
        message: 'Standings recalculated successfully',
        gameId,
        standings
      });

    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Standings error:', error);
    res.status(500).json({ error: error.message });
  }
}
