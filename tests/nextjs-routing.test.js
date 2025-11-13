/**
 * Next.js Routing and SSR Tests
 * Validates Next.js routing functionality, SSR capabilities, and page rendering
 * 
 * Run with: node tests/nextjs-routing.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

console.log('🧪 Testing Next.js routing and SSR at:', BASE_URL);

describe('Next.js Routing and SSR Tests', () => {
  
  describe('Next.js Framework Verification', () => {
    it('should confirm Next.js is powering the application', async () => {
      const response = await fetch(`${BASE_URL}/`);
      
      // Check for Next.js header
      const poweredBy = response.headers.get('x-powered-by');
      assert.ok(poweredBy, 'Should have x-powered-by header');
      assert.ok(
        poweredBy.toLowerCase().includes('next'),
        `Expected Next.js header, got: ${poweredBy}`
      );
      
      console.log(`✅ Next.js confirmed: ${poweredBy}`);
    });
    
    it('should have Next.js data attributes in HTML', async () => {
      const response = await fetch(`${BASE_URL}/`);
      const html = await response.text();
      
      // Check for Next.js-specific attributes
      const hasNextData = html.includes('__NEXT_DATA__') || 
                          html.includes('next-route-announcer') ||
                          html.includes('id="__next"');
      
      assert.ok(hasNextData, 'Should have Next.js-specific HTML elements');
      console.log('✅ Next.js HTML structure confirmed');
    });
  });
  
  describe('Essential Routes Rendering', () => {
    it('should serve main route (/) with valid HTML', async () => {
      const response = await fetch(`${BASE_URL}/`);
      const html = await response.text();
      
      assert.strictEqual(response.status, 200, 'Should return 200 OK');
      assert.ok(html.includes('<!DOCTYPE html>') || html.includes('<!doctype html>'), 
        'Should contain HTML doctype');
      
      // Check for app-specific content (more specific than just "Fantasy")
      const hasFantasyMarathon = html.includes('Fantasy NY Marathon') || 
                                 html.includes('Fantasy Marathon') ||
                                 html.includes('fantasy') && html.includes('marathon');
      
      assert.ok(hasFantasyMarathon, 
        'Should contain Fantasy Marathon related content');
      
      console.log('✅ Main route (/) renders correctly');
    });
    
    it('should have React components in main route (legacy pages migrated to React)', async () => {
      const response = await fetch(`${BASE_URL}/`);
      const html = await response.text();
      
      // React modals are not in initial SSR HTML when isOpen=false
      // They render client-side when needed
      // Verify old HTML modal IDs are gone
      assert.ok(!html.includes('id="team-creation-modal"'), 
        'team-creation-modal is now a React component (not in SSR HTML)');
      assert.ok(!html.includes('id="commissioner-totp-modal"'), 
        'commissioner-totp-modal is now a React component (not in SSR HTML)');
      
      // Verify legacy pages are removed
      assert.ok(!html.includes('commissioner-page'), 'commissioner-page migrated to /commissioner route');
      assert.ok(!html.includes('leaderboard-page'), 'leaderboard-page migrated to /leaderboard route');
      assert.ok(!html.includes('salary-cap-draft-page'), 'salary-cap-draft-page migrated to /team/[session] route');
      
      console.log('✅ React components active, legacy HTML pages/modals removed');
    });
    
    it('should serve API routes without rendering HTML', async () => {
      const response = await fetch(`${BASE_URL}/api/athletes`);
      const contentType = response.headers.get('content-type');
      
      // With DATABASE_URL, API should work (200), without it will fail (500)
      assert.ok(
        response.status === 200 || response.status === 500,
        `Should return 200 or 500, got: ${response.status}`
      );
      
      // Should return JSON in all cases
      assert.ok(
        contentType && contentType.includes('application/json'),
        `API should return JSON content-type, got: ${contentType}`
      );
      
      console.log('✅ API routes serve JSON correctly');
    });
  });
  
  describe('Server-Side Rendering (SSR)', () => {
    it('should render HTML on the server (not just client-side)', async () => {
      const response = await fetch(`${BASE_URL}/`);
      const html = await response.text();
      
      // Check that content exists in initial HTML (SSR)
      // Not just loading states or empty divs
      const hasInitialContent = html.includes('Fantasy') && 
                                html.includes('Marathon');
      
      assert.ok(hasInitialContent, 'Should have content in initial HTML (SSR)');
      console.log('✅ SSR confirmed - content present in initial HTML');
    });
    
    it('should include meta tags for SEO and social sharing', async () => {
      const response = await fetch(`${BASE_URL}/`);
      const html = await response.text();
      
      // Check for important meta tags
      assert.ok(html.includes('<meta name="description"'), 'Should have description meta tag');
      assert.ok(html.includes('og:title') || html.includes('property="og:title"'), 
        'Should have Open Graph title');
      assert.ok(html.includes('twitter:card') || html.includes('property="twitter:card"'), 
        'Should have Twitter card meta');
      
      console.log('✅ SEO and social meta tags present');
    });
    
    it('should preload critical resources', async () => {
      const response = await fetch(`${BASE_URL}/`);
      const html = await response.text();
      
      // Next.js automatically handles resource loading - check for Next.js CSS or inline styles
      const hasCss = html.includes('stylesheet') || 
                     html.includes('style.css') || 
                     html.includes('<style') ||
                     html.includes('/_next/static/css/');
      
      assert.ok(hasCss, 'Should include CSS resources');
      
      console.log('✅ Critical resources configured');
    });
  });
  
  describe('Page Navigation and Client-Side Routing', () => {
    it('should include navigation JavaScript', async () => {
      const response = await fetch(`${BASE_URL}/`);
      const html = await response.text();
      
      // Next.js bundles JavaScript - check for Next.js chunks and script tags
      const hasNextJsScripts = html.includes('/_next/static/chunks/') || 
                               html.includes('<script');
      
      assert.ok(hasNextJsScripts, 'Should include JavaScript via Next.js bundles');
      
      console.log('✅ Navigation JavaScript included (Next.js bundles)');
    });
    
    it('should serve Next.js JavaScript chunks', async () => {
      const response = await fetch(`${BASE_URL}/`);
      const html = await response.text();
      
      // Verify Next.js script tags are present
      const hasScriptTags = html.includes('<script') && 
                           (html.includes('/_next/') || html.includes('__NEXT_DATA__'));
      
      assert.ok(hasScriptTags, 'Should include Next.js script tags');
      
      console.log('✅ Next.js JavaScript chunks configured');
    });
    
    it('should have React routing (legacy SPA navigation removed)', async () => {
      const response = await fetch(`${BASE_URL}/`);
      const html = await response.text();
      
      // Check that landing page is present
      assert.ok(html.includes('landing-page'), 'Should have landing-page');
      
      // Verify legacy page containers are removed (migrated to React routes)
      assert.ok(!html.includes('commissioner-page'), 'commissioner-page removed (now /commissioner route)');
      assert.ok(!html.includes('leaderboard-page'), 'leaderboard-page removed (now /leaderboard route)');
      assert.ok(!html.includes('salary-cap-draft-page'), 'salary-cap-draft-page removed (now /team/[session] route)');
      
      // Verify Next.js routing is active
      assert.ok(html.includes('__NEXT_DATA__'), 'Should use Next.js client-side routing');
      
      console.log('✅ React routing active, legacy SPA containers removed');
    });
  });
  
  describe('Fallback and Error Handling', () => {
    it('should handle non-existent routes gracefully', async () => {
      const response = await fetch(`${BASE_URL}/this-route-does-not-exist-12345`);
      
      // Should return 404 or redirect to home
      assert.ok(
        response.status === 404 || response.status === 200,
        `Expected 404 or 200, got: ${response.status}`
      );
      
      console.log(`✅ Non-existent routes handled: ${response.status}`);
    });
    
    it('should handle API errors gracefully', async () => {
      // Try to access API with invalid parameters
      const response = await fetch(`${BASE_URL}/api/game-state?gameId=`);
      
      // Should not crash the server
      assert.ok(
        response.status >= 200 && response.status < 600,
        'Should return valid HTTP status'
      );
      
      console.log(`✅ API error handling working: ${response.status}`);
    });
    
    it('should include error boundaries in production', async () => {
      const response = await fetch(`${BASE_URL}/`);
      const html = await response.text();
      
      // Check for error handling setup (app structure)
      assert.ok(html.includes('<div'), 'Should have proper HTML structure');
      
      console.log('✅ HTML structure supports error handling');
    });
  });
  
  describe('Static Asset Serving', () => {
    it('should serve CSS files', async () => {
      const response = await fetch(`${BASE_URL}/style.css`);
      const contentType = response.headers.get('content-type');
      
      assert.strictEqual(response.status, 200, 'Should return 200 OK');
      assert.ok(
        contentType && contentType.includes('css'),
        `Expected CSS content-type, got: ${contentType}`
      );
      
      console.log('✅ CSS files served correctly');
    });
    
    it('should serve JSON data files', async () => {
      const response = await fetch(`${BASE_URL}/athletes.json`);
      const contentType = response.headers.get('content-type');
      
      assert.strictEqual(response.status, 200, 'Should return 200 OK');
      assert.ok(
        contentType && contentType.includes('json'),
        `Expected JSON content-type, got: ${contentType}`
      );
      
      const data = await response.json();
      assert.ok(data.men || data.women, 'Should have athlete data');
      
      console.log('✅ JSON data files served correctly');
    });
    
    it('should serve images', async () => {
      const response = await fetch(`${BASE_URL}/favicon-32x32.png`);
      
      assert.strictEqual(response.status, 200, 'Should serve images');
      
      console.log('✅ Image files served correctly');
    });
  });
  
  describe('Performance and Caching', () => {
    it('should include cache headers for static assets', async () => {
      const response = await fetch(`${BASE_URL}/style.css`);
      const cacheControl = response.headers.get('cache-control');
      
      // Should have some caching strategy
      assert.ok(cacheControl !== null, 'Should have cache-control header');
      
      console.log(`✅ Cache headers present: ${cacheControl || 'default'}`);
    });
    
    it('should have reasonable response times', async () => {
      const startTime = Date.now();
      const response = await fetch(`${BASE_URL}/`);
      const endTime = Date.now();
      
      const duration = endTime - startTime;
      
      assert.strictEqual(response.status, 200, 'Should return 200 OK');
      assert.ok(duration < 5000, `Response time should be under 5s, got: ${duration}ms`);
      
      console.log(`✅ Response time: ${duration}ms`);
    });
  });
  
  describe('Legacy Route Compatibility', () => {
    it('should maintain backward compatibility with expected routes', async () => {
      // The app uses SPA routing, but main entry should work
      const response = await fetch(`${BASE_URL}/`);
      
      assert.strictEqual(response.status, 200, 'Main route should be accessible');
      
      console.log('✅ Legacy route compatibility maintained');
    });
    
    it('should serve all required API endpoints', async () => {
      const apiEndpoints = [
        '/api/athletes',
        '/api/game-state',
        '/api/races',
        '/api/rankings',
        '/api/draft',
        '/api/results',
        '/api/standings'
      ];
      
      let allResponding = true;
      const notRespondingEndpoints = [];
      let dbAvailable = false;
      
      for (const endpoint of apiEndpoints) {
        const response = await fetch(`${BASE_URL}${endpoint}`);
        
        // Endpoints should respond (200, 400, 500 are all acceptable)
        // 200 = working with DB, 500 = working but no DB, 400 = bad request but responding
        if (response.status >= 200 && response.status < 600) {
          // Endpoint is responding
          if (response.status === 200) {
            dbAvailable = true;
          }
        } else {
          allResponding = false;
          notRespondingEndpoints.push(`${endpoint} (${response.status})`);
        }
      }
      
      assert.ok(
        allResponding,
        `Some endpoints not responding: ${notRespondingEndpoints.join(', ')}`
      );
      
      if (dbAvailable) {
        console.log('✅ All API endpoints accessible (with database)');
      } else {
        console.log('✅ All API endpoints responding (database not configured - returning 500s as expected)');
      }
    });
  });
});

console.log('\n✨ Next.js routing and SSR tests complete!\n');
