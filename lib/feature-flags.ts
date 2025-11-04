/**
 * Feature Flags
 * 
 * Controls gradual rollout of new Next.js pages during migration.
 * Allows parallel implementation where new pages coexist with legacy code.
 */

// Feature flag configuration from environment variables
export const featureFlags = {
  // Enable new landing page (index.tsx)
  enableNewLanding: process.env.NEXT_PUBLIC_ENABLE_NEW_LANDING === 'true',
  
  // Enable new leaderboard page
  enableNewLeaderboard: process.env.NEXT_PUBLIC_ENABLE_NEW_LEADERBOARD === 'true',
  
  // Enable new commissioner dashboard
  enableNewCommissioner: process.env.NEXT_PUBLIC_ENABLE_NEW_COMMISSIONER === 'true',
  
  // Enable new team session/draft page
  enableNewTeamSession: process.env.NEXT_PUBLIC_ENABLE_NEW_TEAM_SESSION === 'true',
  
  // Enable athlete modal component
  enableAthleteModal: process.env.NEXT_PUBLIC_ENABLE_ATHLETE_MODAL === 'true',
} as const;

/**
 * Check if a specific feature is enabled
 */
export function isFeatureEnabled(feature: keyof typeof featureFlags): boolean {
  return featureFlags[feature];
}

/**
 * Get all enabled features
 */
export function getEnabledFeatures(): string[] {
  return Object.entries(featureFlags)
    .filter(([_, enabled]) => enabled)
    .map(([feature]) => feature);
}

/**
 * Development helper to log feature flag status
 */
export function logFeatureFlags() {
  if (process.env.NODE_ENV === 'development') {
    console.log('🚩 Feature Flags:', featureFlags);
  }
}
