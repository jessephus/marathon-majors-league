/**
 * Scoring Engine - Points-Based Scoring System (Version 2)
 * 
 * This module implements the comprehensive scoring algorithm including:
 * - Placement points (top 10)
 * - Time gap window points
 * - Performance bonuses (negative split, even pace, fast finish)
 * - Record bonuses (world record, course record)
 * - Breakdown JSON generation
 */

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

// ============================================================================
// SCORING RULES MANAGEMENT
// ============================================================================

/**
 * Get scoring rules by version
 */
export async function getScoringRules(version = 2) {
  const [rules] = await sql`
    SELECT id, version, rules, created_at, created_by, description
    FROM scoring_rules
    WHERE version = ${version}
  `;
  
  if (!rules) {
    throw new Error(`Scoring rules version ${version} not found`);
  }
  
  return rules;
}

/**
 * Get the latest scoring rules version
 */
export async function getLatestScoringRules() {
  const [rules] = await sql`
    SELECT id, version, rules, created_at, created_by, description
    FROM scoring_rules
    ORDER BY version DESC
    LIMIT 1
  `;
  
  return rules;
}

// ============================================================================
// PLACEMENT CALCULATION
// ============================================================================

/**
 * Assign placements with tie handling (standard competition ranking)
 * If two tie for 2nd, both get 2nd place, next is 4th
 * Placements are assigned separately per gender
 */
function assignPlacements(results) {
  // Separate results by gender
  const menResults = results.filter(r => r.gender === 'men');
  const womenResults = results.filter(r => r.gender === 'women');
  
  // Assign placements for men
  const rankedMen = assignPlacementsByGender(menResults);
  
  // Assign placements for women
  const rankedWomen = assignPlacementsByGender(womenResults);
  
  // Combine and return
  return [...rankedMen, ...rankedWomen];
}

/**
 * Helper function to assign placements within a single gender
 */
function assignPlacementsByGender(results) {
  // Sort by finish_time_ms ascending (fastest first)
  const sorted = [...results].sort((a, b) => {
    if (a.finish_time_ms === null) return 1;
    if (b.finish_time_ms === null) return -1;
    return a.finish_time_ms - b.finish_time_ms;
  });
  
  let currentPlace = 1;
  let prevTime = null;
  let tieCount = 0;
  
  sorted.forEach((result, index) => {
    if (result.finish_time_ms === null) {
      result.placement = null;
    } else if (prevTime !== null && result.finish_time_ms === prevTime) {
      // Tie - same placement as previous
      result.placement = currentPlace;
      tieCount++;
    } else {
      // New placement
      currentPlace = index + 1;
      result.placement = currentPlace;
      tieCount = 0;
      prevTime = result.finish_time_ms;
    }
  });
  
  return sorted;
}

/**
 * Calculate placement points based on position
 */
function calculatePlacementPoints(placement, rules) {
  if (!placement || placement > rules.max_scored_place) {
    return 0;
  }
  
  const pointsArray = rules.placement_points;
  return pointsArray[placement - 1] || 0;
}

// ============================================================================
// TIME GAP CALCULATION
// ============================================================================

/**
 * Calculate time gap points based on windows
 */
function calculateTimeGapPoints(gapSeconds, windows) {
  // Find first matching window (ascending order)
  for (const window of windows) {
    if (gapSeconds <= window.max_gap_seconds) {
      return window.points;
    }
  }
  return 0;
}

// ============================================================================
// PERFORMANCE BONUSES
// ============================================================================

/**
 * Check for negative split bonus
 */
function checkNegativeSplit(firstHalfMs, secondHalfMs, rules) {
  const bonus = rules.performance_bonuses.NegativeSplit;
  
  if (!bonus.enabled || !firstHalfMs || !secondHalfMs) {
    return null;
  }
  
  if (secondHalfMs < firstHalfMs) {
    return {
      type: 'NEGATIVE_SPLIT',
      points: bonus.points,
      details: {
        first_half_ms: firstHalfMs,
        second_half_ms: secondHalfMs,
        diff_ms: firstHalfMs - secondHalfMs
      }
    };
  }
  
  return null;
}

/**
 * Check for even pace bonus
 */
