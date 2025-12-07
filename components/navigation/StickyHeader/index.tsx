/**
 * StickyHeader Component (Fixed Positioning)
 * 
 * Responsive fixed header for Marathon Majors Fantasy League.
 * 
 * Features:
 * - Fixed positioning at top of viewport (z-index: 999)
 * - Logo + wordmark on left (responsive sizing)
 * - Desktop navigation links in center (hidden on mobile)
 * - User actions on right (Help, Logout buttons)
 * - Mobile menu button (hamburger, shown on <768px)
 * - Integrated MobileMenuDrawer that slides out on mobile
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
 * - Fixed positioning ensures full-width across viewport without scrollbar gaps
 * - Content below header should have top padding equal to header height
 * - MobileMenuDrawer auto-closes on route change
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
import { Tooltip } from '@/components/ui/tooltip';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { 
  Bars3Icon, 
  BellIcon,
  HomeIcon,
  ClipboardDocumentListIcon,
  CalendarIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/chakra/Button';
import { NavLink } from './NavLink';
import { MobileMenuDrawer } from '../MobileMenuDrawer';
import { getTeamHref } from '@/lib/navigation-utils';
import { useGameState } from '@/lib/state-provider';

/**
 * Navigation item configuration
 */
export interface NavItem {
  label: string;
  href: string;
  matchPaths?: string[]; // Additional paths that should mark this nav item as active
  isDynamic?: boolean; // Whether href should be computed dynamically
}

/**
 * Default navigation items for desktop header
 * Updated to include Race (5 items) - Phase 3 enhancement
 * Get default navigation items (with dynamic team link)
 * Called as a function to ensure team href is evaluated at render time
 */
