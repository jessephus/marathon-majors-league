import { neon } from '@neondatabase/serverless';

// Initialize Neon SQL client
const sql = neon(process.env.DATABASE_URL);

// ============================================================================
// ATHLETES
// ============================================================================

export async function getAllAthletes() {
  const athletes = await sql`
    SELECT 
      id, 
      name, 
      country, 
      gender, 
      personal_best as pb, 
      headshot_url as "headshotUrl",
      world_athletics_id as "worldAthleticsId",
      world_athletics_profile_url as "worldAthleticsProfileUrl",
      marathon_rank as "marathonRank",
      road_running_rank as "roadRunningRank"
    FROM athletes
    ORDER BY gender, personal_best
  `;
  
  // Group by gender for frontend compatibility
  const grouped = {
    men: athletes.filter(a => a.gender === 'men'),
    women: athletes.filter(a => a.gender === 'women')
  };
  
  return grouped;
}

export async function getAthleteById(id) {
  const [athlete] = await sql`
    SELECT 
      id, 
      name, 
      country, 
      gender, 
      personal_best as pb, 
      headshot_url as "headshotUrl",
      world_athletics_id as "worldAthleticsId",
      world_athletics_profile_url as "worldAthleticsProfileUrl",
      marathon_rank as "marathonRank",
      road_running_rank as "roadRunningRank"
    FROM athletes
    WHERE id = ${id}
  `;
  return athlete;
}

export async function seedAthletes(athletesData) {
  // Insert men athletes
  for (const athlete of athletesData.men) {
    const waId = athlete.worldAthletics?.id || null;
    const waProfileUrl = athlete.worldAthletics?.profileUrl || null;
    const marathonRank = athlete.worldAthletics?.marathonRank || null;
    const roadRunningRank = athlete.worldAthletics?.roadRunningRank || null;
    
    await sql`
      INSERT INTO athletes (id, name, country, gender, personal_best, headshot_url, world_athletics_id, world_athletics_profile_url, marathon_rank, road_running_rank)
      VALUES (${athlete.id}, ${athlete.name}, ${athlete.country}, 'men', ${athlete.pb}, ${athlete.headshotUrl}, ${waId}, ${waProfileUrl}, ${marathonRank}, ${roadRunningRank})
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        country = EXCLUDED.country,
        personal_best = EXCLUDED.personal_best,
        headshot_url = EXCLUDED.headshot_url,
        world_athletics_id = EXCLUDED.world_athletics_id,
        world_athletics_profile_url = EXCLUDED.world_athletics_profile_url,
        marathon_rank = EXCLUDED.marathon_rank,
        road_running_rank = EXCLUDED.road_running_rank,
        updated_at = CURRENT_TIMESTAMP
    `;
  }
  
  // Insert women athletes
  for (const athlete of athletesData.women) {
    const waId = athlete.worldAthletics?.id || null;
    const waProfileUrl = athlete.worldAthletics?.profileUrl || null;
    const marathonRank = athlete.worldAthletics?.marathonRank || null;
    const roadRunningRank = athlete.worldAthletics?.roadRunningRank || null;
    
    await sql`
      INSERT INTO athletes (id, name, country, gender, personal_best, headshot_url, world_athletics_id, world_athletics_profile_url, marathon_rank, road_running_rank)
      VALUES (${athlete.id}, ${athlete.name}, ${athlete.country}, 'women', ${athlete.pb}, ${athlete.headshotUrl}, ${waId}, ${waProfileUrl}, ${marathonRank}, ${roadRunningRank})
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        country = EXCLUDED.country,
        personal_best = EXCLUDED.personal_best,
        headshot_url = EXCLUDED.headshot_url,
        world_athletics_id = EXCLUDED.world_athletics_id,
        world_athletics_profile_url = EXCLUDED.world_athletics_profile_url,
        marathon_rank = EXCLUDED.marathon_rank,
        road_running_rank = EXCLUDED.road_running_rank,
        updated_at = CURRENT_TIMESTAMP
    `;
  }
}

// ============================================================================
// GAMES
// ============================================================================

