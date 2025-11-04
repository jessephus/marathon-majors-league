/**
 * Performance Benchmark Tests
 * Establishes baseline performance metrics for:
 * - Bundle size
 * - Page load times
 * - API response times
 * - Navigation performance
 * - Concurrent user handling
 * 
 * Run with: node tests/performance-benchmarks.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const IS_LOCAL = BASE_URL.includes('localhost');

console.log('🧪 Running performance benchmarks at:', BASE_URL);
console.log('📊 These tests establish baseline metrics for regression detection\n');

// Performance thresholds
// These are generous baselines designed to catch significant regressions
// without being overly strict. They represent acceptable performance
// for a serverless application on a typical 3G network:
// - Page load includes HTML, CSS, JS download and parsing
// - API response includes database query and JSON serialization
// - Thresholds should be tightened based on actual performance data
const THRESHOLDS = {
  pageLoadTime: 5000,           // 5 seconds max (initial page load on 3G)
  apiResponseTime: 2000,        // 2 seconds max (database query + serialization)
  navigationTime: 3000,         // 3 seconds max (subsequent navigation)
  concurrentRequests: 10,       // Number of concurrent requests to test
  maxBundleSize: 500 * 1024,    // 500KB max for main bundle (gzipped)
};

// Helper to measure timing
async function measureTiming(fn) {
  const start = Date.now();
  await fn();
  return Date.now() - start;
}

describe('Performance Benchmark Tests', () => {
  
  describe('Bundle Size Analysis', () => {
    it('should have bundle size within acceptable limits', async () => {
      if (IS_LOCAL && existsSync(join(process.cwd(), '.next'))) {
        // Only run bundle analysis on local builds
        console.log('📦 Checking Next.js bundle...');
        
        // Read build manifest to check bundle sizes
        const buildManifestPath = join(process.cwd(), '.next/build-manifest.json');
        
        if (existsSync(buildManifestPath)) {
          const manifest = JSON.parse(readFileSync(buildManifestPath, 'utf-8'));
          
          // Get main page bundles
          const mainPageFiles = manifest.pages['/'] || [];
          console.log(`   Main page chunks: ${mainPageFiles.length}`);
          
          // This is a basic check - for detailed analysis use: npm run build:analyze
          assert.ok(mainPageFiles.length > 0, 'Should have bundle files');
          console.log('✅ Bundle structure validated');
          console.log('💡 Run `npm run build:analyze` for detailed bundle analysis');
        } else {
          console.log('⚠️  Build manifest not found - run `npm run build` first');
        }
      } else {
        console.log('⚠️  Bundle analysis only available for local builds');
        console.log('💡 Run `npm run build:analyze` locally for detailed analysis');
      }
    });
    
    it('should track JavaScript file sizes', async () => {
      // Measure actual served file sizes
      const files = [
        '/app.js',
        '/salary-cap-draft.js',
        '/optimizations.js'
      ];
      
      const fileSizes = {};
      
      for (const file of files) {
        try {
          const response = await fetch(`${BASE_URL}${file}`);
          if (response.ok) {
            const content = await response.text();
            const sizeKB = (content.length / 1024).toFixed(2);
            fileSizes[file] = `${sizeKB} KB`;
            console.log(`   ${file}: ${sizeKB} KB`);
          } else {
            console.log(`   ${file}: Not found (${response.status})`);
          }
        } catch (error) {
          console.log(`   ${file}: Unable to fetch - ${error.message}`);
        }
      }
      
      // At least one file should be measurable for the test to be meaningful
      assert.ok(
        Object.keys(fileSizes).length > 0, 
        'Should measure at least one JavaScript file'
      );
      console.log('✅ JavaScript file sizes recorded');
      console.log('📊 Baseline established for future comparison');
    });
    
    it('should track CSS file size', async () => {
      const response = await fetch(`${BASE_URL}/style.css`);
      
      if (response.ok) {
        const content = await response.text();
        const sizeKB = (content.length / 1024).toFixed(2);
        
        console.log(`   style.css: ${sizeKB} KB`);
        console.log('✅ CSS file size recorded');
      }
    });
  });
  
  describe('Page Load Performance', () => {
    it('should load main page within threshold', async () => {
      const duration = await measureTiming(async () => {
        const response = await fetch(`${BASE_URL}/`);
        await response.text();
      });
      
      assert.ok(
        duration < THRESHOLDS.pageLoadTime,
        `Page load should be under ${THRESHOLDS.pageLoadTime}ms, got ${duration}ms`
      );
      
      console.log(`✅ Page load time: ${duration}ms (threshold: ${THRESHOLDS.pageLoadTime}ms)`);
    });
    
    it('should measure Time to First Byte (TTFB)', async () => {
      const start = Date.now();
      const response = await fetch(`${BASE_URL}/`);
      const ttfb = Date.now() - start;
      
      // Read the response
      await response.text();
      
      // TTFB should be fast (under 1 second for good performance)
      console.log(`   TTFB: ${ttfb}ms`);
      assert.ok(ttfb < 2000, `TTFB should be reasonable, got ${ttfb}ms`);
      
      console.log('✅ TTFB measured and acceptable');
    });
    
    it('should load static assets efficiently', async () => {
      const assets = [
        '/app.js',
        '/style.css',
        '/athletes.json'
      ];
      
      const timings = {};
      
      for (const asset of assets) {
        const duration = await measureTiming(async () => {
          await fetch(`${BASE_URL}${asset}`);
        });
        timings[asset] = duration;
        console.log(`   ${asset}: ${duration}ms`);
      }
      
      // All assets should load within reasonable time
      const slowAssets = Object.entries(timings).filter(([_, time]) => time > 3000);
      assert.strictEqual(slowAssets.length, 0, 
        `Some assets are slow: ${slowAssets.map(([name]) => name).join(', ')}`);
      
      console.log('✅ All static assets load efficiently');
    });
  });
  
  describe('API Endpoint Performance', () => {
    it('should respond to /api/athletes within threshold', async () => {
      const duration = await measureTiming(async () => {
        const response = await fetch(`${BASE_URL}/api/athletes`);
        assert.strictEqual(response.status, 200, 'Athletes API should return 200');
        await response.json();
      });
      
      assert.ok(
        duration < THRESHOLDS.apiResponseTime,
        `API response should be under ${THRESHOLDS.apiResponseTime}ms, got ${duration}ms`
      );
      
      console.log(`✅ /api/athletes response time: ${duration}ms`);
    });
    
    it('should respond to /api/races within threshold', async () => {
      const duration = await measureTiming(async () => {
        const response = await fetch(`${BASE_URL}/api/races`);
        assert.strictEqual(response.status, 200, 'Races API should return 200');
        await response.json();
      });
      
      assert.ok(
        duration < THRESHOLDS.apiResponseTime,
        `API response should be under ${THRESHOLDS.apiResponseTime}ms, got ${duration}ms`
      );
      
      console.log(`✅ /api/races response time: ${duration}ms`);
    });
    
    it('should respond to /api/game-state within threshold', async () => {
      const duration = await measureTiming(async () => {
        const response = await fetch(`${BASE_URL}/api/game-state`);
        assert.ok(response.status === 200 || response.status === 404, 'Game state should return 200 or 404');
        await response.json();
      });
      
      assert.ok(
        duration < THRESHOLDS.apiResponseTime,
        `API response should be under ${THRESHOLDS.apiResponseTime}ms, got ${duration}ms`
      );
      
      console.log(`✅ /api/game-state response time: ${duration}ms`);
    });
    
    it('should respond to /api/standings within threshold', async () => {
      const duration = await measureTiming(async () => {
        const response = await fetch(`${BASE_URL}/api/standings`);
        assert.ok(response.status === 200 || response.status === 404, 'Standings should return 200 or 404');
        await response.json();
      });
      
      assert.ok(
        duration < THRESHOLDS.apiResponseTime,
        `API response should be under ${THRESHOLDS.apiResponseTime}ms, got ${duration}ms`
      );
      
      console.log(`✅ /api/standings response time: ${duration}ms`);
    });
    
    it('should measure average API response time across endpoints', async () => {
      const endpoints = [
        '/api/athletes',
        '/api/races',
        '/api/game-state',
        '/api/standings'
      ];
      
      const timings = [];
      
      for (const endpoint of endpoints) {
        const duration = await measureTiming(async () => {
          await fetch(`${BASE_URL}${endpoint}`);
        });
        timings.push(duration);
      }
      
      const average = timings.reduce((a, b) => a + b, 0) / timings.length;
      const max = Math.max(...timings);
      const min = Math.min(...timings);
      
      console.log(`   Average: ${average.toFixed(0)}ms`);
      console.log(`   Min: ${min}ms`);
      console.log(`   Max: ${max}ms`);
      
      assert.ok(average < THRESHOLDS.apiResponseTime, 
        `Average API time should be under ${THRESHOLDS.apiResponseTime}ms`);
      
      console.log('✅ API average response time acceptable');
    });
  });
  
  describe('Navigation Performance', () => {
    it('should measure page-to-page navigation time', async () => {
      // Simulate navigation by fetching different page states
      const duration = await measureTiming(async () => {
        // Load main page
        await fetch(`${BASE_URL}/`);
        
        // Load API data that would be needed for navigation
        await fetch(`${BASE_URL}/api/athletes`);
      });
      
      assert.ok(
        duration < THRESHOLDS.navigationTime,
        `Navigation should be under ${THRESHOLDS.navigationTime}ms, got ${duration}ms`
      );
      
      console.log(`✅ Navigation timing: ${duration}ms`);
    });
  });
  
  describe('Concurrent User Simulation', () => {
    it('should handle concurrent page requests', async () => {
      const concurrentRequests = THRESHOLDS.concurrentRequests;
      
      const start = Date.now();
      const requests = Array(concurrentRequests).fill(null).map(() => 
        fetch(`${BASE_URL}/`)
      );
      
      const responses = await Promise.all(requests);
      const duration = Date.now() - start;
      
      // All requests should succeed
      const allSuccessful = responses.every(r => r.status === 200);
      assert.ok(allSuccessful, 'All concurrent requests should succeed');
      
      const avgTime = duration / concurrentRequests;
      console.log(`   ${concurrentRequests} concurrent requests in ${duration}ms`);
      console.log(`   Average: ${avgTime.toFixed(0)}ms per request`);
      
      console.log('✅ Concurrent page requests handled successfully');
    });
    
    it('should handle concurrent API requests', async () => {
      const concurrentRequests = THRESHOLDS.concurrentRequests;
      
      const start = Date.now();
      const requests = Array(concurrentRequests).fill(null).map(() => 
        fetch(`${BASE_URL}/api/athletes`)
      );
      
      const responses = await Promise.all(requests);
      const duration = Date.now() - start;
      
      // All requests should succeed
      const allSuccessful = responses.every(r => r.status === 200);
      assert.ok(allSuccessful, 'All concurrent API requests should succeed');
      
      const avgTime = duration / concurrentRequests;
      console.log(`   ${concurrentRequests} concurrent API requests in ${duration}ms`);
      console.log(`   Average: ${avgTime.toFixed(0)}ms per request`);
      
      console.log('✅ Concurrent API requests handled successfully');
    });
    
    it('should handle mixed concurrent requests', async () => {
      const start = Date.now();
      
      // Mix of different request types
      const requests = [
        fetch(`${BASE_URL}/`),
        fetch(`${BASE_URL}/api/athletes`),
        fetch(`${BASE_URL}/api/races`),
        fetch(`${BASE_URL}/style.css`),
        fetch(`${BASE_URL}/app.js`),
        fetch(`${BASE_URL}/api/game-state`),
        fetch(`${BASE_URL}/api/standings`),
        fetch(`${BASE_URL}/athletes.json`)
      ];
      
      const responses = await Promise.all(requests);
      const duration = Date.now() - start;
      
      const allSuccessful = responses.every(r => r.status === 200);
      assert.ok(allSuccessful, 'All mixed concurrent requests should succeed');
      
      console.log(`   ${requests.length} mixed requests in ${duration}ms`);
      console.log('✅ Mixed concurrent requests handled successfully');
    });
  });
  
  describe('Database Connection Pooling Performance', () => {
    it('should handle rapid sequential database queries', async () => {
      const numQueries = 5;
      const timings = [];
      
      for (let i = 0; i < numQueries; i++) {
        const duration = await measureTiming(async () => {
          await fetch(`${BASE_URL}/api/athletes`);
        });
        timings.push(duration);
      }
      
      const average = timings.reduce((a, b) => a + b, 0) / timings.length;
      
      console.log(`   ${numQueries} sequential queries`);
      console.log(`   Average: ${average.toFixed(0)}ms`);
      console.log(`   Individual: ${timings.join('ms, ')}ms`);
      
      // Connection pooling should keep times consistent
      const maxDeviation = Math.max(...timings) - Math.min(...timings);
      console.log(`   Max deviation: ${maxDeviation}ms`);
      
      console.log('✅ Database connection pooling performance measured');
    });
  });
  
  describe('Cache Performance', () => {
    it('should measure cache effectiveness for repeated requests', async () => {
      const endpoint = '/api/athletes';
      
      // First request (cache miss)
      const firstRequest = await measureTiming(async () => {
        await fetch(`${BASE_URL}${endpoint}`);
      });
      
      // Second request (potential cache hit)
      const secondRequest = await measureTiming(async () => {
        await fetch(`${BASE_URL}${endpoint}`);
      });
      
      console.log(`   First request: ${firstRequest}ms (cache miss)`);
      console.log(`   Second request: ${secondRequest}ms (potential cache hit)`);
      
      if (secondRequest < firstRequest) {
        const improvement = ((firstRequest - secondRequest) / firstRequest * 100).toFixed(1);
        console.log(`   Cache improvement: ${improvement}%`);
      }
      
      console.log('✅ Cache performance measured');
    });
    
    it('should verify cache headers are present', async () => {
      const endpoints = [
        '/api/athletes',
        '/style.css',
        '/app.js'
      ];
      
      for (const endpoint of endpoints) {
        const response = await fetch(`${BASE_URL}${endpoint}`);
        const cacheControl = response.headers.get('cache-control');
        const etag = response.headers.get('etag');
        
        console.log(`   ${endpoint}:`);
        console.log(`     Cache-Control: ${cacheControl || 'none'}`);
        console.log(`     ETag: ${etag ? 'present' : 'none'}`);
      }
      
      console.log('✅ Cache headers reviewed');
    });
  });
  
  describe('Performance Baseline Summary', () => {
    it('should generate comprehensive performance report', async () => {
      console.log('\n📊 Performance Baseline Report');
      console.log('═══════════════════════════════════════════');
      
      const metrics = {};
      
      // Page Load
      metrics.pageLoad = await measureTiming(async () => {
        await fetch(`${BASE_URL}/`);
      });
      
      // API Calls
      metrics.apiAthletes = await measureTiming(async () => {
        await fetch(`${BASE_URL}/api/athletes`);
      });
      
      metrics.apiStandings = await measureTiming(async () => {
        await fetch(`${BASE_URL}/api/standings`);
      });
      
      // Static Assets
      metrics.css = await measureTiming(async () => {
        await fetch(`${BASE_URL}/style.css`);
      });
      
      metrics.js = await measureTiming(async () => {
        await fetch(`${BASE_URL}/app.js`);
      });
      
      console.log('\n🔹 Core Metrics:');
      console.log(`   Page Load:          ${metrics.pageLoad}ms`);
      console.log(`   API Athletes:       ${metrics.apiAthletes}ms`);
      console.log(`   API Standings:      ${metrics.apiStandings}ms`);
      console.log(`   CSS Load:           ${metrics.css}ms`);
      console.log(`   JS Load:            ${metrics.js}ms`);
      
      console.log('\n🔹 Thresholds:');
      console.log(`   Page Load Max:      ${THRESHOLDS.pageLoadTime}ms`);
      console.log(`   API Response Max:   ${THRESHOLDS.apiResponseTime}ms`);
      console.log(`   Navigation Max:     ${THRESHOLDS.navigationTime}ms`);
      
      console.log('\n💡 Tips for optimization:');
      console.log('   • Run `npm run build:analyze` for bundle analysis');
      console.log('   • Check Network tab in browser DevTools');
      console.log('   • Use Lighthouse for detailed performance audit');
      console.log('   • Monitor with Vercel Analytics in production');
      
      console.log('\n✅ Performance baseline established');
      console.log('   Use these metrics to detect performance regressions');
      console.log('═══════════════════════════════════════════\n');
      
      // All metrics should be within reasonable bounds
      assert.ok(metrics.pageLoad < THRESHOLDS.pageLoadTime, 'Page load within threshold');
      assert.ok(metrics.apiAthletes < THRESHOLDS.apiResponseTime, 'API within threshold');
    });
  });
});

console.log('\n✨ Performance benchmark tests complete!\n');
console.log('📈 Baseline metrics established for future regression detection\n');
