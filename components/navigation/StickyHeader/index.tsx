/**
 * StickyHeader Component
 * 
 * Responsive sticky header for Marathon Majors Fantasy League.
 * 
 * Features:
 * - Sticky positioning at top of viewport (z-index: 999)
 * - Logo + wordmark on left (responsive sizing)
 * - Desktop navigation links in center (hidden on mobile)
 * - User actions on right (Help, Logout buttons)
 * - Mobile menu button (hamburger, shown on <768px)
 * - Scroll shadow that appears when page scrolls
 * - Route-aware active states (gold underline)
 * - WCAG 2.1 AA accessible
 * - Navy 900 background with white text
 * 
 * Implementation:
 * - Uses Next.js router for navigation and route detection
 * - Integrates with Heroicons for consistent iconography
 * - Follows Chakra UI v3 design system
 * - Respects navy/gold brand palette
 * - Responsive heights: 60px (mobile), 72px (tablet), 80px (desktop)
 * 
 * Part of Phase 3: Core Navigation Implementation (Week 13-14)
 * Parent Issue: #122 - Core Navigation Implementation
 * Grand-parent Issue: #59 - Redesign UI with Modern Mobile-First Look
 * 
 * References:
 * - Spec: docs/UI_REDESIGN/UI_PHASE2_NAVIGATION_SPEC.md
 * - Roadmap: docs/UI_REDESIGN_ROADMAP.md (Phase 3, Week 13-14)
 * - Design: docs/CORE_DESIGN_GUIDELINES.md (Navigation System)
 */

import { Flex, Box, HStack, VStack, Heading, Text, Image } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Bars3Icon, BellIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/chakra/Button';
import { NavLink } from './NavLink';

/**
 * Navigation item configuration
 */
export interface NavItem {
  label: string;
  href: string;
  matchPaths?: string[]; // Additional paths that should mark this nav item as active
}

/**
 * Default navigation items for desktop header
 * Following the specification from UI_PHASE2_NAVIGATION_SPEC.md
 */
const DEFAULT_NAV_ITEMS: NavItem[] = [
  {
    label: 'Home',
    href: '/',
    matchPaths: [],
  },
  {
    label: 'My Team',
    href: '/team',
    matchPaths: ['/team/[session]'], // Match team session pages
  },
  {
    label: 'Standings',
    href: '/leaderboard',
    matchPaths: [],
  },
  {
    label: 'Athletes',
    href: '/athletes',
    matchPaths: [],
  },
];

export interface StickyHeaderProps {
  /**
   * Custom navigation items (optional)
   * Defaults to the standard 4-item navigation
   */
  navItems?: NavItem[];
  
  /**
   * Show notifications icon (optional, defaults to true)
   */
  showNotifications?: boolean;
  
  /**
   * Callback when mobile menu is opened
   */
  onMenuOpen?: () => void;
  
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
  
  // Prefix match (e.g., /team matches /team/anything)
  if (itemHref !== '/' && currentPath.startsWith(itemHref)) {
    return true;
  }
  
  // Pattern match (check additional paths)
  for (const pattern of matchPaths) {
    // Simple pattern matching: [param] means any value
    const regexPattern = pattern.replace(/\[.*?\]/g, '[^/]+');
    const regex = new RegExp(`^${regexPattern}$`);
    if (regex.test(currentPath)) {
      return true;
    }
  }
  
  return false;
}

/**
 * StickyHeader Component
 * 
 * Responsive header with desktop navigation and mobile menu button.
 * Automatically adds shadow when page is scrolled.
 */
