/**
 * Tests for Points-Based Scoring System
 * 
 * Run with: node tests/scoring-tests.js
 * (Requires test data setup)
 */

// Test scenarios for scoring system validation

const TEST_SCENARIOS = {
  // Scenario 1: Basic placement points
  basicPlacement: {
    name: 'Basic Placement Points',
    results: [
      { athleteId: 1, finishTimeMs: 7200000, placement: 1 },
      { athleteId: 2, finishTimeMs: 7300000, placement: 2 },
      { athleteId: 3, finishTimeMs: 7400000, placement: 3 }
    ],
    expected: {
      athlete1Points: 10,
      athlete2Points: 9,
      athlete3Points: 8
    }
  },

  // Scenario 2: Tied finish
  tiedFinish: {
    name: 'Tied Finish - Same Placement',
    results: [
      { athleteId: 1, finishTimeMs: 7200000, placement: 1 },
      { athleteId: 2, finishTimeMs: 7300000, placement: 2 },
      { athleteId: 3, finishTimeMs: 7300000, placement: 2 },
      { athleteId: 4, finishTimeMs: 7400000, placement: 4 }
    ],
    expected: {
      athlete2Placement: 2,
      athlete3Placement: 2,
      athlete4Placement: 4, // Skips 3rd
      athlete2Points: 9,
      athlete3Points: 9
    }
  },

  // Scenario 3: Time gap bonuses
  timeGapBonus: {
    name: 'Time Gap Bonuses',
    winnerTime: 7200000, // 2:00:00
    results: [
      { athleteId: 1, finishTimeMs: 7200000, gapSeconds: 0, expectedGapPoints: 5 },
      { athleteId: 2, finishTimeMs: 7245000, gapSeconds: 45, expectedGapPoints: 5 }, // 45s
      { athleteId: 3, finishTimeMs: 7290000, gapSeconds: 90, expectedGapPoints: 4 }, // 90s
      { athleteId: 4, finishTimeMs: 7350000, gapSeconds: 150, expectedGapPoints: 3 }, // 150s
      { athleteId: 5, finishTimeMs: 7500000, gapSeconds: 300, expectedGapPoints: 2 }, // 300s
      { athleteId: 6, finishTimeMs: 7800000, gapSeconds: 600, expectedGapPoints: 1 }  // 600s
    ]
  },

  // Scenario 4: Negative split bonus
  negativeSplit: {
    name: 'Negative Split Performance Bonus',
    athlete: {
      firstHalfMs: 3720000, // 1:02:00
      secondHalfMs: 3480000, // 58:00 (faster)
      expectedBonus: 2
    }
  },

  // Scenario 5: Even pace bonus
  evenPace: {
    name: 'Even Pace Performance Bonus',
    athlete: {
      totalTimeMs: 7200000, // 2:00:00
      firstHalfMs: 3600000,  // 1:00:00
      secondHalfMs: 3600000, // 1:00:00 (exactly same)
      expectedBonus: 1
    }
  },

  // Scenario 6: Fast finish kick
  fastFinish: {
    name: 'Fast Finish Kick Bonus',
    athlete: {
      totalTimeMs: 7500000, // 2:05:00
      raceDistanceM: 42195,
      last5kMs: 870000, // 14:30 (fast for final 5k)
      expectedBonus: 1
    }
  },

  // Scenario 7: World record
  worldRecord: {
    name: 'World Record Bonus',
    athlete: {
      finishTimeMs: 7200000, // 2:00:00 (hypothetical new WR)
      currentWR: 7235000,     // 2:00:35 (Kiptum's actual)
      expectedBonus: 15,
      expectedBadge: 'WR'
    }
  },

  // Scenario 8: Course record (not WR)
  courseRecord: {
    name: 'Course Record Bonus (NYC)',
    athlete: {
      finishTimeMs: 7500000, // 2:05:00 (better than Mutai)
      currentCR: 7506000,     // 2:05:06 (Mutai's actual)
      currentWR: 7235000,     // Not beating WR
      expectedBonus: 5,
      expectedBadge: 'CR'
    }
  },

  // Scenario 9: Provisional record (withhold policy)
  provisionalRecordWithhold: {
    name: 'Provisional Record - Withhold Points',
    athlete: {
      finishTimeMs: 7200000,
      recordType: 'WORLD',
      recordStatus: 'provisional',
      policy: 'withhold',
      expectedPointsNow: 0,
      expectedPointsAfterConfirm: 15
    }
  },

  // Scenario 10: Complete scoring example
  completeExample: {
    name: 'Complete Scoring Example',
    athlete: {
      name: 'Hypothetical Runner',
      placement: 3,
      finishTimeMs: 7350000, // 2:02:30
      winnerTimeMs: 7200000, // 2:00:00
      firstHalfMs: 3600000,  // 1:00:00
      secondHalfMs: 3750000, // 1:02:30
      last5kMs: 900000,      // 15:00
      breakdown: {
        placementPoints: 8,    // 3rd place
        timeGapPoints: 3,      // 150s gap (within 180s)
        negativeSplitBonus: 0, // Second half slower
        evenPaceBonus: 0,      // Not even
        fastFinishBonus: 0,    // Not fast enough
        recordBonus: 0,        // No record
        expectedTotal: 11
      }
    }
  }
};

// Validation functions
function validatePlacementPoints(placement, rules) {
  if (!placement || placement > rules.max_scored_place) return 0;
  return rules.placement_points[placement - 1] || 0;
}

