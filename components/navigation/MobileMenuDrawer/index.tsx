/**
 * MobileMenuDrawer Component
 * 
 * Slide-out drawer for mobile navigation (<768px only).
 * 
 * Features:
 * - Slides in from right side with smooth animation
 * - Contains all navigation options (Home, Team, Standings, Athletes, Help, Commissioner, Logout)
 * - Automatically closes when user navigates to a new route
 * - Navy background matching brand palette
 * - WCAG 2.1 AA accessible with keyboard navigation
 * - Mobile-only (hidden on desktop ≥768px where items are in header)
 * - Touch-optimized targets (48x48px minimum)
 * - Enhanced microinteractions and polish
 * - Stagger animation for menu items
 * - Smooth fade-in overlay
 * 
 * Implementation:
 * - Uses custom overlay + animated drawer (position: fixed)
 * - Integrates with Next.js router for route change detection
 * - Uses Heroicons for consistent iconography
 * - Follows navy/gold brand palette
 * 
 * Part of Phase 3: Core Navigation Implementation (Week 13-14 + Polish)
 * Parent Issue: #122 - Core Navigation Implementation
 * GitHub Issue: [Mobile Menu Drawer]
 * 
 * References:
 * - Spec: docs/UI_REDESIGN/UI_PHASE2_NAVIGATION_SPEC.md
 * - Roadmap: docs/UI_REDESIGN_ROADMAP.md (Phase 3, Week 13-14)
 * - Design: docs/CORE_DESIGN_GUIDELINES.md (Navigation System)
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  Box,
  VStack,
  HStack,
  Text,
  Separator,
  Image,
  Heading,
  IconButton,
  Portal,
} from '@chakra-ui/react';
import {
  HomeIcon,
  UsersIcon,
  TrophyIcon,
  QuestionMarkCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  XMarkIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/chakra/Button';
import { getTeamHref } from '@/lib/navigation-utils';

/**
 * Navigation item configuration
 */
export interface MenuItem {
  icon: React.ComponentType<{ style?: React.CSSProperties }>;
  label: string;
  href: string;
  description?: string;
  isDynamic?: boolean; // Whether href should be computed dynamically
}

/**
 * Get default navigation items (with dynamic team link)
 */
function getDefaultMenuItems(): MenuItem[] {
  return [
    {
      icon: HomeIcon,
      label: 'Home',
      href: '/',
      description: 'Dashboard and overview',
    },
  {
    icon: CalendarIcon,
    label: 'Race',
    href: '/race',
    description: 'Race details and athletes',
  },
    {
      icon: UsersIcon,
      label: 'My Team',
      href: getTeamHref(), // Dynamic based on session
      description: 'Manage your roster',
      isDynamic: true,
    },
    {
      icon: TrophyIcon,
      label: 'Standings',
      href: '/leaderboard',
      description: 'League rankings',
    },
    {
      icon: UsersIcon,
      label: 'Athletes',
      href: '/athletes',
      description: 'Browse runners',
    },
  ];
}

/**
 * Secondary action items (Help, Commissioner)
 */
const SECONDARY_ITEMS: MenuItem[] = [
  {
    icon: QuestionMarkCircleIcon,
    label: 'Help',
    href: '/help',
    description: 'Get assistance',
  },
  {
    icon: Cog6ToothIcon,
    label: 'Commissioner',
    href: '/commissioner',
    description: 'Admin tools',
  },
];

export interface MobileMenuDrawerProps {
  /**
   * Whether the drawer is open
   */
  isOpen: boolean;

  /**
   * Callback when drawer should close
   */
  onClose: () => void;

  /**
   * Custom menu items (optional)
   */
  menuItems?: MenuItem[];

  /**
   * Custom secondary items (optional)
   */
  secondaryItems?: MenuItem[];

  /**
   * Show logout button (optional, defaults to true)
   */
  showLogout?: boolean;

  /**
   * Callback when logout is clicked
   */
  onLogout?: () => void;
}

/**
 * Check if a menu item matches the current route
 */
function isMenuItemActive(currentPath: string, itemHref: string): boolean {
  // Exact match
  if (currentPath === itemHref) {
    return true;
  }

  // Prefix match for nested routes (except home)
  if (itemHref !== '/' && currentPath.startsWith(itemHref)) {
    return true;
  }

  return false;
}

/**
 * MobileMenuDrawer Component
 * 
 * Slide-out navigation drawer for mobile devices.
 * Automatically closes when user navigates to a new route.
 * Team link dynamically adapts based on active session.
 */
