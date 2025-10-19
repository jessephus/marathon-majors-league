import { neon } from '@neondatabase/serverless';

// Initialize Neon SQL client
const sql = neon(process.env.DATABASE_URL);

// ============================================================================
// ATHLETES
// ============================================================================

export async function getAllAthletes(confirmedOnly = true) {
  let athletes;
  
  if (confirmedOnly) {
    // Only return athletes confirmed for active races
    athletes = await sql`
      SELECT DISTINCT
        a.id, 
        a.name, 
        a.country, 
        a.gender, 
        a.personal_best as pb, 
        a.headshot_url as "headshotUrl",
        a.world_athletics_id as "worldAthleticsId",
        a.world_athletics_profile_url as "worldAthleticsProfileUrl",
        a.marathon_rank as "marathonRank",
        a.road_running_rank as "roadRunningRank",
        a.overall_rank as "overallRank",
        a.age,
        a.date_of_birth as "dateOfBirth",
        a.sponsor,
        a.season_best as "seasonBest",
        true as "nycConfirmed"
      FROM athletes a
      INNER JOIN athlete_races ar ON a.id = ar.athlete_id
      INNER JOIN races r ON ar.race_id = r.id
      WHERE r.is_active = true
      ORDER BY a.gender, a.personal_best
    `;
  } else {
    // Return all athletes with confirmation status
    athletes = await sql`
      SELECT DISTINCT
        a.id, 
        a.name, 
        a.country, 
        a.gender, 
        a.personal_best as pb, 
        a.headshot_url as "headshotUrl",
        a.world_athletics_id as "worldAthleticsId",
        a.world_athletics_profile_url as "worldAthleticsProfileUrl",
        a.marathon_rank as "marathonRank",
        a.road_running_rank as "roadRunningRank",
        a.overall_rank as "overallRank",
        a.age,
        a.date_of_birth as "dateOfBirth",
        a.sponsor,
        a.season_best as "seasonBest",
        CASE 
          WHEN ar.id IS NOT NULL THEN true 
          ELSE false 
        END as "nycConfirmed"
      FROM athletes a
      LEFT JOIN athlete_races ar ON a.id = ar.athlete_id AND ar.race_id = (
        SELECT id FROM races WHERE is_active = true LIMIT 1
      )
      ORDER BY a.gender, a.personal_best
    `;
  }
  
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
      road_running_rank as "roadRunningRank",
      overall_rank as "overallRank",
      age,
      date_of_birth as "dateOfBirth",
      sponsor,
      season_best as "seasonBest"
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
    const overallRank = athlete.worldAthletics?.overallRank || null;
    const age = athlete.age || null;
    const dateOfBirth = athlete.dateOfBirth || null;
    const sponsor = athlete.sponsor || null;
    const seasonBest = athlete.seasonBest || athlete.pb || null;
    
    await sql`
      INSERT INTO athletes (id, name, country, gender, personal_best, headshot_url, world_athletics_id, world_athletics_profile_url, marathon_rank, road_running_rank, overall_rank, age, date_of_birth, sponsor, season_best)
      VALUES (${athlete.id}, ${athlete.name}, ${athlete.country}, 'men', ${athlete.pb}, ${athlete.headshotUrl}, ${waId}, ${waProfileUrl}, ${marathonRank}, ${roadRunningRank}, ${overallRank}, ${age}, ${dateOfBirth}, ${sponsor}, ${seasonBest})
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        country = EXCLUDED.country,
        personal_best = EXCLUDED.personal_best,
        headshot_url = EXCLUDED.headshot_url,
        world_athletics_id = EXCLUDED.world_athletics_id,
        world_athletics_profile_url = EXCLUDED.world_athletics_profile_url,
        marathon_rank = EXCLUDED.marathon_rank,
        road_running_rank = EXCLUDED.road_running_rank,
        overall_rank = EXCLUDED.overall_rank,
        age = EXCLUDED.age,
        date_of_birth = EXCLUDED.date_of_birth,
        sponsor = EXCLUDED.sponsor,
        season_best = EXCLUDED.season_best,
        updated_at = CURRENT_TIMESTAMP
    `;
  }
  
  // Insert women athletes
  for (const athlete of athletesData.women) {
    const waId = athlete.worldAthletics?.id || null;
    const waProfileUrl = athlete.worldAthletics?.profileUrl || null;
    const marathonRank = athlete.worldAthletics?.marathonRank || null;
    const roadRunningRank = athlete.worldAthletics?.roadRunningRank || null;
    const overallRank = athlete.worldAthletics?.overallRank || null;
    const age = athlete.age || null;
    const dateOfBirth = athlete.dateOfBirth || null;
    const sponsor = athlete.sponsor || null;
    const seasonBest = athlete.seasonBest || athlete.pb || null;
    
    await sql`
      INSERT INTO athletes (id, name, country, gender, personal_best, headshot_url, world_athletics_id, world_athletics_profile_url, marathon_rank, road_running_rank, overall_rank, age, date_of_birth, sponsor, season_best)
      VALUES (${athlete.id}, ${athlete.name}, ${athlete.country}, 'women', ${athlete.pb}, ${athlete.headshotUrl}, ${waId}, ${waProfileUrl}, ${marathonRank}, ${roadRunningRank}, ${overallRank}, ${age}, ${dateOfBirth}, ${sponsor}, ${seasonBest})
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        country = EXCLUDED.country,
        personal_best = EXCLUDED.personal_best,
        headshot_url = EXCLUDED.headshot_url,
        world_athletics_id = EXCLUDED.world_athletics_id,
        world_athletics_profile_url = EXCLUDED.world_athletics_profile_url,
        marathon_rank = EXCLUDED.marathon_rank,
        road_running_rank = EXCLUDED.road_running_rank,
        overall_rank = EXCLUDED.overall_rank,
        age = EXCLUDED.age,
        date_of_birth = EXCLUDED.date_of_birth,
        sponsor = EXCLUDED.sponsor,
        season_best = EXCLUDED.season_best,
        updated_at = CURRENT_TIMESTAMP
    `;
  }
}

