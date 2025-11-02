/**
 * Temporary Scoring Module
 * 
 * This module calculates temporary/projected scores based on split times
 * during an in-progress race. It's used to show live leaderboard standings
 * before final results are available.
 */

// Marathon distance constants
const MARATHON_DISTANCE_KM = 42.195;
const SPLIT_DISTANCES = {
  '5k': 5,
  '10k': 10,
  'half': 21.0975,
  '30k': 30,
  '35k': 35,
  '40k': 40
};

/**
 * Convert time string (HH:MM:SS or MM:SS) to milliseconds
 */
function timeStringToMs(timeStr) {
  if (!timeStr) return null;
  
  const normalized = timeStr.trim().toUpperCase();
  
  // Treat special result codes as non-finishers
  if (['DNF', 'DNS', 'DQ', 'NA', 'NONE'].includes(normalized)) {
    return null;
  }
  
  const parts = normalized.split(':');
  
  if (parts.length < 2 || parts.length > 3) {
    return null;
  }
  
  const numericParts = parts.map(part => Number(part));
  
  if (numericParts.some(Number.isNaN)) {
    return null;
  }
  
  let hours = 0;
  let minutes = 0;
  let seconds = 0;
  
  if (numericParts.length === 3) {
    [hours, minutes, seconds] = numericParts;
  } else {
    [minutes, seconds] = numericParts;
  }
  
  return Math.floor((hours * 3600 + minutes * 60 + seconds) * 1000);
}

/**
 * Convert milliseconds to time string (HH:MM:SS or MM:SS)
 */
function msToTimeString(ms) {
  if (!ms) return null;
  
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  } else {
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }
}

/**
 * Find the most recent (furthest) split for an athlete
 * Returns: { splitName: string, splitTime: string, distanceKm: number }
 */
function getMostRecentSplit(result) {
  // Check splits in reverse order (furthest to closest)
  const splitOrder = ['40k', '35k', '30k', 'half', '10k', '5k'];
  
  for (const splitName of splitOrder) {
    const splitField = `split_${splitName}`;
    if (result[splitField]) {
      return {
        splitName,
        splitTime: result[splitField],
        distanceKm: SPLIT_DISTANCES[splitName]
      };
    }
  }
  
  return null;
}

/**
 * Project finish time based on current pace from most recent split
 * Uses simple pace projection with a slight fatigue factor for later splits
 */
function projectFinishTime(splitInfo) {
  const { splitTime, distanceKm } = splitInfo;
  const splitMs = timeStringToMs(splitTime);
  
  if (!splitMs || !distanceKm) {
    return null;
  }
  
  // Calculate current pace (ms per km)
  const currentPace = splitMs / distanceKm;
  
  // Apply fatigue factor based on how far into the race
  // Later splits get higher fatigue factor as runners typically slow down
  const progressRatio = distanceKm / MARATHON_DISTANCE_KM;
  let fatigueFactor = 1.0;
  
  if (progressRatio >= 0.95) {
    // 40k split - very close, minimal adjustment
    fatigueFactor = 1.01;
  } else if (progressRatio >= 0.83) {
    // 35k split - slight slowdown expected
    fatigueFactor = 1.02;
  } else if (progressRatio >= 0.71) {
    // 30k split - more slowdown expected
    fatigueFactor = 1.04;
  } else if (progressRatio >= 0.50) {
    // Half marathon split - significant slowdown expected in second half
    fatigueFactor = 1.06;
  } else {
    // Early splits (5k, 10k) - very rough projection
    fatigueFactor = 1.08;
  }
  
  // Project remaining distance at adjusted pace
  const remainingDistance = MARATHON_DISTANCE_KM - distanceKm;
  const projectedRemainingTime = remainingDistance * currentPace * fatigueFactor;
  const projectedFinishMs = splitMs + projectedRemainingTime;
  
  return Math.floor(projectedFinishMs);
}

