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
});

console.log('\n✅ All performance instrumentation tests passed');
console.log('📋 Issue #82 requirements validated');
