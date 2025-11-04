/**
 * Database Connection Tests
 * Verifies database connectivity after Next.js migration
 * 
 * Run with: node tests/database.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

console.log('🧪 Testing database connectivity at:', BASE_URL);

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

describe('Database Connection Tests', () => {
  
  describe('Database Initialization', () => {
    it('should connect to Neon Postgres', async () => {
      const { data, status } = await apiRequest('/api/init-db');
      
      assert.strictEqual(status, 200, 'Should connect successfully');
      assert.strictEqual(data.database, 'Neon Postgres', 'Should use Neon Postgres');
      assert.ok(data.connectionTime, 'Should return connection time');
      
      console.log('✅ Connected to Neon Postgres');
      console.log('   Connection time:', data.connectionTime);
    });
    
    it('should have schema initialized', async () => {
      const { data, status } = await apiRequest('/api/init-db');
      
      assert.strictEqual(data.schemaExists, true, 'Schema should exist');
      
      console.log('✅ Database schema exists');
    });
  });
  
  describe('Data Integrity', () => {
    it('should have athletes seeded', async () => {
      const { data, status } = await apiRequest('/api/init-db');
      
      assert.ok(data.athletesCount > 0, 'Should have athletes in database');
      assert.ok(data.athletesCount >= 100, 'Should have at least 100 athletes (top 100)');
      
      // Verify actual count is reasonable (not suspiciously high or low)
      assert.ok(data.athletesCount <= 300, 'Athlete count should be reasonable (not corrupted)');
      
      console.log('✅ Athletes seeded:', data.athletesCount, 'total');
    });
    
    it('should have proper athlete data structure', async () => {
      const { data, status } = await apiRequest('/api/athletes');
      
      const athlete = data.men[0] || data.women[0];
      
      // Check all required fields exist
      assert.ok(athlete.id, 'Should have id');
      assert.ok(athlete.name, 'Should have name');
      assert.ok(athlete.country, 'Should have country');
      assert.ok(athlete.pb, 'Should have personal best');
      assert.ok(athlete.gender, 'Should have gender');
      
      // Verify actual data values (not just presence)
      assert.ok(typeof athlete.id === 'number', 'ID should be a number');
      assert.ok(athlete.name.length > 2, 'Name should be a real name');
      assert.ok(athlete.country.length === 3, 'Country should be 3-letter code');
      assert.ok(/^\d+:\d+:\d+$/.test(athlete.pb), 'Personal best should be in time format (HH:MM:SS)');
      
      // Check extended fields from World Athletics
      const hasExtendedFields = athlete.marathonRank || athlete.age || athlete.worldAthleticsId;
      if (hasExtendedFields) {
        console.log('✅ Extended athlete fields present (World Athletics data)');
      } else {
        console.log('⚠️  Extended fields not present (might need migration)');
      }
    });
    
    it('should handle edge cases - empty game query', async () => {
      // Test with non-existent game ID
      const { data, status } = await apiRequest('/api/game-state?gameId=nonexistent-test-game');
      
      assert.ok(status === 200 || status === 404, 'Should handle non-existent game gracefully');
      
      console.log('✅ Empty/invalid game query handled correctly');
    });
  });
  
  describe('Database Performance', () => {
    it('should retrieve athletes quickly', async () => {
      const startTime = Date.now();
      const { data, status } = await apiRequest('/api/athletes');
      const duration = Date.now() - startTime;
      
      assert.strictEqual(status, 200, 'Should return successfully');
      assert.ok(duration < 5000, 'Should respond within 5 seconds');
      
      console.log(`✅ Athletes query completed in ${duration}ms`);
    });
    
    it('should handle concurrent requests', async () => {
      const startTime = Date.now();
      
      const requests = [
        apiRequest('/api/athletes'),
        apiRequest('/api/races'),
        apiRequest('/api/game-state?gameId=test'),
      ];
      
      const results = await Promise.all(requests);
      const duration = Date.now() - startTime;
      
      // All requests should succeed
      results.forEach((result, i) => {
        assert.ok(result.status === 200 || result.status === 404, `Request ${i} should succeed`);
      });
      
      console.log(`✅ Handled 3 concurrent requests in ${duration}ms`);
    });
  });
  
  describe('Database Migrations', () => {
    it('should have all required tables', async () => {
      // We can infer this from successful API calls
      const tests = [
        { endpoint: '/api/athletes', table: 'athletes' },
        { endpoint: '/api/races', table: 'races' },
        { endpoint: '/api/game-state?gameId=test', table: 'games' },
      ];
      
      for (const test of tests) {
        const { status } = await apiRequest(test.endpoint);
        assert.ok(status === 200 || status === 404, `${test.table} table should be accessible`);
      }
      
      console.log('✅ All required tables accessible');
    });
  });
  
  describe('Type Safety', () => {
    it('should handle year as string (not integer)', async () => {
      // This was the bug we fixed - year column is VARCHAR but was being compared as integer
      const { data, status } = await apiRequest('/api/athletes');
      
      assert.strictEqual(status, 200, 'Should not throw type mismatch error');
      assert.ok(data.men || data.women, 'Should return athlete data');
      
      console.log('✅ Type mismatch bug fixed (year VARCHAR vs INTEGER)');
    });
  });
  
  describe('Connection Pooling', () => {
    it('should not exhaust connections', async () => {
      // Make multiple requests to test connection pooling
      const requests = [];
      for (let i = 0; i < 10; i++) {
        requests.push(apiRequest('/api/athletes?confirmedOnly=true'));
      }
      
      const results = await Promise.all(requests);
      
      // All should succeed
      results.forEach((result, i) => {
        assert.strictEqual(result.status, 200, `Request ${i} should succeed`);
      });
      
      console.log('✅ Connection pooling working (10 parallel requests succeeded)');
    });
  });
});

console.log('\n🎉 Database tests completed!\n');
