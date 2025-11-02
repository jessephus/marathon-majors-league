/**
 * Test for manual review banner display logic
 * 
 * This test verifies that the hasFinishTimes flag is properly calculated
 * and that the banner display logic works correctly
 */

// Mock test data
const testCases = [
  {
    name: 'All athletes with finish times',
    results: [
      { athlete_id: 1, finish_time: '02:05:30', placement: 1, total_points: 100 },
      { athlete_id: 2, finish_time: '02:06:15', placement: 2, total_points: 95 },
      { athlete_id: 3, finish_time: '02:07:00', placement: 3, total_points: 90 }
    ],
    isFinalized: false,
    expectedHasFinishTimes: true,
    expectedIsTemporary: false,
    shouldShowBanner: true
  },
  {
    name: 'Some athletes with finish times, some with only splits',
    results: [
      { athlete_id: 1, finish_time: '02:05:30', placement: 1, total_points: 100 },
      { athlete_id: 2, finish_time: null, split_half: '01:02:00' },
      { athlete_id: 3, finish_time: null, split_10k: '00:30:00' }
    ],
    isFinalized: false,
    expectedHasFinishTimes: true,
    expectedIsTemporary: true, // Because some have splits without finish
    shouldShowBanner: true // Banner should STILL show because finish times exist
  },
  {
    name: 'Only splits, no finish times',
    results: [
      { athlete_id: 1, finish_time: null, split_half: '01:02:00' },
      { athlete_id: 2, finish_time: null, split_10k: '00:30:00' }
    ],
    isFinalized: false,
    expectedHasFinishTimes: false,
    expectedIsTemporary: true,
    shouldShowBanner: false // No finish times, so no banner
  },
  {
    name: 'Finish times entered and results finalized',
    results: [
      { athlete_id: 1, finish_time: '02:05:30', placement: 1, total_points: 100 },
      { athlete_id: 2, finish_time: '02:06:15', placement: 2, total_points: 95 }
    ],
    isFinalized: true,
    expectedHasFinishTimes: true,
    expectedIsTemporary: false,
    shouldShowBanner: false // Finalized, so no banner
  },
  {
    name: 'No results at all',
    results: [],
    isFinalized: false,
    expectedHasFinishTimes: false,
    expectedIsTemporary: false,
    shouldShowBanner: false
  }
];

// Simulate the logic from the API
function calculateFlags(results, isFinalized) {
  const hasAnyResults = results.length > 0;
  const hasSplitsWithoutFinish = results.some(r => 
    !r.finish_time && (r.split_5k || r.split_10k || r.split_half || r.split_30k || r.split_35k || r.split_40k)
  );
  const hasAnyFinishTimes = results.some(r => r.finish_time !== null);
  const useTemporaryScoring = hasAnyResults && !isFinalized && hasSplitsWithoutFinish;
  
  return {
    hasFinishTimes: hasAnyFinishTimes,
    isTemporary: useTemporaryScoring
  };
}

// Simulate the frontend banner display logic
function shouldShowBanner(hasFinishTimes, resultsFinalized, hasStandings) {
  return hasFinishTimes && !resultsFinalized && hasStandings;
}

// Run tests
console.log('🧪 Running banner display logic tests...\n');

let passedTests = 0;
let failedTests = 0;

testCases.forEach((test, index) => {
  console.log(`Test ${index + 1}: ${test.name}`);
  
  const flags = calculateFlags(test.results, test.isFinalized);
  const hasStandings = test.results.length > 0;
  const bannerShouldShow = shouldShowBanner(flags.hasFinishTimes, test.isFinalized, hasStandings);
  
  console.log(`  Results: ${test.results.length} athletes`);
  console.log(`  Expected hasFinishTimes: ${test.expectedHasFinishTimes}, Got: ${flags.hasFinishTimes}`);
  console.log(`  Expected isTemporary: ${test.expectedIsTemporary}, Got: ${flags.isTemporary}`);
  console.log(`  Expected banner: ${test.shouldShowBanner}, Got: ${bannerShouldShow}`);
  
  const hasFinishTimesCorrect = flags.hasFinishTimes === test.expectedHasFinishTimes;
  const isTemporaryCorrect = flags.isTemporary === test.expectedIsTemporary;
  const bannerCorrect = bannerShouldShow === test.shouldShowBanner;
  
  if (hasFinishTimesCorrect && isTemporaryCorrect && bannerCorrect) {
    console.log('  ✅ PASS\n');
    passedTests++;
  } else {
    console.log('  ❌ FAIL\n');
    failedTests++;
  }
});

console.log(`\n📊 Test Results: ${passedTests}/${testCases.length} passed`);

if (failedTests > 0) {
  console.error(`❌ ${failedTests} test(s) failed`);
  process.exit(1);
} else {
  console.log('✅ All tests passed!');
  process.exit(0);
}
