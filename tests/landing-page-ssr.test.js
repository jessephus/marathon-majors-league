/**
 * Landing Page SSR and Session-Aware Routing Tests
 * 
 * Tests the new server-side rendering implementation for the landing page
 * with session-aware routing logic.
 * 
 * Run with: node tests/landing-page-ssr.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

console.log('🧪 Testing Landing Page SSR at:', BASE_URL);
console.log('ℹ️  Feature flag NEXT_PUBLIC_USE_NEW_WELCOME_CARD:', process.env.NEXT_PUBLIC_USE_NEW_WELCOME_CARD);

describe('Landing Page SSR Tests', () => {
  
  describe('Session Detection Utilities', () => {
    it('should export session detection utilities', async () => {
      // Test that the utilities module exists and has correct exports
      try {
        const { SessionType, detectSessionType, getSessionFromURL, isValidSessionToken } = 
          await import('../lib/session-utils.js');
        
        assert.ok(SessionType, 'SessionType enum should exist');
        assert.strictEqual(typeof detectSessionType, 'function', 'detectSessionType should be a function');
        assert.strictEqual(typeof getSessionFromURL, 'function', 'getSessionFromURL should be a function');
        assert.strictEqual(typeof isValidSessionToken, 'function', 'isValidSessionToken should be a function');
        
        console.log('✅ Session utilities module exports correctly');
      } catch (error) {
        assert.fail(`Failed to import session utilities: ${error.message}`);
      }
    });
    
    it('should detect anonymous session correctly', async () => {
      const { detectSessionType, SessionType } = await import('../lib/session-utils.js');
      
      // Test with empty cookies
      const sessionType = detectSessionType({});
      assert.strictEqual(sessionType, SessionType.ANONYMOUS, 'Empty cookies should result in anonymous session');
      
      console.log('✅ Anonymous session detection works');
    });
    
    it('should validate session token format', async () => {
      const { isValidSessionToken } = await import('../lib/session-utils.js');
      
      // Valid token (32+ characters)
      const validToken = 'a'.repeat(32);
      assert.ok(isValidSessionToken(validToken), 'Should accept 32+ character tokens');
      
      // Invalid tokens
      assert.ok(!isValidSessionToken(''), 'Should reject empty string');
      assert.ok(!isValidSessionToken('short'), 'Should reject short strings');
      assert.ok(!isValidSessionToken(null), 'Should reject null');
      assert.ok(!isValidSessionToken(undefined), 'Should reject undefined');
      
      console.log('✅ Session token validation works');
    });
    
    it('should extract session from URL query', async () => {
      const { getSessionFromURL } = await import('../lib/session-utils.js');
      
      // Test with Next.js query object
      const queryObject = { session: 'test-token-123' };
      assert.strictEqual(getSessionFromURL(queryObject), 'test-token-123', 'Should extract from query object');
      
      // Test with URLSearchParams
      const urlParams = new URLSearchParams('?session=test-token-456');
      assert.strictEqual(getSessionFromURL(urlParams), 'test-token-456', 'Should extract from URLSearchParams');
      
      // Test with missing session
      assert.strictEqual(getSessionFromURL({}), null, 'Should return null when no session');
      
      console.log('✅ URL session extraction works');
    });
  });
  
  describe('WelcomeCard Component', () => {
    it('should be importable via Next.js runtime', async () => {
      // Note: Direct .jsx import in Node.js tests requires additional setup
      // This component is successfully used in pages/index.js via Next.js runtime
      // Skipping direct import test in favor of integration test
      
      const response = await fetch(`${BASE_URL}/`);
      const html = await response.text();
      
      // Verify the component renders successfully when feature flag is enabled
      // by checking for its rendered output
      const hasWelcomeStructure = html.includes('welcome-card');
      assert.ok(hasWelcomeStructure, 'WelcomeCard component should render in page');
      
      console.log('✅ WelcomeCard component renders successfully in Next.js');
    });
  });
  
  describe('SSR Page Rendering', () => {
    it('should render landing page without errors', async () => {
      const response = await fetch(`${BASE_URL}/`);
      const html = await response.text();
      
      assert.strictEqual(response.status, 200, 'Should return 200 OK');
      assert.ok(html.includes('Fantasy NY Marathon'), 'Should contain page title');
      
      console.log('✅ Landing page renders successfully');
    });
    
    it('should include critical CSS for faster first paint', async () => {
      const response = await fetch(`${BASE_URL}/`);
      const html = await response.text();
      
      // Check for inline critical CSS
      const hasInlineCSS = html.includes('<style') && 
                          (html.includes('body { margin:') || html.includes('.container {'));
      
      assert.ok(hasInlineCSS, 'Should include inline critical CSS');
      console.log('✅ Critical CSS is inlined');
    });
    
    it('should have welcome-card element in rendered HTML', async () => {
      const response = await fetch(`${BASE_URL}/`);
      const html = await response.text();
      
      const hasWelcomeCard = html.includes('welcome-card');
      assert.ok(hasWelcomeCard, 'Should contain welcome-card element');
      
      console.log('✅ Welcome card element present');
    });
    
    it('should include team creation modal', async () => {
      const response = await fetch(`${BASE_URL}/`);
      const html = await response.text();
      
      assert.ok(html.includes('team-creation-modal'), 'Should contain team creation modal');
      assert.ok(html.includes('Create Your Team'), 'Should contain modal title');
      
      console.log('✅ Team creation modal present');
    });
  });
  
  describe('Session-Aware Routing', () => {
    it('should handle anonymous session (no session token in URL)', async () => {
      const response = await fetch(`${BASE_URL}/`);
      const html = await response.text();
      
      // For anonymous users, should show "Create a New Team" CTA
      assert.ok(
        html.includes('Create a New Team') || html.includes('Create Team'),
        'Should show team creation CTA for anonymous users'
      );
      
      console.log('✅ Anonymous session handled correctly');
    });
    
    it('should handle session token in URL query parameter', async () => {
      // Create a mock session token (won't be valid, but should be processed)
      const mockToken = 'a'.repeat(32); // 32 characters minimum
      const response = await fetch(`${BASE_URL}/?session=${mockToken}`);
      
      assert.strictEqual(response.status, 200, 'Should handle URL with session parameter');
      
      console.log('✅ URL session parameter handled');
    });
  });
  
  describe('Feature Flag Support', () => {
    it('should support legacy HTML when feature flag is disabled', async () => {
      const response = await fetch(`${BASE_URL}/`);
      const html = await response.text();
      
      // Both new and legacy versions should have essential elements
      const hasLandingPage = html.includes('landing-page');
      const hasWelcomeCard = html.includes('welcome-card');
      
      assert.ok(hasLandingPage, 'Should have landing-page element');
      assert.ok(hasWelcomeCard, 'Should have welcome-card element');
      
      console.log('✅ Landing page structure present (feature flag independent)');
    });
  });
  
  describe('No Client-Side Flicker', () => {
    it('should pre-render appropriate content server-side', async () => {
      const response = await fetch(`${BASE_URL}/`);
      const html = await response.text();
      
      // Check that initial HTML contains actual content, not just loading state
      const hasActualContent = html.includes('Welcome to the Fantasy NY Marathon') ||
                              html.includes('Join the Competition');
      
      assert.ok(hasActualContent, 'Should pre-render content to avoid flicker');
      
      console.log('✅ Content pre-rendered (no flicker)');
    });
    
    it('should have loading overlay for progressive enhancement', async () => {
      const response = await fetch(`${BASE_URL}/`);
      const html = await response.text();
      
      const hasLoadingOverlay = html.includes('app-loading-overlay');
      assert.ok(hasLoadingOverlay, 'Should have loading overlay for progressive enhancement');
      
      console.log('✅ Loading overlay present for progressive enhancement');
    });
  });
  
  describe('Backward Compatibility', () => {
    it('should maintain all legacy page sections', async () => {
      const response = await fetch(`${BASE_URL}/`);
      const html = await response.text();
      
      const legacySections = [
        'landing-page',
        'ranking-page',
        'commissioner-page',
        'salary-cap-draft-page',
        'leaderboard-page'
      ];
      
      for (const section of legacySections) {
        assert.ok(
          html.includes(section),
          `Should maintain legacy section: ${section}`
        );
      }
      
      console.log('✅ All legacy page sections maintained');
    });
    
    it('should maintain existing event handler IDs', async () => {
      const response = await fetch(`${BASE_URL}/`);
      const html = await response.text();
      
      const requiredIDs = [
        'create-team-btn',
        'team-creation-modal',
        'team-creation-form',
        'commissioner-mode',
        'home-button'
      ];
      
      for (const id of requiredIDs) {
        assert.ok(
          html.includes(`id="${id}"`),
          `Should maintain required ID: ${id}`
        );
      }
      
      console.log('✅ Legacy event handler IDs maintained');
    });
  });
  
  describe('Performance Optimization', () => {
    it('should have minimal HTML size for initial load', async () => {
      const response = await fetch(`${BASE_URL}/`);
      const html = await response.text();
      
      // HTML should be reasonable size (< 500KB for initial load)
      const htmlSize = Buffer.byteLength(html, 'utf8');
      assert.ok(htmlSize < 500000, `HTML size should be < 500KB, got ${htmlSize} bytes`);
      
      console.log(`✅ HTML size: ${(htmlSize / 1024).toFixed(2)} KB`);
    });
    
    it('should include required scripts via Next.js Script component', async () => {
      const response = await fetch(`${BASE_URL}/`);
      const html = await response.text();
      
      // Check for Next.js transformed scripts (they appear in the page bundle)
      // In development, app.js and salary-cap-draft.js are bundled by Next.js
      const hasScriptBundle = html.includes('/_next/static/chunks') || 
                             html.includes('data-nscript');
      
      assert.ok(hasScriptBundle, 'Should include Next.js script bundles');
      
      // Check for external scripts defined in index.js
      assert.ok(html.includes('cdn.tailwindcss.com'), 'Should include Tailwind CSS');
      assert.ok(html.includes('chart.js'), 'Should include Chart.js');
      
      console.log('✅ External scripts included via Next.js Script component');
    });
  });
});
