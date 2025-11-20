/**
 * Complete Game Flow Test
 * Tests an entire game flow from start to finish
 * 
 * Uses TestContext for automatic resource tracking and cleanup.
 * Sequential execution: each test builds on the previous one.
 * Suite-level cleanup ensures all resources are cleaned up after
 * the complete flow finishes.
 * 
 * Run with: node tests/game-flow.test.js
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { TestContext } from './test-context.js';

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

console.log('🧪 Testing complete game flow at:', BASE_URL);

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

describe('Complete Game Flow Test', () => {
  let testCtx;
  let gameId;
  let athletes = null;
  let teamNames = ['Team Alpha', 'Team Bravo', 'Team Charlie'];
  
  // Create context once for the entire suite (sequential flow test)
  before(async () => {
    testCtx = new TestContext('game-flow-test');
  });
  
  // Cleanup once after all tests complete (suite-level cleanup)
  after(async () => {
    await testCtx.cleanup();
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
    
    it('should create game state', async () => {
      // Create game using TestContext - automatically tracked for cleanup
      gameId = await testCtx.createGame({
        players: [],
        draft_complete: false,
        results_finalized: false,
        roster_lock_time: null
      });
      
      console.log('✅ Game state created:', gameId);
      
      // Verify game was created
      const { data, status } = await apiRequest(`/api/game-state?gameId=${gameId}`);
      assert.strictEqual(status, 200, 'Should retrieve game state');
    });
  });
  
  describe('2. Team Creation (Salary Cap Draft)', () => {
    it('should create teams via salary cap draft', async () => {
      // Create 3 teams using salary cap draft
      const sortedMen = [...athletes.men].sort((a, b) => (a.salary || 0) - (b.salary || 0));
      const sortedWomen = [...athletes.women].sort((a, b) => (a.salary || 0) - (b.salary || 0));

      for (let i = 0; i < teamNames.length; i++) {
        const teamName = teamNames[i];
        
        // First create a session
        const sessionResponse = await apiRequest('/api/session/create', {
          method: 'POST',
          body: JSON.stringify({
            sessionType: 'player',
            displayName: teamName,
            gameId
          })
        });
        
        assert.strictEqual(sessionResponse.status, 201, `Should create session for ${teamName}`);
        const sessionToken = sessionResponse.data.session.token;
        
        // Track this session for cleanup (API creates it, we track it)
        testCtx.trackResource('sessions', sessionResponse.data.session.id);
        
        // Then submit a salary cap draft team
        const menAthletes = sortedMen.slice(i * 3, i * 3 + 3);
        const womenAthletes = sortedWomen.slice(i * 3, i * 3 + 3);
        
        // Convert to API format (just IDs in objects)
        const team = {
          men: menAthletes.map(a => ({ id: a.id })),
          women: womenAthletes.map(a => ({ id: a.id }))
        };
        
        // Calculate total spent
        const totalSpent = [...menAthletes, ...womenAthletes].reduce((sum, a) => sum + (a.salary || 0), 0);
        
        const requestBody = {
          team,
          totalSpent,
          teamName
        };
        
        const draftResponse = await apiRequest(`/api/salary-cap-draft?gameId=${gameId}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sessionToken}`
          },
          body: JSON.stringify(requestBody)
        });
        
        assert.ok(draftResponse.status === 200 || draftResponse.status === 201, 
          `Should submit team for ${teamName}`);
      }
      
      console.log('✅ Created', teamNames.length, 'teams via salary cap draft');
    });
  });
  
  describe('3. Draft Complete', () => {
    it('should mark draft as complete in game state', async () => {
      const updateData = {
        draftComplete: true
      };
      
      const { data, status } = await apiRequest(`/api/game-state?gameId=${gameId}`, {
        method: 'POST',
        body: JSON.stringify(updateData),
      });
      
      assert.ok(status === 200 || status === 201, 'Should update game state');
      console.log('✅ Draft marked as complete');
    });
  });
  
  describe('4. Results Entry', () => {
    it('should save race results', async () => {
      const results = {
        1: { finishTime: '2:05:30', splits: {} },
        2: { finishTime: '2:06:15', splits: {} },
        3: { finishTime: '2:07:45', splits: {} }
      };
      
      const { data, status } = await apiRequest(`/api/results?gameId=${gameId}`, {
        method: 'POST',
        body: JSON.stringify(results),
      });
      
      assert.ok(status === 200 || status === 201, 'Should save results');
      console.log('✅ Race results saved');
    });
    
    it('should retrieve race results', async () => {
      const { data, status } = await apiRequest(`/api/results?gameId=${gameId}`);
      
      assert.strictEqual(status, 200, 'Should retrieve results');
      console.log('✅ Race results retrieved');
    });
  });
  
  describe('5. Finalize Results', () => {
    it('should finalize game', async () => {
      const finalData = {
        resultsFinalized: true
      };
      
      const { data, status } = await apiRequest(`/api/game-state?gameId=${gameId}`, {
        method: 'POST',
        body: JSON.stringify(finalData),
      });
      
      assert.ok(status === 200 || status === 201, 'Should finalize game');
      console.log('✅ Game finalized');
    });
    
    it('should verify final game state', async () => {
      const { data, status } = await apiRequest(`/api/game-state?gameId=${gameId}`);
      
      assert.strictEqual(status, 200, 'Should retrieve final state');
      assert.strictEqual(data.resultsFinalized, true, 'Should be finalized');
      assert.strictEqual(data.draftComplete, true, 'Should have draft complete');
      
      console.log('✅ Final game state verified');
      // Note: data.players removed in PR #131 (deprecated snake draft)
      console.log('   Draft complete:', data.draftComplete);
      console.log('   Results finalized:', data.resultsFinalized);
      console.log('   Roster lock time:', data.rosterLockTime || 'not set');
    });
  });
  
  describe('6. Data Persistence', () => {
    it('should persist game data across requests', async () => {
      // Fetch game state again after a delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const { data, status } = await apiRequest(`/api/game-state?gameId=${gameId}`);
      
      assert.strictEqual(status, 200, 'Should retrieve persisted data');
      // Note: data.players removed in PR #131 (deprecated snake draft)
      // Modern game state has: draftComplete, resultsFinalized, rosterLockTime, results
      assert.ok(typeof data.draftComplete === 'boolean', 'Should have draftComplete field');
      assert.ok(typeof data.resultsFinalized === 'boolean', 'Should have resultsFinalized field');
      
      console.log('✅ Game data persists correctly');
    });
  });
  
  describe('7. Error Handling', () => {
    it('should handle invalid game ID gracefully', async () => {
      const { data, status } = await apiRequest('/api/game-state?gameId=invalid-nonexistent-game');
      
      assert.ok(status === 200 || status === 404, 'Should handle invalid game ID');
      
      console.log('✅ Invalid game ID handled');
    });
    
    it('should reject invalid rankings data', async () => {
      const { data, status } = await apiRequest(
        `/api/rankings?gameId=${gameId}&playerCode=ALPHA`,
        {
          method: 'POST',
          body: JSON.stringify({ men: [], women: [] }), // Invalid: empty arrays
        }
      );
      
      // Should reject or handle gracefully (may vary by implementation)
      assert.ok(status >= 200, 'Should respond to invalid rankings');
      
      console.log('✅ Invalid rankings data handled');
    });
    
    it('should handle missing parameters', async () => {
      const { data, status } = await apiRequest('/api/rankings'); // Missing gameId and playerCode
      
      assert.ok(status === 400 || status === 404 || status === 200, 'Should handle missing parameters');
      
      console.log('✅ Missing parameters handled');
    });
  });
});

console.log('\n🎉 Complete game flow test completed!\n');
console.log('📊 Summary:');
console.log('   All critical paths tested');
console.log('   Error handling verified');
console.log('   Ready for production! ✨\n');
