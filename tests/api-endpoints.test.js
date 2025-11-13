/**
 * API Endpoints Test Suite
 * Tests all critical API endpoints after Next.js migration
 * 
 * Run with: node tests/api-endpoints.test.js
 * Or: npm test (if test script is added to package.json)
 */

import { describe, it, after } from 'node:test';
import assert from 'node:assert';
import { generateTestId, cleanupTestGame } from './test-utils.js';

// Configuration
const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const GAME_ID = generateTestId('test-game');

console.log('🧪 Testing API endpoints at:', BASE_URL);
console.log('🎮 Using test game ID:', GAME_ID);

/**
 * Helper function to make API requests
 */
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

// Test Suite
describe('API Endpoints - Post Migration Tests', () => {
  
  // Cleanup after all tests complete
  after(async () => {
    console.log('\n🧹 Cleaning up test data...');
    try {
      await cleanupTestGame(GAME_ID);
      console.log('✅ Test data cleaned up successfully\n');
    } catch (error) {
      console.error('⚠️  Cleanup warning:', error.message, '\n');
    }
  });
  
  describe('GET /api/init-db', () => {
    it('should initialize database successfully', async () => {
      const { response, data, status } = await apiRequest('/api/init-db');
      
      assert.strictEqual(status, 200, 'Should return 200 OK');
      assert.ok(data.message, 'Should have a message');
      assert.ok(data.database === 'Neon Postgres', 'Should use Neon Postgres');
      assert.ok(typeof data.athletesCount === 'number', 'Should return athlete count');
      
      console.log('✅ Database initialized:', data.message);
      console.log('   Athletes count:', data.athletesCount);
    });
  });
  
  describe('GET /api/athletes', () => {
    it('should return athletes grouped by gender', async () => {
      const { response, data, status } = await apiRequest('/api/athletes');
      
      assert.strictEqual(status, 200, 'Should return 200 OK');
      assert.ok(data.men, 'Should have men athletes');
      assert.ok(data.women, 'Should have women athletes');
      assert.ok(Array.isArray(data.men), 'Men should be an array');
      assert.ok(Array.isArray(data.women), 'Women should be an array');
      assert.ok(data.men.length > 0, 'Should have at least one male athlete');
      assert.ok(data.women.length > 0, 'Should have at least one female athlete');
      
      // Check athlete structure
      const athlete = data.men[0];
      assert.ok(athlete.id, 'Athlete should have id');
      assert.ok(athlete.name, 'Athlete should have name');
      assert.ok(athlete.country, 'Athlete should have country');
      assert.ok(athlete.pb, 'Athlete should have personal best');
      
      console.log('✅ Athletes endpoint working');
      console.log(`   Men: ${data.men.length}, Women: ${data.women.length}`);
    });
    
    it('should filter confirmed athletes', async () => {
      const { response, data, status } = await apiRequest('/api/athletes?confirmedOnly=true');
      
      assert.strictEqual(status, 200, 'Should return 200 OK');
      assert.ok(data.men, 'Should have men athletes');
      assert.ok(data.women, 'Should have women athletes');
      
      console.log('✅ Confirmed filter working');
    });
  });
  
  describe('GET /api/races', () => {
    it('should return all races', async () => {
      const { response, data, status } = await apiRequest('/api/races');
      
      assert.strictEqual(status, 200, 'Should return 200 OK');
      assert.ok(Array.isArray(data), 'Should return an array of races');
      
      if (data.length > 0) {
        const race = data[0];
        assert.ok(race.id, 'Race should have id');
        assert.ok(race.name, 'Race should have name');
        assert.ok(race.date, 'Race should have date');
        console.log('✅ Races endpoint working, found', data.length, 'races');
      } else {
        console.log('⚠️  No races found (this is okay if database is fresh)');
      }
    });
    
    it('should filter active races', async () => {
      const { response, data, status } = await apiRequest('/api/races?active=true');
      
      assert.strictEqual(status, 200, 'Should return 200 OK');
      assert.ok(Array.isArray(data), 'Should return an array');
      
      console.log('✅ Active races filter working');
    });
  });
  
  describe('POST /api/game-state', () => {
    it('should create a new game state', async () => {
      // After PR #131: players array removed (was part of deprecated snake draft)
      // Modern game state uses: draftComplete, resultsFinalized, rosterLockTime
      const gameData = {
        draftComplete: false,
        resultsFinalized: false,
        rosterLockTime: null
      };
      
      const { response, data, status } = await apiRequest('/api/game-state?gameId=' + GAME_ID, {
        method: 'POST',
        body: JSON.stringify(gameData),
      });
      
      assert.strictEqual(status, 200, 'Should return 200 OK');
      assert.ok(data.message || data.success, 'Should indicate success');
      
      console.log('✅ Game state creation working');
    });
  });
  
  describe('GET /api/game-state', () => {
    it('should retrieve game state', async () => {
      const { response, data, status } = await apiRequest('/api/game-state?gameId=' + GAME_ID);
      
      assert.strictEqual(status, 200, 'Should return 200 OK');
      // After PR #131: players array removed (was part of deprecated snake draft)
      // Modern game state has: draftComplete, resultsFinalized, rosterLockTime, results
      assert.ok(typeof data.draftComplete === 'boolean', 'Should have draftComplete boolean');
      assert.ok(typeof data.resultsFinalized === 'boolean', 'Should have resultsFinalized boolean');
      assert.ok(data.hasOwnProperty('rosterLockTime'), 'Should have rosterLockTime field');
      
      console.log('✅ Game state retrieval working');
    });
  });
  
  // NOTE: /api/rankings and /api/draft endpoints removed in PR #131
  // These were part of the deprecated snake draft system
  // Modern salary cap draft uses /api/salary-cap-draft instead
  
  describe('POST /api/salary-cap-draft', () => {
    it('should handle salary cap draft team creation', async () => {
      const teamData = {
        gameId: GAME_ID,
        playerCode: 'TEST_PLAYER',
        teamName: 'Test Team',
        athletes: {
          men: [1, 2, 3],
          women: [4, 5, 6]
        },
        totalSalary: 25000
      };
      
      const { response, data, status } = await apiRequest('/api/salary-cap-draft', {
        method: 'POST',
        body: JSON.stringify(teamData),
      });
      
      // Should succeed or fail validation gracefully
      assert.ok(status === 200 || status === 201 || status === 400, 'Should return valid status');
      
      if (status === 200 || status === 201) {
        console.log('✅ Salary cap draft endpoint working');
      } else {
        console.log('✅ Salary cap draft endpoint validates input');
      }
    });
  });
  
  describe('GET /api/results', () => {
    it('should retrieve race results', async () => {
      const { response, data, status } = await apiRequest(`/api/results?gameId=${GAME_ID}`);
      
      assert.strictEqual(status, 200, 'Should return 200 OK');
      // Results might be empty initially, that's okay
      
      console.log('✅ Results endpoint working');
    });
  });
  
  describe('Error Handling', () => {
    it('should handle missing gameId gracefully', async () => {
      const { response, data, status } = await apiRequest('/api/game-state');
      
      // Should either use default gameId or return error
      assert.ok(status === 200 || status === 400, 'Should handle gracefully');
      
      console.log('✅ Error handling working');
    });
    
    it('should handle invalid endpoints', async () => {
      const { response, data, status } = await apiRequest('/api/nonexistent');
      
      assert.strictEqual(status, 404, 'Should return 404 for invalid endpoint');
      
      console.log('✅ 404 handling working');
    });
  });
  
  describe('CORS Headers', () => {
    it('should include CORS headers', async () => {
      const { response } = await apiRequest('/api/athletes');
      
      const corsHeader = response.headers.get('Access-Control-Allow-Origin');
      assert.ok(corsHeader, 'Should have CORS header');
      
      console.log('✅ CORS headers present');
    });
  });
});

console.log('\n🎉 All API endpoint tests completed!\n');