function validateTimeGapPoints(gapSeconds, windows) {
  for (const window of windows) {
    if (gapSeconds <= window.max_gap_seconds) {
      return window.points;
    }
  }
  return 0;
}

function validateNegativeSplit(firstHalfMs, secondHalfMs) {
  return secondHalfMs < firstHalfMs;
}

function validateEvenPace(firstHalfMs, secondHalfMs, totalMs, tolerance = 0.005) {
  const diff = Math.abs(secondHalfMs - firstHalfMs);
  return diff <= totalMs * tolerance;
}

function validateFastFinish(last5kMs, totalMs, distanceM, improvement = 0.03) {
  const avgPace = totalMs / distanceM;
  const last5kPace = last5kMs / 5000;
  return last5kPace <= avgPace * (1 - improvement);
}

// Test runner
function runTests() {
  console.log('🧪 Points-Based Scoring System Tests\n');
  console.log('=' .repeat(60));
  
  const rules = {
    placement_points: [10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
    max_scored_place: 10,
    time_gap_windows: [
      { max_gap_seconds: 60, points: 5 },
      { max_gap_seconds: 120, points: 4 },
      { max_gap_seconds: 180, points: 3 },
      { max_gap_seconds: 300, points: 2 },
      { max_gap_seconds: 600, points: 1 }
    ]
  };
  
  let passed = 0;
  let failed = 0;
  
  // Test 1: Placement Points
  console.log('\n✓ Test 1: Placement Points');
  const p1 = validatePlacementPoints(1, rules);
  const p2 = validatePlacementPoints(2, rules);
  const p10 = validatePlacementPoints(10, rules);
  const p11 = validatePlacementPoints(11, rules);
  console.log(`  1st place: ${p1} pts ${p1 === 10 ? '✓' : '✗'}`);
  console.log(`  2nd place: ${p2} pts ${p2 === 9 ? '✓' : '✗'}`);
  console.log(`  10th place: ${p10} pts ${p10 === 1 ? '✓' : '✗'}`);
  console.log(`  11th place: ${p11} pts ${p11 === 0 ? '✓' : '✗'}`);
  if (p1 === 10 && p2 === 9 && p10 === 1 && p11 === 0) passed++; else failed++;
  
  // Test 2: Time Gap Points
  console.log('\n✓ Test 2: Time Gap Points');
  const g45 = validateTimeGapPoints(45, rules.time_gap_windows);
  const g90 = validateTimeGapPoints(90, rules.time_gap_windows);
  const g150 = validateTimeGapPoints(150, rules.time_gap_windows);
  const g700 = validateTimeGapPoints(700, rules.time_gap_windows);
  console.log(`  45s gap: ${g45} pts ${g45 === 5 ? '✓' : '✗'}`);
  console.log(`  90s gap: ${g90} pts ${g90 === 4 ? '✓' : '✗'}`);
  console.log(`  150s gap: ${g150} pts ${g150 === 3 ? '✓' : '✗'}`);
  console.log(`  700s gap: ${g700} pts ${g700 === 0 ? '✓' : '✗'}`);
  if (g45 === 5 && g90 === 4 && g150 === 3 && g700 === 0) passed++; else failed++;
  
  // Test 3: Negative Split
  console.log('\n✓ Test 3: Negative Split Detection');
  const ns1 = validateNegativeSplit(3720000, 3480000); // Faster second half
  const ns2 = validateNegativeSplit(3480000, 3720000); // Slower second half
  console.log(`  1:02 → 0:58: ${ns1} ${ns1 ? '✓' : '✗'}`);
  console.log(`  0:58 → 1:02: ${ns2} ${!ns2 ? '✓' : '✗'}`);
  if (ns1 && !ns2) passed++; else failed++;
  
  // Test 4: Even Pace
  console.log('\n✓ Test 4: Even Pace Detection');
  const ep1 = validateEvenPace(3600000, 3600000, 7200000); // Perfect
  const ep2 = validateEvenPace(3600000, 3636000, 7200000); // Within tolerance
  const ep3 = validateEvenPace(3600000, 3750000, 7200000); // Too far
  console.log(`  1:00 → 1:00: ${ep1} ${ep1 ? '✓' : '✗'}`);
  console.log(`  1:00 → 1:00:36: ${ep2} ${ep2 ? '✓' : '✗'}`);
  console.log(`  1:00 → 1:02:30: ${ep3} ${!ep3 ? '✓' : '✗'}`);
  if (ep1 && ep2 && !ep3) passed++; else failed++;
  
  // Test 5: Fast Finish
  console.log('\n✓ Test 5: Fast Finish Detection');
  const avgPace = 7500000 / 42195; // ~177.6 ms/m
  const threshold = avgPace * 0.97; // 3% faster = ~172.3 ms/m
  const ff1 = validateFastFinish(850000, 7500000, 42195); // Very fast
  const ff2 = validateFastFinish(920000, 7500000, 42195); // Not fast enough
  console.log(`  Last 5k in 14:10: ${ff1} ${ff1 ? '✓' : '✗'}`);
  console.log(`  Last 5k in 15:20: ${ff2} ${!ff2 ? '✓' : '✗'}`);
  if (ff1 && !ff2) passed++; else failed++;
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
  console.log(`${failed === 0 ? '✅ All tests passed!' : '❌ Some tests failed'}\n`);
  
  return failed === 0;
}

// Run if executed directly
if (typeof require !== 'undefined' && require.main === module) {
  const success = runTests();
  process.exit(success ? 0 : 1);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TEST_SCENARIOS, runTests };
}
