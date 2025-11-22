/**
 * BottomNav Component
 * 
 * Mobile bottom navigation toolbar for Marathon Majors Fantasy League.
 * 
 * Features:
 * - 4 primary navigation items (Home, Team, Standings, Athletes)
 * - Icon + label format for clarity
 * - Route-aware active states with navy color
 * - Mobile-only visibility (hidden on ≥768px)
 * - Fixed positioning at bottom
 * - Touch-optimized (44x44px minimum touch targets)
 * - WCAG 2.1 AA accessible
 * 
 * Implementation:
 * - Uses Next.js router for navigation and route detection
 * - Integrates with Heroicons for consistent iconography
 * - Follows Chakra UI v3 design system
 * - Respects navy/gold brand palette
 * 
 * Part of Phase 3: Core Navigation Implementation (Week 11-12)
 * Parent Issue: #122 - Core Navigation Implementation
 * Grand-parent Issue: #59 - Redesign UI with Modern Mobile-First Look
 * 
 * References:
 * - Spec: docs/UI_REDESIGN/UI_PHASE2_NAVIGATION_SPEC.md
 * - Roadmap: docs/UI_REDESIGN_ROADMAP.md (Phase 3, Week 11-12)
 * - Design: docs/CORE_DESIGN_GUIDELINES.md (Navigation System)
 */

import { Flex, Box } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { HomeIcon, UsersIcon, TrophyIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { BottomNavItem } from './BottomNavItem';

/**
 * Navigation item configuration
 */
interface NavItem {
  icon: React.ComponentType<{ style?: React.CSSProperties }>;
  label: string;
  href: string;
  matchPaths?: string[]; // Additional paths that should mark this nav item as active
}

/**
 * Default navigation items for the bottom toolbar
 * Updated to include Race (5 items) - Phase 3 enhancement
 */
const DEFAULT_NAV_ITEMS: NavItem[] = [
  {
    icon: HomeIcon,
    label: 'Home',
    href: '/',
    matchPaths: [],
  },
  {
    icon: UsersIcon,
    label: 'Team',
    href: '/team',
    matchPaths: ['/team/[session]'], // Match team session pages
  },
  {
    icon: CalendarIcon,
    label: 'Race',
    href: '/race',
    matchPaths: [],
  },
  {
    icon: TrophyIcon,
    label: 'Standings',
    href: '/leaderboard',
    matchPaths: [],
  },
  {
    icon: UsersIcon, // Using UsersIcon for Athletes (can be changed to a running icon)
    label: 'Athletes',
    href: '/athletes',
    matchPaths: [],
  },
];

export interface BottomNavProps {
  /**
   * Custom navigation items (optional)
   * Defaults to the standard 4-item navigation
   */
  items?: NavItem[];
  
  /**
   * Additional class name for styling
   */
  className?: string;
}

/**
 * Check if a navigation item should be marked as active
 */
function isNavItemActive(
  currentPath: string, 
  itemHref: string, 
  matchPaths: string[] = []
): boolean {
  // Exact match
  if (currentPath === itemHref) {
    return true;
  }
  
  // Prefix match for nested routes (e.g., /team/abc123)
  if (itemHref !== '/' && currentPath.startsWith(itemHref)) {
    return true;
  }
  
  // Check additional match paths
  for (const path of matchPaths) {
    if (currentPath.startsWith(path.replace('[session]', ''))) {
      return true;
    }
  }
  
  return false;
}

/**
 * BottomNav Component
 * 
 * Mobile-only bottom navigation toolbar with 4 primary navigation items.
 * Hidden on desktop (≥768px) per responsive design specifications.
 */
export function BottomNav({ items = DEFAULT_NAV_ITEMS, className }: BottomNavProps) {
  const router = useRouter();
  const currentPath = router.pathname;
  
  return (
    <Box
      as="nav"
      position="fixed"
      bottom={0}
      left={0}
      right={0}
      zIndex={10002} // High z-index to ensure it's above legacy content
      bg="white"
      borderTop="2px solid"
      borderColor="gray.200"
      boxShadow="0 -4px 12px rgba(0, 0, 0, 0.1)"
      height="64px"
      display={{ base: 'block', md: 'none' }} // Mobile only (<768px)
      className={className}
      role="navigation"
      aria-label="Mobile primary navigation"
    >
      <Flex
        height="100%"
        px={2}
        justify="space-around"
        align="center"
      >
        {items.map((item) => {
          const isActive = isNavItemActive(
            currentPath, 
            item.href, 
            item.matchPaths
          );
          
          return (
            <BottomNavItem
              key={item.href}
              icon={item.icon}
              label={item.label}
              href={item.href}
              isActive={isActive}
            />
          );
        })}
      </Flex>
    </Box>
  );
}

// Re-export BottomNavItem for convenience
export { BottomNavItem } from './BottomNavItem';
export type { BottomNavItemProps } from './BottomNavItem';
