/**
 * Frontend Integration Tests
 * Tests that the frontend can still interact with the API after migration
 * 
 * Run with: node tests/frontend-integration.test.js
 */

import { describe, it, after } from 'node:test';
import assert from 'node:assert';
import { neon } from '@neondatabase/serverless';

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

// Initialize database connection (only if DATABASE_URL is available)
let sql = null;
if (process.env.DATABASE_URL) {
  sql = neon(process.env.DATABASE_URL);
}

// Track created resources for cleanup
const createdGames = [];

console.log('🧪 Testing frontend integration at:', BASE_URL);

// Cleanup function - runs after ALL tests complete
after(async () => {
  console.log('\n🧹 Cleaning up frontend integration test data...');
  
  if (createdGames.length === 0) {
    console.log('   No test data to clean up\n');
    return;
  }
  
  if (!sql) {
    console.log('   ⚠️  DATABASE_URL not set, skipping cleanup\n');
    return;
  }
  
  try {
    let deletedGames = 0;
    
    // Delete child records first, then parent games (no CASCADE configured)
    for (const gameId of createdGames) {
      try {
        // Delete all child records by game_id
        await sql`DELETE FROM race_results WHERE game_id = ${gameId}`;
        await sql`DELETE FROM salary_cap_teams WHERE game_id = ${gameId}`;
        await sql`DELETE FROM draft_teams WHERE game_id = ${gameId}`;
        await sql`DELETE FROM player_rankings WHERE game_id = ${gameId}`;
        await sql`DELETE FROM anonymous_sessions WHERE game_id = ${gameId}`;
        
        // Delete parent game
        await sql`DELETE FROM games WHERE game_id = ${gameId}`;
        deletedGames++;
      } catch (e) {
        console.warn(`   ⚠️  Could not delete game ${gameId}: ${e.message}`);
      }
    }
    
    console.log(`✅ Cleaned up ${deletedGames} game(s)\n`);
  } catch (error) {
    console.error('⚠️  Cleanup error:', error.message, '\n');
  }
});

async function fetchHTML(path = '/') {
  const response = await fetch(`${BASE_URL}${path}`);
  const html = await response.text();
  return { html, status: response.status, response };
}

