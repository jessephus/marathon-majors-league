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
 * Also shows teams with submitted rosters even when no race results exist yet
 */
async function calculateStandings(gameId) {
  // Get all players in the game
  const [game] = await sql`
    SELECT players, results_finalized FROM games WHERE game_id = ${gameId}
  `;
  
  if (!game) {
    return { standings: [], isTemporary: false, projectionInfo: null, hasResults: false };
  }
  
  const players = game.players || [];
  const isFinalized = game.results_finalized || false;
  
  // Get all teams with submitted rosters (from salary_cap_teams)
  const submittedTeams = await sql`
    SELECT DISTINCT 
      player_code,
      COUNT(athlete_id) as roster_count
    FROM salary_cap_teams
    WHERE game_id = ${gameId}
    GROUP BY player_code
    HAVING COUNT(athlete_id) = 6
  `;
  
  const teamsWithRosters = submittedTeams.map(t => t.player_code);
  console.log('📊 Teams with rosters:', teamsWithRosters);
  console.log('📊 Submitted teams query result:', submittedTeams);
  
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
  const hasAnyFinishTimes = allResults.some(r => r.finish_time !== null);
  const useTemporaryScoring = hasAnyResults && !isFinalized && hasSplitsWithoutFinish;
  
  let resultsWithScores = allResults;
  let projectionInfo = null;
  
  // Apply temporary scoring if needed
  if (useTemporaryScoring) {
    resultsWithScores = calculateTemporaryScores(allResults);
    projectionInfo = getProjectionSummary(resultsWithScores);
  }
  
  const standings = [];
  
  // Calculate stats for each player who has a submitted roster
  // If no results exist yet, show all teams with 0 points
  const playersToShow = hasAnyResults ? players : teamsWithRosters;
  
  console.log('📊 About to iterate. hasAnyResults:', hasAnyResults, 'playersToShow:', playersToShow);
  
  // 🚀 PERFORMANCE OPTIMIZATION: Fetch all teams in ONE query instead of N queries
  const allSalaryCapTeams = await sql`
    SELECT player_code, athlete_id
    FROM salary_cap_teams
    WHERE game_id = ${gameId}
  `;
  
  const allDraftTeams = await sql`
    SELECT player_code, athlete_id
    FROM draft_teams
    WHERE game_id = ${gameId}
  `;
  
  // Build a lookup map: playerCode => [athleteId1, athleteId2, ...]
  const teamsByPlayer = new Map();
  
  // Add all salary_cap_teams
  for (const row of allSalaryCapTeams) {
    if (!teamsByPlayer.has(row.player_code)) {
      teamsByPlayer.set(row.player_code, []);
    }
    teamsByPlayer.get(row.player_code).push(row.athlete_id);
  }
  
  // Fallback: add draft_teams for players NOT in salary_cap_teams
  for (const row of allDraftTeams) {
    // Only use draft_teams if player has no salary_cap_teams entry
    if (!teamsByPlayer.has(row.player_code)) {
      teamsByPlayer.set(row.player_code, []);
      teamsByPlayer.get(row.player_code).push(row.athlete_id);
    }
  }
  
  for (const playerCode of playersToShow) {
    const athleteIds = teamsByPlayer.get(playerCode);
    
    if (!athleteIds || athleteIds.length === 0) {
      continue;
    }
    
    // Filter results for this player's athletes
    const playerResults = resultsWithScores.filter(r => athleteIds.includes(r.athlete_id));
    
    // Calculate stats - prefer total_points when available, fall back to temporary_points
    // Each result is evaluated individually based on whether it has full scoring or only temporary
    const totalPoints = playerResults.reduce((sum, r) => {
      // Use total_points if available (from full scoring engine)
      if (r.total_points !== undefined && r.total_points !== null) {
        return sum + r.total_points;
      }
      // Fall back to temporary_points for results that only have splits
      return sum + (r.temporary_points || 0);
    }, 0);
    
    // Calculate race stats
    const racesCount = playerResults.filter(r => r.placement !== null || r.projected_placement !== null).length;
    const wins = playerResults.filter(r => {
      const place = r.placement || r.projected_placement;
      return place === 1;
    }).length;
    const top3 = playerResults.filter(r => {
      const place = r.placement || r.projected_placement;
      return place !== null && place <= 3;
    }).length;
    
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
    hasFinishTimes: hasAnyFinishTimes,
    hasResults: hasAnyResults,
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
      
      // If no results, check if there are any submitted teams to show
      if (!hasResults) {
        // Get teams with submitted rosters
        const submittedTeams = await sql`
          SELECT DISTINCT 
            player_code,
            COUNT(athlete_id) as roster_count
          FROM salary_cap_teams
          WHERE game_id = ${gameId}
          GROUP BY player_code
          HAVING COUNT(athlete_id) = 6
        `;
        
        // If there are submitted teams, calculate standings (will show 0 points)
        if (submittedTeams.length > 0) {
          const standingsData = await calculateStandings(gameId);
          
          // Set cache headers for no-results state (use moderate caching since this is stable)
          setCacheHeaders(res, {
            maxAge: 60,
            sMaxAge: 120,
            staleWhileRevalidate: 300,
          });
          
          res.status(200).json({
            gameId,
            standings: standingsData.standings || [],
            hasResults: false,
            isTemporary: false,
            cached: false
          });
          return;
        }
        
        // Otherwise return empty standings
        // Set cache headers for empty state (use moderate caching)
        setCacheHeaders(res, {
          maxAge: 60,
          sMaxAge: 120,
          staleWhileRevalidate: 300,
        });
        
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
            // Also check for finish times in a single query
            const resultsCheck = await sql`
              SELECT 
                COUNT(*) FILTER (WHERE finish_time IS NULL AND 
                  (split_5k IS NOT NULL OR split_10k IS NOT NULL OR split_half IS NOT NULL 
                   OR split_30k IS NOT NULL OR split_35k IS NOT NULL OR split_40k IS NOT NULL)) as splits_without_finish,
                COUNT(*) FILTER (WHERE finish_time IS NOT NULL) as finish_times
              FROM race_results
              WHERE game_id = ${gameId}
            `;
            
            const needsFreshCalc = resultsCheck[0]?.splits_without_finish > 0;
            const hasFinishTimes = resultsCheck[0]?.finish_times > 0;
            
            if (needsFreshCalc) {
              // Recalculate for temporary scoring
              standingsData = null;
            } else {
              standingsData = { standings: cached, isTemporary: false, hasFinishTimes, projectionInfo: null };
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
      
      const { standings, isTemporary: isTempScoring, hasFinishTimes, projectionInfo: projection } = standingsData;
      
      // Generate ETag for client-side caching
      // Only include stable data in ETag (exclude projectionInfo which may vary)
      const stableData = standings.map(s => ({
        player_code: s.player_code,
        total_points: s.total_points,
        races_count: s.races_count,
        rank: s.rank
      }));
      const etag = generateETag({ standings: stableData, isTemporary: isTempScoring });
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
      
      // Check if client has current version (also sets X-Cache-Status header)
      if (checkETag(req, etag, 'standings', res)) {
        return send304(res);
      }
      
      res.status(200).json({
        gameId,
        standings,
        hasResults: true,
        cached: useCache && standings.length > 0 && !isTempScoring,
        isTemporary: isTempScoring,
        hasFinishTimes,
        projectionInfo: projection
      });

    } else if (req.method === 'POST') {
      // Force recalculation of standings
      const standingsData = await calculateStandings(gameId);
      
      // Update cache only if not temporary
      if (!standingsData.isTemporary) {
        await updateStandingsCache(gameId, standingsData.standings);
      }
      
      // Set cache headers (no caching for POST - force revalidation)
      setCacheHeaders(res, {
        maxAge: 0,
        sMaxAge: 0,
        staleWhileRevalidate: 0,
      });
      
      res.status(200).json({
        message: 'Standings recalculated successfully',
        gameId,
        standings: standingsData.standings,
        isTemporary: standingsData.isTemporary,
        hasFinishTimes: standingsData.hasFinishTimes,
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