/**
 * Get progression data for an athlete (year-by-year season's bests)
 * @param {number} athleteId - Database ID of the athlete
 * @param {string} discipline - Optional discipline filter (e.g., 'Marathon Road')
 * @returns {Promise<Array>} Array of progression records
 */
export async function getAthleteProgression(athleteId, discipline = null) {
  let progression;
  
  if (discipline) {
    progression = await sql`
      SELECT 
        id,
        athlete_id as "athleteId",
        discipline,
        season,
        mark,
        venue,
        competition_date as "competitionDate",
        competition_name as "competitionName",
        result_score as "resultScore",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM athlete_progression
      WHERE athlete_id = ${athleteId} 
        AND discipline = ${discipline}
      ORDER BY season DESC, mark ASC
    `;
  } else {
    progression = await sql`
      SELECT 
        id,
        athlete_id as "athleteId",
        discipline,
        season,
        mark,
        venue,
        competition_date as "competitionDate",
        competition_name as "competitionName",
        result_score as "resultScore",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM athlete_progression
      WHERE athlete_id = ${athleteId}
      ORDER BY season DESC, mark ASC
    `;
  }
  
  return progression;
}

/**
 * Get race results for an athlete
 * @param {number} athleteId - Database ID of the athlete
 * @param {number} year - Optional year filter
 * @param {string} discipline - Optional discipline filter (e.g., 'Marathon')
 * @returns {Promise<Array>} Array of race result records
 */
export async function getAthleteRaceResults(athleteId, year = null, discipline = null) {
  let results;
  
  if (year && discipline) {
    results = await sql`
      SELECT 
        id,
        athlete_id as "athleteId",
        year,
        competition_date as "competitionDate",
        competition_name as "competitionName",
        venue,
        discipline,
        position,
        finish_time as "finishTime",
        race_points as "racePoints",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM athlete_race_results
      WHERE athlete_id = ${athleteId}
        AND year = ${year}
        AND discipline = ${discipline}
      ORDER BY competition_date DESC
    `;
  } else if (year) {
    results = await sql`
      SELECT 
        id,
        athlete_id as "athleteId",
        year,
        competition_date as "competitionDate",
        competition_name as "competitionName",
        venue,
        discipline,
        position,
        finish_time as "finishTime",
        race_points as "racePoints",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM athlete_race_results
      WHERE athlete_id = ${athleteId}
        AND year = ${year}
      ORDER BY competition_date DESC
    `;
  } else if (discipline) {
    results = await sql`
      SELECT 
        id,
        athlete_id as "athleteId",
        year,
        competition_date as "competitionDate",
        competition_name as "competitionName",
        venue,
        discipline,
        position,
        finish_time as "finishTime",
        race_points as "racePoints",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM athlete_race_results
      WHERE athlete_id = ${athleteId}
        AND discipline = ${discipline}
      ORDER BY competition_date DESC, year DESC
    `;
  } else {
    results = await sql`
      SELECT 
        id,
        athlete_id as "athleteId",
        year,
        competition_date as "competitionDate",
        competition_name as "competitionName",
        venue,
        discipline,
        position,
        finish_time as "finishTime",
        race_points as "racePoints",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM athlete_race_results
      WHERE athlete_id = ${athleteId}
      ORDER BY competition_date DESC, year DESC
    `;
  }
  
  return results;
}

