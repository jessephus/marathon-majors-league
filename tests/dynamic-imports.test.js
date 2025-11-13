/**
 * Dynamic Import Integration Tests
 * 
 * Tests for dynamic import functionality, feature flags, and performance monitoring.
 */

import { performanceMonitor } from '../lib/performance-monitor.ts';
import { featureFlags, FeatureFlag } from '../lib/feature-flags.ts';
import { CHUNK_NAMES } from '../lib/dynamic-import.ts';

// Test results tracking
let passedTests = 0;
let failedTests = 0;
const failedTestDetails = [];

// Simple test framework
function test(description, fn) {
    try {
        fn();
        passedTests++;
        console.log(`✓ ${description}`);
    } catch (error) {
        failedTests++;
        console.error(`✗ ${description}`);
        console.error(`  ${error.message}`);
        failedTestDetails.push({ description, error: error.message });
    }
}

async function testAsync(description, fn) {
    try {
        await fn();
        passedTests++;
        console.log(`✓ ${description}`);
    } catch (error) {
        failedTests++;
        console.error(`✗ ${description}`);
        console.error(`  ${error.message}`);
        failedTestDetails.push({ description, error: error.message });
    }
}

function assertEquals(actual, expected, message = '') {
    if (actual !== expected) {
        throw new Error(`${message}\n  Expected: ${JSON.stringify(expected)}\n  Actual: ${JSON.stringify(actual)}`);
    }
}

function assertTrue(condition, message = '') {
    if (!condition) {
        throw new Error(message || 'Expected condition to be true');
    }
}

function assertGreaterThan(actual, expected, message = '') {
    if (actual <= expected) {
        throw new Error(`${message}\n  Expected ${actual} > ${expected}`);
    }
}

function assertHasProperty(obj, prop, message = '') {
    if (!obj || !obj.hasOwnProperty(prop)) {
        throw new Error(`${message}\n  Expected object to have property: ${prop}`);
    }
}

function assertMatches(actual, pattern, message = '') {
    if (!pattern.test(actual)) {
        throw new Error(`${message}\n  Expected ${actual} to match ${pattern}`);
    }
}

// Mock performance API for Node.js environment
if (typeof global !== 'undefined' && !global.performance) {
    global.performance = {
        now: () => Date.now()
    };
}

// Run tests
console.log('\n🧪 Running Dynamic Import Tests...\n');

// Performance Monitor Tests
console.log('Performance Monitor Tests:');

test('should track chunk load times', () => {
    performanceMonitor.clear();
    const tracker = performanceMonitor.trackChunkLoad('test-chunk');
    tracker.finish(true);

    const metrics = performanceMonitor.getChunkMetrics();
    assertEquals(metrics.length, 1, 'Should have 1 metric');
    assertEquals(metrics[0].chunkName, 'test-chunk', 'Chunk name should match');
    assertEquals(metrics[0].success, true, 'Success should be true');
});

test('should calculate average load time', () => {
    performanceMonitor.clear();
    
    // Simulate multiple loads
    const tracker1 = performanceMonitor.trackChunkLoad('test-chunk');
    tracker1.finish(true);
    
    const tracker2 = performanceMonitor.trackChunkLoad('test-chunk');
    tracker2.finish(true);

    const avgTime = performanceMonitor.getAverageLoadTime('test-chunk');
    assertTrue(avgTime >= 0, 'Average time should be >= 0');
});

test('should track load failures', () => {
    performanceMonitor.clear();
    const tracker = performanceMonitor.trackChunkLoad('failing-chunk');
    tracker.finish(false, 'Network error');

    const metrics = performanceMonitor.getChunkMetrics();
    assertEquals(metrics[0].success, false, 'Success should be false');
    assertEquals(metrics[0].error, 'Network error', 'Error message should match');
});

test('should generate performance summary', () => {
    performanceMonitor.clear();
    
    // Load test chunk twice
    performanceMonitor.trackChunkLoad('chunk-a').finish(true);
    performanceMonitor.trackChunkLoad('chunk-a').finish(true);
    performanceMonitor.trackChunkLoad('chunk-b').finish(true);

    const summary = performanceMonitor.getSummary();
    assertEquals(summary.length, 2, 'Should have 2 chunks in summary');
    
    const chunkA = summary.find(s => s.chunkName === 'chunk-a');
    assertEquals(chunkA?.loadCount, 2, 'Chunk A should have 2 loads');
    assertEquals(chunkA?.successRate, 100, 'Chunk A success rate should be 100%');
});

