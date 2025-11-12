/**
 * Performance Monitor for Web Vitals, Dynamic Imports, and Custom Metrics
 * 
 * Comprehensive performance instrumentation including:
 * - Web Vitals (CLS, LCP, FID, INP)
 * - Dynamic chunk load times
 * - Leaderboard refresh latency
 * - Cache hit ratios
 * 
 * Related to Issue #82 (PR #96+): Performance instrumentation & guardrails
 */

import type { Metric } from 'web-vitals';

interface ChunkLoadMetric {
  chunkName: string;
  startTime: number;
  endTime: number;
  loadTimeMs: number;
  timestamp: Date;
  success: boolean;
  error?: string;
}

interface WebVitalsMetric {
  name: 'CLS' | 'LCP' | 'INP' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: Date;
}

interface LeaderboardRefreshMetric {
  startTime: number;
  endTime: number;
  latencyMs: number;
  timestamp: Date;
  cacheHit: boolean;
}

interface CacheMetric {
  type: 'results' | 'gameState' | 'athletes';
  hit: boolean;
  timestamp: Date;
}

interface PerformanceEvent {
  event: string;
  payload: any;
  timestamp: Date;
}

// Performance budgets and thresholds (from issue requirements)
export const PERFORMANCE_BUDGETS = {
  LCP_THRESHOLD: 2500, // ms - Largest Contentful Paint (leaderboard)
  INP_THRESHOLD: 200, // ms - Interaction to Next Paint (replaces FID)
  CLS_THRESHOLD: 0.1, // Cumulative Layout Shift
  CHUNK_LOAD_MEDIAN: 800, // ms - Dynamic chunk loads
  CACHE_HIT_RATIO_MIN: 0.7, // 70% during race
  LEADERBOARD_REFRESH_MAX: 1000, // ms - Leaderboard refresh latency
} as const;

class PerformanceMonitor {
  private chunkMetrics: ChunkLoadMetric[] = [];
  private webVitalsMetrics: WebVitalsMetric[] = [];
  private leaderboardMetrics: LeaderboardRefreshMetric[] = [];
  private cacheMetrics: CacheMetric[] = [];
  private performanceEvents: PerformanceEvent[] = [];
  private readonly maxMetrics = 100; // Keep last 100 metrics per type