export function StickyHeader({
  navItems = DEFAULT_NAV_ITEMS,
  showNotifications = true,
  onMenuOpen,
  className,
}: StickyHeaderProps) {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  
  // Track scroll position to add shadow
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial state
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);
  
  return (
    <Flex
      as="header"
      position="sticky"
      top={0}
      left={0}
      right={0}
      zIndex={999}
      bg="navy.900"
      color="white"
      px={{ base: 4, md: 6, lg: 8 }}
      py={{ base: 3, md: 4 }}
      align="center"
      justify="space-between"
      transition="box-shadow 0.2s ease-out"
      shadow={scrolled ? 'lg' : 'none'}
      height={{ base: '60px', md: '72px', lg: '80px' }}
      borderRadius={0}
      marginX="calc(-50vw + 50%)"
      width="100vw"
      className={className}
      role="banner"
      aria-label="Site header"
    >
      {/* Left: Logo + Wordmark */}
      <HStack gap={{ base: 2, md: 3 }} flex={{ base: '0 0 auto', lg: 1 }}>
        <Image 
          src="/images/MMFL-logo.png" 
          alt="MMFL Logo" 
          width={{ base: '32px', md: '40px', lg: '48px' }}
          height={{ base: '32px', md: '40px', lg: '48px' }}
          objectFit="contain"
        />
        
        {/* Wordmark - Hidden on very small screens */}
        <VStack 
          align="start" 
          gap={0} 
          display={{ base: 'none', sm: 'flex' }}
        >
          <Heading 
            size={{ base: 'sm', md: 'md' }} 
            lineHeight={1.2}
            fontWeight="bold"
          >
            Marathon Majors
          </Heading>
          <Text 
            fontSize={{ base: 'xs', md: 'sm' }} 
            opacity={0.8}
            lineHeight={1.2}
          >
            Fantasy League
          </Text>
        </VStack>
      </HStack>
      
      {/* Center: Desktop Navigation (hidden on mobile) */}
      <HStack 
        gap={{ md: 6, lg: 8 }} 
        display={{ base: 'none', md: 'flex' }}
        as="nav"
        role="navigation"
        aria-label="Main navigation"
      >
        {navItems.map((item) => {
          const isActive = isNavItemActive(
            router.pathname,
            item.href,
            item.matchPaths
          );
          
          return (
            <NavLink
              key={item.href}
              href={item.href}
              isActive={isActive}
            >
              {item.label}
            </NavLink>
          );
        })}
      </HStack>
      
      {/* Right: User Actions */}
      <HStack 
        gap={{ base: 2, md: 4 }} 
        flex={{ base: '0 0 auto', lg: 1 }} 
        justify="flex-end"
      >
        {/* Help Link - Desktop only */}
        <Link href="/help" passHref legacyBehavior>
          <Box 
            as="a" 
            fontSize="sm"
            fontWeight="medium"
            color="white"
            opacity={0.9}
            _hover={{ opacity: 1, textDecoration: 'underline' }}
            display={{ base: 'none', lg: 'block' }}
            transition="opacity 0.2s"
            cursor="pointer"
          >
            Help
          </Box>
        </Link>
        
        {/* Commissioner Link - Desktop only */}
        <Link href="/commissioner" passHref legacyBehavior>
          <Box 
            as="a" 
            fontSize="sm"
            fontWeight="medium"
            color="white"
            opacity={0.9}
            _hover={{ opacity: 1, textDecoration: 'underline' }}
            display={{ base: 'none', lg: 'block' }}
            transition="opacity 0.2s"
            cursor="pointer"
          >
            Commissioner
          </Box>
        </Link>
        
        {/* Notifications Icon - Optional */}
        {showNotifications && (
          <Box
            as="button"
            aria-label="Notifications"
            p={2}
            borderRadius="md"
            _hover={{ bg: 'whiteAlpha.200' }}
            _active={{ bg: 'whiteAlpha.300' }}
            transition="background-color 0.15s"
            display={{ base: 'flex', md: 'none' }}
          >
            <BellIcon style={{ width: '20px', height: '20px' }} />
          </Box>
        )}
        
        {/* Logout Button - Desktop */}
        <Button
          colorPalette="gold"
          variant="outline"
          size="sm"
          display={{ base: 'none', md: 'inline-flex' }}
          borderColor="gold.500"
          color="gold.400"
          _hover={{ bg: 'whiteAlpha.200' }}
        >
          Logout
        </Button>
        
        {/* Mobile Menu Button */}
        <Box
          as="button"
          aria-label="Open menu"
          p={2}
          borderRadius="md"
          _hover={{ bg: 'whiteAlpha.200' }}
          _active={{ bg: 'whiteAlpha.300' }}
          transition="background-color 0.15s"
          display={{ base: 'flex', md: 'none' }}
          onClick={onMenuOpen}
        >
          <Bars3Icon style={{ width: '24px', height: '24px' }} />
        </Box>
      </HStack>
    </Flex>
  );
}
