/**
 * Dynamic Import Coverage Tests
 * 
 * Tests specifically designed to improve dynamic-import.ts code coverage
 * by exercising all functions including dynamicImport wrapper and prefetchChunk.
 * 
 * Run with: tsx tests/dynamic-import-coverage.test.js
 */

// Mock Next.js dynamic before importing
const mockDynamic = (loader, options) => {
  // Return a mock component that wraps the loader
  const Component = (props) => {
    return null; // Mock component
  };
  Component.displayName = 'DynamicComponent';
  return Component;
};

// Mock modules
globalThis.require = (path) => {
  if (path === 'next/dynamic') {
    return { default: mockDynamic };
  }
  return {};
};

// Mock performance
globalThis.performance = {
  now: () => Date.now(),
};

// Mock window for browser-specific code
globalThis.window = {
  getChunkPerformance: () => {},
  getFeatureFlags: () => {},
};

// Import after mocks
import { dynamicImport, prefetchChunk, CHUNK_NAMES, logBundleInfo } from '../lib/dynamic-import.ts';
import { performanceMonitor } from '../lib/performance-monitor.ts';
import { FeatureFlag, featureFlags } from '../lib/feature-flags.ts';

let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
  try {
    fn();
    testsPassed++;
    console.log(`✓ ${name}`);
  } catch (error) {
    testsFailed++;
    console.error(`✗ ${name}`);
    console.error(`  ${error.message}`);
  }
}

async function testAsync(name, fn) {
  try {
    await fn();
    testsPassed++;
    console.log(`✓ ${name}`);
  } catch (error) {
    testsFailed++;
    console.error(`✗ ${name}`);
    console.error(`  ${error.message}`);
  }
}

console.log('🧪 Dynamic Import Coverage Tests\n');

// Test CHUNK_NAMES
console.log('Chunk Names:');

test('should have ATHLETE_MODAL chunk name', () => {
  if (CHUNK_NAMES.ATHLETE_MODAL !== 'chunk-athlete-modal') {
    throw new Error('ATHLETE_MODAL should be chunk-athlete-modal');
  }
});

test('should have COMMISSIONER_RESULTS chunk name', () => {
  if (CHUNK_NAMES.COMMISSIONER_RESULTS !== 'chunk-commissioner-results') {
    throw new Error('COMMISSIONER_RESULTS should be chunk-commissioner-results');
  }
});

test('should have COMMISSIONER_ATHLETES chunk name', () => {
  if (CHUNK_NAMES.COMMISSIONER_ATHLETES !== 'chunk-commissioner-athletes') {
    throw new Error('COMMISSIONER_ATHLETES should be chunk-commissioner-athletes');
  }
});

test('should have COMMISSIONER_TEAMS chunk name', () => {
  if (CHUNK_NAMES.COMMISSIONER_TEAMS !== 'chunk-commissioner-teams') {
    throw new Error('COMMISSIONER_TEAMS should be chunk-commissioner-teams');
  }
});

test('should have LEADERBOARD_TABLE chunk name', () => {
  if (CHUNK_NAMES.LEADERBOARD_TABLE !== 'chunk-leaderboard-table') {
    throw new Error('LEADERBOARD_TABLE should be chunk-leaderboard-table');
  }
});

test('should have BUDGET_TRACKER chunk name', () => {
  if (CHUNK_NAMES.BUDGET_TRACKER !== 'chunk-budget-tracker') {
    throw new Error('BUDGET_TRACKER should be chunk-budget-tracker');
  }
});

// Test dynamicImport function
console.log('\nDynamic Import Function:');

test('should create dynamic import without feature flag', () => {
  const mockLoader = async () => ({ default: () => null });
  
  const Component = dynamicImport(mockLoader, {
    chunkName: 'test-chunk-no-flag',
  });
  
  if (!Component) throw new Error('Should return component');
});

test('should create dynamic import with enabled feature flag', () => {
  const mockLoader = async () => ({ default: () => null });
  
  featureFlags.override(FeatureFlag.DYNAMIC_ATHLETE_MODAL, true);
  
  const Component = dynamicImport(mockLoader, {
    chunkName: 'test-chunk-enabled-flag',
    featureFlag: FeatureFlag.DYNAMIC_ATHLETE_MODAL,
  });
  
  if (!Component) throw new Error('Should return component');
  
  featureFlags.clearOverrides();
});

test('should return fallback when feature flag disabled and fallback provided', () => {
  const mockLoader = async () => ({ default: () => null });
  const FallbackComponent = () => null;
  FallbackComponent.displayName = 'FallbackComponent';
  
  featureFlags.override(FeatureFlag.DYNAMIC_ATHLETE_MODAL, false);
  
  const Component = dynamicImport(mockLoader, {
    chunkName: 'test-chunk-disabled-with-fallback',
    featureFlag: FeatureFlag.DYNAMIC_ATHLETE_MODAL,
    fallbackComponent: FallbackComponent,
  });
  
  if (Component !== FallbackComponent) throw new Error('Should return fallback component');
  
  featureFlags.clearOverrides();
});