function checkEvenPace(firstHalfMs, secondHalfMs, totalTimeMs, rules) {
  const bonus = rules.performance_bonuses.EvenPace;
  
  if (!bonus.enabled || !firstHalfMs || !secondHalfMs) {
    return null;
  }
  
  const diff = Math.abs(secondHalfMs - firstHalfMs);
  const tolerance = totalTimeMs * bonus.tolerance_ratio;
  
  if (diff <= tolerance) {
    return {
      type: 'EVEN_PACE',
      points: bonus.points,
      details: {
        first_half_ms: firstHalfMs,
        second_half_ms: secondHalfMs,
        diff_ms: diff,
        tolerance_ms: Math.floor(tolerance)
      }
    };
  }
  
  return null;
}

/**
 * Check for fast finish kick bonus
 */
function checkFastFinishKick(last5kMs, totalTimeMs, raceDistanceMeters, rules) {
  const bonus = rules.performance_bonuses.FastFinishKick;
  
  if (!bonus.enabled || !last5kMs || raceDistanceMeters < 10000) {
    return null;
  }
  
  const avgPaceMsPerMeter = totalTimeMs / raceDistanceMeters;
  const last5kPaceMsPerMeter = last5kMs / 5000;
  const thresholdPace = avgPaceMsPerMeter * (1 - bonus.pace_improvement_ratio);
  
  if (last5kPaceMsPerMeter <= thresholdPace) {
    return {
      type: 'FAST_FINISH_KICK',
      points: bonus.points,
      details: {
        last_5k_ms: last5kMs,
        avg_pace_ms_per_m: avgPaceMsPerMeter,
        last_5k_pace_ms_per_m: last5kPaceMsPerMeter,
        threshold_pace_ms_per_m: thresholdPace
      }
    };
  }
  
  return null;
}

/**
 * Apply bonus exclusions
 */
function applyBonusExclusions(bonuses, exclusions) {
  if (!exclusions || Object.keys(exclusions).length === 0) {
    return bonuses;
  }
  
  // Build a map of bonus types
  const bonusMap = new Map();
  bonuses.forEach(bonus => {
    bonusMap.set(bonus.type, bonus);
  });
  
  // Apply exclusions
  const filtered = [];
  const excluded = new Set();
  
  bonuses.forEach(bonus => {
    if (excluded.has(bonus.type)) {
      return;
    }
    
    // Check if this bonus excludes others
    const excludeList = exclusions[bonus.type] || [];
    excludeList.forEach(excludedType => {
      if (bonusMap.has(excludedType)) {
        // Keep the higher value
        const otherBonus = bonusMap.get(excludedType);
        if (otherBonus.points > bonus.points) {
          excluded.add(bonus.type);
        } else {
          excluded.add(excludedType);
        }
      }
    });
    
    if (!excluded.has(bonus.type)) {
      filtered.push(bonus);
    }
  });
  
  return filtered;
}

/**
 * Calculate all performance bonuses for a result
 */
function calculatePerformanceBonuses(result, raceDistanceMeters, rules) {
  const bonuses = [];
  
  // Check negative split
  const negativeSplit = checkNegativeSplit(
    result.first_half_time_ms,
    result.second_half_time_ms,
    rules
  );
  if (negativeSplit) bonuses.push(negativeSplit);
  
  // Check even pace
  const evenPace = checkEvenPace(
    result.first_half_time_ms,
    result.second_half_time_ms,
    result.finish_time_ms,
    rules
  );
  if (evenPace) bonuses.push(evenPace);
  
  // Check fast finish kick
  const fastFinish = checkFastFinishKick(
    result.last_5k_time_ms,
    result.finish_time_ms,
    raceDistanceMeters,
    rules
  );
  if (fastFinish) bonuses.push(fastFinish);
  
  // Apply exclusions
  return applyBonusExclusions(bonuses, rules.bonus_exclusions);
}

// ============================================================================
// RECORD DETECTION & BONUSES
// ============================================================================

/**
 * Get race records for comparison
 */
async function getRaceRecords(raceId, gender) {
  const records = await sql`
    SELECT record_type, time_ms, athlete_name, set_date, verified
    FROM race_records
    WHERE race_id = ${raceId} AND gender = ${gender}
  `;
  
  const recordMap = {};
  records.forEach(record => {
    recordMap[record.record_type] = record;
  });
  
  return recordMap;
}

/**
 * Detect if result sets a record
 */
