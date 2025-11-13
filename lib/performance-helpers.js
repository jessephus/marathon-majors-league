/**
 * Client-side performance tracking helpers
 * 
 * These functions can be called from vanilla JS code (app.js, salary-cap-draft.js)
 * to track performance metrics.
 */

/**
 * Track a leaderboard refresh
 * Usage: 
 *   const tracker = trackLeaderboardRefresh(cacheHit);
 *   await fetchData();
 *   tracker.finish();
 */
export function trackLeaderboardRefresh(cacheHit = false) {
  if (typeof window === 'undefined' || !window.__performanceMonitor) {
    return { finish: () => {} };
  }
  
  return window.__performanceMonitor.trackLeaderboardRefresh(cacheHit);
}

/**
 * Track a cache access
 * Usage: trackCacheAccess('results', true);  // cache hit
 *        trackCacheAccess('gameState', false); // cache miss
 */
export function trackCacheAccess(type, hit) {
  if (typeof window === 'undefined' || !window.__performanceMonitor) {
    return;
  }
  
  window.__performanceMonitor.trackCacheAccess(type, hit);
}

/**
 * Log a performance event
 * Usage: performanceLogger('custom_event', { data: 'value' });
 */
export function performanceLogger(event, payload) {
  if (typeof window === 'undefined' || !window.__performanceMonitor) {
    return;
  }
  
  window.__performanceMonitor.performanceLogger(event, payload);
}

/**
 * Mark a performance point
 * Usage: markPerformance('leaderboard-start');
 */
export function markPerformance(name) {
  if (typeof window === 'undefined' || !window.performance) {
    return;
  }
  
  window.performance.mark(name);
}

/**
 * Measure between two performance marks
 * Usage: 
 *   markPerformance('start');
 *   // ... do work
 *   markPerformance('end');
 *   const duration = measurePerformance('my-operation', 'start', 'end');
 */
export function measurePerformance(measureName, startMark, endMark) {
  if (typeof window === 'undefined' || !window.performance) {
    return 0;
  }
  
  try {
    const measure = endMark
      ? window.performance.measure(measureName, startMark, endMark)
      : window.performance.measure(measureName, startMark);
    
    return measure.duration;
  } catch (error) {
    console.warn(`[Performance] Failed to measure ${measureName}:`, error);
    return 0;
  }
}

// Make functions available globally for vanilla JS usage
if (typeof window !== 'undefined') {
  window.trackLeaderboardRefresh = trackLeaderboardRefresh;
  window.trackCacheAccess = trackCacheAccess;
  window.performanceLogger = performanceLogger;
  window.markPerformance = markPerformance;
  window.measurePerformance = measurePerformance;
}