export async function getGameState(gameId) {
  const [game] = await sql`
    SELECT game_id, players, draft_complete, results_finalized, created_at, updated_at
    FROM games
    WHERE game_id = ${gameId}
  `;
  
  if (!game) {
    return null;
  }
  
  return {
    players: game.players || [],
    draft_complete: game.draft_complete,
    results_finalized: game.results_finalized,
    created_at: game.created_at,
    updated_at: game.updated_at
  };
}

export async function createGame(gameId, players = []) {
  const [game] = await sql`
    INSERT INTO games (game_id, players, draft_complete, results_finalized)
    VALUES (${gameId}, ${players}, false, false)
    RETURNING game_id, players, draft_complete, results_finalized, created_at, updated_at
  `;
  
  return {
    players: game.players || [],
    draft_complete: game.draft_complete,
    results_finalized: game.results_finalized,
    created_at: game.created_at,
    updated_at: game.updated_at
  };
}

export async function updateGameState(gameId, updates) {
  const { players, draft_complete, results_finalized } = updates;
  
  // Get current game state or create if doesn't exist
  let game = await getGameState(gameId);
  if (!game) {
    game = await createGame(gameId, players || []);
    return game;
  }
  
  // Build the UPDATE query parts
  const updateParts = [];
  
  if (players !== undefined) {
    updateParts.push({ field: 'players', value: players });
  }
  
  if (draft_complete !== undefined) {
    updateParts.push({ field: 'draft_complete', value: draft_complete });
  }
  
  if (results_finalized !== undefined) {
    updateParts.push({ field: 'results_finalized', value: results_finalized });
  }
  
  if (updateParts.length === 0) {
    return game;
  }
  
  // Execute updates one at a time using tagged templates
  for (const part of updateParts) {
    if (part.field === 'players') {
      await sql`
        UPDATE games
        SET players = ${part.value}, updated_at = CURRENT_TIMESTAMP
        WHERE game_id = ${gameId}
      `;
    } else if (part.field === 'draft_complete') {
      await sql`
        UPDATE games
        SET draft_complete = ${part.value}, updated_at = CURRENT_TIMESTAMP
        WHERE game_id = ${gameId}
      `;
    } else if (part.field === 'results_finalized') {
      await sql`
        UPDATE games
        SET results_finalized = ${part.value}, updated_at = CURRENT_TIMESTAMP
        WHERE game_id = ${gameId}
      `;
    }
  }
  
  // Fetch and return updated game state
  const updatedGame = await getGameState(gameId);
  return updatedGame;
}

// ============================================================================
// RANKINGS
// ============================================================================

export async function getPlayerRankings(gameId, playerCode = null) {
  let rankings;
  
  if (playerCode) {
    rankings = await sql`
      SELECT pr.player_code, pr.gender, pr.rank_order,
             a.id, a.name, a.country, a.personal_best as pb, a.headshot_url as "headshotUrl"
      FROM player_rankings pr
      JOIN athletes a ON pr.athlete_id = a.id
      WHERE pr.game_id = ${gameId} AND pr.player_code = ${playerCode}
      ORDER BY pr.gender, pr.rank_order
    `;
  } else {
    rankings = await sql`
      SELECT pr.player_code, pr.gender, pr.rank_order,
             a.id, a.name, a.country, a.personal_best as pb, a.headshot_url as "headshotUrl"
      FROM player_rankings pr
      JOIN athletes a ON pr.athlete_id = a.id
      WHERE pr.game_id = ${gameId}
      ORDER BY pr.player_code, pr.gender, pr.rank_order
    `;
  }
  
  // Transform to match blob storage format
  const grouped = {};
  
  rankings.forEach(row => {
    if (!grouped[row.player_code]) {
      grouped[row.player_code] = { men: [], women: [] };
    }
    
    const athlete = {
      id: row.id,
      name: row.name,
      country: row.country,
      pb: row.pb,
      headshotUrl: row.headshotUrl
    };
    
    grouped[row.player_code][row.gender].push(athlete);
  });
  
  return playerCode && grouped[playerCode] ? grouped[playerCode] : grouped;
}

