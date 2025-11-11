/**
 * Performance Monitor for Dynamic Imports
 * 
 * Tracks chunk load times and provides instrumentation for performance analysis.
 * Related to Issue #98: Dynamic imports & feature flags after foundational extraction
 */

interface ChunkLoadMetric {
  chunkName: string;
  startTime: number;
  endTime: number;
  loadTimeMs: number;
  timestamp: Date;
  success: boolean;
  error?: string;
}

class PerformanceMonitor {
  private metrics: ChunkLoadMetric[] = [];
  private readonly maxMetrics = 100; // Keep last 100 metrics

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

        this.metrics.push(metric);
        
        // Keep only the last maxMetrics entries
        if (this.metrics.length > this.maxMetrics) {
          this.metrics.shift();
        }

        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
          console.log(
            `[Chunk Load] ${chunkName}: ${metric.loadTimeMs.toFixed(2)}ms`,
            success ? '✓' : '✗'
          );
        }

        // Report to analytics if available (can be extended)
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
   * Get all collected metrics
   */
  getMetrics(): ChunkLoadMetric[] {
    return [...this.metrics];
  }

  /**
   * Get metrics for a specific chunk
   */
  getChunkMetrics(chunkName: string): ChunkLoadMetric[] {
    return this.metrics.filter(m => m.chunkName === chunkName);
  }

  /**
   * Get average load time for a chunk
   */
  getAverageLoadTime(chunkName: string): number {
    const chunkMetrics = this.getChunkMetrics(chunkName);
    if (chunkMetrics.length === 0) return 0;
    
    const total = chunkMetrics.reduce((sum, m) => sum + m.loadTimeMs, 0);
    return total / chunkMetrics.length;
  }

  /**
   * Get performance summary for dashboard
   */
  getSummary() {
    const uniqueChunks = [...new Set(this.metrics.map(m => m.chunkName))];
    
    return uniqueChunks.map(chunkName => ({
      chunkName,
      loadCount: this.getChunkMetrics(chunkName).length,
      avgLoadTime: this.getAverageLoadTime(chunkName),
      successRate: this.getSuccessRate(chunkName),
    }));
  }

  /**
   * Get success rate for a chunk
   */
  private getSuccessRate(chunkName: string): number {
    const chunkMetrics = this.getChunkMetrics(chunkName);
    if (chunkMetrics.length === 0) return 0;
    
    const successCount = chunkMetrics.filter(m => m.success).length;
    return (successCount / chunkMetrics.length) * 100;
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * Export metrics as JSON
   */
  exportMetrics(): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      summary: this.getSummary(),
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
  
  // Add console helper
  (window as any).getChunkPerformance = (chunkName?: string) => {
    if (chunkName) {
      console.table(performanceMonitor.getChunkMetrics(chunkName));
    } else {
      console.table(performanceMonitor.getSummary());
    }
  };
}