/**
 * Calculate temporary placement based on projected finish times
 * Returns results with temporary placement assigned
 */
function calculateTemporaryPlacements(results) {
  // Separate by gender
  const menResults = results.filter(r => r.gender === 'men');
  const womenResults = results.filter(r => r.gender === 'women');
  
  // Process each gender separately
  const processedMen = assignTemporaryPlacementsByGender(menResults);
  const processedWomen = assignTemporaryPlacementsByGender(womenResults);
  
  return [...processedMen, ...processedWomen];
}

/**
 * Assign temporary placements within a single gender
 */
function assignTemporaryPlacementsByGender(results) {
  const processed = results.map(result => {
    const mostRecentSplit = getMostRecentSplit(result);
    
    if (!mostRecentSplit) {
      return {
        ...result,
        projected_finish_ms: null,
        projected_placement: null,
        projection_source: null,
        is_temporary: false
      };
    }
    
    const projectedFinishMs = projectFinishTime(mostRecentSplit);
    
    return {
      ...result,
      projected_finish_ms: projectedFinishMs,
      projection_source: mostRecentSplit.splitName,
      is_temporary: true
    };
  });
  
  // Sort by projected finish time (fastest first)
  const withProjections = processed.filter(r => r.projected_finish_ms !== null);
  const withoutProjections = processed.filter(r => r.projected_finish_ms === null);
  
  withProjections.sort((a, b) => a.projected_finish_ms - b.projected_finish_ms);
  
  // Assign temporary placements
  let currentPlace = 1;
  let prevTime = null;
  
  withProjections.forEach((result, index) => {
    if (prevTime !== null && result.projected_finish_ms === prevTime) {
      // Tie - same placement as previous
      result.projected_placement = currentPlace;
    } else {
      currentPlace = index + 1;
      result.projected_placement = currentPlace;
      prevTime = result.projected_finish_ms;
    }
  });
  
  return [...withProjections, ...withoutProjections];
}

/**
 * Calculate simple temporary points based on projected placement
 * This uses a simplified scoring model focused on placement points
 */
function calculateTemporaryPoints(projectedPlacement) {
  if (!projectedPlacement || projectedPlacement > 10) {
    return 0;
  }
  
  // Standard placement points (1st=10pts, 2nd=9pts, ..., 10th=1pt)
  const placementPoints = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
  return placementPoints[projectedPlacement - 1] || 0;
}

/**
 * Main function to calculate temporary scores for all results
 * Returns enhanced results with temporary scoring data
 */
export function calculateTemporaryScores(results) {
  // Calculate temporary placements
  const withPlacements = calculateTemporaryPlacements(results);
  
  // Add temporary points
  return withPlacements.map(result => {
    if (!result.is_temporary || !result.projected_placement) {
      return result;
    }
    
    const temporaryPoints = calculateTemporaryPoints(result.projected_placement);
    
    return {
      ...result,
      temporary_points: temporaryPoints,
      projected_finish_time: msToTimeString(result.projected_finish_ms)
    };
  });
}

/**
 * Check if any results have temporary scores
 */
export function hasTemporaryScores(results) {
  return results.some(r => r.is_temporary === true);
}

/**
 * Get summary of what splits are being used for projections
 */
export function getProjectionSummary(results) {
  const splitCounts = {};
  
  results.forEach(result => {
    if (result.is_temporary && result.projection_source) {
      splitCounts[result.projection_source] = (splitCounts[result.projection_source] || 0) + 1;
    }
  });
  
  // Find most common split
  let mostCommonSplit = null;
  let maxCount = 0;
  
  Object.entries(splitCounts).forEach(([split, count]) => {
    if (count > maxCount) {
      maxCount = count;
      mostCommonSplit = split;
    }
  });
  
  return {
    mostCommonSplit,
    splitCounts,
    totalWithProjections: Object.values(splitCounts).reduce((sum, count) => sum + count, 0)
  };
}