async function detectRecords(result, raceId, athleteGender) {
  if (!result.finish_time_ms) {
    return { type: 'NONE', list: [] };
  }
  
  const records = await getRaceRecords(raceId, athleteGender);
  const detectedRecords = [];
  
  // Check world record
  if (records.WORLD && result.finish_time_ms < records.WORLD.time_ms) {
    detectedRecords.push('WORLD');
  }
  
  // Check course record
  if (records.COURSE && result.finish_time_ms < records.COURSE.time_ms) {
    detectedRecords.push('COURSE');
  }
  
  if (detectedRecords.length === 0) {
    return { type: 'NONE', list: [] };
  } else if (detectedRecords.length === 1) {
    return { type: detectedRecords[0], list: detectedRecords };
  } else {
    return { type: 'BOTH', list: detectedRecords };
  }
}

/**
 * Calculate record bonus points
 */
function calculateRecordBonus(recordMeta, rules) {
  if (recordMeta.type === 'NONE') {
    return { bonuses: [], totalPoints: 0 };
  }
  
  const requiresConfirmation = rules.record_requires_confirmation;
  const provisionalPolicy = rules.record_provisional_points_policy;
  const mutuallyExclusive = rules.record_bonuses_mutually_exclusive;
  const precedence = rules.record_bonus_precedence;
  
  // Determine status
  const status = requiresConfirmation ? 'provisional' : 'confirmed';
  
  // Determine if points should be awarded now
  const awardNow = (status === 'confirmed') || 
                   (status === 'provisional' && provisionalPolicy === 'provisional');
  
  // Determine which records to apply
  let recordsToApply = recordMeta.list;
  
  if (mutuallyExclusive && recordMeta.list.length > 1) {
    // Apply highest precedence only
    const highestPrecedence = precedence.find(r => recordMeta.list.includes(r));
    recordsToApply = [highestPrecedence];
  }
  
  // Calculate points
  const bonuses = [];
  let totalPoints = 0;
  
  recordsToApply.forEach(recordType => {
    const bonusConfig = recordType === 'WORLD' 
      ? rules.record_bonuses.WorldRecord 
      : rules.record_bonuses.CourseRecord;
    
    const points = awardNow ? bonusConfig.points : 0;
    totalPoints += points;
    
    bonuses.push({
      type: recordType === 'WORLD' ? 'WORLD_RECORD' : 'COURSE_RECORD',
      status: status,
      points: points,
      actual_points: bonusConfig.points // Store actual value for later confirmation
    });
  });
  
  return { bonuses, totalPoints, status };
}

// ============================================================================
// MAIN SCORING ALGORITHM
// ============================================================================

/**
 * Score a single race for a game
 */
