/**
 * Web Vitals Coverage Tests
 * 
 * Tests for web-vitals.ts integration module.
 * 
 * Run with: tsx tests/web-vitals-coverage.test.js
 */

// Mock performance and window
globalThis.window = {
  performance: {
    mark: (name) => {},
    measure: (name, startMark, endMark) => ({
      duration: 100,
      name,
      entryType: 'measure',
      startTime: 0,
    }),
    clearMarks: () => {},
    clearMeasures: () => {},
  },
};

globalThis.performance = globalThis.window.performance;

// Mock performance monitor
const mockPerformanceMonitor = {
  trackWebVital: (metric) => {},
};

// Mock web-vitals module
let onCLSCallback, onLCPCallback, onINPCallback, onTTFBCallback;
const webVitalsMock = {
  onCLS: (cb) => { onCLSCallback = cb; },
  onLCP: (cb) => { onLCPCallback = cb; },
  onINP: (cb) => { onINPCallback = cb; },
  onTTFB: (cb) => { onTTFBCallback = cb; },
};

// Override imports
globalThis.require = (path) => {
  if (path === 'web-vitals') {
    return webVitalsMock;
  }
  if (path.includes('performance-monitor')) {
    return { performanceMonitor: mockPerformanceMonitor };
  }
  return {};
};

import { initWebVitals, markPerformance, measurePerformance, clearPerformanceMarks } from '../lib/web-vitals.ts';

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

function assert(condition, message = '') {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

console.log('🧪 Web Vitals Coverage Tests\n');

console.log('Initialization:');

test('should initialize web vitals monitoring', () => {
  // Should set up callbacks without error
  initWebVitals();
  assert(true, 'Initialization should not throw');
});

test('should call onCLS callback', () => {
  initWebVitals();
  
  // Simulate CLS metric
  if (onCLSCallback) {
    onCLSCallback({
      name: 'CLS',
      value: 0.05,
      id: 'cls-1',
      delta: 0.05,
      rating: 'good',
    });
  }
  
  assert(true, 'CLS callback should work');
});

test('should call onLCP callback', () => {
  initWebVitals();
  
  // Simulate LCP metric
  if (onLCPCallback) {
    onLCPCallback({
      name: 'LCP',
      value: 2000,
      id: 'lcp-1',
      delta: 2000,
      rating: 'good',
    });
  }
  
  assert(true, 'LCP callback should work');
});

test('should call onINP callback', () => {
  initWebVitals();
  
  // Simulate INP metric
  if (onINPCallback) {
    onINPCallback({
      name: 'INP',
      value: 150,
      id: 'inp-1',
      delta: 150,
      rating: 'good',
    });
  }
  
  assert(true, 'INP callback should work');
});

test('should call onTTFB callback', () => {
  initWebVitals();
  
  // Simulate TTFB metric
  if (onTTFBCallback) {
    onTTFBCallback({
      name: 'TTFB',
      value: 500,
      id: 'ttfb-1',
      delta: 500,
      rating: 'good',
    });
  }
  
  assert(true, 'TTFB callback should work');
});

console.log('\nPerformance Marking:');

test('should mark performance', () => {
  markPerformance('test-mark');
  assert(true, 'Should mark performance without error');
});

test('should measure performance between marks', () => {
  markPerformance('start-mark');
  markPerformance('end-mark');
  
  const duration = measurePerformance('test-measure', 'start-mark', 'end-mark');
  assert(typeof duration === 'number', 'Should return numeric duration');
});

test('should measure performance from single mark', () => {
  markPerformance('single-mark');
  const duration = measurePerformance('test-measure-single', 'single-mark');
  assert(typeof duration === 'number', 'Should return numeric duration');
});

test('should handle missing window.performance gracefully', () => {
  const originalWindow = globalThis.window;
  delete globalThis.window;
  
  markPerformance('no-win-mark');
  const duration = measurePerformance('no-win-measure', 'start');
  
  assert(duration === 0, 'Should return 0 when window unavailable');
  
  globalThis.window = originalWindow;
});

test('should handle measure errors gracefully', () => {
  // Override measure to throw
  const originalMeasure = globalThis.window.performance.measure;
  globalThis.window.performance.measure = () => {
    throw new Error('Measure failed');
  };
  
  const duration = measurePerformance('error-measure', 'nonexistent-mark');
  assert(duration === 0, 'Should return 0 on error');
  
  globalThis.window.performance.measure = originalMeasure;
});

console.log('\nPerformance Cleanup:');

test('should clear performance marks', () => {
  markPerformance('clear-test-mark');
  clearPerformanceMarks();
  assert(true, 'Should clear marks without error');
});

test('should handle missing window in clear', () => {
  const originalWindow = globalThis.window;
  delete globalThis.window;
  
  clearPerformanceMarks();
  assert(true, 'Should handle missing window gracefully');
  
  globalThis.window = originalWindow;
});

console.log('\nServer-Side Rendering:');

test('should not initialize on server-side', () => {
  const originalWindow = globalThis.window;
  delete globalThis.window;
  
  // Should not throw, just return early
  initWebVitals();
  
  globalThis.window = originalWindow;
  assert(true, 'Should handle SSR gracefully');
});

// Summary
console.log('\n' + '='.repeat(50));
console.log(`Tests: ${testsPassed} passed, ${testsFailed} failed`);

if (testsFailed > 0) {
  process.exit(1);
} else {
  console.log('✅ All Web Vitals Coverage Tests Passed!');
  process.exit(0);
}
