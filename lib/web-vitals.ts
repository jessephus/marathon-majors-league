/**
 * Web Vitals Integration
 * 
 * Measures Core Web Vitals (CLS, LCP, FID, INP) and reports to performance monitor.
 * Implements recommendations from web.dev/vitals
 * 
 * Related to Issue #82: Performance instrumentation & guardrails
 */

import { onCLS, onLCP, onINP, onTTFB, type Metric } from 'web-vitals';
import { performanceMonitor } from './performance-monitor.js';

/**
 * Initialize Web Vitals monitoring
 * Should be called once on app initialization
 */
export function initWebVitals(): void {
  // Only run in browser
  if (typeof window === 'undefined') return;

  // Track CLS (Cumulative Layout Shift)
  onCLS((metric: Metric) => {
    performanceMonitor.trackWebVital(metric);
  });

  // Track LCP (Largest Contentful Paint)
  onLCP((metric: Metric) => {
    performanceMonitor.trackWebVital(metric);
  });

  // Track INP (Interaction to Next Paint) - replaces FID in web-vitals v4
  onINP((metric: Metric) => {
    performanceMonitor.trackWebVital(metric);
  });

  // Track TTFB (Time to First Byte)
  onTTFB((metric: Metric) => {
    performanceMonitor.trackWebVital(metric);
  });

  if (process.env.NODE_ENV === 'development') {
    console.log('[Web Vitals] Monitoring initialized');
  }
}

/**
 * Manual performance mark for custom metrics
 */
export function markPerformance(name: string): void {
  if (typeof window !== 'undefined' && window.performance) {
    performance.mark(name);
  }
}

/**
 * Measure performance between two marks
 */
export function measurePerformance(
  measureName: string,
  startMark: string,
  endMark?: string
): number {
  if (typeof window === 'undefined' || !window.performance) return 0;

  try {
    const measure = endMark
      ? performance.measure(measureName, startMark, endMark)
      : performance.measure(measureName, startMark);

    return measure.duration;
  } catch (error) {
    console.warn(`[Performance] Failed to measure ${measureName}:`, error);
    return 0;
  }
}

/**
 * Clear performance marks and measures
 */
export function clearPerformanceMarks(): void {
  if (typeof window !== 'undefined' && window.performance) {
    performance.clearMarks();
    performance.clearMeasures();
  }
}
