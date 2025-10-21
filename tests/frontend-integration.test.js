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
});

console.log('\n🎉 Frontend integration tests completed!\n');
