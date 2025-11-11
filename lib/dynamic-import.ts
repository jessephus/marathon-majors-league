/**
 * Dynamic Import Utilities
 * 
 * Provides utilities for dynamic imports with performance tracking and feature flags.
 * Related to Issue #98: Dynamic imports & feature flags after foundational extraction
 */

import dynamic, { DynamicOptions } from 'next/dynamic';
import { ComponentType } from 'react';
import { performanceMonitor } from './performance-monitor';
import { FeatureFlag, featureFlags } from './feature-flags';

// Define our own loader type that's always a function
type LoaderFn<P = any> = () => Promise<ComponentType<P> | { default: ComponentType<P> }>;

interface DynamicImportOptions<P = any> extends Omit<DynamicOptions<P>, 'loader'> {
  chunkName: string;
  featureFlag?: FeatureFlag;
  fallbackComponent?: ComponentType<P>;
}

/**
 * Enhanced dynamic import with performance tracking and feature flag support
 * 
 * @example
 * const AthleteModal = dynamicImport({
 *   chunkName: 'chunk-athlete-modal',
 *   loader: () => import('@/components/AthleteModal'),
 *   featureFlag: FeatureFlag.DYNAMIC_ATHLETE_MODAL,
 *   loading: () => <SkeletonLoader />,
 *   ssr: false,
 * });
 */
export function dynamicImport<P = any>(
  loader: LoaderFn<P>,
  options: DynamicImportOptions<P>
): ComponentType<P> {
  const { chunkName, featureFlag, fallbackComponent, ...dynamicOptions } = options;

  // If feature flag is specified and disabled, return fallback or static import
  if (featureFlag && !featureFlags.isEnabled(featureFlag)) {
    if (fallbackComponent) {
      return fallbackComponent;
    }
    // If no fallback, we still use dynamic import but log it's a fallback behavior
    console.warn(
      `[DynamicImport] Feature flag ${featureFlag} disabled, but no fallback provided for ${chunkName}`
    );
  }

  // Wrap loader with performance tracking
  const trackedLoader: LoaderFn<P> = () => {
    const tracker = performanceMonitor.trackChunkLoad(chunkName);
    
    return loader()
      .then((module) => {
        tracker.finish(true);
        return module;
      })
      .catch((error) => {
        tracker.finish(false, error instanceof Error ? error.message : 'Unknown error');
        throw error;
      });
  };

  return dynamic(trackedLoader, {
    ...dynamicOptions,
  });
}

/**
 * Prefetch a dynamic chunk
 * Useful for hover/focus interactions to improve perceived performance
 */
export function prefetchChunk(loader: () => Promise<any>, chunkName: string): void {
  if (typeof window === 'undefined') return;

  // Check if prefetch is enabled
  if (!featureFlags.isEnabled(FeatureFlag.PREFETCH_ON_HOVER)) {
    return;
  }

  // Track prefetch as a separate metric
  const tracker = performanceMonitor.trackChunkLoad(`${chunkName}-prefetch`);
  
  loader()
    .then(() => {
      tracker.finish(true);
    })
    .catch((error) => {
      tracker.finish(false, error.message);
    });
}

/**
 * Predictable chunk naming for commissioner panels
 */
export const CHUNK_NAMES = {
  ATHLETE_MODAL: 'chunk-athlete-modal',
  COMMISSIONER_RESULTS: 'chunk-commissioner-results',
  COMMISSIONER_ATHLETES: 'chunk-commissioner-athletes',
  COMMISSIONER_TEAMS: 'chunk-commissioner-teams',
  LEADERBOARD_TABLE: 'chunk-leaderboard-table',
  BUDGET_TRACKER: 'chunk-budget-tracker',
} as const;

/**
 * Log bundle size information (development only)
 */
export function logBundleInfo(): void {
  if (process.env.NODE_ENV !== 'development') return;

  console.log('=== Bundle Information ===');
  console.log('Dynamic chunks configured:');
  Object.entries(CHUNK_NAMES).forEach(([key, chunkName]) => {
    console.log(`  - ${key}: ${chunkName}`);
  });
  console.log('');
  console.log('To view chunk performance:');
  console.log('  window.getChunkPerformance()');
  console.log('');
  console.log('To view feature flags:');
  console.log('  window.getFeatureFlags()');
  console.log('==========================');
}

// Log on initialization in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  logBundleInfo();
}
