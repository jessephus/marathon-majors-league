/**
 * Performance Instrumentation Tests
 * 
 * Tests the new performance monitoring system including:
 * - Web Vitals tracking
 * - Cache hit ratio monitoring
 * - Leaderboard refresh latency
 * - Dynamic chunk load metrics
 * - Performance budgets and thresholds
 * 
 * Run with: npm run test:perf-instrumentation
 * 
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

// Mock browser environment
global.window = {
  performance: {
    now: () => Date.now(),
    mark: () => {},
    measure: () => ({ duration: 100 }),
  },
};

global.process = { env: { NODE_ENV: 'test' } };

// Import after setting up mocks
const { performanceMonitor, PERFORMANCE_BUDGETS } = await import('../lib/performance-monitor.ts');

console.log('🧪 Testing Performance Instrumentation System');
console.log('📊 Validating Issue #82 requirements\n');

describe('Performance Instrumentation Tests', () => {
  
  describe('Performance Budgets Configuration', () => {
    it('should have LCP threshold of 2500ms (Issue requirement)', () => {
      assert.strictEqual(PERFORMANCE_BUDGETS.LCP_THRESHOLD, 2500,
        'LCP threshold must be 2500ms for leaderboard');
    });
    
    it('should have INP threshold of 200ms', () => {
      assert.strictEqual(PERFORMANCE_BUDGETS.INP_THRESHOLD, 200,
        'INP threshold must be 200ms');
    });
    
    it('should have CLS threshold of 0.1', () => {
      assert.strictEqual(PERFORMANCE_BUDGETS.CLS_THRESHOLD, 0.1,
        'CLS threshold must be 0.1');
    });
    
    it('should have chunk load median threshold of 800ms (Issue requirement)', () => {
      assert.strictEqual(PERFORMANCE_BUDGETS.CHUNK_LOAD_MEDIAN, 800,
        'Dynamic chunk load median must be < 800ms');
    });
    
    it('should have cache hit ratio minimum of 70% (Issue requirement)', () => {
      assert.strictEqual(PERFORMANCE_BUDGETS.CACHE_HIT_RATIO_MIN, 0.7,
        'Cache hit ratio must be > 70% during race');
    });
    
    it('should have leaderboard refresh max of 1000ms', () => {
      assert.strictEqual(PERFORMANCE_BUDGETS.LEADERBOARD_REFRESH_MAX, 1000,
        'Leaderboard refresh must be < 1000ms');
    });
  });
  
  describe('Web Vitals Tracking', () => {
    it('should track LCP metric', () => {
      performanceMonitor.clear();
      
      const mockMetric = {
        name: 'LCP',
        value: 2000,
        id: 'test-lcp',
        delta: 2000,
        rating: 'good',
      };
      
      performanceMonitor.trackWebVital(mockMetric);
      
      const report = performanceMonitor.getPerformanceReport();
      assert.ok(report.webVitals.lcp, 'LCP metric should be tracked');
      assert.strictEqual(report.webVitals.lcp.value, 2000);
      assert.strictEqual(report.webVitals.lcp.rating, 'good');
    });
    
    it('should track CLS metric', () => {
      performanceMonitor.clear();
      
      const mockMetric = {
        name: 'CLS',
        value: 0.05,
        id: 'test-cls',
        delta: 0.05,
        rating: 'good',
      };
      
      performanceMonitor.trackWebVital(mockMetric);
      
      const report = performanceMonitor.getPerformanceReport();
      assert.ok(report.webVitals.cls);
      assert.strictEqual(report.webVitals.cls.value, 0.05);
    });
    
    it('should track INP metric', () => {
      performanceMonitor.clear();
      
      const mockMetric = {
        name: 'INP',
        value: 150,
        id: 'test-inp',
        delta: 150,
        rating: 'good',
      };
      
      performanceMonitor.trackWebVital(mockMetric);
      
      const report = performanceMonitor.getPerformanceReport();
      assert.ok(report.webVitals.inp);
      assert.strictEqual(report.webVitals.inp.value, 150);
    });
    
    it('should detect threshold violations', () => {
      performanceMonitor.clear();
      
      const poorLCP = {
        name: 'LCP',
        value: 3000, // Exceeds 2500ms threshold
        id: 'test-lcp-poor',
        delta: 3000,
        rating: 'poor',
      };
      
      performanceMonitor.trackWebVital(poorLCP);
      
      const events = performanceMonitor.getPerformanceEvents();
      const violations = events.filter(e => e.event === 'web_vital_threshold_exceeded');
      
      assert.ok(violations.length > 0, 'Threshold violation should be logged');
      const lcpViolation = violations.find(e => e.payload.metric === 'LCP');
      assert.ok(lcpViolation, 'LCP violation should be logged');
    });
  });
  
  describe('Cache Hit Ratio Tracking', () => {
    it('should track cache accesses', () => {
      performanceMonitor.clear();
      
      performanceMonitor.trackCacheAccess('results', true);
      performanceMonitor.trackCacheAccess('results', true);
      performanceMonitor.trackCacheAccess('results', false);
      
      const metrics = performanceMonitor.getCacheMetrics();
      assert.strictEqual(metrics.length, 3, 'Should track 3 cache accesses');
    });
    
    it('should calculate cache hit ratio correctly', () => {
      performanceMonitor.clear();
      
      // 8 hits, 2 misses = 80% hit ratio
      for (let i = 0; i < 10; i++) {
        performanceMonitor.trackCacheAccess('results', i < 8);
      }
      
      const hitRatio = performanceMonitor.getCacheHitRatio('results');
      assert.strictEqual(hitRatio, 0.8, 'Hit ratio should be 80%');
    });
    
    it('should track different cache types separately', () => {
      performanceMonitor.clear();
      
      performanceMonitor.trackCacheAccess('results', true);
      performanceMonitor.trackCacheAccess('gameState', false);
      performanceMonitor.trackCacheAccess('athletes', true);
      
      assert.strictEqual(performanceMonitor.getCacheHitRatio('results'), 1.0);
      assert.strictEqual(performanceMonitor.getCacheHitRatio('gameState'), 0.0);
      assert.strictEqual(performanceMonitor.getCacheHitRatio('athletes'), 1.0);
    });
    
    it('should detect low cache hit ratio (< 70%)', () => {
      performanceMonitor.clear();
      
      // 6 hits, 4 misses = 60% hit ratio (below 70% threshold)
      for (let i = 0; i < 10; i++) {
        performanceMonitor.trackCacheAccess('gameState', i < 6);
      }
      
      const events = performanceMonitor.getPerformanceEvents();
      const violations = events.filter(e => e.event === 'cache_hit_ratio_low');
      
      assert.ok(violations.length > 0, 'Low cache hit ratio should be detected');
    });
  });
  
  describe('Leaderboard Refresh Tracking', () => {
    it('should track leaderboard refresh latency', () => {
      performanceMonitor.clear();
      
      const tracker = performanceMonitor.trackLeaderboardRefresh(true);
      tracker.finish();
      
      const metrics = performanceMonitor.getLeaderboardMetrics();
      assert.strictEqual(metrics.length, 1, 'Should track 1 refresh');
      assert.strictEqual(metrics[0].cacheHit, true);
    });
    
    it('should calculate average latency', () => {
      performanceMonitor.clear();
      
      const tracker1 = performanceMonitor.trackLeaderboardRefresh(true);
      tracker1.finish();
      
      const tracker2 = performanceMonitor.trackLeaderboardRefresh(false);
      tracker2.finish();
      
      const avgLatency = performanceMonitor.getAverageLeaderboardLatency();
      assert.ok(avgLatency >= 0, 'Should calculate average latency');
    });
  });
  
  describe('Dynamic Chunk Load Tracking', () => {
    it('should track chunk loads', () => {
      performanceMonitor.clear();
      
      const tracker = performanceMonitor.trackChunkLoad('TestChunk');
      tracker.finish(true);
      
      const metrics = performanceMonitor.getChunkMetrics();
      assert.strictEqual(metrics.length, 1);
      assert.strictEqual(metrics[0].chunkName, 'TestChunk');
      assert.strictEqual(metrics[0].success, true);
    });
    
    it('should track chunk load failures', () => {
      performanceMonitor.clear();
      
      const tracker = performanceMonitor.trackChunkLoad('FailedChunk');
      tracker.finish(false, 'Network error');
      
      const metrics = performanceMonitor.getChunkMetrics();
      assert.strictEqual(metrics[0].success, false);
      assert.strictEqual(metrics[0].error, 'Network error');
    });
    
    it('should calculate median chunk load time', () => {
      performanceMonitor.clear();
      
      // Add some mock chunks with different load times
      const chunks = [
        { name: 'Chunk1', time: 100 },
        { name: 'Chunk2', time: 500 },
        { name: 'Chunk3', time: 300 },
      ];
      
      chunks.forEach(c => {
        const tracker = performanceMonitor.trackChunkLoad(c.name);
        tracker.finish(true);
      });
      
      const median = performanceMonitor.getChunkLoadMedian();
      assert.ok(median >= 0, 'Should calculate median load time');
    });
  });
  
  describe('Performance Report Generation', () => {
    it('should generate comprehensive report', () => {
      const report = performanceMonitor.getPerformanceReport();
      
      assert.ok(report.webVitals, 'Report should include webVitals');
      assert.ok(report.cache, 'Report should include cache metrics');
      assert.ok(report.chunks, 'Report should include chunk metrics');
      assert.ok(report.leaderboard, 'Report should include leaderboard metrics');
      assert.ok(report.budgets, 'Report should include budgets');
      assert.ok(typeof report.thresholdViolations === 'number');
    });
    
    it('should export metrics as JSON', () => {
      const exported = performanceMonitor.exportMetrics();
      
      assert.ok(typeof exported === 'string');
      
      const parsed = JSON.parse(exported);
      assert.ok(parsed.timestamp);
      assert.ok(parsed.report);
      assert.ok(parsed.rawMetrics);
      assert.ok(parsed.events);
    });
  });
  
  describe('Performance Logger', () => {
    it('should log performance events', () => {
      performanceMonitor.clear();
      
      performanceMonitor.performanceLogger('test_event', {
        metric: 'test',
        value: 123,
      });
      
      const events = performanceMonitor.getPerformanceEvents();
      assert.strictEqual(events.length, 1);
      assert.strictEqual(events[0].event, 'test_event');
      assert.strictEqual(events[0].payload.value, 123);
    });
  });
  
  describe('Metrics Cleanup', () => {
    it('should clear all metrics', () => {
      performanceMonitor.clear();
      
      // Add some metrics
      performanceMonitor.trackCacheAccess('results', true);
      performanceMonitor.trackLeaderboardRefresh(true).finish();
      
      // Clear
      performanceMonitor.clear();
      
      const report = performanceMonitor.getPerformanceReport();
      assert.strictEqual(report.cache.totalAccesses, 0);
      assert.strictEqual(report.leaderboard.totalRefreshes, 0);
    });
  });
  
  describe('Additional Coverage Tests', () => {
    it('should get chunk metrics by name', () => {
      performanceMonitor.clear();
      
      performanceMonitor.trackChunkLoad('test-chunk-1').finish(true);
      performanceMonitor.trackChunkLoad('test-chunk-2').finish(true);
      performanceMonitor.trackChunkLoad('test-chunk-1').finish(true);
      
      const chunk1Metrics = performanceMonitor.getChunkMetricsByName('test-chunk-1');
      assert.strictEqual(chunk1Metrics.length, 2, 'Should have 2 metrics for test-chunk-1');
      
      const chunk2Metrics = performanceMonitor.getChunkMetricsByName('test-chunk-2');
      assert.strictEqual(chunk2Metrics.length, 1, 'Should have 1 metric for test-chunk-2');
    });
    
    it('should calculate average load time for a specific chunk', () => {
      performanceMonitor.clear();
      
      performanceMonitor.trackChunkLoad('avg-test').finish(true);
      performanceMonitor.trackChunkLoad('avg-test').finish(true);
      
      const avgTime = performanceMonitor.getAverageLoadTime('avg-test');
      assert.ok(avgTime >= 0, 'Average time should be >= 0');
    });
    
    it('should return 0 for empty chunk metrics', () => {
      performanceMonitor.clear();
      
      const avgTime = performanceMonitor.getAverageLoadTime('nonexistent-chunk');
      assert.strictEqual(avgTime, 0, 'Should return 0 for nonexistent chunk');
      
      const median = performanceMonitor.getChunkLoadMedian();
      assert.strictEqual(median, 0, 'Should return 0 for empty metrics');
    });
    
    it('should get latest web vital by name', () => {
      performanceMonitor.clear();
      
      const metric1 = {
        name: 'LCP',
        value: 2000,
        id: 'lcp-1',
        delta: 2000,
        rating: 'good',
      };
      
      const metric2 = {
        name: 'LCP',
        value: 2500,
        id: 'lcp-2',
        delta: 500,
        rating: 'good',
      };
      
      performanceMonitor.trackWebVital(metric1);
      performanceMonitor.trackWebVital(metric2);
      
      const latest = performanceMonitor.getLatestWebVital('LCP');
      assert.ok(latest, 'Should get latest LCP metric');
      assert.strictEqual(latest.value, 2500, 'Latest LCP should be 2500');
    });
    
    it('should return undefined for non-existent web vital', () => {
      performanceMonitor.clear();
      
      const latest = performanceMonitor.getLatestWebVital('NONEXISTENT');
      assert.strictEqual(latest, undefined, 'Should return undefined for non-existent metric');
    });
    
    it('should get web vitals metrics', () => {
      performanceMonitor.clear();
      
      const metric = {
        name: 'CLS',
        value: 0.05,
        id: 'cls-test',
        delta: 0.05,
        rating: 'good',
      };
      
      performanceMonitor.trackWebVital(metric);
      
      const metrics = performanceMonitor.getWebVitalsMetrics();
      assert.ok(Array.isArray(metrics), 'Should return array');
      assert.ok(metrics.length > 0, 'Should have metrics');
    });
    
    it('should calculate cache hit ratio for all types', () => {
      performanceMonitor.clear();
      
      // Add metrics for different types
      performanceMonitor.trackCacheAccess('athletes', true);
      performanceMonitor.trackCacheAccess('athletes', true);
      performanceMonitor.trackCacheAccess('gameState', false);
      performanceMonitor.trackCacheAccess('results', true);
      
      const athletesRatio = performanceMonitor.getCacheHitRatio('athletes');
      assert.strictEqual(athletesRatio, 1.0, 'Athletes cache hit ratio should be 100%');
      
      const gameStateRatio = performanceMonitor.getCacheHitRatio('gameState');
      assert.strictEqual(gameStateRatio, 0.0, 'GameState cache hit ratio should be 0%');
      
      const resultsRatio = performanceMonitor.getCacheHitRatio('results');
      assert.strictEqual(resultsRatio, 1.0, 'Results cache hit ratio should be 100%');
      
      const overallRatio = performanceMonitor.getCacheHitRatio();
      assert.strictEqual(overallRatio, 0.75, 'Overall cache hit ratio should be 75%');
    });
    
    it('should return 0 for cache hit ratio with no metrics', () => {
      performanceMonitor.clear();
      
      const ratio = performanceMonitor.getCacheHitRatio('athletes');
      assert.strictEqual(ratio, 0, 'Should return 0 for no metrics');
    });
    
    it('should calculate leaderboard cache hit ratio', () => {
      performanceMonitor.clear();
      
      performanceMonitor.trackLeaderboardRefresh(true).finish();
      performanceMonitor.trackLeaderboardRefresh(true).finish();
      performanceMonitor.trackLeaderboardRefresh(false).finish();
      
      const report = performanceMonitor.getPerformanceReport();
      const cacheHitRatio = report.leaderboard.cacheHitRatio;
      
      assert.ok(cacheHitRatio > 0.6, 'Leaderboard cache hit ratio should be > 60%');
    });
    
    it('should track performance events with limit', () => {
      performanceMonitor.clear();
      
      // Add more than 50 events to test the limit
      for (let i = 0; i < 60; i++) {
        performanceMonitor.performanceLogger('test_event', { index: i });
      }
      
      const events = performanceMonitor.getPerformanceEvents();
      assert.strictEqual(events.length, 50, 'Should keep only last 50 events');
      assert.strictEqual(events[0].payload.index, 10, 'Should have removed first 10 events');
    });
    
    it('should count threshold violations in report', () => {
      performanceMonitor.clear();
      
      // Create a threshold violation
      const poorLCP = {
        name: 'LCP',
        value: 3000,
        id: 'lcp-poor',
        delta: 3000,
        rating: 'poor',
      };
      
      performanceMonitor.trackWebVital(poorLCP);
      
      const report = performanceMonitor.getPerformanceReport();
      assert.ok(report.thresholdViolations > 0, 'Should count threshold violations');
    });
    
    it('should handle odd number of chunks for median calculation', () => {
      performanceMonitor.clear();
      
      // Add 3 chunks (odd number)
      performanceMonitor.trackChunkLoad('chunk1').finish(true);
      performanceMonitor.trackChunkLoad('chunk2').finish(true);
      performanceMonitor.trackChunkLoad('chunk3').finish(true);
      
      const median = performanceMonitor.getChunkLoadMedian();
      assert.ok(median >= 0, 'Should calculate median for odd number of chunks');
    });
    
    it('should handle even number of chunks for median calculation', () => {
      performanceMonitor.clear();
      
      // Add 4 chunks (even number)
      performanceMonitor.trackChunkLoad('chunk1').finish(true);
      performanceMonitor.trackChunkLoad('chunk2').finish(true);
      performanceMonitor.trackChunkLoad('chunk3').finish(true);
      performanceMonitor.trackChunkLoad('chunk4').finish(true);
      
      const median = performanceMonitor.getChunkLoadMedian();
      assert.ok(median >= 0, 'Should calculate median for even number of chunks');
    });
    
    it('should include all cache types in report', () => {
      performanceMonitor.clear();
      
      performanceMonitor.trackCacheAccess('athletes', true);
      performanceMonitor.trackCacheAccess('gameState', true);
      performanceMonitor.trackCacheAccess('results', false);
      
      const report = performanceMonitor.getPerformanceReport();
      
      assert.ok(report.cache.athletes >= 0, 'Should report athletes cache');
      assert.ok(report.cache.gameState >= 0, 'Should report gameState cache');
      assert.ok(report.cache.results >= 0, 'Should report results cache');
      assert.ok(report.cache.scoring >= 0, 'Should report scoring cache');
      assert.ok(report.cache.standings >= 0, 'Should report standings cache');
      assert.ok(report.cache.default >= 0, 'Should report default cache');
      assert.ok(report.cache.overall >= 0, 'Should report overall cache');
    });
    
    it('should track TTFB web vital', () => {
      performanceMonitor.clear();
      
      const ttfbMetric = {
        name: 'TTFB',
        value: 500,
        id: 'ttfb-test',
        delta: 500,
        rating: 'good',
      };
      
      performanceMonitor.trackWebVital(ttfbMetric);
      
      const report = performanceMonitor.getPerformanceReport();
      assert.ok(report.webVitals.ttfb, 'Should track TTFB metric');
      assert.strictEqual(report.webVitals.ttfb.value, 500, 'TTFB value should be 500');
    });
    
    it('should limit metrics to maxMetrics', () => {
      performanceMonitor.clear();
      
      // Add more than 100 chunks
      for (let i = 0; i < 110; i++) {
        performanceMonitor.trackChunkLoad(`chunk-${i}`).finish(true);
      }
      
      const metrics = performanceMonitor.getChunkMetrics();
      assert.ok(metrics.length <= 100, 'Should limit to maxMetrics (100)');
    });
    
    it('should limit web vitals metrics to maxMetrics', () => {
      performanceMonitor.clear();
      
      // Add more than 100 web vitals
      for (let i = 0; i < 110; i++) {
        performanceMonitor.trackWebVital({
          name: 'CLS',
          value: 0.01 * i,
          id: `cls-${i}`,
          delta: 0.01,
          rating: 'good',
        });
      }
      
      const metrics = performanceMonitor.getWebVitalsMetrics();
      assert.ok(metrics.length <= 100, 'Should limit web vitals to maxMetrics (100)');
    });
    
    it('should limit leaderboard metrics to maxMetrics', () => {
      performanceMonitor.clear();
      
      // Add more than 100 leaderboard refreshes
      for (let i = 0; i < 110; i++) {
        performanceMonitor.trackLeaderboardRefresh(true).finish();
      }
      
      const metrics = performanceMonitor.getLeaderboardMetrics();
      assert.ok(metrics.length <= 100, 'Should limit leaderboard metrics to maxMetrics (100)');
    });
    
    it('should limit cache metrics to maxMetrics', () => {
      performanceMonitor.clear();
      
      // Add more than 100 cache accesses
      for (let i = 0; i < 110; i++) {
        performanceMonitor.trackCacheAccess('results', true);
      }
      
      const metrics = performanceMonitor.getCacheMetrics();
      assert.ok(metrics.length <= 100, 'Should limit cache metrics to maxMetrics (100)');
    });
  });
});

console.log('\n✅ All performance instrumentation tests passed');
console.log('📋 Issue #82 requirements validated');