function getDefaultNavItems(): NavItem[] {
  return [
    {
      label: 'Home',
      href: '/',
      matchPaths: [],
    },
    {
      label: 'My Team',
      href: getTeamHref(), // Dynamic based on session
      matchPaths: ['/team/[session]'], // Match team session pages
      isDynamic: true,
    },
  {
    label: 'Race',
    href: '/race',
    matchPaths: [],
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
}

export interface StickyHeaderProps {
  /**
   * Custom navigation items (optional)
   * Defaults to the standard 4-item navigation
   */
  navItems?: NavItem[];
  
  /**
   * Callback when mobile menu is opened
   */
  onMenuOpen?: () => void;
  
  /**
   * Additional class name for styling
   */
  className?: string;
  
  /**
   * Show notification bell for invalid roster athletes
   */
  showNotifications?: boolean;
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
 * Team link dynamically adapts based on active session.
 */
export function StickyHeader({
  navItems,
  onMenuOpen,
  className,
  showNotifications = true,
}: StickyHeaderProps) {
  const router = useRouter();
  const { gameState } = useGameState();
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [invalidRosterCount, setInvalidRosterCount] = useState<number>(0);
  const [isCheckingRoster, setIsCheckingRoster] = useState(false);
  
  // Handle logout
  const handleLogout = async () => {
    try {
      const response = await fetch('/api/session/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        // Clear client-side sessions (localStorage)
        if (typeof window !== 'undefined') {
          localStorage.removeItem('marathon_fantasy_team');
          localStorage.removeItem('marathon_fantasy_commissioner');
          // Dispatch event to notify other components
          window.dispatchEvent(new Event('sessionsUpdated'));
        }
        // Redirect to home page after successful logout
        router.push('/');
      } else {
        console.error('Logout failed:', await response.json());
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  
  // Initialize with truly static defaults to prevent hydration mismatch
  // IMPORTANT: Do NOT call getDefaultNavItems() here - it uses dynamic logic
  const [computedNavItems, setComputedNavItems] = useState<NavItem[]>(() => {
    if (navItems) return navItems;
    // Return static SSR-safe defaults (no dynamic hrefs)
    return [
      { label: 'Home', href: '/', icon: HomeIcon },
      { label: 'Team', href: '/?action=create-team', icon: ClipboardDocumentListIcon }, // Static for SSR
      { label: 'Race', href: '/race', icon: CalendarIcon },
      { label: 'Standings', href: '/standings', icon: TrophyIcon },
    ];
  });
  
  // Update nav items on client after hydration with dynamic hrefs
  useEffect(() => {
    const items = navItems || getDefaultNavItems();
    setComputedNavItems(items);
  }, [navItems]);
  
  // Re-evaluate dynamic hrefs when session changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleSessionUpdate = () => {
      const items = navItems || getDefaultNavItems();
      setComputedNavItems(items);
    };
    
    window.addEventListener('sessionsUpdated', handleSessionUpdate);
    return () => window.removeEventListener('sessionsUpdated', handleSessionUpdate);
  }, [navItems]);
  
  // Check for invalid athletes in user's roster
  useEffect(() => {
    if (!showNotifications) return;

    // Helper: attempt to read sessionToken from localStorage with retries
    const getSessionTokenWithRetries = async (attempts = 4) => {
      const delays = [150, 300, 600, 1200];
      for (let i = 0; i < attempts; i++) {
        try {
          const raw = localStorage.getItem('marathon_fantasy_team');
          if (!raw) {
            console.log(`[StickyHeader] [attempt ${i + 1}] No raw session in localStorage`);
          } else {
            // Log raw value for debugging on first few attempts (do not log excessively)
            if (i === 0) console.log('[StickyHeader] raw stored session:', raw);
            try {
              const parsed = JSON.parse(raw);
              // tolerate multiple token field names for robustness
              const token = parsed?.sessionToken || parsed?.token || parsed?.session_id || parsed?.session || null;
              if (token) return token;
              console.log(`[StickyHeader] [attempt ${i + 1}] session object present but no token field`);
            } catch (parseErr) {
              console.warn('[StickyHeader] Failed to parse stored session JSON:', parseErr);
            }
          }
        } catch (err) {
          console.error('[StickyHeader] Error reading localStorage:', err);
        }

        // Wait a bit before next attempt
        const wait = delays[i] ?? 500;
        // eslint-disable-next-line no-await-in-loop
        await new Promise((res) => setTimeout(res, wait));
      }
      return null;
    };

    const checkRosterValidity = async () => {
      if (typeof window === 'undefined') return;

      console.log('[StickyHeader] 🔔 Checking roster validity...');
      setIsCheckingRoster(true);

      try {
        const sessionToken = await getSessionTokenWithRetries();
        if (!sessionToken) {
          console.log('[StickyHeader] ❌ No sessionToken available after retries');
          setInvalidRosterCount(0);
          return;
        }

        // Derive gameId to send to the validation API. Prefer gameState, then session object, then cookie, else 'default'
        const deriveGameId = () => {
          try {
            if (gameState?.gameId) return String(gameState.gameId);
            const raw = localStorage.getItem('marathon_fantasy_team');
            if (raw) {
              const parsed = JSON.parse(raw);
              if (parsed?.gameId) return String(parsed.gameId);
              if (parsed?.game_id) return String(parsed.game_id);
            }
            // Cookie fallback: current_game_id (used in SSR/other parts of app)
            const cookieMatch = document.cookie.match(/(?:^|; )current_game_id=([^;]+)/);
            if (cookieMatch) return decodeURIComponent(cookieMatch[1]);
          } catch (err) {
            // ignore and fall through
          }
          return 'default';
        };

        const gameId = deriveGameId();
        console.log('[StickyHeader] 📡 Calling validation API with token (masked):', `${String(sessionToken).slice(0, 6)}...`, ' gameId=', `${String(gameId).slice(0,6)}...`);

        const response = await fetch(`/api/validate-team-roster?sessionToken=${encodeURIComponent(sessionToken)}&gameId=${encodeURIComponent(gameId)}`);
        if (response.ok) {
          const data = await response.json();
          const invalidCount = data.invalidAthletes?.length || data.invalidCount || 0;
          console.log('[StickyHeader] ✅ Validation response:', { invalidCount, invalidAthletes: data.invalidAthletes });
          setInvalidRosterCount(invalidCount);
        } else {
          // Log more details when validation fails (404 often means session not found/inactive)
          let body = null;
          try { body = await response.json(); } catch (e) { /* ignore */ }
          console.log('[StickyHeader] ⚠️ Validation failed:', response.status, body);
          setInvalidRosterCount(0);
        }
      } catch (error) {
        console.error('[StickyHeader] ❌ Failed to validate roster:', error);
        setInvalidRosterCount(0);
      } finally {
        setIsCheckingRoster(false);
      }
    };

    // Initial check on mount
    checkRosterValidity();

    // Re-check when sessions are updated
    window.addEventListener('sessionsUpdated', checkRosterValidity);

    // Re-check when navigating to team or standings pages (when roster might change)
    const handleRouteChange = () => {
      // Small delay to allow session updates to complete
      setTimeout(checkRosterValidity, 500);
    };

    router.events?.on('routeChangeComplete', handleRouteChange);

    return () => {
      window.removeEventListener('sessionsUpdated', checkRosterValidity);
      router.events?.off('routeChangeComplete', handleRouteChange);
    };
  }, [showNotifications, router.events]);
  
  // Track scroll position to add shadow with smooth transition
  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const isScrolled = window.scrollY > 10;
          if (isScrolled !== scrolled) {
            setScrolled(isScrolled);
          }
          ticking = false;
        });
        ticking = true;
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial state
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);
  
  return (
    <Flex
      as="header"
      position="fixed"
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
      // Enhanced shadow transition with easing
      transition="box-shadow 0.25s cubic-bezier(0, 0, 0.2, 1)"
      shadow={scrolled ? 'lg' : 'none'}
      height="64px"
      borderRadius={0}
      className={className}
      role="banner"
      aria-label="Site header"
      // Respect user's motion preferences
      css={{
        '@media (prefers-reduced-motion: reduce)': {
          transition: 'none',
        }
      }}
    >
      {/* Left: Logo + Wordmark */}
      <HStack gap={{ base: 2, md: 3 }} flex={{ base: '0 0 auto', lg: 1 }}>
        <Image 
          src="/assets/mmfl-logo.png" 
          alt="MMFL Logo" 
          width="40px"
          height="40px"
          objectFit="contain"
        />
        
        {/* Wordmark - "MMFL" on smallest mobile, full text on larger screens */}
        <VStack 
          align="start" 
          gap={0}
        >
          {/* Mobile: Show "MMFL" abbreviation - Large and bold */}
          <Heading 
            size="lg"
            lineHeight={1}
            fontWeight="extrabold"
            display={{ base: 'block', sm: 'none' }}
            letterSpacing="tight"
          >
            MMFL
          </Heading>
          
          {/* Desktop: Show full wordmark */}
          <Box display={{ base: 'none', sm: 'block' }}>
            <Heading 
              size={{ sm: 'sm', md: 'md' }} 
              lineHeight={1.2}
              fontWeight="bold"
            >
              Marathon Majors
            </Heading>
            <Text 
              fontSize={{ sm: 'xs', md: 'sm' }} 
              opacity={0.8}
              lineHeight={1.2}
            >
              Fantasy League
            </Text>
          </Box>
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
        {computedNavItems.map((item) => {
          // Recompute dynamic hrefs at render time
          const href = item.isDynamic ? getTeamHref() : item.href;
          const isActive = isNavItemActive(
            router.pathname,
            href,
            item.matchPaths
          );
          
          return (
            <NavLink
              key={item.label}
              href={href}
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
        {/* Notification Bell - Shows when invalid athletes detected */}
        {showNotifications && invalidRosterCount > 0 && (
          <Tooltip 
            label={`${invalidRosterCount} athlete${invalidRosterCount > 1 ? 's' : ''} on your roster ${invalidRosterCount > 1 ? 'are' : 'is'} not confirmed for this race`}
            placement="bottom"
          >
            <Box 
              as="button"
              position="relative"
              aria-label={`${invalidRosterCount} invalid athlete notification`}
              p={2}
              borderRadius="md"
              _hover={{ bg: 'whiteAlpha.200' }}
              _active={{ bg: 'whiteAlpha.300' }}
              transition="background-color 0.15s"
              onClick={() => {
                // Navigate to team page
                const teamHref = getTeamHref();
                router.push(teamHref);
              }}
              cursor="pointer"
            >
              <BellIcon style={{ width: '24px', height: '24px', color: 'white' }} />
              
              {/* Notification Badge */}
              <Box
                position="absolute"
                top="4px"
                right="4px"
                minW="20px"
                height="20px"
                bg="error.600"
                borderRadius="full"
                display="flex"
                alignItems="center"
                justifyContent="center"
                fontSize="xs"
                fontWeight="bold"
                color="white"
                px={1}
                border="2px solid"
                borderColor="navy.900"
              >
                {invalidRosterCount}
              </Box>
            </Box>
          </Tooltip>
        )}
        
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
        
        {/* Logout Button - Desktop */}
        <Button
          colorPalette="gold"
          variant="outline"
          size="sm"
          display={{ base: 'none', md: 'inline-flex' }}
          borderColor="gold.500"
          color="gold.400"
          _hover={{ bg: 'whiteAlpha.200' }}
          onClick={handleLogout}
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
          onClick={() => {
            setIsMobileMenuOpen(true);
            onMenuOpen?.();
          }}
        >
          <Bars3Icon style={{ width: '24px', height: '24px' }} />
        </Box>
      </HStack>

      {/* Mobile Menu Drawer */}
      <MobileMenuDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
    </Flex>
  );
}