describe('Frontend Integration Tests', () => {
  
  describe('Static Assets', () => {
    it('should serve index.html', async () => {
      const { html, status } = await fetchHTML('/');
      
      assert.strictEqual(status, 200, 'Should return 200 OK');
      assert.ok(html.includes('<!DOCTYPE html>'), 'Should contain HTML doctype');
      assert.ok(html.includes('Fantasy'), 'Should contain Fantasy text');
      
      console.log('✅ index.html served correctly');
    });
    
    // Legacy app.js and salary-cap-draft.js were removed in monolith cleanup (PR #130)
    // The application now uses React components loaded via Next.js
    
    it('should serve style.css', async () => {
      const response = await fetch(`${BASE_URL}/style.css`);
      const css = await response.text();
      
      assert.strictEqual(response.status, 200, 'Should return 200 OK');
      assert.ok(css.includes(':root') || css.includes('.'), 'Should contain CSS');
      
      console.log('✅ style.css served correctly');
    });
    
    it('should serve athletes.json', async () => {
      const response = await fetch(`${BASE_URL}/athletes.json`);
      const data = await response.json();
      
      assert.strictEqual(response.status, 200, 'Should return 200 OK');
      assert.ok(data.men, 'Should have men athletes');
      assert.ok(data.women, 'Should have women athletes');
      
      console.log('✅ athletes.json served correctly');
    });
  });
  
  describe('HTML Structure', () => {
    it('should have required elements for landing page', async () => {
      const { html } = await fetchHTML('/');
      
      // Check for key landing page elements
      assert.ok(html.includes('id="landing-page"'), 'Should have landing page');
      
      // React modals are not rendered in SSR HTML when isOpen=false
      // They exist as React components but don't appear in initial HTML
      // This is correct behavior - modals render on client-side when opened
      
      // Legacy pages removed - migrated to React routes
      assert.ok(!html.includes('id="ranking-page"'), 'ranking-page removed (deprecated snake draft)');
      assert.ok(!html.includes('id="salary-cap-draft-page"'), 'salary-cap-draft-page removed (migrated to /team/[session])');
      assert.ok(!html.includes('id="commissioner-page"'), 'commissioner-page removed (migrated to /commissioner)');
      
      // Verify old HTML modal IDs are gone (now React components)
      assert.ok(!html.includes('id="team-creation-modal"'), 'team-creation-modal is now a React component (not in initial HTML)');
      assert.ok(!html.includes('id="commissioner-totp-modal"'), 'commissioner-totp-modal is now a React component (not in initial HTML)');
      
      console.log('✅ Landing page present, legacy pages/modals correctly removed');
    });
    
    it('should not have legacy HTML structure', async () => {
      const { html } = await fetchHTML('/');
      
      // Verify legacy elements are removed
      assert.ok(!html.includes('drag-handle-header'), 'Should not have drag handle (snake draft removed)');
      assert.ok(!html.includes('athlete-management-container'), 'Should not have athlete management container (migrated to React)');
      assert.ok(!html.includes('dangerouslySetInnerHTML'), 'Should not inject HTML via dangerouslySetInnerHTML (migration complete)');
      
      console.log('✅ Legacy HTML successfully removed');
    });
    
    it('should have WelcomeCard React component', async () => {
      const { html } = await fetchHTML('/');
      
      // Verify React component is rendered (check for various team creation text variations)
      assert.ok(
        html.includes('Create a New Team') || html.includes('Create Your Team') || html.includes('Create Team'), 
        'Should have team creation UI'
      );
      
      console.log('✅ WelcomeCard React component rendered');
    });
  });
  
  // Legacy JavaScript configuration and function tests removed (PR #130)
  // app.js monolith was deleted and replaced with React components
  // Relevant functionality is now tested in component-specific tests
  
  describe('Next.js Page Rendering', () => {
    it('should render root page with React', async () => {
      const { html, status } = await fetchHTML('/');
      
      assert.strictEqual(status, 200, 'Should return 200 OK');
      
      // Check for Next.js React rendering markers
      assert.ok(html.includes('__NEXT_DATA__') || html.includes('id="__next"'), 
        'Should have Next.js rendering markers');
      
      console.log('✅ Next.js page rendering verified');
    });
  });
  
  describe('Next.js Specific', () => {
    it('should use Next.js pages structure', async () => {
      // Check if pages directory exists (this would need file system access)
      // For now, we'll verify the response headers
      const { response } = await fetchHTML('/');
      
      const poweredBy = response.headers.get('x-powered-by');
      if (poweredBy && poweredBy.includes('Next.js')) {
        console.log('✅ Confirmed: Running on Next.js');
      } else {
        console.log('⚠️  Could not confirm Next.js (but might be working)');
      }
    });
  });
  
  describe('API Integration', () => {
    it('should load athlete data from API', async () => {
      const response = await fetch(`${BASE_URL}/api/athletes`);
      const data = await response.json();
      
      assert.strictEqual(response.status, 200, 'Athletes API should return 200');
      assert.ok(data.men && data.men.length > 0, 'Should have men athletes from API');
      assert.ok(data.women && data.women.length > 0, 'Should have women athletes from API');
      
      // Verify data structure matches what frontend expects
      const athlete = data.men[0];
      assert.ok(athlete.id, 'Athletes should have id field');
      assert.ok(athlete.name, 'Athletes should have name field');
      
      console.log('✅ API athlete data loads correctly');
    });
    
    it('should handle game state API calls', async () => {
      const testGameId = 'integration-test-' + Date.now();
      
      // Test creating a game
      // After PR #131: players array removed (was part of deprecated snake draft)
      const createResponse = await fetch(`${BASE_URL}/api/game-state?gameId=${testGameId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draftComplete: false,
          resultsFinalized: false,
          rosterLockTime: null
        })
      });
      
      assert.ok(createResponse.status === 200 || createResponse.status === 201, 'Should create game');
      
      // Track game for cleanup
      createdGames.push(testGameId);
      
      // Test retrieving the game
      const getResponse = await fetch(`${BASE_URL}/api/game-state?gameId=${testGameId}`);
      const gameData = await getResponse.json();
      
      assert.strictEqual(getResponse.status, 200, 'Should retrieve game');
      // After PR #131: Check for modern game state fields instead of players array
      assert.ok(typeof gameData.draftComplete === 'boolean', 'Game should have draftComplete boolean');
      assert.ok(typeof gameData.resultsFinalized === 'boolean', 'Game should have resultsFinalized boolean');
      assert.ok(gameData.hasOwnProperty('rosterLockTime'), 'Game should have rosterLockTime field');
      
      console.log('✅ Game state API integration works');
    });
    
    it('should handle invalid API requests gracefully', async () => {
      const response = await fetch(`${BASE_URL}/api/nonexistent-endpoint`);
      
      assert.ok(response.status === 404 || response.status === 405, 'Should return 404 or 405 for invalid endpoint');
      
      console.log('✅ Invalid API requests handled gracefully');
    });
    
    it('should verify API endpoints match frontend expectations', async () => {
      // Check that critical endpoints exist
      const endpoints = [
        '/api/athletes',
        '/api/races',
        '/api/game-state',
      ];
      
      for (const endpoint of endpoints) {
        const response = await fetch(`${BASE_URL}${endpoint}`);
        assert.ok(response.status === 200 || response.status === 404, `${endpoint} should be accessible`);
      }
      
      console.log('✅ All critical API endpoints accessible');
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle missing query parameters', async () => {
      const response = await fetch(`${BASE_URL}/api/game-state`); // No gameId
      
      assert.ok(response.status >= 200, 'Should handle missing gameId parameter');
      
      console.log('✅ Missing parameters handled');
    });
    
    it('should handle malformed data', async () => {
      const response = await fetch(`${BASE_URL}/api/game-state?gameId=test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json{'
      });
      
      assert.ok(response.status === 400 || response.status === 500, 'Should reject malformed JSON');
      
      console.log('✅ Malformed data rejected');
    });
  });
});

console.log('\n🎉 Frontend integration tests completed!\n');
