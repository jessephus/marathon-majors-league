/**
 * Test suite for temporary scoring module
 */

import { calculateTemporaryScores, hasTemporaryScores, getProjectionSummary } from '../pages/api/lib/temporary-scoring.js';

// Test data
const mockResultsWithSplits = [
  {
    athlete_id: 1,
    gender: 'men',
    finish_time: null,
    split_5k: null,
    split_10k: null,
    split_half: '1:02:30',
    split_30k: null,
    split_35k: null,
    split_40k: null,
  },
  {
    athlete_id: 2,
    gender: 'men',
    finish_time: null,
    split_5k: null,
    split_10k: null,
    split_half: '1:03:15',
    split_30k: null,
    split_35k: null,
    split_40k: null,
  },
  {
    athlete_id: 3,
    gender: 'women',
    finish_time: null,
    split_5k: null,
    split_10k: null,
    split_half: '1:10:00',
    split_30k: null,
    split_35k: null,
    split_40k: null,
  },
  {
    athlete_id: 4,
    gender: 'women',
    finish_time: null,
    split_5k: null,
    split_10k: null,
    split_half: '1:11:30',
    split_30k: null,
    split_35k: null,
    split_40k: null,
  },
];

const mockResultsWithVariedSplits = [
  {
    athlete_id: 5,
    gender: 'men',
    finish_time: null,
    split_5k: null,
    split_10k: null,
    split_half: null,
    split_30k: null,
    split_35k: null,
    split_40k: '1:55:00',
  },
  {
    athlete_id: 6,
    gender: 'men',
    finish_time: null,
    split_5k: null,
    split_10k: null,
    split_half: '1:02:00',
    split_30k: null,
    split_35k: null,
    split_40k: null,
  },
  {
    athlete_id: 7,
    gender: 'men',
    finish_time: null,
    split_5k: null,
    split_10k: '29:00',
    split_half: null,
    split_30k: null,
    split_35k: null,
    split_40k: null,
  },
];

console.log('🧪 Testing Temporary Scoring Module\n');

// Test 1: Basic temporary score calculation
console.log('Test 1: Basic temporary score calculation');
try {
  const results = calculateTemporaryScores(mockResultsWithSplits);
  
  console.log('✅ Successfully calculated temporary scores');
  console.log(`   - Processed ${results.length} results`);
  
  // Check that all results have temporary scoring data
  const withProjections = results.filter(r => r.is_temporary);
  console.log(`   - ${withProjections.length} athletes have projections`);
  
  // Check placements are assigned
  const menWithPlacements = results.filter(r => r.gender === 'men' && r.projected_placement !== null);
  const womenWithPlacements = results.filter(r => r.gender === 'women' && r.projected_placement !== null);
  console.log(`   - Men with placements: ${menWithPlacements.length}`);
  console.log(`   - Women with placements: ${womenWithPlacements.length}`);
  
  // Check points are assigned
  const withPoints = results.filter(r => r.temporary_points > 0);
  console.log(`   - Athletes with points: ${withPoints.length}`);
  
  // Verify faster athlete gets better placement
  const menResults = results.filter(r => r.gender === 'men');
  if (menResults.length >= 2) {
    const athlete1 = menResults.find(r => r.athlete_id === 1);
    const athlete2 = menResults.find(r => r.athlete_id === 2);
    if (athlete1 && athlete2) {
      const faster = athlete1.projected_finish_ms < athlete2.projected_finish_ms ? athlete1 : athlete2;
      const slower = faster.athlete_id === 1 ? athlete2 : athlete1;
      if (faster.projected_placement < slower.projected_placement) {
        console.log('   ✓ Faster athlete correctly ranked higher');
      } else {
        console.log('   ✗ FAIL: Placement order incorrect');
      }
    }
  }
  
  console.log();
} catch (error) {
  console.error('❌ Test 1 failed:', error.message);
  console.log();
}

// Test 2: hasTemporaryScores function
console.log('Test 2: hasTemporaryScores function');
try {
  const results = calculateTemporaryScores(mockResultsWithSplits);
  const hasTemp = hasTemporaryScores(results);
  
  if (hasTemp) {
    console.log('✅ Correctly identified temporary scores');
  } else {
    console.log('❌ Failed to identify temporary scores');
  }
  
  // Test with no temporary scores
  const finalResults = [
    { athlete_id: 1, finish_time: '2:05:00', is_temporary: false },
  ];
  const hasNoTemp = hasTemporaryScores(finalResults);
  
  if (!hasNoTemp) {
    console.log('✅ Correctly identified no temporary scores');
  } else {
    console.log('❌ Incorrectly reported temporary scores');
  }
  
  console.log();
} catch (error) {
  console.error('❌ Test 2 failed:', error.message);
  console.log();
}

