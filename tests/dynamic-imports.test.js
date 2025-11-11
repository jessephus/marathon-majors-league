/**
 * Dynamic Import Integration Tests
 * 
 * Tests for dynamic import functionality, feature flags, and performance monitoring.
 */

// Mock performance.now() for consistent testing
global.performance = {
  now: jest.fn(() => Date.now())
};

describe('Dynamic Import System', () => {
  describe('Performance Monitor', () => {
    beforeEach(() => {
      // Clear metrics before each test
      jest.clearAllMocks();
    });

    test('should track chunk load times', () => {
      const { performanceMonitor } = require('../lib/performance-monitor');
      
      performanceMonitor.clear();
      const tracker = performanceMonitor.trackChunkLoad('test-chunk');
      tracker.finish(true);

      const metrics = performanceMonitor.getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].chunkName).toBe('test-chunk');
      expect(metrics[0].success).toBe(true);
    });

    test('should calculate average load time', () => {
      const { performanceMonitor } = require('../lib/performance-monitor');
      
      performanceMonitor.clear();
      
      // Simulate multiple loads
      const tracker1 = performanceMonitor.trackChunkLoad('test-chunk');
      tracker1.finish(true);
      
      const tracker2 = performanceMonitor.trackChunkLoad('test-chunk');
      tracker2.finish(true);

      const avgTime = performanceMonitor.getAverageLoadTime('test-chunk');
      expect(avgTime).toBeGreaterThanOrEqual(0);
    });

    test('should track load failures', () => {
      const { performanceMonitor } = require('../lib/performance-monitor');
      
      performanceMonitor.clear();
      const tracker = performanceMonitor.trackChunkLoad('failing-chunk');
      tracker.finish(false, 'Network error');

      const metrics = performanceMonitor.getMetrics();
      expect(metrics[0].success).toBe(false);
      expect(metrics[0].error).toBe('Network error');
    });

    test('should generate performance summary', () => {
      const { performanceMonitor } = require('../lib/performance-monitor');
      
      performanceMonitor.clear();
      
      // Load test chunk twice
      performanceMonitor.trackChunkLoad('chunk-a').finish(true);
      performanceMonitor.trackChunkLoad('chunk-a').finish(true);
      performanceMonitor.trackChunkLoad('chunk-b').finish(true);

      const summary = performanceMonitor.getSummary();
      expect(summary).toHaveLength(2);
      
      const chunkA = summary.find(s => s.chunkName === 'chunk-a');
      expect(chunkA?.loadCount).toBe(2);
      expect(chunkA?.successRate).toBe(100);
    });
  });

  describe('Feature Flag System', () => {
    test('should check if flag is enabled', () => {
      const { featureFlags, FeatureFlag } = require('../lib/feature-flags');
      
      const isEnabled = featureFlags.isEnabled(FeatureFlag.DYNAMIC_ATHLETE_MODAL);
      expect(typeof isEnabled).toBe('boolean');
    });

    test('should override feature flags', () => {
      const { featureFlags, FeatureFlag } = require('../lib/feature-flags');
      
      const originalState = featureFlags.isEnabled(FeatureFlag.DYNAMIC_ATHLETE_MODAL);
      
      featureFlags.override(FeatureFlag.DYNAMIC_ATHLETE_MODAL, !originalState);
      expect(featureFlags.isEnabled(FeatureFlag.DYNAMIC_ATHLETE_MODAL)).toBe(!originalState);
      
      featureFlags.clearOverrides();
      expect(featureFlags.isEnabled(FeatureFlag.DYNAMIC_ATHLETE_MODAL)).toBe(originalState);
    });

    test('should list all feature flags', () => {
      const { featureFlags } = require('../lib/feature-flags');
      
      const allFlags = featureFlags.getAll();
      expect(allFlags.length).toBeGreaterThan(0);
      expect(allFlags[0]).toHaveProperty('flag');
      expect(allFlags[0]).toHaveProperty('enabled');
      expect(allFlags[0]).toHaveProperty('config');
    });
  });

  describe('Dynamic Import Utility', () => {
    test('should define chunk names', () => {
      const { CHUNK_NAMES } = require('../lib/dynamic-import');
      
      expect(CHUNK_NAMES).toHaveProperty('ATHLETE_MODAL');
      expect(CHUNK_NAMES).toHaveProperty('COMMISSIONER_RESULTS');
      expect(CHUNK_NAMES).toHaveProperty('COMMISSIONER_ATHLETES');
      expect(CHUNK_NAMES).toHaveProperty('COMMISSIONER_TEAMS');
      
      // Verify naming convention
      expect(CHUNK_NAMES.ATHLETE_MODAL).toMatch(/^chunk-/);
      expect(CHUNK_NAMES.COMMISSIONER_RESULTS).toMatch(/^chunk-commissioner-/);
    });
  });

  describe('Integration', () => {
    test('should track dynamic imports through the system', async () => {
      const { performanceMonitor } = require('../lib/performance-monitor');
      const { featureFlags, FeatureFlag } = require('../lib/feature-flags');
      
      performanceMonitor.clear();
      
      // Verify feature flag is enabled
      expect(featureFlags.isEnabled(FeatureFlag.DYNAMIC_ATHLETE_MODAL)).toBe(true);
      
      // Simulate a chunk load
      const tracker = performanceMonitor.trackChunkLoad('chunk-athlete-modal');
      
      // Simulate async loading
      await new Promise(resolve => setTimeout(resolve, 10));
      
      tracker.finish(true);
      
      // Verify metrics were recorded
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.length).toBeGreaterThan(0);
      expect(metrics[metrics.length - 1].chunkName).toBe('chunk-athlete-modal');
      expect(metrics[metrics.length - 1].success).toBe(true);
    });

    test('should handle feature flag disabled scenario', () => {
      const { featureFlags, FeatureFlag } = require('../lib/feature-flags');
      
      // Override to disable
      featureFlags.override(FeatureFlag.DYNAMIC_ATHLETE_MODAL, false);
      
      expect(featureFlags.isEnabled(FeatureFlag.DYNAMIC_ATHLETE_MODAL)).toBe(false);
      
      // Clean up
      featureFlags.clearOverrides();
    });
  });
});

console.log('✅ Dynamic Import Integration Tests configured');
console.log('Note: Run with Jest for full test execution');