// Feature Flag Tests
console.log('\nFeature Flag System Tests:');

test('should check if flag is enabled', () => {
    const isEnabled = featureFlags.isEnabled(FeatureFlag.DYNAMIC_ATHLETE_MODAL);
    assertEquals(typeof isEnabled, 'boolean', 'isEnabled should return boolean');
});

test('should override feature flags', () => {
    const originalState = featureFlags.isEnabled(FeatureFlag.DYNAMIC_ATHLETE_MODAL);
    
    featureFlags.override(FeatureFlag.DYNAMIC_ATHLETE_MODAL, !originalState);
    assertEquals(
        featureFlags.isEnabled(FeatureFlag.DYNAMIC_ATHLETE_MODAL),
        !originalState,
        'Override should toggle state'
    );
    
    featureFlags.clearOverrides();
    assertEquals(
        featureFlags.isEnabled(FeatureFlag.DYNAMIC_ATHLETE_MODAL),
        originalState,
        'Clear should restore original state'
    );
});

test('should list all feature flags', () => {
    const allFlags = featureFlags.getAll();
    assertTrue(allFlags.length > 0, 'Should have at least one flag');
    assertHasProperty(allFlags[0], 'flag', 'Flag should have "flag" property');
    assertHasProperty(allFlags[0], 'enabled', 'Flag should have "enabled" property');
    assertHasProperty(allFlags[0], 'config', 'Flag should have "config" property');
});

// Dynamic Import Utility Tests
console.log('\nDynamic Import Utility Tests:');

test('should define chunk names', () => {
    assertHasProperty(CHUNK_NAMES, 'ATHLETE_MODAL', 'Should have ATHLETE_MODAL');
    assertHasProperty(CHUNK_NAMES, 'COMMISSIONER_RESULTS', 'Should have COMMISSIONER_RESULTS');
    assertHasProperty(CHUNK_NAMES, 'COMMISSIONER_ATHLETES', 'Should have COMMISSIONER_ATHLETES');
    assertHasProperty(CHUNK_NAMES, 'COMMISSIONER_TEAMS', 'Should have COMMISSIONER_TEAMS');
    
    // Verify naming convention
    assertMatches(CHUNK_NAMES.ATHLETE_MODAL, /^chunk-/, 'ATHLETE_MODAL should start with "chunk-"');
    assertMatches(CHUNK_NAMES.COMMISSIONER_RESULTS, /^chunk-commissioner-/, 'COMMISSIONER_RESULTS should start with "chunk-commissioner-"');
});

// Integration Tests
console.log('\nIntegration Tests:');

await testAsync('should track dynamic imports through the system', async () => {
    performanceMonitor.clear();
    
    // Verify feature flag is enabled
    assertEquals(
        featureFlags.isEnabled(FeatureFlag.DYNAMIC_ATHLETE_MODAL),
        true,
        'DYNAMIC_ATHLETE_MODAL should be enabled'
    );
    
    // Simulate a chunk load
    const tracker = performanceMonitor.trackChunkLoad('chunk-athlete-modal');
    
    // Simulate async loading
    await new Promise(resolve => setTimeout(resolve, 10));
    
    tracker.finish(true);
    
    // Verify metrics were recorded
    const metrics = performanceMonitor.getChunkMetrics();
    assertTrue(metrics.length > 0, 'Should have at least one metric');
    assertEquals(
        metrics[metrics.length - 1].chunkName,
        'chunk-athlete-modal',
        'Last metric should be chunk-athlete-modal'
    );
    assertEquals(
        metrics[metrics.length - 1].success,
        true,
        'Last metric should be successful'
    );
});

test('should handle feature flag disabled scenario', () => {
    // Override to disable
    featureFlags.override(FeatureFlag.DYNAMIC_ATHLETE_MODAL, false);
    
    assertEquals(
        featureFlags.isEnabled(FeatureFlag.DYNAMIC_ATHLETE_MODAL),
        false,
        'Flag should be disabled after override'
    );
    
    // Clean up
    featureFlags.clearOverrides();
});

// Print summary
console.log('\n' + '='.repeat(50));
console.log(`Test Results: ${passedTests} passed, ${failedTests} failed`);

if (failedTests > 0) {
    console.log('\nFailed Tests:');
    failedTestDetails.forEach(({ description, error }) => {
        console.log(`  ✗ ${description}`);
        console.log(`    ${error}`);
    });
    process.exit(1);
} else {
    console.log('✅ All Dynamic Import Tests Passed!');
    process.exit(0);
}

console.log('Note: Run with Jest for full test execution');
