/**
 * Leaderboard Components Tests
 * 
 * Validates new leaderboard components for Phase 4 migration.
 */

import { strict as assert } from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Testing Leaderboard Components...\n');

let testsPassed = 0;
let testsFailed = 0;

// Helper function
function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    testsPassed++;
  } catch (error) {
    console.error(`❌ ${name}`);
    console.error(`   ${error.message}`);
    testsFailed++;
  }
}

// Test 1: Verify components exist
test('LeaderboardTable component file exists', () => {
  const componentPath = path.join(__dirname, '../components/LeaderboardTable.tsx');
  assert(fs.existsSync(componentPath), 'LeaderboardTable.tsx should exist');
});

test('ResultsTable component file exists', () => {
  const componentPath = path.join(__dirname, '../components/ResultsTable.tsx');
  assert(fs.existsSync(componentPath), 'ResultsTable.tsx should exist');
});

test('PointsModal component file exists', () => {
  const componentPath = path.join(__dirname, '../components/PointsModal.tsx');
  assert(fs.existsSync(componentPath), 'PointsModal.tsx should exist');
});

// Test 2: Verify leaderboard page imports new components
test('Leaderboard page imports LeaderboardTable', () => {
  const pagePath = path.join(__dirname, '../pages/leaderboard.tsx');
  const content = fs.readFileSync(pagePath, 'utf8');
  assert(content.includes('import LeaderboardTable'), 'Should import LeaderboardTable');
});

test('Leaderboard page imports ResultsTable', () => {
  const pagePath = path.join(__dirname, '../pages/leaderboard.tsx');
  const content = fs.readFileSync(pagePath, 'utf8');
  assert(content.includes('import ResultsTable'), 'Should import ResultsTable');
});

test('Leaderboard page imports PointsModal', () => {
  const pagePath = path.join(__dirname, '../pages/leaderboard.tsx');
  const content = fs.readFileSync(pagePath, 'utf8');
  assert(content.includes('import PointsModal'), 'Should import PointsModal');
});

// Test 3: Verify SSR implementation
test('Leaderboard page has getServerSideProps', () => {
  const pagePath = path.join(__dirname, '../pages/leaderboard.tsx');
  const content = fs.readFileSync(pagePath, 'utf8');
  assert(content.includes('export async function getServerSideProps'), 'Should have getServerSideProps');
});

test('Leaderboard page fetches initial data in SSR', () => {
  const pagePath = path.join(__dirname, '../pages/leaderboard.tsx');
  const content = fs.readFileSync(pagePath, 'utf8');
  assert(content.includes('initialStandings'), 'Should fetch initial standings');
  assert(content.includes('initialResults'), 'Should fetch initial results');
  assert(content.includes('cacheTimestamp'), 'Should embed cache timestamp');
});

// Test 4: Verify auto-refresh functionality
test('Leaderboard page implements visibility tracking', () => {
  const pagePath = path.join(__dirname, '../pages/leaderboard.tsx');
  const content = fs.readFileSync(pagePath, 'utf8');
  assert(content.includes('visibilitychange'), 'Should track visibility changes');
  assert(content.includes('isVisible'), 'Should have isVisible state');
  assert(content.includes('isFocused'), 'Should have isFocused state');
});

test('Leaderboard page pauses refresh when hidden', () => {
  const pagePath = path.join(__dirname, '../pages/leaderboard.tsx');
  const content = fs.readFileSync(pagePath, 'utf8');
  assert(content.includes('Auto-refresh paused'), 'Should pause refresh when tab hidden');
});

test('Leaderboard page sets up 60-second interval', () => {
  const pagePath = path.join(__dirname, '../pages/leaderboard.tsx');
  const content = fs.readFileSync(pagePath, 'utf8');
  assert(content.includes('60000'), 'Should use 60-second interval');
});

// Test 5: Verify state manager integration
test('Leaderboard page imports useStateManagerEvent', () => {
  const pagePath = path.join(__dirname, '../pages/leaderboard.tsx');
  const content = fs.readFileSync(pagePath, 'utf8');
  assert(content.includes('useStateManagerEvent'), 'Should import useStateManagerEvent');
});

test('Leaderboard page subscribes to results:updated event', () => {
  const pagePath = path.join(__dirname, '../pages/leaderboard.tsx');
  const content = fs.readFileSync(pagePath, 'utf8');
  assert(content.includes("'results:updated'"), 'Should subscribe to results:updated');
});

test('Leaderboard page subscribes to results:invalidated event', () => {
  const pagePath = path.join(__dirname, '../pages/leaderboard.tsx');
  const content = fs.readFileSync(pagePath, 'utf8');
  assert(content.includes("'results:invalidated'"), 'Should subscribe to results:invalidated');
});

// Test 6: Verify accessibility features
test('LeaderboardTable has ARIA roles', () => {
  const componentPath = path.join(__dirname, '../components/LeaderboardTable.tsx');
  const content = fs.readFileSync(componentPath, 'utf8');
  assert(content.includes('role="button"'), 'Should have button role for clickable rows');
  assert(content.includes('aria-label'), 'Should have aria-label for accessibility');
});

test('LeaderboardTable supports keyboard navigation', () => {
  const componentPath = path.join(__dirname, '../components/LeaderboardTable.tsx');
  const content = fs.readFileSync(componentPath, 'utf8');
  assert(content.includes('onKeyDown'), 'Should handle keyboard events');
  assert(content.includes('tabIndex'), 'Should have tabIndex for focus');
});

test('ResultsTable has ARIA roles', () => {
  const componentPath = path.join(__dirname, '../components/ResultsTable.tsx');
  const content = fs.readFileSync(componentPath, 'utf8');
  assert(content.includes('role="button"'), 'Should have button role');
  assert(content.includes('aria-label'), 'Should have aria-label');
});

test('PointsModal is keyboard accessible', () => {
  const componentPath = path.join(__dirname, '../components/PointsModal.tsx');
  const content = fs.readFileSync(componentPath, 'utf8');
  assert(content.includes('Escape'), 'Should close on Escape key');
  assert(content.includes('aria-modal'), 'Should have aria-modal attribute');
});

// Test 7: Verify sticky behavior implementation
test('LeaderboardTable implements sticky behavior', () => {
  const componentPath = path.join(__dirname, '../components/LeaderboardTable.tsx');
  const content = fs.readFileSync(componentPath, 'utf8');
  assert(content.includes('sticky-top'), 'Should have sticky-top class');
  assert(content.includes('sticky-bottom'), 'Should have sticky-bottom class');
  assert(content.includes('requestAnimationFrame'), 'Should use RAF for smooth scrolling');
});

// Summary
console.log('\n' + '='.repeat(50));
console.log(`Tests Passed: ${testsPassed}`);
console.log(`Tests Failed: ${testsFailed}`);
console.log('='.repeat(50));

if (testsFailed > 0) {
  process.exit(1);
}

console.log('\n✅ All leaderboard component tests passed!\n');
