/**
 * NavigationWrapper Component
 * 
 * Smart wrapper that conditionally renders new Chakra UI navigation or legacy navigation
 * based on feature flags. Enables gradual A/B rollout of Phase 3 navigation components.
 * 
 * Features:
 * - Feature flag-based rendering (chakra_header, chakra_bottom_nav)
 * - Fallback to legacy navigation when flags are disabled
 * - Zero downtime during rollout
 * - Proper padding for fixed header/footer
 * - Preserves existing page content
 * 
 * Implementation:
 * - Uses FeatureFlag system for gradual rollout (10% → 100%)
 * - Integrates StickyHeader and BottomNav components
 * - Handles responsive padding based on viewport size
 * - Ensures no content overlap with fixed navigation
 * 
 * Part of Phase 3: Core Navigation Implementation
 * Parent Issue: #122 - Core Navigation Implementation
 * Current Issue: Navigation Feature Flags & Gradual Rollout
 * 
 * References:
 * - Feature Flags: lib/feature-flags.ts
 * - StickyHeader: components/navigation/StickyHeader/index.tsx
 * - BottomNav: components/navigation/BottomNav/index.tsx
 * - Roadmap: docs/UI_REDESIGN_ROADMAP.md (Phase 3, Week 11-14)
 */

import { ReactNode } from 'react';
import { Box } from '@chakra-ui/react';
import { useFeatureFlag, FeatureFlag } from '@/lib/feature-flags';
import { StickyHeader } from './StickyHeader';
import { BottomNav } from './BottomNav';

export interface NavigationWrapperProps {
  /**
   * Page content to render
   */
  children: ReactNode;
  
  /**
   * Disable navigation rendering entirely (for special pages)
   */
  hideNavigation?: boolean;
  
  /**
   * Additional class name for the content wrapper
   */
  className?: string;
}

/**
 * NavigationWrapper Component
 * 
 * Wraps page content with appropriate navigation based on feature flags.
 * Handles the transition from legacy navigation to new Chakra UI navigation.
 */
export function NavigationWrapper({
  children,
  hideNavigation = false,
  className,
}: NavigationWrapperProps) {
  // Check feature flags for navigation components
  const useChakraHeader = useFeatureFlag(FeatureFlag.CHAKRA_HEADER);
  const useChakraBottomNav = useFeatureFlag(FeatureFlag.CHAKRA_BOTTOM_NAV);
  
  // If navigation is hidden, just render children
  if (hideNavigation) {
    return <>{children}</>;
  }
  
  // Calculate top padding based on header presence
  // Header heights: 60px (base), 72px (md), 80px (lg)
  const topPadding = useChakraHeader
    ? { base: '60px', md: '72px', lg: '80px' }
    : 0;
  
  // Calculate bottom padding based on bottom nav presence
  // Bottom nav height: 64px (mobile only)
  const bottomPadding = useChakraBottomNav
    ? { base: '64px', md: 0 }
    : 0;
  
  return (
    <>
      {/* Render Chakra header if feature flag is enabled */}
      {useChakraHeader && <StickyHeader />}
      
      {/* Main content with appropriate padding to prevent overlap */}
      <Box
        as="main"
        pt={topPadding}
        pb={bottomPadding}
        minHeight="100vh"
        className={className}
      >
        {children}
      </Box>
      
      {/* Render Chakra bottom nav if feature flag is enabled */}
      {useChakraBottomNav && <BottomNav />}
      
      {/* Legacy navigation fallback */}
      {/* Note: Legacy navigation is rendered by the vanilla JS in public/app.js */}
      {/* When feature flags are disabled, the legacy navigation will be visible */}
    </>
  );
}

/**
 * Hook to check if new navigation is active
 * Useful for conditional logic in other components
 */
export function useNewNavigation() {
  const useChakraHeader = useFeatureFlag(FeatureFlag.CHAKRA_HEADER);
  const useChakraBottomNav = useFeatureFlag(FeatureFlag.CHAKRA_BOTTOM_NAV);
  
  return {
    hasChakraHeader: useChakraHeader,
    hasChakraBottomNav: useChakraBottomNav,
    hasAnyNewNav: useChakraHeader || useChakraBottomNav,
  };
}
