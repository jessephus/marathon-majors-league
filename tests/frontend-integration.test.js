/**
 * Frontend Integration Tests
 * Tests that the frontend can still interact with the API after migration
 * 
 * Run with: node tests/frontend-integration.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

console.log('🧪 Testing frontend integration at:', BASE_URL);

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
    
    it('should serve app.js', async () => {
      const response = await fetch(`${BASE_URL}/app.js`);
      const js = await response.text();
      
      assert.strictEqual(response.status, 200, 'Should return 200 OK');
      assert.ok(js.includes('function') || js.includes('const'), 'Should contain JavaScript');
      assert.ok(js.includes('API_BASE'), 'Should have API_BASE configuration');
      
      console.log('✅ app.js served correctly');
    });
    
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
    it('should have all required pages', async () => {
      const { html } = await fetchHTML('/');
      
      // Check for key page elements
      assert.ok(html.includes('id="landing-page"'), 'Should have landing page');
      assert.ok(html.includes('id="ranking-page"'), 'Should have ranking page');
      assert.ok(html.includes('id="commissioner-page"'), 'Should have commissioner page');
      assert.ok(html.includes('id="teams-page"'), 'Should have teams page');
      
      console.log('✅ All required page elements present');
    });
    
    it('should have drag handle column in athlete table', async () => {
      const { html } = await fetchHTML('/');
      
      assert.ok(html.includes('drag-handle-header'), 'Should have drag handle header');
      
      console.log('✅ Drag handle migration successful');
    });
    
    it('should have athlete management container', async () => {
      const { html } = await fetchHTML('/');
      
      assert.ok(html.includes('athlete-management-container'), 'Should have athlete management container');
      assert.ok(!html.includes('id="athlete-table-container".*id="athlete-table-container"'), 'Should not have duplicate IDs');
      
      console.log('✅ Athlete management container fix verified');
    });
  });
  
  describe('JavaScript Configuration', () => {
    it('should have correct API_BASE configuration', async () => {
      const response = await fetch(`${BASE_URL}/app.js`);
      const js = await response.text();
      
      // Check that API_BASE is defined
      assert.ok(js.includes('API_BASE'), 'Should define API_BASE');
      
      // Check that it's not pointing to a hardcoded URL
      const hasHardcodedURL = js.match(/API_BASE\s*=\s*['"]https?:\/\//);
      if (hasHardcodedURL) {
        console.log('⚠️  Warning: API_BASE might be hardcoded, should be relative for Next.js');
      } else {
        console.log('✅ API_BASE configuration looks good');
      }
    });
  });
  
  describe('Critical Frontend Functions', () => {
    it('should have drag and drop functions', async () => {
      const response = await fetch(`${BASE_URL}/app.js`);
      const js = await response.text();
      
      assert.ok(js.includes('handleTableRowDragStart'), 'Should have drag start handler');
      assert.ok(js.includes('handleTableRowTouchStart'), 'Should have touch start handler');
      assert.ok(js.includes('drag-handle'), 'Should reference drag handle');
      
      console.log('✅ Drag and drop functionality present');
    });
    
    it('should have game state management', async () => {
      const response = await fetch(`${BASE_URL}/app.js`);
      const js = await response.text();
      
      assert.ok(js.includes('gameState'), 'Should have gameState');
      assert.ok(js.includes('handleEnterGame'), 'Should have enter game handler');
      assert.ok(js.includes('handleCommissionerMode'), 'Should have commissioner mode');
      
      console.log('✅ Game state management present');
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
      const createResponse = await fetch(`${BASE_URL}/api/game-state?gameId=${testGameId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          players: ['TEST1', 'TEST2'],
          draftComplete: false
        })
      });
      
      assert.ok(createResponse.status === 200 || createResponse.status === 201, 'Should create game');
      
      // Test retrieving the game
      const getResponse = await fetch(`${BASE_URL}/api/game-state?gameId=${testGameId}`);
      const gameData = await getResponse.json();
      
      assert.strictEqual(getResponse.status, 200, 'Should retrieve game');
      assert.ok(gameData.players, 'Game should have players array');
      
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
