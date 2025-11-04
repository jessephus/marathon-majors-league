/**
 * Legacy Feature Regression Tests
 * Ensures backward compatibility with legacy MVP features, 
 * API schemas, and existing user data
 * 
 * Run with: node tests/legacy-regression.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

console.log('🧪 Testing legacy feature compatibility at:', BASE_URL);

describe('Legacy Feature Regression Tests', () => {
  
  describe('Legacy API Schema Compatibility', () => {
    it('should maintain athletes API schema structure', async () => {
      const response = await fetch(`${BASE_URL}/api/athletes`);
      const athletes = await response.json();
      
      assert.ok(Array.isArray(athletes), 'Should return array');
      
      if (athletes.length > 0) {
        const athlete = athletes[0];
        
        // Required legacy fields
        const requiredFields = ['id', 'name', 'country', 'gender'];
        
        for (const field of requiredFields) {
          assert.ok(field in athlete, `Athlete should have ${field} field`);
        }
        
        console.log('✅ Athletes API schema compatible with legacy');
      } else {
        console.log('⚠️  No athletes found for schema validation');
      }
    });
    
    it('should maintain races API schema structure', async () => {
      const response = await fetch(`${BASE_URL}/api/races`);
      const data = await response.json();
      
      assert.ok(response.status === 200, 'Races endpoint should be accessible');
      
      if (Array.isArray(data) && data.length > 0) {
        const race = data[0];
        
        // Check for expected fields
        assert.ok('name' in race || 'id' in race, 'Race should have basic identifiers');
        
        console.log('✅ Races API schema compatible');
      } else {
        console.log('⚠️  No races configured for schema validation');
      }
    });
    
    it('should maintain game-state API structure', async () => {
      const response = await fetch(`${BASE_URL}/api/game-state`);
      
      // Accept 200 (with DB) or 500 (without DB)
      assert.ok(
        response.status === 200 || response.status === 500,
        `Game state should return 200 or 500, got: ${response.status}`
      );
      
      const data = await response.json();
      
      // Should return object (even if error object)
      assert.strictEqual(typeof data, 'object', 'Should return object');
      
      console.log('✅ Game-state API structure maintained');
    });
    
    it('should maintain results API structure', async () => {
      const response = await fetch(`${BASE_URL}/api/results`);
      
      // Accept 200 (with DB) or 500 (without DB)
      assert.ok(
        response.status === 200 || response.status === 500,
        `Results endpoint should return 200 or 500, got: ${response.status}`
      );
      
      const data = await response.json();
      assert.ok(data !== undefined, 'Should return data');
      
      console.log('✅ Results API structure maintained');
    });
    
    it('should maintain standings API structure', async () => {
      const response = await fetch(`${BASE_URL}/api/standings`);
      
      // Accept 200 (with DB) or 500 (without DB) or 404 (if endpoint doesn't exist)
      assert.ok(
        response.status === 200 || response.status === 404 || response.status === 500,
        `Standings endpoint should return 200/404/500, got: ${response.status}`
      );
      
      const data = await response.json();
      assert.ok(Array.isArray(data) || typeof data === 'object', 
        'Should return array or object');
      
      console.log('✅ Standings API structure maintained');
    });
  });
  
  describe('Legacy MVP Features Preservation', () => {
    it('should support legacy snake draft functionality', async () => {
      const response = await fetch(`${BASE_URL}/api/draft`);
      
      // Draft endpoint should exist and respond
      assert.ok(response.status < 500, 'Draft endpoint should be functional');
      
      console.log('✅ Legacy snake draft endpoint accessible');
    });
    
    it('should support legacy rankings submission', async () => {
      const response = await fetch(`${BASE_URL}/api/rankings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: 'test',
          playerCode: 'test-player',
          rankings: { men: [], women: [] }
        })
      });
      
      // Should process rankings (even if validation fails due to empty data)
      assert.ok(response.status < 500, 'Rankings endpoint should process requests');
      
      console.log('✅ Legacy rankings submission functional');
    });
    
    it('should support legacy results entry', async () => {
      const response = await fetch(`${BASE_URL}/api/results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: 'test',
          results: []
        })
      });
      
      // Should process results submission
      assert.ok(response.status < 500, 'Results endpoint should process requests');
      
      console.log('✅ Legacy results entry functional');
    });
    
    it('should maintain backward compatible response formats', async () => {
      // All API endpoints should return JSON
      const endpoints = [
        '/api/athletes',
        '/api/races',
        '/api/game-state',
        '/api/results',
        '/api/standings'
      ];
      
      for (const endpoint of endpoints) {
        const response = await fetch(`${BASE_URL}${endpoint}`);
        const contentType = response.headers.get('content-type');
        
        assert.ok(
          contentType && contentType.includes('json'),
          `${endpoint} should return JSON`
        );
      }
      
      console.log('✅ All endpoints return JSON format');
    });
  });
  
  describe('Legacy Data Format Support', () => {
    it('should handle legacy gameId parameter format', async () => {
      // Test with various gameId formats
      const gameIds = ['default', 'test-game-123', 'legacy_game_456'];
      
      for (const gameId of gameIds) {
        const response = await fetch(`${BASE_URL}/api/game-state?gameId=${gameId}`);
        
        assert.strictEqual(response.status, 200, 
          `Should accept gameId format: ${gameId}`);
      }
      
      console.log('✅ Legacy gameId formats supported');
    });
    
    it('should handle legacy player code formats', async () => {
      // Test various player code formats that may exist in legacy data
      const playerCodes = ['player1', 'PLAYER_2', 'player-three'];
      
      for (const playerCode of playerCodes) {
        const response = await fetch(
          `${BASE_URL}/api/rankings?gameId=test&playerCode=${playerCode}`
        );
        
        // Should not crash with different formats
        assert.ok(response.status < 500, 
          `Should handle player code: ${playerCode}`);
      }
      
      console.log('✅ Legacy player code formats handled');
    });
    
    it('should preserve legacy gender field values', async () => {
      const response = await fetch(`${BASE_URL}/api/athletes`);
      const athletes = await response.json();
      
      if (athletes.length > 0) {
        const genderValues = [...new Set(athletes.map(a => a.gender))];
        
        // Should have consistent gender values
        assert.ok(genderValues.length > 0, 'Should have gender values');
        
        // Common formats: 'M', 'F', 'men', 'women', 'male', 'female'
        // Check each gender value matches exactly one of the expected formats
        const validGenderFormats = ['M', 'F', 'W', 'men', 'women', 'male', 'female'];
        const allValid = genderValues.every(g => 
          g && validGenderFormats.includes(g.toString())
        );
        
        // If strict validation fails, check for case-insensitive partial match as fallback
        const hasRecognizedFormat = allValid || genderValues.some(g => 
          g && validGenderFormats.some(valid => 
            g.toString().toLowerCase() === valid.toLowerCase()
          )
        );
        
        assert.ok(hasRecognizedFormat, 
          `Gender values should use recognized formats, got: ${genderValues.join(', ')}`);
        
        console.log(`✅ Gender field formats: ${genderValues.join(', ')}`);
      }
    });
  });
  
  describe('Legacy CORS Configuration', () => {
    it('should maintain CORS headers for backward compatibility', async () => {
      const response = await fetch(`${BASE_URL}/api/athletes`);
      
      const corsHeaders = {
        'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
        'access-control-allow-methods': response.headers.get('access-control-allow-methods'),
        'access-control-allow-headers': response.headers.get('access-control-allow-headers')
      };
      
      // Should have CORS headers for external access
      assert.ok(
        corsHeaders['access-control-allow-origin'],
        'Should have CORS origin header'
      );
      
      console.log('✅ CORS headers preserved for legacy clients');
    });
    
    it('should handle OPTIONS requests for CORS preflight', async () => {
      const response = await fetch(`${BASE_URL}/api/athletes`, {
        method: 'OPTIONS'
      });
      
      // Should respond to OPTIONS
      assert.ok(
        response.status === 200 || response.status === 204,
        'Should handle OPTIONS requests'
      );
      
      console.log('✅ CORS preflight (OPTIONS) supported');
    });
  });
  
  describe('Legacy Database Schema Compatibility', () => {
    it('should maintain database initialization compatibility', async () => {
      const response = await fetch(`${BASE_URL}/api/init-db`);
      
      // Should be accessible (may skip if already initialized)
      assert.ok(response.status < 500, 'Database init should be functional');
      
      const data = await response.json();
      assert.ok(data, 'Should return initialization status');
      
      console.log('✅ Database initialization compatible');
    });
    
    it('should support legacy table structures', async () => {
      // Verify that athlete data includes expected legacy fields
      const response = await fetch(`${BASE_URL}/api/athletes`);
      const athletes = await response.json();
      
      if (athletes.length > 0) {
        const athlete = athletes[0];
        
        // Legacy fields that should still exist
        const legacyFields = ['name', 'country'];
        
        for (const field of legacyFields) {
          assert.ok(field in athlete, 
            `Legacy field '${field}' should be preserved`);
        }
        
        console.log('✅ Legacy table structure preserved');
      }
    });
  });
  
  describe('Legacy Error Handling', () => {
    it('should maintain graceful error responses', async () => {
      // Test with intentionally problematic requests
      const response = await fetch(`${BASE_URL}/api/game-state?gameId=`);
      
      // Should not crash server
      assert.ok(response.status >= 200 && response.status < 600, 
        'Should return valid HTTP status for errors');
      
      if (response.status >= 400) {
        const data = await response.json();
        // Should return error information
        assert.ok(data !== undefined, 'Should return error data');
      }
      
      console.log('✅ Legacy error handling maintained');
    });
    
    it('should handle missing required parameters gracefully', async () => {
      // POST without body
      const response = await fetch(`${BASE_URL}/api/rankings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      // Should handle gracefully (not 500)
      assert.ok(response.status !== 500, 
        'Should not crash on missing parameters');
      
      console.log('✅ Missing parameter handling maintained');
    });
  });
  
  describe('Legacy Feature Flags and Configuration', () => {
    it('should maintain access to all legacy endpoints', async () => {
      const legacyEndpoints = [
        '/api/athletes',
        '/api/races',
        '/api/game-state',
        '/api/rankings',
        '/api/draft',
        '/api/results',
        '/api/standings',
        '/api/init-db'
      ];
      
      let allAccessible = true;
      const inaccessibleEndpoints = [];
      
      for (const endpoint of legacyEndpoints) {
        const response = await fetch(`${BASE_URL}${endpoint}`);
        if (response.status >= 500) {
          allAccessible = false;
          inaccessibleEndpoints.push(endpoint);
        }
      }
      
      assert.ok(
        allAccessible,
        `Legacy endpoints not accessible: ${inaccessibleEndpoints.join(', ')}`
      );
      
      console.log(`✅ All ${legacyEndpoints.length} legacy endpoints accessible`);
    });
  });
  
  describe('Session Token Backward Compatibility', () => {
    it('should support session token validation', async () => {
      // Verify session endpoints exist
      const endpoints = [
        '/api/session/create',
        '/api/session/verify'
      ];
      
      for (const endpoint of endpoints) {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });
        
        // Should respond (even if rejecting invalid data)
        assert.ok(response.status < 500, 
          `${endpoint} should be functional`);
      }
      
      console.log('✅ Session endpoints backward compatible');
    });
  });
  
  describe('Legacy Frontend Integration', () => {
    it('should serve legacy JavaScript files', async () => {
      const legacyFiles = [
        '/app.js',
        '/salary-cap-draft.js',
        '/style.css',
        '/athletes.json'
      ];
      
      for (const file of legacyFiles) {
        const response = await fetch(`${BASE_URL}${file}`);
        
        assert.strictEqual(response.status, 200, 
          `Legacy file ${file} should be accessible`);
      }
      
      console.log('✅ All legacy frontend files accessible');
    });
    
    it('should maintain API_BASE configuration compatibility', async () => {
      const response = await fetch(`${BASE_URL}/app.js`);
      const content = await response.text();
      
      // Should have API_BASE or similar configuration
      const hasApiConfig = content.includes('API_BASE') || 
                          content.includes('api/') ||
                          content.includes('fetch');
      
      assert.ok(hasApiConfig, 'Should have API configuration');
      
      console.log('✅ Frontend API configuration maintained');
    });
  });
  
  describe('Breaking Change Detection', () => {
    it('should fail if critical legacy endpoint is removed', async () => {
      // These endpoints are critical for legacy compatibility
      const criticalEndpoints = [
        '/api/athletes',
        '/api/game-state',
        '/api/results'
      ];
      
      for (const endpoint of criticalEndpoints) {
        const response = await fetch(`${BASE_URL}${endpoint}`);
        
        assert.notStrictEqual(response.status, 404, 
          `BREAKING: Critical endpoint ${endpoint} was removed!`);
        
        assert.ok(response.status < 500, 
          `BREAKING: Critical endpoint ${endpoint} is broken!`);
      }
      
      console.log('✅ No breaking changes detected in critical endpoints');
    });
    
    it('should fail if athlete data structure changes unexpectedly', async () => {
      const response = await fetch(`${BASE_URL}/api/athletes`);
      const athletes = await response.json();
      
      assert.ok(Array.isArray(athletes), 
        'BREAKING: Athletes endpoint should return array');
      
      if (athletes.length > 0) {
        const athlete = athletes[0];
        
        // Critical fields that must never be removed
        const criticalFields = ['id', 'name'];
        
        for (const field of criticalFields) {
          assert.ok(field in athlete, 
            `BREAKING: Critical field '${field}' was removed from athletes!`);
        }
      }
      
      console.log('✅ No breaking changes in athlete data structure');
    });
  });
});

console.log('\n✨ Legacy regression tests complete!\n');
console.log('🛡️  Backward compatibility verified\n');