  /**
   * Track the loading of a dynamic chunk
   */
  trackChunkLoad(chunkName: string): {
    finish: (success?: boolean, error?: string) => void;
  } {
    const startTime = performance.now();
    
    return {
      finish: (success = true, error?: string) => {
        const endTime = performance.now();
        const metric: ChunkLoadMetric = {
          chunkName,
          startTime,
          endTime,
          loadTimeMs: endTime - startTime,
          timestamp: new Date(),
          success,
          error,
        };

        this.chunkMetrics.push(metric);
        
        // Keep only the last maxMetrics entries
        if (this.chunkMetrics.length > this.maxMetrics) {
          this.chunkMetrics.shift();
        }

        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
          console.log(
            `[Chunk Load] ${chunkName}: ${metric.loadTimeMs.toFixed(2)}ms`,
            success ? '✓' : '✗'
          );
        }

        // Check threshold
        const median = this.getChunkLoadMedian();
        if (median > PERFORMANCE_BUDGETS.CHUNK_LOAD_MEDIAN) {
          this.performanceLogger('chunk_load_threshold_exceeded', {
            chunkName,
            loadTime: metric.loadTimeMs,
            median,
            threshold: PERFORMANCE_BUDGETS.CHUNK_LOAD_MEDIAN,
          });
        }

        // Report to analytics if available
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'chunk_load', {
            chunk_name: chunkName,
            load_time: Math.round(metric.loadTimeMs),
            success: success,
          });
        }
      },
    };
  }

  /**
   * Track Web Vitals metrics
   */
  trackWebVital(metric: Metric): void {
    const rating = this.getRating(metric.name as any, metric.value);
    
    const webVital: WebVitalsMetric = {
      name: metric.name as any,
      value: metric.value,
      rating,
      timestamp: new Date(),
    };

    this.webVitalsMetrics.push(webVital);

    // Keep only the last maxMetrics entries
    if (this.webVitalsMetrics.length > this.maxMetrics) {
      this.webVitalsMetrics.shift();
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `[Web Vitals] ${metric.name}: ${metric.value.toFixed(2)} (${rating})`,
        rating === 'good' ? '✓' : rating === 'needs-improvement' ? '⚠' : '✗'
      );
    }

    // Check thresholds
    this.checkWebVitalThreshold(metric.name as any, metric.value);

    // Report to analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', metric.name, {
        value: Math.round(metric.value),
        metric_rating: rating,
        metric_delta: metric.delta,
      });
    }
  }

  /**
   * Track leaderboard refresh latency
   */
  trackLeaderboardRefresh(cacheHit: boolean): {
    finish: () => void;
  } {
    const startTime = performance.now();
    
    return {
      finish: () => {
        const endTime = performance.now();
        const metric: LeaderboardRefreshMetric = {
          startTime,
          endTime,
          latencyMs: endTime - startTime,
          timestamp: new Date(),
          cacheHit,
        };

        this.leaderboardMetrics.push(metric);

        // Keep only the last maxMetrics entries
        if (this.leaderboardMetrics.length > this.maxMetrics) {
          this.leaderboardMetrics.shift();
        }

        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
          console.log(
            `[Leaderboard Refresh] ${metric.latencyMs.toFixed(2)}ms`,
            cacheHit ? '(cache hit)' : '(cache miss)',
            metric.latencyMs < PERFORMANCE_BUDGETS.LEADERBOARD_REFRESH_MAX ? '✓' : '✗'
          );
        }

        // Check threshold
        if (metric.latencyMs > PERFORMANCE_BUDGETS.LEADERBOARD_REFRESH_MAX) {
          this.performanceLogger('leaderboard_refresh_slow', {
            latency: metric.latencyMs,
            threshold: PERFORMANCE_BUDGETS.LEADERBOARD_REFRESH_MAX,
            cacheHit,
          });
        }

        // Report to analytics
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'leaderboard_refresh', {
            latency: Math.round(metric.latencyMs),
            cache_hit: cacheHit,
          });
        }
      },
    };
  }

  /**
   * Track cache hits/misses
   */
  trackCacheAccess(type: 'results' | 'gameState' | 'athletes', hit: boolean): void {
    const metric: CacheMetric = {
      type,
      hit,
      timestamp: new Date(),
    };

    this.cacheMetrics.push(metric);

    // Keep only the last maxMetrics entries
    if (this.cacheMetrics.length > this.maxMetrics) {
      this.cacheMetrics.shift();
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `[Cache] ${type}: ${hit ? 'HIT' : 'MISS'}`
      );
    }

    // Check threshold
    const hitRatio = this.getCacheHitRatio(type);
    if (hitRatio < PERFORMANCE_BUDGETS.CACHE_HIT_RATIO_MIN) {
      this.performanceLogger('cache_hit_ratio_low', {
        type,
        hitRatio,
        threshold: PERFORMANCE_BUDGETS.CACHE_HIT_RATIO_MIN,
      });
    }
  }

  /**
   * Performance event logger
   * Disabled in production except analytics
   */
  performanceLogger(event: string, payload: any): void {
    const logEvent: PerformanceEvent = {
      event,
      payload,
      timestamp: new Date(),
    };

    this.performanceEvents.push(logEvent);

    // Keep only last 50 events
    if (this.performanceEvents.length > 50) {
      this.performanceEvents.shift();
    }

    // Log to console in development only
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[Performance] ${event}`, payload);
    }

    // Always send to analytics if available (production monitoring)
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'performance_issue', {
        issue_type: event,
        ...payload,
      });
    }
  }
  /**
   * Get rating for Web Vital metric
   */
  private getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds: Record<string, [number, number]> = {
      CLS: [0.1, 0.25],
      INP: [200, 500],
      LCP: [2500, 4000],
      TTFB: [800, 1800],
    };

    const [goodThreshold, poorThreshold] = thresholds[name] || [0, 0];

    if (value <= goodThreshold) return 'good';
    if (value <= poorThreshold) return 'needs-improvement';
    return 'poor';
  }

  /**
   * Check if Web Vital exceeds threshold
   */
  private checkWebVitalThreshold(name: string, value: number): void {
    const thresholds: Record<string, number> = {
      CLS: PERFORMANCE_BUDGETS.CLS_THRESHOLD,
      INP: PERFORMANCE_BUDGETS.INP_THRESHOLD,
      LCP: PERFORMANCE_BUDGETS.LCP_THRESHOLD,
    };

    const threshold = thresholds[name];
    if (threshold && value > threshold) {
      this.performanceLogger('web_vital_threshold_exceeded', {
        metric: name,
        value,
        threshold,
      });
    }
  }

  /**
   * Get all collected chunk load metrics
   */
  getChunkMetrics(): ChunkLoadMetric[] {
    return [...this.chunkMetrics];
  }

  /**
   * Get metrics for a specific chunk
   */
  getChunkMetricsByName(chunkName: string): ChunkLoadMetric[] {
    return this.chunkMetrics.filter(m => m.chunkName === chunkName);
  }

  /**
   * Get chunk load median
   */
  getChunkLoadMedian(): number {
    if (this.chunkMetrics.length === 0) return 0;
    
    const times = this.chunkMetrics.map(m => m.loadTimeMs).sort((a, b) => a - b);
    const mid = Math.floor(times.length / 2);
    
    return times.length % 2 === 0
      ? (times[mid - 1] + times[mid]) / 2
      : times[mid];
  }

  /**
   * Get average load time for a chunk
   */
  getAverageLoadTime(chunkName: string): number {
    const chunkMetrics = this.getChunkMetricsByName(chunkName);
    if (chunkMetrics.length === 0) return 0;
    
    const total = chunkMetrics.reduce((sum, m) => sum + m.loadTimeMs, 0);
    return total / chunkMetrics.length;
  }

  /**
   * Get success rate for a chunk
   */
  private getSuccessRate(chunkName: string): number {
    const chunkMetrics = this.getChunkMetricsByName(chunkName);
    if (chunkMetrics.length === 0) return 0;
    
    const successCount = chunkMetrics.filter(m => m.success).length;
    return (successCount / chunkMetrics.length) * 100;
  }

  /**
   * Get all Web Vitals metrics
   */
  getWebVitalsMetrics(): WebVitalsMetric[] {
    return [...this.webVitalsMetrics];
  }

  /**
   * Get latest Web Vitals by name
   */
  getLatestWebVital(name: string): WebVitalsMetric | undefined {
    return [...this.webVitalsMetrics]
      .reverse()
      .find(m => m.name === name);
  }

  /**
   * Get all leaderboard refresh metrics
   */
  getLeaderboardMetrics(): LeaderboardRefreshMetric[] {
    return [...this.leaderboardMetrics];
  }

  /**
   * Get average leaderboard refresh latency
   */
  getAverageLeaderboardLatency(): number {
    if (this.leaderboardMetrics.length === 0) return 0;
    
    const total = this.leaderboardMetrics.reduce((sum, m) => sum + m.latencyMs, 0);
    return total / this.leaderboardMetrics.length;
  }

  /**
   * Get cache hit ratio
   */
  getCacheHitRatio(type?: 'results' | 'gameState' | 'athletes'): number {
    const metrics = type 
      ? this.cacheMetrics.filter(m => m.type === type)
      : this.cacheMetrics;
    
    if (metrics.length === 0) return 0;
    
    const hits = metrics.filter(m => m.hit).length;
    return hits / metrics.length;
  }

  /**
   * Get all cache metrics
   */
  getCacheMetrics(): CacheMetric[] {
    return [...this.cacheMetrics];
  }

  /**
   * Get all performance events
   */
  getPerformanceEvents(): PerformanceEvent[] {
    return [...this.performanceEvents];
  }

  /**
   * Get performance summary for dashboard
   */
  getSummary() {
    const uniqueChunks = [...new Set(this.chunkMetrics.map(m => m.chunkName))];
    
    return uniqueChunks.map(chunkName => ({
      chunkName,
      loadCount: this.getChunkMetricsByName(chunkName).length,
      avgLoadTime: this.getAverageLoadTime(chunkName),
      successRate: this.getSuccessRate(chunkName),
    }));
  }

  /**
   * Get comprehensive performance report
   */
  getPerformanceReport() {
    return {
      webVitals: {
        cls: this.getLatestWebVital('CLS'),
        lcp: this.getLatestWebVital('LCP'),
        inp: this.getLatestWebVital('INP'),
        ttfb: this.getLatestWebVital('TTFB'),
      },
      chunks: {
        summary: this.getSummary(),
        medianLoadTime: this.getChunkLoadMedian(),
        totalLoads: this.chunkMetrics.length,
      },
      leaderboard: {
        avgLatency: this.getAverageLeaderboardLatency(),
        totalRefreshes: this.leaderboardMetrics.length,
        cacheHitRatio: this.leaderboardMetrics.length > 0
          ? this.leaderboardMetrics.filter(m => m.cacheHit).length / this.leaderboardMetrics.length
          : 0,
      },
      cache: {
        overall: this.getCacheHitRatio(),
        results: this.getCacheHitRatio('results'),
        gameState: this.getCacheHitRatio('gameState'),
        athletes: this.getCacheHitRatio('athletes'),
        totalAccesses: this.cacheMetrics.length,
      },
      budgets: PERFORMANCE_BUDGETS,
      thresholdViolations: this.performanceEvents.filter(e => 
        e.event.includes('threshold_exceeded') || e.event.includes('slow') || e.event.includes('low')
      ).length,
    };
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.chunkMetrics = [];
    this.webVitalsMetrics = [];
    this.leaderboardMetrics = [];
    this.cacheMetrics = [];
    this.performanceEvents = [];
  }

  /**
   * Export metrics as JSON
   */
  exportMetrics(): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      report: this.getPerformanceReport(),
      rawMetrics: {
        chunks: this.chunkMetrics,
        webVitals: this.webVitalsMetrics,
        leaderboard: this.leaderboardMetrics,
        cache: this.cacheMetrics,
      },
      events: this.performanceEvents,
    }, null, 2);
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Higher-order component to track dynamic import loading
 */
export function withPerformanceTracking<T extends object>(
  chunkName: string,
  importFn: () => Promise<T>
): () => Promise<T> {
  return async () => {
    const tracker = performanceMonitor.trackChunkLoad(chunkName);
    
    try {
      const module = await importFn();
      tracker.finish(true);
      return module;
    } catch (error) {
      tracker.finish(false, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  };
}

/**
 * Expose performance monitor to window for debugging
 */
if (typeof window !== 'undefined') {
  (window as any).__performanceMonitor = performanceMonitor;
  
  // Add console helpers
  (window as any).getChunkPerformance = (chunkName?: string) => {
    if (chunkName) {
      console.table(performanceMonitor.getChunkMetricsByName(chunkName));
    } else {
      console.table(performanceMonitor.getSummary());
    }
  };

  (window as any).getWebVitals = () => {
    console.table(performanceMonitor.getWebVitalsMetrics());
  };

  (window as any).getCacheStats = () => {
    console.log('Cache Hit Ratios:', {
      overall: `${(performanceMonitor.getCacheHitRatio() * 100).toFixed(1)}%`,
      results: `${(performanceMonitor.getCacheHitRatio('results') * 100).toFixed(1)}%`,
      gameState: `${(performanceMonitor.getCacheHitRatio('gameState') * 100).toFixed(1)}%`,
      athletes: `${(performanceMonitor.getCacheHitRatio('athletes') * 100).toFixed(1)}%`,
    });
    console.table(performanceMonitor.getCacheMetrics().slice(-20)); // Last 20
  };

  (window as any).getPerformanceReport = () => {
    console.log(performanceMonitor.getPerformanceReport());
  };

  (window as any).getPerformanceEvents = () => {
    console.table(performanceMonitor.getPerformanceEvents());
  };
}