export async function savePlayerRankings(gameId, playerCode, men, women) {
  // Delete existing rankings for this player
  await sql`
    DELETE FROM player_rankings
    WHERE game_id = ${gameId} AND player_code = ${playerCode}
  `;
  
  // Insert men rankings
  for (let i = 0; i < men.length; i++) {
    await sql`
      INSERT INTO player_rankings (game_id, player_code, gender, athlete_id, rank_order)
      VALUES (${gameId}, ${playerCode}, 'men', ${men[i].id}, ${i + 1})
    `;
  }
  
  // Insert women rankings
  for (let i = 0; i < women.length; i++) {
    await sql`
      INSERT INTO player_rankings (game_id, player_code, gender, athlete_id, rank_order)
      VALUES (${gameId}, ${playerCode}, 'women', ${women[i].id}, ${i + 1})
    `;
  }
}

export async function clearAllRankings(gameId) {
  await sql`
    DELETE FROM player_rankings
    WHERE game_id = ${gameId}
  `;
}

// ============================================================================
// DRAFT TEAMS
// ============================================================================

export async function getDraftTeams(gameId) {
  const teams = await sql`
    SELECT dt.player_code,
           a.id, a.name, a.country, a.gender, a.personal_best as pb, a.headshot_url as "headshotUrl"
    FROM draft_teams dt
    JOIN athletes a ON dt.athlete_id = a.id
    WHERE dt.game_id = ${gameId}
    ORDER BY dt.player_code, a.gender, a.personal_best
  `;
  
  // Transform to match blob storage format
  const grouped = {};
  
  teams.forEach(row => {
    if (!grouped[row.player_code]) {
      grouped[row.player_code] = { men: [], women: [] };
    }
    
    const athlete = {
      id: row.id,
      name: row.name,
      country: row.country,
      pb: row.pb,
      headshotUrl: row.headshotUrl
    };
    
    grouped[row.player_code][row.gender].push(athlete);
  });
  
  return grouped;
}

export async function saveDraftTeams(gameId, teams) {
  // Clear existing teams for this game
  await sql`
    DELETE FROM draft_teams
    WHERE game_id = ${gameId}
  `;
  
  // Insert new teams
  for (const [playerCode, team] of Object.entries(teams)) {
    // Insert men
    if (team.men) {
      for (const athlete of team.men) {
        await sql`
          INSERT INTO draft_teams (game_id, player_code, athlete_id)
          VALUES (${gameId}, ${playerCode}, ${athlete.id})
        `;
      }
    }
    
    // Insert women
    if (team.women) {
      for (const athlete of team.women) {
        await sql`
          INSERT INTO draft_teams (game_id, player_code, athlete_id)
          VALUES (${gameId}, ${playerCode}, ${athlete.id})
        `;
      }
    }
  }
}

// ============================================================================
// RACE RESULTS
// ============================================================================

export async function getRaceResults(gameId) {
  const results = await sql`
    SELECT athlete_id, finish_time
    FROM race_results
    WHERE game_id = ${gameId}
  `;
  
  // Transform to match blob storage format (athleteId -> finishTime map)
  const resultsMap = {};
  results.forEach(row => {
    if (row.finish_time) {
      resultsMap[row.athlete_id] = row.finish_time;
    }
  });
  
  return resultsMap;
}

export async function saveRaceResults(gameId, results) {
  // Update or insert results
  for (const [athleteId, finishTime] of Object.entries(results)) {
    await sql`
      INSERT INTO race_results (game_id, athlete_id, finish_time, is_final)
      VALUES (${gameId}, ${parseInt(athleteId)}, ${finishTime}, false)
      ON CONFLICT (game_id, athlete_id) DO UPDATE SET
        finish_time = EXCLUDED.finish_time,
        updated_at = CURRENT_TIMESTAMP
    `;
  }
}

export async function finalizeResults(gameId) {
  await sql`
    UPDATE race_results
    SET is_final = true
    WHERE game_id = ${gameId}
  `;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export async function initializeDatabase() {
  // Test connection
  const [result] = await sql`SELECT NOW() as current_time`;
  return result;
}

export async function resetGame(gameId) {
  // Delete all game data
  await sql`DELETE FROM race_results WHERE game_id = ${gameId}`;
  await sql`DELETE FROM draft_teams WHERE game_id = ${gameId}`;
  await sql`DELETE FROM player_rankings WHERE game_id = ${gameId}`;
  await sql`DELETE FROM games WHERE game_id = ${gameId}`;
}