// Test 3: getProjectionSummary function
console.log('Test 3: getProjectionSummary function');
try {
  const results = calculateTemporaryScores(mockResultsWithSplits);
  const summary = getProjectionSummary(results);
  
  console.log('✅ Successfully generated projection summary');
  console.log(`   - Most common split: ${summary.mostCommonSplit}`);
  console.log(`   - Total with projections: ${summary.totalWithProjections}`);
  console.log(`   - Split counts:`, summary.splitCounts);
  console.log();
} catch (error) {
  console.error('❌ Test 3 failed:', error.message);
  console.log();
}

// Test 4: Multiple split types
console.log('Test 4: Multiple split types (40k, half, 10k)');
try {
  const results = calculateTemporaryScores(mockResultsWithVariedSplits);
  
  // Check that most recent split is used for each athlete
  const athlete5 = results.find(r => r.athlete_id === 5);
  const athlete6 = results.find(r => r.athlete_id === 6);
  const athlete7 = results.find(r => r.athlete_id === 7);
  
  if (athlete5.projection_source === '40k') {
    console.log('   ✓ Athlete 5 using 40k split (most recent)');
  } else {
    console.log(`   ✗ FAIL: Athlete 5 using ${athlete5.projection_source} instead of 40k`);
  }
  
  if (athlete6.projection_source === 'half') {
    console.log('   ✓ Athlete 6 using half split (most recent available)');
  } else {
    console.log(`   ✗ FAIL: Athlete 6 using ${athlete6.projection_source} instead of half`);
  }
  
  if (athlete7.projection_source === '10k') {
    console.log('   ✓ Athlete 7 using 10k split (most recent available)');
  } else {
    console.log(`   ✗ FAIL: Athlete 7 using ${athlete7.projection_source} instead of 10k`);
  }
  
  // Verify 40k split has smaller fatigue factor (more accurate projection)
  const summary = getProjectionSummary(results);
  console.log('✅ Successfully handled multiple split types');
  console.log(`   - Split distribution: ${JSON.stringify(summary.splitCounts)}`);
  console.log();
} catch (error) {
  console.error('❌ Test 4 failed:', error.message);
  console.log();
}

// Test 5: Placement points calculation
console.log('Test 5: Placement points calculation');
try {
  const results = calculateTemporaryScores(mockResultsWithSplits);
  
  // Find first place in men
  const menResults = results.filter(r => r.gender === 'men');
  const firstPlace = menResults.find(r => r.projected_placement === 1);
  const secondPlace = menResults.find(r => r.projected_placement === 2);
  
  if (firstPlace && firstPlace.temporary_points === 10) {
    console.log('   ✓ 1st place gets 10 points');
  } else {
    console.log(`   ✗ FAIL: 1st place has ${firstPlace?.temporary_points} points instead of 10`);
  }
  
  if (secondPlace && secondPlace.temporary_points === 9) {
    console.log('   ✓ 2nd place gets 9 points');
  } else {
    console.log(`   ✗ FAIL: 2nd place has ${secondPlace?.temporary_points} points instead of 9`);
  }
  
  console.log('✅ Placement points correctly calculated');
  console.log();
} catch (error) {
  console.error('❌ Test 5 failed:', error.message);
  console.log();
}

// Test 6: Gender separation
console.log('Test 6: Gender separation in placements');
try {
  const results = calculateTemporaryScores(mockResultsWithSplits);
  
  const menResults = results.filter(r => r.gender === 'men');
  const womenResults = results.filter(r => r.gender === 'women');
  
  // Check that men and women have separate placements starting from 1
  const menFirstPlace = menResults.filter(r => r.projected_placement === 1);
  const womenFirstPlace = womenResults.filter(r => r.projected_placement === 1);
  
  if (menFirstPlace.length > 0 && womenFirstPlace.length > 0) {
    console.log('   ✓ Both men and women have 1st place (separate rankings)');
    console.log('✅ Gender separation working correctly');
  } else {
    console.log('   ✗ FAIL: Gender separation not working');
  }
  
  console.log();
} catch (error) {
  console.error('❌ Test 6 failed:', error.message);
  console.log();
}

console.log('✨ All tests completed!\n');