/**
 * Get complete athlete profile with progression and race results
 * @param {number} athleteId - Database ID of the athlete
 * @param {Object} options - Options for what data to include
 * @param {boolean} options.includeProgression - Include progression data
 * @param {boolean} options.includeResults - Include race results data
 * @param {string} options.discipline - Filter by discipline
 * @param {number} options.year - Filter results by year
 * @returns {Promise<Object>} Complete athlete profile object
 */
export async function getAthleteProfile(athleteId, options = {}) {
  const {
    includeProgression = false,
    includeResults = false,
    discipline = null,
    year = null
  } = options;
  
  // Get base athlete data
  const athlete = await getAthleteById(athleteId);
  
  if (!athlete) {
    return null;
  }
  
  const profile = { ...athlete };
  
  // Add progression data if requested
  if (includeProgression) {
    profile.progression = await getAthleteProgression(athleteId, discipline);
  }
  
  // Add race results if requested
  if (includeResults) {
    profile.raceResults = await getAthleteRaceResults(athleteId, year, discipline);
  }
  
  return profile;
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

// ============================================================================
// RACES
// ============================================================================

export async function getAllRaces() {
  const races = await sql`
    SELECT 
      id, 
      name, 
      date, 
      location, 
      distance, 
      event_type as "eventType",
      world_athletics_event_id as "worldAthleticsEventId",
      description,
      is_active as "isActive",
      created_at as "createdAt",
      updated_at as "updatedAt"
    FROM races
    ORDER BY date DESC
  `;
  return races;
}

export async function getActiveRaces() {
  const races = await sql`
    SELECT 
      id, 
      name, 
      date, 
      location, 
      distance, 
      event_type as "eventType",
      world_athletics_event_id as "worldAthleticsEventId",
      description,
      is_active as "isActive",
      created_at as "createdAt",
      updated_at as "updatedAt"
    FROM races
    WHERE is_active = true
    ORDER BY date DESC
  `;
  return races;
}

export async function getRaceById(id) {
  const [race] = await sql`
    SELECT 
      id, 
      name, 
      date, 
      location, 
      distance, 
      event_type as "eventType",
      world_athletics_event_id as "worldAthleticsEventId",
      description,
      is_active as "isActive",
      created_at as "createdAt",
      updated_at as "updatedAt"
    FROM races
    WHERE id = ${id}
  `;
  return race;
}

export async function createRace(raceData) {
  const { name, date, location, distance, eventType, worldAthleticsEventId, description, isActive } = raceData;
  
  const [race] = await sql`
    INSERT INTO races (name, date, location, distance, event_type, world_athletics_event_id, description, is_active)
    VALUES (
      ${name}, 
      ${date}, 
      ${location}, 
      ${distance || 'Marathon (42.195 km)'}, 
      ${eventType || 'Marathon Majors'}, 
      ${worldAthleticsEventId || null}, 
      ${description || null}, 
      ${isActive !== undefined ? isActive : true}
    )
    RETURNING id, name, date, location, distance, event_type as "eventType", world_athletics_event_id as "worldAthleticsEventId", description, is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"
  `;
  
  return race;
}

export async function updateRace(id, updates) {
  const { name, date, location, distance, eventType, worldAthleticsEventId, description, isActive } = updates;
  
  // Build update query dynamically
  const setParts = [];
  const values = [];
  
  if (name !== undefined) {
    setParts.push('name = $' + (values.length + 1));
    values.push(name);
  }
  if (date !== undefined) {
    setParts.push('date = $' + (values.length + 1));
    values.push(date);
  }
  if (location !== undefined) {
    setParts.push('location = $' + (values.length + 1));
    values.push(location);
  }
  if (distance !== undefined) {
    setParts.push('distance = $' + (values.length + 1));
    values.push(distance);
  }
  if (eventType !== undefined) {
    setParts.push('event_type = $' + (values.length + 1));
    values.push(eventType);
  }
  if (worldAthleticsEventId !== undefined) {
    setParts.push('world_athletics_event_id = $' + (values.length + 1));
    values.push(worldAthleticsEventId);
  }
  if (description !== undefined) {
    setParts.push('description = $' + (values.length + 1));
    values.push(description);
  }
  if (isActive !== undefined) {
    setParts.push('is_active = $' + (values.length + 1));
    values.push(isActive);
  }
  
  if (setParts.length === 0) {
    return await getRaceById(id);
  }
  
  // Execute update one field at a time using tagged templates
  if (name !== undefined) {
    await sql`UPDATE races SET name = ${name}, updated_at = CURRENT_TIMESTAMP WHERE id = ${id}`;
  }
  if (date !== undefined) {
    await sql`UPDATE races SET date = ${date}, updated_at = CURRENT_TIMESTAMP WHERE id = ${id}`;
  }
  if (location !== undefined) {
    await sql`UPDATE races SET location = ${location}, updated_at = CURRENT_TIMESTAMP WHERE id = ${id}`;
  }
  if (distance !== undefined) {
    await sql`UPDATE races SET distance = ${distance}, updated_at = CURRENT_TIMESTAMP WHERE id = ${id}`;
  }
  if (eventType !== undefined) {
    await sql`UPDATE races SET event_type = ${eventType}, updated_at = CURRENT_TIMESTAMP WHERE id = ${id}`;
  }
  if (worldAthleticsEventId !== undefined) {
    await sql`UPDATE races SET world_athletics_event_id = ${worldAthleticsEventId}, updated_at = CURRENT_TIMESTAMP WHERE id = ${id}`;
  }
  if (description !== undefined) {
    await sql`UPDATE races SET description = ${description}, updated_at = CURRENT_TIMESTAMP WHERE id = ${id}`;
  }
  if (isActive !== undefined) {
    await sql`UPDATE races SET is_active = ${isActive}, updated_at = CURRENT_TIMESTAMP WHERE id = ${id}`;
  }
  
  return await getRaceById(id);
}

// ============================================================================
// ATHLETE-RACE LINKS
// ============================================================================

export async function linkAthleteToRace(athleteId, raceId, bibNumber = null) {
  const [link] = await sql`
    INSERT INTO athlete_races (athlete_id, race_id, bib_number)
    VALUES (${athleteId}, ${raceId}, ${bibNumber})
    ON CONFLICT (athlete_id, race_id) DO UPDATE SET
      bib_number = EXCLUDED.bib_number
    RETURNING id, athlete_id as "athleteId", race_id as "raceId", bib_number as "bibNumber", confirmed_at as "confirmedAt"
  `;
  return link;
}

export async function unlinkAthleteFromRace(athleteId, raceId) {
  await sql`
    DELETE FROM athlete_races
    WHERE athlete_id = ${athleteId} AND race_id = ${raceId}
  `;
}

export async function getAthletesForRace(raceId) {
  const athletes = await sql`
    SELECT 
      a.id,
      a.name,
      a.country,
      a.gender,
      a.personal_best as pb,
      a.headshot_url as "headshotUrl",
      a.world_athletics_id as "worldAthleticsId",
      a.marathon_rank as "marathonRank",
      ar.bib_number as "bibNumber",
      ar.confirmed_at as "confirmedAt"
    FROM athletes a
    JOIN athlete_races ar ON a.id = ar.athlete_id
    WHERE ar.race_id = ${raceId}
    ORDER BY a.gender, a.personal_best
  `;
  
  // Group by gender
  const grouped = {
    men: athletes.filter(a => a.gender === 'men'),
    women: athletes.filter(a => a.gender === 'women')
  };
  
  return grouped;
}

export async function getRacesForAthlete(athleteId) {
  const races = await sql`
    SELECT 
      r.id,
      r.name,
      r.date,
      r.location,
      r.distance,
      r.event_type as "eventType",
      ar.bib_number as "bibNumber",
      ar.confirmed_at as "confirmedAt"
    FROM races r
    JOIN athlete_races ar ON r.id = ar.race_id
    WHERE ar.athlete_id = ${athleteId}
    ORDER BY r.date DESC
  `;
  return races;
}

export async function seedNYMarathon2025() {
  // Check if race already exists
  const existing = await sql`
    SELECT id FROM races WHERE name = 'NYC Marathon' AND date = '2025-11-02'
  `;
  
  if (existing.length > 0) {
    return existing[0];
  }
  
  // Create the 2025 NY Marathon race
  const race = await createRace({
    name: 'NYC Marathon',
    date: '2025-11-02',
    location: 'New York City, NY, USA',
    distance: 'Marathon (42.195 km)',
    eventType: 'Marathon Majors',
    description: 'The 2025 TCS New York City Marathon',
    isActive: true
  });
  
  // Link all current athletes to this race (since they are confirmed for it)
  const athletes = await sql`SELECT id FROM athletes`;
  for (const athlete of athletes) {
    await linkAthleteToRace(athlete.id, race.id);
  }
  
  return race;
}
