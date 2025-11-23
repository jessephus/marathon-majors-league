/**
 * Feature Flag System
 * 
 * Controls feature rollout and enables A/B testing for performance optimizations.
 * Related to Issue #98: Dynamic imports & feature flags after foundational extraction
 */

export enum FeatureFlag {
  // Dynamic Import Features
  DYNAMIC_ATHLETE_MODAL = 'dynamic_athlete_modal',
  DYNAMIC_COMMISSIONER_PANELS = 'dynamic_commissioner_panels',
  
  // Performance Features
  AGGRESSIVE_CODE_SPLITTING = 'aggressive_code_splitting',
  PREFETCH_ON_HOVER = 'prefetch_on_hover',
  
  // UI Redesign Features (Phase 3: Navigation)
  CHAKRA_HEADER = 'chakra_header',
  CHAKRA_BOTTOM_NAV = 'chakra_bottom_nav',
  
  // Experimental Features
  EXPERIMENTAL_BUNDLE_ANALYSIS = 'experimental_bundle_analysis',
}

interface FeatureFlagConfig {
  enabled: boolean;
  description: string;
  rolloutPercentage?: number; // 0-100, for gradual rollout
  enabledForUsers?: string[]; // Specific user emails/IDs
  environment?: ('development' | 'production' | 'preview')[];
}

type FeatureFlagRegistry = {
  [key in FeatureFlag]: FeatureFlagConfig;
};

/**
 * Feature flag registry with default configurations
 */
const featureFlagRegistry: FeatureFlagRegistry = {
  [FeatureFlag.DYNAMIC_ATHLETE_MODAL]: {
    enabled: true,
    description: 'Load AthleteModal component on-demand to reduce initial bundle size',
    rolloutPercentage: 100,
    environment: ['development', 'production', 'preview'],
  },
  [FeatureFlag.DYNAMIC_COMMISSIONER_PANELS]: {
    enabled: true,
    description: 'Split commissioner dashboard panels into separate chunks',
    rolloutPercentage: 100,
    environment: ['development', 'production', 'preview'],
  },
  [FeatureFlag.AGGRESSIVE_CODE_SPLITTING]: {
    enabled: false,
    description: 'Enable aggressive code splitting for all components >50KB',
    rolloutPercentage: 0,
    environment: ['development'],
  },
  [FeatureFlag.PREFETCH_ON_HOVER]: {
    enabled: true,
    description: 'Prefetch dynamic chunks on hover/focus for better perceived performance',
    rolloutPercentage: 100,
    environment: ['production', 'preview'],
  },
  [FeatureFlag.CHAKRA_HEADER]: {
    enabled: true,
    description: 'Replace legacy header with new Chakra UI StickyHeader component (includes MobileMenuDrawer on mobile)',
    rolloutPercentage: 100,
    environment: ['development', 'preview', 'production'], // Enabled in all environments
  },
  [FeatureFlag.CHAKRA_BOTTOM_NAV]: {
    enabled: true,
    description: 'Replace legacy mobile navigation with new Chakra UI BottomNav component (Phase 3)',
    rolloutPercentage: 100,
    environment: ['development', 'preview', 'production'], // Enabled in all environments
  },
  [FeatureFlag.EXPERIMENTAL_BUNDLE_ANALYSIS]: {
    enabled: false,
    description: 'Enable experimental bundle analysis tools',
    rolloutPercentage: 0,
    environment: ['development'],
  },
};

/**
 * Feature flag manager class
 */
class FeatureFlagManager {
  private overrides: Map<FeatureFlag, boolean> = new Map();
  private userId: string | null = null;

