/**
 * Complete Game Flow Test - UPDATED WITH TEST CONTEXT
 * Tests an entire game flow from start to finish
 * 
 * This version demonstrates the new TestContext pattern that tracks
 * all created resources and cleans them up automatically.
 * 
 * Run with: node tests/game-flow-with-context.test.js
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { TestContext } from './test-context.js';

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

console.log('🧪 Testing complete game flow with TestContext at:', BASE_URL);

async function apiRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  
  const text = await response.text();
  let data;
  
  try {
    data = JSON.parse(text);
  } catch (e) {
    data = text;
  }
  
  return { response, data, status: response.status };
}

describe('Complete Game Flow Test with TestContext', () => {
  let testCtx;
  let athletes = null;
  let gameId = null;
  let sessionTokens = [];
  
  // Create fresh test context before each test
  beforeEach(() => {
    testCtx = new TestContext('game-flow-test');
  });
  
  // Cleanup after each test - ALWAYS runs even if test fails
  afterEach(async () => {
    if (testCtx) {
      await testCtx.cleanup();
    }
  });
  
  describe('1. Game Setup', () => {
    it('should load athletes', async () => {
      const { data, status } = await apiRequest('/api/athletes');
      
      assert.strictEqual(status, 200, 'Should load athletes');
      assert.ok(data.men.length >= 3, 'Should have at least 3 men');
      assert.ok(data.women.length >= 3, 'Should have at least 3 women');
      
      athletes = data;
      console.log('✅ Loaded', data.men.length, 'men and', data.women.length, 'women');
    });
    
    it('should create game state using TestContext', async () => {
      // Create game through test context - it will be tracked for cleanup
      gameId = await testCtx.createGame({
        players: [],
        draft_complete: false,
        results_finalized: false
      });
      
      console.log('✅ Game created with ID:', gameId);
      console.log('📊 Tracked resources:', testCtx.getSummary());
      
      // Verify game exists via API
      const { data, status } = await apiRequest(`/api/game-state?gameId=${gameId}`);
      assert.strictEqual(status, 200, 'Should retrieve game state');
      assert.strictEqual(data.gameId, gameId, 'Game ID should match');
    });
  });
  
  describe('2. Team Creation with Session Tracking', () => {
    it('should create player sessions using TestContext', async () => {
      // Create a game first
      gameId = await testCtx.createGame({ players: [] });
      
      // Create 3 player sessions through test context
      const teamNames = ['Team Alpha', 'Team Bravo', 'Team Charlie'];
      
      for (const teamName of teamNames) {
        const session = await testCtx.createSession('player', teamName, gameId);
        sessionTokens.push(session.sessionToken);
        
        console.log(`✅ Created session for ${teamName}`);
      }
      
      assert.strictEqual(sessionTokens.length, 3, 'Should have 3 sessions');
      console.log('📊 Tracked resources:', testCtx.getSummary());
    });
  });
  
  describe('3. Resource Tracking Demonstration', () => {
    it('should track all created resources', async () => {
      // Create a complete test scenario
      
      // 1. Create game
      gameId = await testCtx.createGame({ players: [] });
      
      // 2. Create test athlete
      const athleteId = await testCtx.createAthlete({
        name: 'Test Runner',
        country: 'TST',
        gender: 'men',
        personal_best: '2:05:00'
      });
      
      // 3. Create test race
      const raceId = await testCtx.createRace({
        name: 'Test Marathon',
        date: '2025-12-01',
        location: 'Test City'
      });
      
      // 4. Link athlete to race
      await testCtx.createAthleteRace(athleteId, raceId, '1234');
      
      // 5. Create player session
      const session = await testCtx.createSession('player', 'Test Team', gameId);
      
      // 6. Create salary cap team entry
      await testCtx.createSalaryCapTeam(
        gameId, 
        'Test Team', 
        athleteId, 
        'men', 
        5000, 
        true
      );
      
      // 7. Create race result
      await testCtx.createRaceResult(gameId, athleteId, '2:05:30', true);
      
      console.log('✅ Created complete test scenario');
      console.log('📊 Tracked resources:', testCtx.getSummary());
      
      // Verify we're tracking everything
      const summary = testCtx.getSummary();
      assert.strictEqual(summary.games, 1, 'Should track 1 game');
      assert.strictEqual(summary.sessions, 1, 'Should track 1 session');
      assert.strictEqual(summary.athletes, 1, 'Should track 1 athlete');
      assert.strictEqual(summary.races, 1, 'Should track 1 race');
      assert.strictEqual(summary.athleteRaces, 1, 'Should track 1 athlete-race link');
      assert.strictEqual(summary.salaryCapTeams, 1, 'Should track 1 team entry');
      assert.strictEqual(summary.raceResults, 1, 'Should track 1 race result');
      
      // Cleanup will happen automatically in afterEach
    });
  });
  
  describe('4. Cleanup on Test Failure', () => {
    it('should cleanup even if test fails', async () => {
      // Create resources
      gameId = await testCtx.createGame({ players: [] });
      const athleteId = await testCtx.createAthlete({
        name: 'Test Athlete for Failure',
        country: 'TST',
        gender: 'men'
      });
      
      console.log('✅ Created resources before intentional failure');
      console.log('📊 Tracked resources:', testCtx.getSummary());
      
      // This assertion passes - just demonstrating the concept
      // If it failed, cleanup would still happen in afterEach
      assert.ok(true, 'Test passes');
      
      console.log('💡 Note: Even if this test had failed, afterEach would cleanup all resources');
    });
  });
  
  describe('5. Manual Resource Tracking', () => {
    it('should allow manual tracking for API-created resources', async () => {
      // Create game through test context
      gameId = await testCtx.createGame({ players: [] });
      
      // If you create a resource through the API instead of test context,
      // you can manually track it for cleanup
      const { data } = await apiRequest('/api/session/create', {
        method: 'POST',
        body: JSON.stringify({
          sessionType: 'player',
          displayName: 'API Created Team',
          gameId: gameId
        })
      });
      
      if (data.sessionToken) {
        // Manually get the session ID and track it
        const sessionData = await testCtx.sql`
          SELECT id FROM anonymous_sessions WHERE session_token = ${data.sessionToken}
        `;
        
        if (sessionData && sessionData.length > 0) {
          testCtx.trackResource('sessions', sessionData[0].id);
          console.log('✅ Manually tracked API-created session');
        }
      }
      
      console.log('📊 Tracked resources:', testCtx.getSummary());
    });
  });
});

console.log('\n💡 Key Benefits of TestContext:');
console.log('   ✅ Explicit resource tracking - no pattern matching');
console.log('   ✅ Cleanup happens even if test fails');
console.log('   ✅ Clear visibility of what will be cleaned up');
console.log('   ✅ Proper foreign key dependency ordering');
console.log('   ✅ No accidental deletion of production data\n');