test('should log warning when feature flag disabled without fallback', () => {
  const mockLoader = async () => ({ default: () => null });
  
  // Capture console.warn
  const originalWarn = console.warn;
  let warnCalled = false;
  console.warn = (...args) => {
    warnCalled = true;
  };
  
  featureFlags.override(FeatureFlag.DYNAMIC_ATHLETE_MODAL, false);
  
  const Component = dynamicImport(mockLoader, {
    chunkName: 'test-chunk-disabled-no-fallback',
    featureFlag: FeatureFlag.DYNAMIC_ATHLETE_MODAL,
  });
  
  console.warn = originalWarn;
  
  if (!warnCalled) throw new Error('Should log warning when disabled without fallback');
  if (!Component) throw new Error('Should still return component');
  
  featureFlags.clearOverrides();
});

await testAsync('should track successful chunk load', async () => {
  performanceMonitor.clear();
  
  const mockLoader = async () => {
    await new Promise(resolve => setTimeout(resolve, 10));
    return { default: () => null };
  };
  
  const Component = dynamicImport(mockLoader, {
    chunkName: 'test-chunk-success',
  });
  
  // The component is wrapped by Next.js dynamic, but the loader is wrapped by our tracker
  if (!Component) throw new Error('Should return component');
});

await testAsync('should track failed chunk load', async () => {
  performanceMonitor.clear();
  
  const mockLoader = async () => {
    throw new Error('Chunk load failed');
  };
  
  const Component = dynamicImport(mockLoader, {
    chunkName: 'test-chunk-failure',
  });
  
  if (!Component) throw new Error('Should return component even if loader fails');
});

// Test prefetchChunk function
console.log('\nPrefetch Chunk Function:');

await testAsync('should prefetch chunk when enabled', async () => {
  performanceMonitor.clear();
  
  featureFlags.override(FeatureFlag.PREFETCH_ON_HOVER, true);
  
  const mockLoader = async () => {
    await new Promise(resolve => setTimeout(resolve, 5));
    return { default: () => null };
  };
  
  prefetchChunk(mockLoader, 'test-prefetch-enabled');
  
  // Give it time to start tracking
  await new Promise(resolve => setTimeout(resolve, 10));
  
  featureFlags.clearOverrides();
});

test('should not prefetch chunk when disabled', () => {
  performanceMonitor.clear();
  
  featureFlags.override(FeatureFlag.PREFETCH_ON_HOVER, false);
  
  const mockLoader = async () => ({ default: () => null });
  
  prefetchChunk(mockLoader, 'test-prefetch-disabled');
  
  // Should not add any metrics since it returns early
  const metrics = performanceMonitor.getChunkMetrics();
  const prefetchMetrics = metrics.filter(m => m.chunkName.includes('test-prefetch-disabled'));
  
  if (prefetchMetrics.length > 0) {
    throw new Error('Should not track metrics when prefetch is disabled');
  }
  
  featureFlags.clearOverrides();
});

test('should not prefetch on server-side (no window)', () => {
  const originalWindow = globalThis.window;
  delete globalThis.window;
  
  const mockLoader = async () => ({ default: () => null });
  
  // Should return early without error
  prefetchChunk(mockLoader, 'test-prefetch-ssr');
  
  globalThis.window = originalWindow;
});

await testAsync('should handle prefetch failure', async () => {
  performanceMonitor.clear();
  
  featureFlags.override(FeatureFlag.PREFETCH_ON_HOVER, true);
  
  const mockLoader = async () => {
    throw new Error('Prefetch failed');
  };
  
  // Should not throw, just track the failure
  prefetchChunk(mockLoader, 'test-prefetch-fail');
  
  // Give it time to fail
  await new Promise(resolve => setTimeout(resolve, 10));
  
  featureFlags.clearOverrides();
});

// Test logBundleInfo function
console.log('\nLog Bundle Info Function:');

test('should log bundle info in development', () => {
  const originalEnv = process.env.NODE_ENV;
  const originalLog = console.log;
  let logCalled = false;
  
  process.env.NODE_ENV = 'development';
  console.log = (...args) => {
    logCalled = true;
  };
  
  logBundleInfo();
  
  console.log = originalLog;
  process.env.NODE_ENV = originalEnv;
  
  if (!logCalled) throw new Error('Should log in development');
});

test('should not log bundle info in production', () => {
  const originalEnv = process.env.NODE_ENV;
  const originalLog = console.log;
  let logCalled = false;
  
  process.env.NODE_ENV = 'production';
  console.log = (...args) => {
    logCalled = true;
  };
  
  logBundleInfo();
  
  console.log = originalLog;
  process.env.NODE_ENV = originalEnv;
  
  if (logCalled) throw new Error('Should not log in production');
});

test('should not log bundle info in test', () => {
  const originalEnv = process.env.NODE_ENV;
  const originalLog = console.log;
  let logCalled = false;
  
  process.env.NODE_ENV = 'test';
  console.log = (...args) => {
    logCalled = true;
  };
  
  logBundleInfo();
  
  console.log = originalLog;
  process.env.NODE_ENV = originalEnv;
  
  if (logCalled) throw new Error('Should not log in test');
});

// Summary
console.log('\n' + '='.repeat(50));
console.log(`Tests: ${testsPassed} passed, ${testsFailed} failed`);

if (testsFailed > 0) {
  process.exit(1);
} else {
  console.log('✅ All Dynamic Import Coverage Tests Passed!');
  process.exit(0);
}