export function MobileMenuDrawer({
  isOpen,
  onClose,
  menuItems,
  secondaryItems = SECONDARY_ITEMS,
  showLogout = true,
  onLogout,
}: MobileMenuDrawerProps) {
  const router = useRouter();
  const [isAnimating, setIsAnimating] = useState(false);

  // Use default items if not provided, recomputing on each render for dynamic hrefs
  const computedMenuItems = menuItems || getDefaultMenuItems();
  
  // Re-evaluate dynamic hrefs when router changes (for session updates)
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    // Listen for session updates to re-render with new team href
    if (typeof window === 'undefined') return;
    
    const handleSessionUpdate = () => {
      forceUpdate(prev => prev + 1);
    };
    
    window.addEventListener('sessionsUpdated', handleSessionUpdate);
    return () => window.removeEventListener('sessionsUpdated', handleSessionUpdate);
  }, []);

  // Track animation state for smooth transitions
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    } else {
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Close drawer when route changes
  useEffect(() => {
    const handleRouteChange = () => {
      onClose();
    };

    router.events.on('routeChangeStart', handleRouteChange);

    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [router, onClose]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen && !isAnimating) return null;

  return (
    <Portal>
      {/* Overlay with smooth fade animation */}
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bg="blackAlpha.600"
        zIndex={1400}
        onClick={onClose}
        opacity={isOpen ? 1 : 0}
        transition="opacity 0.25s cubic-bezier(0, 0, 0.2, 1)"
        css={{
          '@media (prefers-reduced-motion: reduce)': {
            transition: 'none',
          }
        }}
      />

      {/* Drawer with enhanced slide animation */}
      <Box
        position="fixed"
        top={0}
        right={0}
        bottom={0}
        width={{ base: '280px', sm: '320px' }}
        bg="navy.900"
        color="white"
        zIndex={1401}
        overflowY="auto"
        transform={isOpen ? 'translateX(0)' : 'translateX(100%)'}
        transition="transform 0.3s cubic-bezier(0, 0, 0.2, 1)"
        display="flex"
        flexDirection="column"
        boxShadow="xl"
        css={{
          '@media (prefers-reduced-motion: reduce)': {
            transition: 'none',
            transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          }
        }}
      >
        {/* Header */}
        <Box
          px={6}
          py={6}
          borderBottomWidth="1px"
          borderBottomColor="whiteAlpha.200"
          position="relative"
        >
          <IconButton
            aria-label="Close menu"
            variant="ghost"
            size="sm"
            color="white"
            _hover={{ bg: 'whiteAlpha.200' }}
            _active={{ bg: 'whiteAlpha.300' }}
            position="absolute"
            top={4}
            right={4}
            onClick={onClose}
          >
            <XMarkIcon style={{ width: '20px', height: '20px' }} />
          </IconButton>

          <HStack gap={3}>
            <Image
              src="/images/MMFL-logo.png"
              alt="MMFL Logo"
              width="40px"
              height="40px"
              objectFit="contain"
            />
            <VStack align="start" gap={0}>
              <Heading size="md" lineHeight={1.2} fontWeight="bold">
                Marathon Majors
              </Heading>
              <Text fontSize="sm" opacity={0.8} lineHeight={1.2}>
                Fantasy League
              </Text>
            </VStack>
          </HStack>
        </Box>

        {/* Body with stagger animation for menu items */}
        <Box px={4} py={6} flex={1}>
          <VStack gap={2} align="stretch">
            {/* Primary Navigation Items with stagger effect */}
            {computedMenuItems.map((item, index) => {
              const Icon = item.icon;
              // Recompute dynamic hrefs at render time
              const href = item.isDynamic ? getTeamHref() : item.href;
              const isActive = isMenuItemActive(router.pathname, href);

              return (
                <Link key={item.label} href={href} passHref legacyBehavior>
                  <Box
                    as="a"
                    display="flex"
                    alignItems="center"
                    gap={3}
                    px={4}
                    py={3}
                    borderRadius="md"
                    bg={isActive ? 'whiteAlpha.200' : 'transparent'}
                    color={isActive ? 'gold.400' : 'white'}
                    fontWeight={isActive ? 'semibold' : 'medium'}
                    // Enhanced transitions with stagger
                    transition="all 0.2s cubic-bezier(0, 0, 0.2, 1)"
                    transitionDelay={isOpen ? `${index * 0.05}s` : '0s'}
                    opacity={isOpen ? 1 : 0}
                    transform={isOpen ? 'translateX(0)' : 'translateX(20px)'}
                    _hover={{
                      bg: 'whiteAlpha.100',
                      transform: 'translateX(4px)',
                      color: isActive ? 'gold.300' : 'whiteAlpha.900',
                    }}
                    _active={{
                      bg: 'whiteAlpha.300',
                      transform: 'scale(0.98)',
                    }}
                    cursor="pointer"
                    minH="48px"
                    css={{
                      '@media (prefers-reduced-motion: reduce)': {
                        transition: 'background-color 0.2s',
                        transitionDelay: '0s',
                        transform: 'none !important',
                        opacity: 1,
                      }
                    }}
                  >
                    <Icon
                      style={{
                        width: '24px',
                        height: '24px',
                        flexShrink: 0,
                      }}
                    />
                    <VStack align="start" gap={0} flex={1}>
                      <Text fontSize="md" lineHeight={1.3}>
                        {item.label}
                      </Text>
                      {item.description && (
                        <Text
                          fontSize="xs"
                          opacity={0.7}
                          lineHeight={1.2}
                          color={isActive ? 'gold.300' : 'whiteAlpha.700'}
                        >
                          {item.description}
                        </Text>
                      )}
                    </VStack>
                  </Box>
                </Link>
              );
            })}

            {/* Separator */}
            <Separator my={2} borderColor="whiteAlpha.200" />

            {/* Secondary Items (Help, Commissioner) with stagger */}
            {secondaryItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = isMenuItemActive(router.pathname, item.href);
              const staggerIndex = computedMenuItems.length + index;

              return (
                <Link key={item.href} href={item.href} passHref legacyBehavior>
                  <Box
                    as="a"
                    display="flex"
                    alignItems="center"
                    gap={3}
                    px={4}
                    py={3}
                    borderRadius="md"
                    bg={isActive ? 'whiteAlpha.200' : 'transparent'}
                    color={isActive ? 'gold.400' : 'white'}
                    fontWeight={isActive ? 'semibold' : 'medium'}
                    transition="all 0.2s cubic-bezier(0, 0, 0.2, 1)"
                    transitionDelay={isOpen ? `${staggerIndex * 0.05}s` : '0s'}
                    opacity={isOpen ? 1 : 0}
                    transform={isOpen ? 'translateX(0)' : 'translateX(20px)'}
                    _hover={{
                      bg: 'whiteAlpha.100',
                      transform: 'translateX(4px)',
                      color: isActive ? 'gold.300' : 'whiteAlpha.900',
                    }}
                    _active={{
                      bg: 'whiteAlpha.300',
                      transform: 'scale(0.98)',
                    }}
                    cursor="pointer"
                    minH="48px"
                    css={{
                      '@media (prefers-reduced-motion: reduce)': {
                        transition: 'background-color 0.2s',
                        transitionDelay: '0s',
                        transform: 'none !important',
                        opacity: 1,
                      }
                    }}
                  >
                    <Icon
                      style={{
                        width: '24px',
                        height: '24px',
                        flexShrink: 0,
                      }}
                    />
                    <VStack align="start" gap={0} flex={1}>
                      <Text fontSize="md" lineHeight={1.3}>
                        {item.label}
                      </Text>
                      {item.description && (
                        <Text
                          fontSize="xs"
                          opacity={0.7}
                          lineHeight={1.2}
                          color={isActive ? 'gold.300' : 'whiteAlpha.700'}
                        >
                          {item.description}
                        </Text>
                      )}
                    </VStack>
                  </Box>
                </Link>
              );
            })}

            {/* Logout Button */}
            {showLogout && (
              <>
                <Separator my={2} borderColor="whiteAlpha.200" />
                <Button
                  colorPalette="error"
                  variant="ghost"
                  size="lg"
                  justifyContent="flex-start"
                  px={4}
                  gap={3}
                  minH="48px"
                  color="white"
                  _hover={{ bg: 'whiteAlpha.100' }}
                  _active={{ bg: 'whiteAlpha.200' }}
                  onClick={onLogout || (() => router.push('/api/session/logout'))}
                >
                  <ArrowRightOnRectangleIcon
                    style={{
                      width: '24px',
                      height: '24px',
                      flexShrink: 0,
                    }}
                  />
                  <Text fontSize="md" fontWeight="medium">
                    Logout
                  </Text>
                </Button>
              </>
            )}
          </VStack>
        </Box>
      </Box>
    </Portal>
  );
}