  /**
   * Check if a feature flag is enabled
   */
  isEnabled(flag: FeatureFlag): boolean {
    // Check for manual override first
    if (this.overrides.has(flag)) {
      return this.overrides.get(flag)!;
    }

    const config = featureFlagRegistry[flag];
    
    // Check if disabled globally
    if (!config.enabled) {
      return false;
    }

    // Check environment
    if (config.environment) {
      const currentEnv = this.getCurrentEnvironment();
      if (!config.environment.includes(currentEnv)) {
        return false;
      }
    }

    // Check rollout percentage (simple hash-based distribution)
    if (config.rolloutPercentage !== undefined && config.rolloutPercentage < 100) {
      const userHash = this.getUserHash();
      const isInRollout = (userHash % 100) < config.rolloutPercentage;
      if (!isInRollout) {
        return false;
      }
    }

    // Check user allowlist
    if (config.enabledForUsers && config.enabledForUsers.length > 0) {
      if (!this.userId || !config.enabledForUsers.includes(this.userId)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Override a feature flag (for testing)
   */
  override(flag: FeatureFlag, enabled: boolean): void {
    this.overrides.set(flag, enabled);
    console.log(`[FeatureFlags] Override: ${flag} = ${enabled}`);
  }

  /**
   * Clear all overrides
   */
  clearOverrides(): void {
    this.overrides.clear();
  }

  /**
   * Set user ID for feature flag targeting
   */
  setUserId(userId: string): void {
    this.userId = userId;
  }

  /**
   * Get current environment
   * 
   * Priority order:
   * 1. NODE_ENV (respects build mode: production vs development)
   * 2. Hostname detection (distinguishes preview vs production deployments)
   * 
   * This ensures production builds disable dev-only features even on localhost.
   */
  private getCurrentEnvironment(): 'development' | 'production' | 'preview' {
    // Check NODE_ENV first - this respects the build mode
    // Production builds should always return 'production' regardless of hostname
    if (process.env.NODE_ENV === 'production') {
      // In production builds, check if we're on a Vercel preview deployment
      if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        if (hostname.includes('vercel.app') && !hostname.includes('marathonmajorsfantasy')) {
          return 'preview';
        }
      }
      return 'production';
    }
    
    // Development builds (NODE_ENV !== 'production')
    // Still check hostname to distinguish between dev and preview deployments
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      
      if (hostname.includes('vercel.app')) {
        return 'preview';
      }
    }
    
    return 'development';
  }

  /**
   * Generate a consistent hash for the current user/session
   */
  private getUserHash(): number {
    if (this.userId) {
      return this.simpleHash(this.userId);
    }

    // Use session storage or generate a stable session ID
    if (typeof window !== 'undefined') {
      let sessionId = sessionStorage.getItem('feature_flag_session_id');
      if (!sessionId) {
        // Use crypto.getRandomValues for secure randomness
        // Feature flags aren't a security boundary, but we should use proper randomness
        const array = new Uint32Array(2);
        if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
          crypto.getRandomValues(array);
          sessionId = Array.from(array).map(n => n.toString(36)).join('');
        } else {
          // Fallback for environments without crypto (shouldn't happen in browsers)
          sessionId = Date.now().toString(36) + Math.random().toString(36).substring(2);
        }
        sessionStorage.setItem('feature_flag_session_id', sessionId);
      }
      return this.simpleHash(sessionId);
    }

    return 0;
  }

  /**
   * Simple string hash function
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Get all feature flags and their status
   */
  getAll(): Array<{ flag: FeatureFlag; enabled: boolean; config: FeatureFlagConfig }> {
    return Object.entries(featureFlagRegistry).map(([flag, config]) => ({
      flag: flag as FeatureFlag,
      enabled: this.isEnabled(flag as FeatureFlag),
      config,
    }));
  }

  /**
   * Export feature flag state
   */
  export(): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      environment: this.getCurrentEnvironment(),
      userId: this.userId,
      flags: this.getAll(),
      overrides: Array.from(this.overrides.entries()),
    }, null, 2);
  }
}

// Singleton instance
export const featureFlags = new FeatureFlagManager();

/**
 * React hook for feature flags
 */
export function useFeatureFlag(flag: FeatureFlag): boolean {
  return featureFlags.isEnabled(flag);
}

/**
 * Expose feature flags to window for debugging
 */
if (typeof window !== 'undefined') {
  (window as any).__featureFlags = featureFlags;
  
  // Add console helpers
  (window as any).getFeatureFlags = () => {
    console.table(
      featureFlags.getAll().map(({ flag, enabled, config }) => ({
        flag,
        enabled,
        description: config.description,
      }))
    );
  };
  
  (window as any).toggleFeatureFlag = (flag: FeatureFlag, enabled?: boolean) => {
    const currentState = featureFlags.isEnabled(flag);
    const newState = enabled !== undefined ? enabled : !currentState;
    featureFlags.override(flag, newState);
    console.log(`Feature flag ${flag} is now ${newState ? 'enabled' : 'disabled'}`);
  };
}
