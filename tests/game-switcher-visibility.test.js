/**
 * Game Switcher Visibility Test
 * Verifies that the game switcher is only visible to commissioners
 * 
 * Run with: node tests/game-switcher-visibility.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

console.log('🧪 Testing game switcher visibility at:', BASE_URL);

async function fetchHTML(path = '/') {
  const response = await fetch(`${BASE_URL}${path}`);
  const html = await response.text();
  return { html, status: response.status, response };
}

describe('Game Switcher Visibility Tests', () => {
  
  describe('CSS Rules', () => {
    it('should have CSS to hide game-switcher by default', async () => {
      const response = await fetch(`${BASE_URL}/style.css`);
      const css = await response.text();
      
      assert.strictEqual(response.status, 200, 'Should return 200 OK');
      
      // Check for the CSS rule that hides game-switcher by default
      assert.ok(
        css.includes('.game-switcher') && css.includes('display: none'),
        'CSS should hide .game-switcher by default'
      );
      
      console.log('✅ CSS hides game-switcher by default');
    });
    
    it('should have CSS to show game-switcher when visible class is added', async () => {
      const response = await fetch(`${BASE_URL}/style.css`);
      const css = await response.text();
      
      assert.strictEqual(response.status, 200, 'Should return 200 OK');
      
      // Check for the CSS rule that shows game-switcher with visible class
      assert.ok(
        css.includes('.game-switcher.visible') && css.includes('display: flex'),
        'CSS should show .game-switcher when .visible class is present'
      );
      
      console.log('✅ CSS shows game-switcher when .visible class is added');
    });
  });
  
  describe('JavaScript Logic', () => {
    it('should have logic to toggle game-switcher visibility', async () => {
      const response = await fetch(`${BASE_URL}/app.js`);
      const js = await response.text();
      
      assert.strictEqual(response.status, 200, 'Should return 200 OK');
      
      // Check for the updateFooterButtons function updates game-switcher
      assert.ok(
        js.includes('.game-switcher') && 
        js.includes('commissionerSession.isCommissioner'),
        'JavaScript should check commissioner status for game-switcher visibility'
      );
      
      assert.ok(
        js.includes("classList.add('visible')"),
        'JavaScript should add visible class when commissioner is logged in'
      );
      
      assert.ok(
        js.includes("classList.remove('visible')"),
        'JavaScript should remove visible class when not commissioner'
      );
      
      console.log('✅ JavaScript has logic to toggle game-switcher visibility');
    });
  });
  
  describe('HTML Structure', () => {
    it('should have game-switcher in footer', async () => {
      const { html, status } = await fetchHTML('/');
      
      assert.strictEqual(status, 200, 'Should return 200 OK');
      
      // Check for game-switcher div in HTML
      assert.ok(
        html.includes('game-switcher') && html.includes('game-select'),
        'HTML should contain game-switcher element with game-select dropdown'
      );
      
      console.log('✅ HTML contains game-switcher element in footer');
    });
  });
});

console.log('\n📝 Expected Behavior:');
console.log('  - Game switcher is HIDDEN by default (no visible class)');
console.log('  - Game switcher is SHOWN when commissioner logs in (visible class added)');
console.log('  - Game switcher is HIDDEN when commissioner logs out (visible class removed)');
console.log('\n🔍 Implementation:');
console.log('  - CSS: .game-switcher has display: none by default');
console.log('  - CSS: .game-switcher.visible has display: flex');
console.log('  - JS: updateFooterButtons() toggles visibility based on commissionerSession.isCommissioner');
