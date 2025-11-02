/**
 * Standings API - League leaderboard with points
 */

import { neon } from '@neondatabase/serverless';
import { generateETag, setCacheHeaders, checkETag, send304 } from './lib/cache-utils.js';
import { calculateTemporaryScores, hasTemporaryScores, getProjectionSummary } from './lib/temporary-scoring.js';

const sql = neon(process.env.DATABASE_URL);

/**
 * Calculate and update standings for a game
 * Now supports temporary scoring based on splits when final results aren't available
 */
async function calculateStandings(gameId) {
  // Get all players in the game
  const [game] = await sql`
    SELECT players, results_finalized FROM games WHERE game_id = ${gameId}
  `;
  
  if (!game || !game.players) {
    return { standings: [], isTemporary: false, projectionInfo: null };
  }
  
  const players = game.players;
  const isFinalized = game.results_finalized || false;
  
  // Get all race results for this game to determine if we need temporary scoring
  const allResults = await sql`
    SELECT 
      athlete_id,
      finish_time,
      split_5k,
      split_10k,
      split_half,
      split_30k,
      split_35k,
      split_40k,
      placement,
      total_points,
      a.gender
    FROM race_results rr
    LEFT JOIN athletes a ON rr.athlete_id = a.id
    WHERE rr.game_id = ${gameId}
  `;
  
  // Determine if we should use temporary scoring
  // Use temporary scores if: results exist, race not finalized, and some athletes have splits but not finish times
  const hasAnyResults = allResults.length > 0;
  const hasSplitsWithoutFinish = allResults.some(r => 
    !r.finish_time && (r.split_5k || r.split_10k || r.split_half || r.split_30k || r.split_35k || r.split_40k)
  );
  const useTemporaryScoring = hasAnyResults && !isFinalized && hasSplitsWithoutFinish;
  
  let resultsWithScores = allResults;
  let projectionInfo = null;
  
  // Apply temporary scoring if needed
  if (useTemporaryScoring) {
    resultsWithScores = calculateTemporaryScores(allResults);
    projectionInfo = getProjectionSummary(resultsWithScores);
  }
  
  const standings = [];
  
  // Calculate stats for each player
  for (const playerCode of players) {
    // Get player's team - try both salary_cap_teams and draft_teams
    let team = await sql`
      SELECT athlete_id
      FROM salary_cap_teams
      WHERE game_id = ${gameId} AND player_code = ${playerCode}
    `;
    
    // Fallback to legacy draft_teams if not found
    if (team.length === 0) {
      team = await sql`
        SELECT athlete_id
        FROM draft_teams
        WHERE game_id = ${gameId} AND player_code = ${playerCode}
      `;
    }
    
    if (team.length === 0) {
      continue;
    }
    
    const athleteIds = team.map(t => t.athlete_id);
    
    // Filter results for this player's athletes
    const playerResults = resultsWithScores.filter(r => athleteIds.includes(r.athlete_id));
    
    // Calculate stats based on whether we're using temporary or final scoring
    let totalPoints, racesCount, wins, top3;
    
    if (useTemporaryScoring) {
      // Use temporary points and projected placements
      totalPoints = playerResults.reduce((sum, r) => sum + (r.temporary_points || r.total_points || 0), 0);
      racesCount = playerResults.filter(r => r.projected_placement !== null || r.placement !== null).length;
      wins = playerResults.filter(r => (r.projected_placement || r.placement) === 1).length;
      top3 = playerResults.filter(r => {
        const place = r.projected_placement || r.placement;
        return place !== null && place <= 3;
      }).length;
    } else {
      // Use final points and placements
      totalPoints = playerResults.reduce((sum, r) => sum + (r.total_points || 0), 0);
      racesCount = playerResults.filter(r => r.placement !== null).length;
      wins = playerResults.filter(r => r.placement === 1).length;
      top3 = playerResults.filter(r => r.placement !== null && r.placement <= 3).length;
    }
    
    const worldRecords = playerResults.filter(r => 
      (r.record_type === 'WORLD' || r.record_type === 'BOTH') && 
      r.record_status === 'confirmed'
    ).length;
    const courseRecords = playerResults.filter(r => 
      (r.record_type === 'COURSE' || r.record_type === 'BOTH') && 
      r.record_status === 'confirmed' &&
      r.record_type !== 'WORLD' // Don't double count WR
    ).length;
    const averagePoints = racesCount > 0 ? totalPoints / racesCount : 0;
    
    // Get last race points (most recent result)
    const lastRacePoints = playerResults.length > 0 
      ? (playerResults[playerResults.length - 1].temporary_points || playerResults[playerResults.length - 1].total_points || 0)
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
  
  return {
    standings,
    isTemporary: useTemporaryScoring,
    projectionInfo: useTemporaryScoring ? projectionInfo : null
  };
}

/**
 * Update standings in database
 */
async function updateStandingsCache(gameId, standings) {
  try {
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
  } catch (error) {
    // If league_standings table doesn't exist, just skip caching
    console.log('Standings cache not available:', error.message);
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
      
      // Check if any results exist for this game
      const resultsCount = await sql`
        SELECT COUNT(*) as count
        FROM race_results
        WHERE game_id = ${gameId}
      `;
      const hasResults = resultsCount.length > 0 && resultsCount[0].count > 0;
      
      // If no results, return early
      if (!hasResults) {
        res.status(200).json({
          gameId,
          standings: [],
          hasResults: false,
          cached: false
        });
        return;
      }
      
      let standingsData = null;
      let isTemporary = false;
      let projectionInfo = null;
      
      if (useCache) {
        try {
          // Try to get from cache (but skip cache if we're in temporary mode)
          const cached = await sql`
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
          
          if (cached.length > 0) {
            // Add ranks
            let currentRank = 1;
            let prevPoints = null;
            cached.forEach((standing, index) => {
              if (prevPoints !== null && standing.total_points === prevPoints) {
                standing.rank = currentRank;
              } else {
                currentRank = index + 1;
                standing.rank = currentRank;
                prevPoints = standing.total_points;
              }
            });
            
            // Check if we should use cached or recalculate for temporary scoring
            // If there are splits without finish times, we need fresh calculation
            const needsFreshCalc = await sql`
              SELECT COUNT(*) as count
              FROM race_results
              WHERE game_id = ${gameId}
                AND finish_time IS NULL
                AND (split_5k IS NOT NULL OR split_10k IS NOT NULL OR split_half IS NOT NULL 
                     OR split_30k IS NOT NULL OR split_35k IS NOT NULL OR split_40k IS NOT NULL)
            `;
            
            if (needsFreshCalc[0]?.count > 0) {
              // Recalculate for temporary scoring
              standingsData = null;
            } else {
              standingsData = { standings: cached, isTemporary: false, projectionInfo: null };
            }
          }
        } catch (error) {
          // Cache not available, will calculate fresh
          console.log('Cache not available:', error.message);
        }
      }
      
      if (!standingsData) {
        // Calculate fresh standings
        standingsData = await calculateStandings(gameId);
        
        // Cache them only if not temporary (temporary scores change frequently)
        if (standingsData.standings.length > 0 && !standingsData.isTemporary) {
          await updateStandingsCache(gameId, standingsData.standings);
        }
      }
      
      const { standings, isTemporary: isTempScoring, projectionInfo: projection } = standingsData;
      
      // Generate ETag for client-side caching
      const etag = generateETag({ standings, isTemporary: isTempScoring, projectionInfo: projection });
      res.setHeader('ETag', `"${etag}"`);
      
      // Use shorter cache times for temporary scoring
      if (isTempScoring) {
        setCacheHeaders(res, {
          maxAge: 10,
          sMaxAge: 20,
          staleWhileRevalidate: 60,
        });
      } else {
        setCacheHeaders(res, {
          maxAge: 30,
          sMaxAge: 60,
          staleWhileRevalidate: 300,
        });
      }
      
      // Check if client has current version
      if (checkETag(req, etag)) {
        return send304(res);
      }
      
      res.status(200).json({
        gameId,
        standings,
        hasResults: true,
        cached: useCache && standings.length > 0 && !isTempScoring,
        isTemporary: isTempScoring,
        projectionInfo: projection
      });

    } else if (req.method === 'POST') {
      // Force recalculation of standings
      const standingsData = await calculateStandings(gameId);
      
      // Update cache only if not temporary
      if (!standingsData.isTemporary) {
        await updateStandingsCache(gameId, standingsData.standings);
      }
      
      res.status(200).json({
        message: 'Standings recalculated successfully',
        gameId,
        standings: standingsData.standings,
        isTemporary: standingsData.isTemporary,
        projectionInfo: standingsData.projectionInfo
      });

    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Standings error:', error);
    res.status(500).json({ error: error.message });
  }
}