export async function scoreRace(gameId, raceId, rulesVersion = 2) {
  // Get scoring rules
  const rulesData = await getScoringRules(rulesVersion);
  const rules = rulesData.rules;
  
  // Get race distance (marathon = 42195 meters)
  const [race] = await sql`
    SELECT id, name, distance
    FROM races
    WHERE id = ${raceId}
  `;
  
  if (!race) {
    throw new Error(`Race ${raceId} not found`);
  }
  
  const raceDistanceMeters = 42195; // Marathon distance
  
  // Get all results for this game
  const results = await sql`
    SELECT 
      rr.id,
      rr.game_id,
      rr.athlete_id,
      rr.finish_time,
      rr.finish_time_ms,
      rr.first_half_time_ms,
      rr.second_half_time_ms,
      rr.last_5k_time_ms,
      rr.split_5k,
      rr.split_10k,
      rr.split_half,
      rr.split_30k,
      rr.split_35k,
      rr.split_40k,
      a.gender,
      a.name as athlete_name
    FROM race_results rr
    JOIN athletes a ON rr.athlete_id = a.id
    WHERE rr.game_id = ${gameId}
      AND rr.finish_time IS NOT NULL
  `;
  
  if (results.length === 0) {
    return { message: 'No results to score', scored: 0 };
  }
  
  // Convert finish times to milliseconds if not already done
  results.forEach(result => {
    if (!result.finish_time_ms && result.finish_time) {
      result.finish_time_ms = timeStringToMs(result.finish_time);
    }
  });
  
  // Step 1: Assign placements with tie handling (separated by gender)
  const rankedResults = assignPlacements(results);
  
  // Step 2: Get winner times per gender for gap calculation
  const menResults = rankedResults.filter(r => r.gender === 'men' && r.finish_time_ms);
  const womenResults = rankedResults.filter(r => r.gender === 'women' && r.finish_time_ms);
  
  const menWinnerTime = menResults.length > 0 ? menResults[0].finish_time_ms : null;
  const womenWinnerTime = womenResults.length > 0 ? womenResults[0].finish_time_ms : null;
  
  if (!menWinnerTime && !womenWinnerTime) {
    throw new Error('No valid winner times found');
  }
  
  // Step 3: Calculate points for each result
  const scoredResults = [];
  
  for (const result of rankedResults) {
    // Skip if no finish time
    if (!result.finish_time_ms) {
      continue;
    }
    
    // Get the winner time for this athlete's gender
    const winnerTime = result.gender === 'men' ? menWinnerTime : womenWinnerTime;
    
    if (!winnerTime) {
      console.warn(`No winner time for gender ${result.gender}, skipping athlete ${result.athlete_id}`);
      continue;
    }
    
    // Calculate placement points
    const placementPoints = calculatePlacementPoints(result.placement, rules);
    
    // Calculate time gap (relative to gender winner)
    const gapSeconds = Math.floor((result.finish_time_ms - winnerTime) / 1000);
    const timeGapPoints = calculateTimeGapPoints(gapSeconds, rules.time_gap_windows);
    
    // Calculate performance bonuses
    const performanceBonuses = calculatePerformanceBonuses(
      result,
      raceDistanceMeters,
      rules
    );
    const performanceBonusPoints = performanceBonuses.reduce((sum, b) => sum + b.points, 0);
    
    // Detect and calculate record bonuses
    const recordMeta = await detectRecords(result, raceId, result.gender);
    const recordBonus = calculateRecordBonus(recordMeta, rules);
    
    // Calculate total points
    const totalPoints = placementPoints + timeGapPoints + performanceBonusPoints + recordBonus.totalPoints;
    
    // Build breakdown JSON
    const breakdown = {
      version: rulesVersion,
      placement: {
        position: result.placement,
        points: placementPoints
      },
      time_gap: {
        gap_seconds: gapSeconds,
        points: timeGapPoints,
        window: rules.time_gap_windows.find(w => gapSeconds <= w.max_gap_seconds) || null
      },
      performance_bonuses: performanceBonuses,
      record_bonuses: recordBonus.bonuses,
      total_points: totalPoints
    };
    
    scoredResults.push({
      id: result.id,
      athlete_id: result.athlete_id,
      placement: result.placement,
      placement_points: placementPoints,
      time_gap_seconds: gapSeconds,
      time_gap_points: timeGapPoints,
      performance_bonus_points: performanceBonusPoints,
      record_bonus_points: recordBonus.totalPoints,
      total_points: totalPoints,
      points_version: rulesVersion,
      breakdown: breakdown,
      record_type: recordMeta.type,
      record_status: recordBonus.status || 'none'
    });
  }
  
  // Step 4: Persist all scores
  for (const scored of scoredResults) {
    await sql`
      UPDATE race_results
      SET 
        placement = ${scored.placement},
        placement_points = ${scored.placement_points},
        time_gap_seconds = ${scored.time_gap_seconds},
        time_gap_points = ${scored.time_gap_points},
        performance_bonus_points = ${scored.performance_bonus_points},
        record_bonus_points = ${scored.record_bonus_points},
        total_points = ${scored.total_points},
        points_version = ${scored.points_version},
        breakdown = ${JSON.stringify(scored.breakdown)},
        record_type = ${scored.record_type},
        record_status = ${scored.record_status},
        is_world_record = ${scored.record_type === 'WORLD' || scored.record_type === 'BOTH'},
        is_course_record = ${scored.record_type === 'COURSE' || scored.record_type === 'BOTH'},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${scored.id}
    `;
  }
  
  return {
    message: 'Scoring completed successfully',
    scored: scoredResults.length,
    version: rulesVersion,
    results: scoredResults
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert time string to milliseconds
 */
function timeStringToMs(timeStr) {
  if (!timeStr) return null;
  
  const parts = timeStr.split(':');
  let hours = 0, minutes = 0, seconds = 0;
  
  if (parts.length === 3) {
    // H:MM:SS
    hours = parseInt(parts[0]);
    minutes = parseInt(parts[1]);
    seconds = parseFloat(parts[2]);
  } else if (parts.length === 2) {
    // MM:SS
    minutes = parseInt(parts[0]);
    seconds = parseFloat(parts[1]);
  }
  
  return Math.floor((hours * 3600 + minutes * 60 + seconds) * 1000);
}

/**
 * Convert milliseconds to time string
 */
export function msToTimeString(ms) {
  if (!ms) return null;
  
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(2);
  
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(5, '0')}`;
  } else {
    return `${minutes}:${String(seconds).padStart(5, '0')}`;
  }
}
