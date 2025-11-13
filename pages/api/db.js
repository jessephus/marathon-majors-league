import { neon } from '@neondatabase/serverless';

// Initialize Neon SQL client
const sql = neon(process.env.DATABASE_URL);

// ============================================================================
// ATHLETES
// ============================================================================

export async function getAllAthletes(confirmedOnly = false) {
  let athletes;
  
  if (confirmedOnly) {
    // Only return athletes confirmed for active races
    // Calculate season_best from 2025 marathon race results only
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
        a.salary,
        COALESCE(
          (SELECT MIN(arr.finish_time)
           FROM athlete_race_results arr
           WHERE arr.athlete_id = a.id
           AND arr.year = '2025'
           AND arr.discipline = 'Marathon'
           AND arr.finish_time IS NOT NULL),
          a.season_best
        ) as "seasonBest",
        true as "nycConfirmed"
      FROM athletes a
      INNER JOIN athlete_races ar ON a.id = ar.athlete_id
      INNER JOIN races r ON ar.race_id = r.id
      WHERE r.is_active = true
      ORDER BY a.gender, a.personal_best
    `;
  } else {
    // Return all athletes with confirmation status
    // Calculate season_best from 2025 marathon race results only
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
        a.salary,
        COALESCE(
          (SELECT MIN(arr.finish_time)
           FROM athlete_race_results arr
           WHERE arr.athlete_id = a.id
           AND arr.year = '2025'
           AND arr.discipline = 'Marathon'
           AND arr.finish_time IS NOT NULL),
          a.season_best
        ) as "seasonBest",
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
      COALESCE(
        (SELECT MIN(arr.finish_time)
         FROM athlete_race_results arr
         WHERE arr.athlete_id = id
         AND arr.year = '2025'
         AND arr.discipline = 'Marathon'
         AND arr.finish_time IS NOT NULL),
        season_best
      ) as "seasonBest"
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

/**
 * Get game state from database
 * 
 * ⚠️ DEPRECATION NOTICE - games.players[] array:
 * The `players` array is DEPRECATED and only maintained for legacy site compatibility.
 * 
 * For salary cap draft teams, DO NOT USE games.players[].
 * Instead, query anonymous_sessions table directly:
 *   SELECT * FROM anonymous_sessions WHERE game_id = ? AND is_active = true
 * 
 * New code should use:
 *   - TeamsOverviewPanel (commissioner view)
 *   - /api/salary-cap-draft endpoint (teams query)
 * 
 * The players[] array was a holdover from snake draft mode and is no longer 
 * maintained for new salary cap teams. Legacy site (app.js) still uses it,
 * but will show stale data for teams created after this deprecation.
 */
export async function getGameState(gameId) {
  const [game] = await sql`
    SELECT game_id, players, draft_complete, results_finalized, roster_lock_time, created_at, updated_at
    FROM games
    WHERE game_id = ${gameId}
  `;
  
  if (!game) {
    return null;
  }
  
  return {
    players: game.players || [], // ⚠️ DEPRECATED - Query anonymous_sessions instead
    draft_complete: game.draft_complete,
    results_finalized: game.results_finalized,
    roster_lock_time: game.roster_lock_time,
    created_at: game.created_at,
    updated_at: game.updated_at
  };
}

/**
 * Create a new game
 * 
 * ⚠️ DEPRECATION NOTICE - players parameter:
 * The `players` parameter is DEPRECATED for salary cap draft games.
 * It's only used for legacy snake draft mode.
 * 
 * For salary cap draft, teams are tracked in anonymous_sessions table.
 * Do not add teams to games.players[] array.
 */
export async function createGame(gameId, players = []) {
  const [game] = await sql`
    INSERT INTO games (game_id, players, draft_complete, results_finalized)
    VALUES (${gameId}, ${players}, false, false)
    RETURNING game_id, players, draft_complete, results_finalized, roster_lock_time, created_at, updated_at
  `;
  
  return {
    players: game.players || [], // ⚠️ DEPRECATED - Don't use for salary cap draft
    draft_complete: game.draft_complete,
    results_finalized: game.results_finalized,
    roster_lock_time: game.roster_lock_time,
    created_at: game.created_at,
    updated_at: game.updated_at
  };
}

export async function updateGameState(gameId, updates) {
  const { players, draft_complete, results_finalized, roster_lock_time } = updates;
  
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
  
  if (roster_lock_time !== undefined) {
    updateParts.push({ field: 'roster_lock_time', value: roster_lock_time });
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
    } else if (part.field === 'roster_lock_time') {
      await sql`
        UPDATE games
        SET roster_lock_time = ${part.value}, updated_at = CURRENT_TIMESTAMP
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
// ============================================================================
// DEPRECATED SNAKE DRAFT FUNCTIONS - REMOVED
// ============================================================================
// The following functions were removed as part of the monolith cleanup:
// - getPlayerRankings() - Part of legacy snake draft system
// - savePlayerRankings() - Part of legacy snake draft system
// - clearAllRankings() - Part of legacy snake draft system
// - getDraftTeams() - Part of legacy snake draft system
// - saveDraftTeams() - Part of legacy snake draft system
//
// These functions worked with player_rankings and draft_teams tables which
// are deprecated in favor of the modern salary cap draft (salary_cap_teams table).
//
// The /api/rankings and /api/draft endpoints that used these functions have
// also been removed.
//
// For team data, use:
// - getSalaryCapTeams() - Get salary cap draft teams
// - saveSalaryCapTeam() - Save salary cap draft team

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
  for (const [athleteIdKey, rawValue] of Object.entries(results)) {
    const athleteId = parseInt(athleteIdKey, 10);
    if (Number.isNaN(athleteId)) {
      continue;
    }

    let finishTime = null;
    let split5k = null;
    let split10k = null;
    let splitHalf = null;
    let split30k = null;
    let split35k = null;
    let split40k = null;
    let placement = null;
    let placementPoints = null;
    let timeGapSeconds = null;
    let timeGapPoints = null;
    let performanceBonusPoints = null;
    let recordBonusPoints = null;
    let totalPoints = null;
    let pointsVersion = null;
    let breakdown = null;
    let recordType = null;
    let recordStatus = null;
    let isWorldRecord = null;
    let isCourseRecord = null;

    if (rawValue && typeof rawValue === 'object' && !Array.isArray(rawValue)) {
      finishTime = rawValue.finishTime ?? rawValue.finish_time ?? rawValue.time ?? rawValue.finish ?? null;

      const splits = rawValue.splits || {};
      split5k = rawValue.split5k ?? rawValue.split_5k ?? splits['5k'] ?? splits['split_5k'] ?? null;
      split10k = rawValue.split10k ?? rawValue.split_10k ?? splits['10k'] ?? splits['split_10k'] ?? null;
      splitHalf = rawValue.splitHalf ?? rawValue.split_half ?? splits['half'] ?? splits['21k'] ?? splits['13.1m'] ?? null;
      split30k = rawValue.split30k ?? rawValue.split_30k ?? splits['30k'] ?? null;
      split35k = rawValue.split35k ?? rawValue.split_35k ?? splits['35k'] ?? null;
      split40k = rawValue.split40k ?? rawValue.split_40k ?? splits['40k'] ?? null;

      placement = rawValue.placement ?? rawValue.place ?? null;
      placementPoints = rawValue.placementPoints ?? rawValue.placement_points ?? null;
      timeGapSeconds = rawValue.timeGapSeconds ?? rawValue.time_gap_seconds ?? null;
      timeGapPoints = rawValue.timeGapPoints ?? rawValue.time_gap_points ?? null;
      performanceBonusPoints = rawValue.performanceBonusPoints ?? rawValue.performance_bonus_points ?? null;
      recordBonusPoints = rawValue.recordBonusPoints ?? rawValue.record_bonus_points ?? null;
      totalPoints = rawValue.totalPoints ?? rawValue.total_points ?? null;
      pointsVersion = rawValue.pointsVersion ?? rawValue.points_version ?? null;
      breakdown = rawValue.breakdown ?? null;
      recordType = rawValue.recordType ?? rawValue.record_type ?? null;
      recordStatus = rawValue.recordStatus ?? rawValue.record_status ?? null;

      const worldRecordFlag = rawValue.isWorldRecord ?? rawValue.is_world_record;
      const courseRecordFlag = rawValue.isCourseRecord ?? rawValue.is_course_record;
      const computedWorldRecord = recordType && (recordType === 'WORLD' || recordType === 'BOTH');
      const computedCourseRecord = recordType && (recordType === 'COURSE' || recordType === 'BOTH');

      isWorldRecord = worldRecordFlag ?? (computedWorldRecord ? true : null);
      isCourseRecord = courseRecordFlag ?? (computedCourseRecord ? true : null);
    } else if (typeof rawValue === 'string') {
      finishTime = rawValue;
    }

    if (!finishTime && !split5k && !split10k && !splitHalf && !split30k && !split35k && !split40k) {
      // Nothing to store for this athlete
      continue;
    }

    await sql`
      INSERT INTO race_results (
        game_id,
        athlete_id,
        finish_time,
        split_5k,
        split_10k,
        split_half,
        split_30k,
        split_35k,
        split_40k,
        placement,
        placement_points,
        time_gap_seconds,
        time_gap_points,
        performance_bonus_points,
        record_bonus_points,
        total_points,
        points_version,
        breakdown,
        record_type,
        record_status,
        is_world_record,
        is_course_record,
        is_final
      )
      VALUES (
        ${gameId},
        ${athleteId},
        ${finishTime},
        ${split5k},
        ${split10k},
        ${splitHalf},
        ${split30k},
        ${split35k},
        ${split40k},
        ${placement},
        ${placementPoints},
        ${timeGapSeconds},
        ${timeGapPoints},
        ${performanceBonusPoints},
        ${recordBonusPoints},
        ${totalPoints},
        ${pointsVersion},
        ${breakdown},
        ${recordType},
        ${recordStatus},
        ${isWorldRecord},
        ${isCourseRecord},
        false
      )
      ON CONFLICT (game_id, athlete_id) DO UPDATE SET
        finish_time = COALESCE(EXCLUDED.finish_time, race_results.finish_time),
        split_5k = COALESCE(EXCLUDED.split_5k, race_results.split_5k),
        split_10k = COALESCE(EXCLUDED.split_10k, race_results.split_10k),
        split_half = COALESCE(EXCLUDED.split_half, race_results.split_half),
        split_30k = COALESCE(EXCLUDED.split_30k, race_results.split_30k),
        split_35k = COALESCE(EXCLUDED.split_35k, race_results.split_35k),
        split_40k = COALESCE(EXCLUDED.split_40k, race_results.split_40k),
        placement = COALESCE(EXCLUDED.placement, race_results.placement),
        placement_points = COALESCE(EXCLUDED.placement_points, race_results.placement_points),
        time_gap_seconds = COALESCE(EXCLUDED.time_gap_seconds, race_results.time_gap_seconds),
        time_gap_points = COALESCE(EXCLUDED.time_gap_points, race_results.time_gap_points),
        performance_bonus_points = COALESCE(EXCLUDED.performance_bonus_points, race_results.performance_bonus_points),
        record_bonus_points = COALESCE(EXCLUDED.record_bonus_points, race_results.record_bonus_points),
        total_points = COALESCE(EXCLUDED.total_points, race_results.total_points),
        points_version = COALESCE(EXCLUDED.points_version, race_results.points_version),
        breakdown = COALESCE(EXCLUDED.breakdown, race_results.breakdown),
        record_type = COALESCE(EXCLUDED.record_type, race_results.record_type),
        record_status = COALESCE(EXCLUDED.record_status, race_results.record_status),
        is_world_record = COALESCE(EXCLUDED.is_world_record, race_results.is_world_record),
        is_course_record = COALESCE(EXCLUDED.is_course_record, race_results.is_course_record),
        updated_at = CURRENT_TIMESTAMP,
        is_final = CASE WHEN race_results.is_final = true THEN true ELSE COALESCE(race_results.is_final, false) END
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

// ============================================================================
// SCORING RULES
// ============================================================================

export async function getScoringRules(version = 2) {
  const [rules] = await sql`
    SELECT id, version, rules, created_at, created_by, description
    FROM scoring_rules
    WHERE version = ${version}
  `;
  return rules;
}

export async function getAllScoringRules() {
  const rules = await sql`
    SELECT id, version, rules, created_at, created_by, description
    FROM scoring_rules
    ORDER BY version DESC
  `;
  return rules;
}

export async function createScoringRules(version, rules, createdBy = 'api', description = '') {
  const [newRules] = await sql`
    INSERT INTO scoring_rules (version, rules, created_by, description)
    VALUES (${version}, ${JSON.stringify(rules)}, ${createdBy}, ${description})
    RETURNING id, version, rules, created_at, created_by, description
  `;
  return newRules;
}

// ============================================================================
// STANDINGS
// ============================================================================

export async function getStandings(gameId) {
  const standings = await sql`
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
  return standings;
}

// ============================================================================
// RECORDS AUDIT
// ============================================================================

export async function getRecordsAudit(gameId = null, athleteId = null) {
  let audit;
  
  if (gameId && athleteId) {
    audit = await sql`
      SELECT 
        ra.id,
        ra.race_result_id,
        ra.game_id,
        ra.athlete_id,
        ra.record_type,
        ra.status_before,
        ra.status_after,
        ra.points_delta,
        ra.changed_by,
        ra.changed_at,
        ra.notes,
        a.name as athlete_name
      FROM records_audit ra
      JOIN athletes a ON ra.athlete_id = a.id
      WHERE ra.game_id = ${gameId} AND ra.athlete_id = ${athleteId}
      ORDER BY ra.changed_at DESC
    `;
  } else if (gameId) {
    audit = await sql`
      SELECT 
        ra.id,
        ra.race_result_id,
        ra.game_id,
        ra.athlete_id,
        ra.record_type,
        ra.status_before,
        ra.status_after,
        ra.points_delta,
        ra.changed_by,
        ra.changed_at,
        ra.notes,
        a.name as athlete_name
      FROM records_audit ra
      JOIN athletes a ON ra.athlete_id = a.id
      WHERE ra.game_id = ${gameId}
      ORDER BY ra.changed_at DESC
    `;
  } else if (athleteId) {
    audit = await sql`
      SELECT 
        ra.id,
        ra.race_result_id,
        ra.game_id,
        ra.athlete_id,
        ra.record_type,
        ra.status_before,
        ra.status_after,
        ra.points_delta,
        ra.changed_by,
        ra.changed_at,
        ra.notes,
        a.name as athlete_name
      FROM records_audit ra
      JOIN athletes a ON ra.athlete_id = a.id
      WHERE ra.athlete_id = ${athleteId}
      ORDER BY ra.changed_at DESC
    `;
  } else {
    audit = await sql`
      SELECT 
        ra.id,
        ra.race_result_id,
        ra.game_id,
        ra.athlete_id,
        ra.record_type,
        ra.status_before,
        ra.status_after,
        ra.points_delta,
        ra.changed_by,
        ra.changed_at,
        ra.notes,
        a.name as athlete_name
      FROM records_audit ra
      JOIN athletes a ON ra.athlete_id = a.id
      ORDER BY ra.changed_at DESC
      LIMIT 100
    `;
  }
  
  return audit;
}

// ============================================================================
// USER ACCOUNTS (Migration 003)
// ============================================================================

/**
 * Get user by email
 * @param {string} email - User email address
 * @returns {Promise<Object|null>} User object or null if not found
 */
export async function getUserByEmail(email) {
  const [user] = await sql`
    SELECT 
      id,
      email,
      phone_number as "phoneNumber",
      display_name as "displayName",
      totp_enabled as "totpEnabled",
      totp_verified_at as "totpVerifiedAt",
      is_active as "isActive",
      is_admin as "isAdmin",
      is_staff as "isStaff",
      email_verified as "emailVerified",
      email_verified_at as "emailVerifiedAt",
      phone_verified as "phoneVerified",
      phone_verified_at as "phoneVerifiedAt",
      created_at as "createdAt",
      updated_at as "updatedAt",
      last_login as "lastLogin"
    FROM users
    WHERE email = ${email} 
      AND deleted_at IS NULL
  `;
  return user || null;
}

/**
 * Get user by ID
 * @param {number} userId - User ID
 * @returns {Promise<Object|null>} User object or null if not found
 */
export async function getUserById(userId) {
  const [user] = await sql`
    SELECT 
      id,
      email,
      phone_number as "phoneNumber",
      display_name as "displayName",
      totp_enabled as "totpEnabled",
      totp_verified_at as "totpVerifiedAt",
      is_active as "isActive",
      is_admin as "isAdmin",
      is_staff as "isStaff",
      email_verified as "emailVerified",
      email_verified_at as "emailVerifiedAt",
      phone_verified as "phoneVerified",
      phone_verified_at as "phoneVerifiedAt",
      created_at as "createdAt",
      updated_at as "updatedAt",
      last_login as "lastLogin"
    FROM users
    WHERE id = ${userId}
      AND deleted_at IS NULL
  `;
  return user || null;
}

/**
 * Get user by phone number
 * @param {string} phoneNumber - User phone number (E.164 format)
 * @returns {Promise<Object|null>} User object or null if not found
 */
export async function getUserByPhone(phoneNumber) {
  const [user] = await sql`
    SELECT 
      id,
      email,
      phone_number as "phoneNumber",
      display_name as "displayName",
      totp_enabled as "totpEnabled",
      is_active as "isActive",
      is_admin as "isAdmin",
      email_verified as "emailVerified",
      phone_verified as "phoneVerified",
      created_at as "createdAt",
      last_login as "lastLogin"
    FROM users
    WHERE phone_number = ${phoneNumber}
      AND deleted_at IS NULL
  `;
  return user || null;
}

/**
 * Create a new user account
 * @param {Object} userData - User data
 * @returns {Promise<Object>} Created user object
 */
export async function createUser(userData) {
  const {
    email,
    phoneNumber = null,
    displayName = null,
    isAdmin = false,
    isStaff = false
  } = userData;

  const [user] = await sql`
    INSERT INTO users (
      email,
      phone_number,
      display_name,
      is_admin,
      is_staff,
      is_active
    ) VALUES (
      ${email},
      ${phoneNumber},
      ${displayName},
      ${isAdmin},
      ${isStaff},
      TRUE
    )
    RETURNING 
      id,
      email,
      phone_number as "phoneNumber",
      display_name as "displayName",
      is_active as "isActive",
      is_admin as "isAdmin",
      is_staff as "isStaff",
      created_at as "createdAt"
  `;

  // Create default user profile
  await sql`
    INSERT INTO user_profiles (user_id)
    VALUES (${user.id})
  `;

  return user;
}

/**
 * Update user information
 * @param {number} userId - User ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated user object
 */
export async function updateUser(userId, updates) {
  const {
    displayName,
    phoneNumber,
    totpSecret,
    totpEnabled,
    emailVerified,
    phoneVerified
  } = updates;

  // Build update query
  if (displayName !== undefined) {
    await sql`UPDATE users SET display_name = ${displayName}, updated_at = CURRENT_TIMESTAMP WHERE id = ${userId}`;
  }
  if (phoneNumber !== undefined) {
    await sql`UPDATE users SET phone_number = ${phoneNumber}, updated_at = CURRENT_TIMESTAMP WHERE id = ${userId}`;
  }
  if (totpSecret !== undefined) {
    await sql`UPDATE users SET totp_secret = ${totpSecret}, updated_at = CURRENT_TIMESTAMP WHERE id = ${userId}`;
  }
  if (totpEnabled !== undefined) {
    const verifiedAt = totpEnabled ? new Date() : null;
    await sql`
      UPDATE users 
      SET totp_enabled = ${totpEnabled}, 
          totp_verified_at = ${verifiedAt},
          updated_at = CURRENT_TIMESTAMP 
      WHERE id = ${userId}
    `;
  }
  if (emailVerified !== undefined) {
    const verifiedAt = emailVerified ? new Date() : null;
    await sql`
      UPDATE users 
      SET email_verified = ${emailVerified},
          email_verified_at = ${verifiedAt},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${userId}
    `;
  }
  if (phoneVerified !== undefined) {
    const verifiedAt = phoneVerified ? new Date() : null;
    await sql`
      UPDATE users 
      SET phone_verified = ${phoneVerified},
          phone_verified_at = ${verifiedAt},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${userId}
    `;
  }

  return await getUserById(userId);
}

/**
 * Record user login
 * @param {number} userId - User ID
 * @returns {Promise<void>}
 */
export async function recordUserLogin(userId) {
  await sql`
    UPDATE users
    SET last_login = CURRENT_TIMESTAMP
    WHERE id = ${userId}
  `;
}

// ============================================================================
// ONE-TIME PASSWORDS
// ============================================================================

/**
 * Create OTP for user
 * @param {number} userId - User ID
 * @param {string} otpCode - 6-digit OTP code
 * @param {string} deliveryMethod - 'sms' or 'email'
 * @param {number} expiryMinutes - Minutes until expiration (default: 5)
 * @returns {Promise<Object>} Created OTP object
 */
export async function createOTP(userId, otpCode, deliveryMethod, expiryMinutes = 5) {
  const [otp] = await sql`
    INSERT INTO one_time_passwords (
      user_id,
      otp_code,
      delivery_method,
      expires_at
    ) VALUES (
      ${userId},
      ${otpCode},
      ${deliveryMethod},
      CURRENT_TIMESTAMP + INTERVAL '${expiryMinutes} minutes'
    )
    RETURNING 
      id,
      user_id as "userId",
      otp_code as "otpCode",
      delivery_method as "deliveryMethod",
      expires_at as "expiresAt",
      created_at as "createdAt"
  `;
  return otp;
}

/**
 * Verify OTP code
 * @param {number} userId - User ID
 * @param {string} otpCode - OTP code to verify
 * @param {string} deliveryMethod - 'sms' or 'email'
 * @returns {Promise<boolean>} True if valid, false otherwise
 */
export async function verifyOTP(userId, otpCode, deliveryMethod) {
  const [otp] = await sql`
    SELECT id, expires_at, used
    FROM one_time_passwords
    WHERE user_id = ${userId}
      AND otp_code = ${otpCode}
      AND delivery_method = ${deliveryMethod}
      AND used = FALSE
      AND expires_at > CURRENT_TIMESTAMP
    ORDER BY created_at DESC
    LIMIT 1
  `;

  if (!otp) {
    return false;
  }

  // Mark as used
  await sql`
    UPDATE one_time_passwords
    SET used = TRUE, used_at = CURRENT_TIMESTAMP
    WHERE id = ${otp.id}
  `;

  return true;
}

// ============================================================================
// MAGIC LINKS
// ============================================================================

/**
 * Create magic link for user
 * @param {number} userId - User ID
 * @param {string} token - Secure random token
 * @param {string} purpose - 'login', 'verify_email', 'reset_totp', 'invite'
 * @param {number} expiryMinutes - Minutes until expiration (default: 15)
 * @param {Object} metadata - Optional metadata
 * @returns {Promise<Object>} Created magic link object
 */
export async function createMagicLink(userId, token, purpose, expiryMinutes = 15, metadata = null) {
  const [link] = await sql`
    INSERT INTO magic_links (
      user_id,
      token,
      purpose,
      expires_at,
      metadata
    ) VALUES (
      ${userId},
      ${token},
      ${purpose},
      CURRENT_TIMESTAMP + INTERVAL '${expiryMinutes} minutes',
      ${metadata ? JSON.stringify(metadata) : null}
    )
    RETURNING 
      id,
      user_id as "userId",
      token,
      purpose,
      expires_at as "expiresAt",
      metadata,
      created_at as "createdAt"
  `;
  return link;
}

/**
 * Verify and consume magic link
 * @param {string} token - Magic link token
 * @returns {Promise<Object|null>} Magic link object if valid, null otherwise
 */
export async function verifyMagicLink(token) {
  const [link] = await sql`
    SELECT 
      id,
      user_id as "userId",
      token,
      purpose,
      metadata,
      expires_at as "expiresAt",
      used,
      created_at as "createdAt"
    FROM magic_links
    WHERE token = ${token}
      AND used = FALSE
      AND expires_at > CURRENT_TIMESTAMP
  `;

  if (!link) {
    return null;
  }

  // Mark as used
  await sql`
    UPDATE magic_links
    SET used = TRUE, used_at = CURRENT_TIMESTAMP
    WHERE id = ${link.id}
  `;

  return link;
}

// ============================================================================
// USER SESSIONS
// ============================================================================

/**
 * Create user session
 * @param {number} userId - User ID
 * @param {string} sessionToken - Secure session token
 * @param {number} expiryDays - Days until expiration (default: 30)
 * @returns {Promise<Object>} Created session object
 */
export async function createSession(userId, sessionToken, expiryDays = 30) {
  const [session] = await sql`
    INSERT INTO user_sessions (
      user_id,
      session_token,
      expires_at
    ) VALUES (
      ${userId},
      ${sessionToken},
      CURRENT_TIMESTAMP + INTERVAL '${expiryDays} days'
    )
    RETURNING 
      id,
      user_id as "userId",
      session_token as "sessionToken",
      expires_at as "expiresAt",
      created_at as "createdAt"
  `;
  return session;
}

/**
 * Verify session token
 * @param {string} sessionToken - Session token to verify
 * @returns {Promise<Object|null>} Session with user info if valid, null otherwise
 */
export async function verifySession(sessionToken) {
  const [session] = await sql`
    SELECT 
      s.id,
      s.user_id as "userId",
      s.session_token as "sessionToken",
      s.expires_at as "expiresAt",
      s.last_activity as "lastActivity",
      u.email,
      u.display_name as "displayName",
      u.is_active as "isActive"
    FROM user_sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.session_token = ${sessionToken}
      AND s.revoked = FALSE
      AND s.expires_at > CURRENT_TIMESTAMP
      AND u.deleted_at IS NULL
  `;

  if (!session) {
    return null;
  }

  // Update last activity
  await sql`
    UPDATE user_sessions
    SET last_activity = CURRENT_TIMESTAMP
    WHERE id = ${session.id}
  `;

  return session;
}

/**
 * Revoke session
 * @param {string} sessionToken - Session token to revoke
 * @returns {Promise<void>}
 */
export async function revokeSession(sessionToken) {
  await sql`
    UPDATE user_sessions
    SET revoked = TRUE, revoked_at = CURRENT_TIMESTAMP
    WHERE session_token = ${sessionToken}
  `;
}

/**
 * Revoke all sessions for user
 * @param {number} userId - User ID
 * @returns {Promise<void>}
 */
export async function revokeAllUserSessions(userId) {
  await sql`
    UPDATE user_sessions
    SET revoked = TRUE, revoked_at = CURRENT_TIMESTAMP
    WHERE user_id = ${userId}
      AND revoked = FALSE
  `;
}

// ============================================================================
// USER PROFILES
// ============================================================================

/**
 * Get user profile
 * @param {number} userId - User ID
 * @returns {Promise<Object|null>} User profile or null
 */
export async function getUserProfile(userId) {
  const [profile] = await sql`
    SELECT 
      id,
      user_id as "userId",
      avatar_url as "avatarUrl",
      bio,
      location,
      timezone,
      preferred_auth_method as "preferredAuthMethod",
      notification_preferences as "notificationPreferences",
      created_at as "createdAt",
      updated_at as "updatedAt"
    FROM user_profiles
    WHERE user_id = ${userId}
  `;
  return profile || null;
}

/**
 * Update user profile
 * @param {number} userId - User ID
 * @param {Object} updates - Profile fields to update
 * @returns {Promise<Object>} Updated profile
 */
export async function updateUserProfile(userId, updates) {
  const {
    avatarUrl,
    bio,
    location,
    timezone,
    preferredAuthMethod,
    notificationPreferences
  } = updates;

  if (avatarUrl !== undefined) {
    await sql`UPDATE user_profiles SET avatar_url = ${avatarUrl}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ${userId}`;
  }
  if (bio !== undefined) {
    await sql`UPDATE user_profiles SET bio = ${bio}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ${userId}`;
  }
  if (location !== undefined) {
    await sql`UPDATE user_profiles SET location = ${location}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ${userId}`;
  }
  if (timezone !== undefined) {
    await sql`UPDATE user_profiles SET timezone = ${timezone}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ${userId}`;
  }
  if (preferredAuthMethod !== undefined) {
    await sql`UPDATE user_profiles SET preferred_auth_method = ${preferredAuthMethod}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ${userId}`;
  }
  if (notificationPreferences !== undefined) {
    await sql`UPDATE user_profiles SET notification_preferences = ${JSON.stringify(notificationPreferences)}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ${userId}`;
  }

  return await getUserProfile(userId);
}

// ============================================================================
// USER GAMES (League Membership)
// ============================================================================

/**
 * Get user's game memberships
 * @param {number} userId - User ID
 * @returns {Promise<Array>} Array of game memberships
 */
export async function getUserGames(userId) {
  const memberships = await sql`
    SELECT 
      ug.id,
      ug.user_id as "userId",
      ug.game_id as "gameId",
      ug.role,
      ug.player_code as "playerCode",
      ug.team_name as "teamName",
      ug.team_sponsor as "teamSponsor",
      ug.owner_name as "ownerName",
      ug.status,
      ug.invited_by as "invitedBy",
      ug.invited_at as "invitedAt",
      ug.joined_at as "joinedAt",
      g.draft_complete as "draftComplete",
      g.results_finalized as "resultsFinalized"
    FROM user_games ug
    JOIN games g ON ug.game_id = g.game_id
    WHERE ug.user_id = ${userId}
    ORDER BY ug.joined_at DESC
  `;
  return memberships;
}

/**
 * Get game members
 * @param {string} gameId - Game ID
 * @returns {Promise<Array>} Array of game members
 */
export async function getGameMembers(gameId) {
  const members = await sql`
    SELECT 
      ug.id,
      ug.user_id as "userId",
      ug.role,
      ug.player_code as "playerCode",
      ug.team_name as "teamName",
      ug.team_sponsor as "teamSponsor",
      ug.owner_name as "ownerName",
      ug.status,
      ug.joined_at as "joinedAt",
      u.email,
      u.display_name as "displayName"
    FROM user_games ug
    JOIN users u ON ug.user_id = u.id
    WHERE ug.game_id = ${gameId}
      AND u.deleted_at IS NULL
    ORDER BY 
      CASE ug.role WHEN 'commissioner' THEN 1 WHEN 'player' THEN 2 ELSE 3 END,
      ug.joined_at
  `;
  return members;
}

/**
 * Add user to game
 * @param {number} userId - User ID
 * @param {string} gameId - Game ID
 * @param {string} role - 'commissioner', 'player', or 'spectator'
 * @param {Object} options - Additional options (playerCode, teamName, etc.)
 * @returns {Promise<Object>} Created membership
 */
export async function addUserToGame(userId, gameId, role, options = {}) {
  const {
    playerCode = null,
    teamName = null,
    teamSponsor = null,
    ownerName = null,
    status = 'active',
    invitedBy = null
  } = options;

  const [membership] = await sql`
    INSERT INTO user_games (
      user_id,
      game_id,
      role,
      player_code,
      team_name,
      team_sponsor,
      owner_name,
      status,
      invited_by
    ) VALUES (
      ${userId},
      ${gameId},
      ${role},
      ${playerCode},
      ${teamName},
      ${teamSponsor},
      ${ownerName},
      ${status},
      ${invitedBy}
    )
    RETURNING 
      id,
      user_id as "userId",
      game_id as "gameId",
      role,
      player_code as "playerCode",
      team_name as "teamName",
      team_sponsor as "teamSponsor",
      owner_name as "ownerName",
      status,
      joined_at as "joinedAt"
  `;
  return membership;
}

/**
 * Update user's game membership
 * @param {number} membershipId - Membership ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<void>}
 */
export async function updateUserGameMembership(membershipId, updates) {
  const {
    teamName,
    teamSponsor,
    ownerName,
    status
  } = updates;

  if (teamName !== undefined) {
    await sql`UPDATE user_games SET team_name = ${teamName}, updated_at = CURRENT_TIMESTAMP WHERE id = ${membershipId}`;
  }
  if (teamSponsor !== undefined) {
    await sql`UPDATE user_games SET team_sponsor = ${teamSponsor}, updated_at = CURRENT_TIMESTAMP WHERE id = ${membershipId}`;
  }
  if (ownerName !== undefined) {
    await sql`UPDATE user_games SET owner_name = ${ownerName}, updated_at = CURRENT_TIMESTAMP WHERE id = ${membershipId}`;
  }
  if (status !== undefined) {
    await sql`UPDATE user_games SET status = ${status}, updated_at = CURRENT_TIMESTAMP WHERE id = ${membershipId}`;
  }
}

// ============================================================================
// INVITE CODES
// ============================================================================

/**
 * Create invite code
 * @param {Object} codeData - Invite code data
 * @returns {Promise<Object>} Created invite code
 */
export async function createInviteCode(codeData) {
  const {
    code,
    codeType = 'admin',
    maxUses = 1,
    createdBy,
    expiryDays = null,
    metadata = null
  } = codeData;

  const expiresAt = expiryDays 
    ? new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000)
    : null;

  const [inviteCode] = await sql`
    INSERT INTO invite_codes (
      code,
      code_type,
      max_uses,
      created_by,
      expires_at,
      metadata
    ) VALUES (
      ${code},
      ${codeType},
      ${maxUses},
      ${createdBy},
      ${expiresAt},
      ${metadata ? JSON.stringify(metadata) : null}
    )
    RETURNING 
      id,
      code,
      code_type as "codeType",
      max_uses as "maxUses",
      current_uses as "currentUses",
      created_by as "createdBy",
      expires_at as "expiresAt",
      is_active as "isActive",
      created_at as "createdAt"
  `;
  return inviteCode;
}

/**
 * Verify and consume invite code
 * @param {string} code - Invite code to verify
 * @param {number} userId - User ID consuming the code
 * @returns {Promise<Object|null>} Invite code object if valid, null otherwise
 */
export async function verifyInviteCode(code, userId) {
  const [inviteCode] = await sql`
    SELECT 
      id,
      code,
      code_type as "codeType",
      max_uses as "maxUses",
      current_uses as "currentUses",
      metadata
    FROM invite_codes
    WHERE code = ${code}
      AND is_active = TRUE
      AND current_uses < max_uses
      AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
  `;

  if (!inviteCode) {
    return null;
  }

  // Record usage
  await sql`
    INSERT INTO invite_code_usage (invite_code_id, user_id)
    VALUES (${inviteCode.id}, ${userId})
    ON CONFLICT (invite_code_id, user_id) DO NOTHING
  `;

  // Increment usage counter
  await sql`
    UPDATE invite_codes
    SET current_uses = current_uses + 1
    WHERE id = ${inviteCode.id}
  `;

  return inviteCode;
}

// ============================================================================
// AUDIT LOG
// ============================================================================

/**
 * Log user action to audit trail
 * @param {Object} auditData - Audit log data
 * @returns {Promise<void>}
 */
export async function logAudit(auditData) {
  const {
    userId = null,
    action,
    resourceType = null,
    resourceId = null,
    details = null,
    ipAddress = null,
    userAgent = null
  } = auditData;

  await sql`
    INSERT INTO audit_log (
      user_id,
      action,
      resource_type,
      resource_id,
      details,
      ip_address,
      user_agent
    ) VALUES (
      ${userId},
      ${action},
      ${resourceType},
      ${resourceId},
      ${details ? JSON.stringify(details) : null},
      ${ipAddress},
      ${userAgent}
    )
  `;
}

// ============================================================================
// ANONYMOUS SESSIONS
// ============================================================================

/**
 * Verify an anonymous session token
 * @param {string} sessionToken - The session token to verify
 * @returns {Promise<Object|null>} Session details if valid, null otherwise
 */
export async function verifyAnonymousSession(sessionToken) {
  if (!sessionToken) {
    return null;
  }
  
  const result = await sql`
    SELECT * FROM verify_anonymous_session(${sessionToken})
  `;
  
  if (!result || result.length === 0) {
    return null;
  }
  
  const session = result[0];
  
  // Return null if session is invalid
  if (!session.is_valid) {
    return null;
  }
  
  return {
    id: session.session_id,
    type: session.session_type,
    gameId: session.game_id,
    playerCode: session.player_code,
    displayName: session.display_name,
    expiresAt: session.expires_at,
    daysUntilExpiry: session.days_until_expiry
  };
}

/**
 * Get game state with anonymous session validation
 * @param {string} gameId - The game ID
 * @param {string} sessionToken - Optional anonymous session token
 * @returns {Promise<Object|null>} Game state if accessible, null otherwise
 */
export async function getGameStateWithSession(gameId, sessionToken = null) {
  // Get base game state
  const gameState = await getGameState(gameId);
  
  if (!gameState) {
    return null;
  }
  
  // If no session token provided, return game state (backward compatibility)
  if (!sessionToken) {
    return gameState;
  }
  
  // Verify session has access to this game
  const session = await verifyAnonymousSession(sessionToken);
  
  if (!session) {
    return null;
  }
  
  // Check if session is associated with this game
  if (session.gameId && session.gameId !== gameId) {
    return null;
  }
  
  return {
    ...gameState,
    sessionType: session.type,
    sessionDisplayName: session.displayName
  };
}

/**
 * Check if a session token has commissioner access to a game
 * @param {string} gameId - The game ID
 * @param {string} sessionToken - The session token
 * @returns {Promise<boolean>} True if session has commissioner access
 */
export async function hasCommissionerAccess(gameId, sessionToken) {
  if (!sessionToken) {
    return false;
  }
  
  // Verify session
  const session = await verifyAnonymousSession(sessionToken);
  
  if (!session) {
    return false;
  }
  
  // Check if session type is commissioner
  if (session.type !== 'commissioner') {
    return false;
  }
  
  // Check if session is associated with this game
  if (session.gameId && session.gameId !== gameId) {
    return false;
  }
  
  // Check if game has this session token as commissioner
  const [game] = await sql`
    SELECT anonymous_session_token
    FROM games
    WHERE game_id = ${gameId}
      AND (anonymous_session_token = ${sessionToken} OR anonymous_session_token IS NULL)
  `;
  
  if (!game) {
    return false;
  }
  
  // If game doesn't have a session token yet, allow this commissioner session to claim it
  if (!game.anonymous_session_token) {
    await sql`
      UPDATE games
      SET anonymous_session_token = ${sessionToken},
          allow_anonymous_access = true,
          anonymous_access_enabled_at = CURRENT_TIMESTAMP
      WHERE game_id = ${gameId}
    `;
    return true;
  }
  
  return game.anonymous_session_token === sessionToken;
}

/**
 * Check if a session token has player access to a game
 * @param {string} gameId - The game ID
 * @param {string} playerCode - The player code
 * @param {string} sessionToken - The session token
 * @returns {Promise<boolean>} True if session has player access
 */
export async function hasPlayerAccess(gameId, playerCode, sessionToken) {
  if (!sessionToken || !playerCode) {
    return false;
  }
  
  // Verify session
  const session = await verifyAnonymousSession(sessionToken);
  
  if (!session) {
    return false;
  }
  
  // Check if session is associated with this game and player code
  const [sessionRecord] = await sql`
    SELECT id, game_id, player_code
    FROM anonymous_sessions
    WHERE session_token = ${sessionToken}
      AND is_active = true
      AND (game_id = ${gameId} OR game_id IS NULL)
      AND (player_code = ${playerCode} OR player_code IS NULL)
  `;
  
  if (!sessionRecord) {
    return false;
  }
  
  // Update session with game and player code if not set
  if (!sessionRecord.game_id || !sessionRecord.player_code) {
    await sql`
      UPDATE anonymous_sessions
      SET game_id = ${gameId},
          player_code = ${playerCode}
      WHERE session_token = ${sessionToken}
    `;
  }
  
  return true;
}

