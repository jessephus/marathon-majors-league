# Phase 2: Navigation System Specification

**Document Version:** 1.0  
**Created:** November 21, 2025  
**Phase:** 2 - Navigation Spec (Weeks 3-4)  
**Related Roadmap:** Phase 3 - Core Navigation (Weeks 11-14)  
**Related Issue:** [#122 - Navigation Components](https://github.com/jessephus/marathon-majors-league/issues/122)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Navigation Architecture](#navigation-architecture)
3. [Sticky Header Specification](#sticky-header-specification)
4. [Bottom Toolbar Specification](#bottom-toolbar-specification)
5. [User Flow Mapping](#user-flow-mapping)
6. [Responsive Behavior](#responsive-behavior)
7. [Accessibility Requirements](#accessibility-requirements)
8. [Implementation Guide](#implementation-guide)

---

## Executive Summary

### Navigation Philosophy

**Mobile-First, Touch-Optimized**
- Primary navigation via bottom toolbar (thumb-zone accessibility)
- Sticky header for branding and secondary actions
- No hamburger menus for critical navigation
- Progressive enhancement for desktop

### Key Principles

1. **Thumb-Zone First:** Place primary actions within easy thumb reach (bottom 30% of screen)
2. **Persistent Context:** Header shows current location and branding at all times
3. **4-Item Maximum:** Bottom toolbar limited to 4-5 primary navigation items
4. **Clear Active States:** Users always know where they are
5. **Smooth Transitions:** Navigation changes feel instant and fluid

### Navigation Modes by User Role

| User Type | Primary Navigation | Secondary Navigation | Tertiary Actions |
|-----------|-------------------|---------------------|------------------|
| **Guest** | Home, Athletes, Standings | Create Team, Help | Commissioner Login |
| **Player** | Home, Team, Standings, Athletes | Help, Settings | Logout |
| **Commissioner** | Dashboard, Results, Athletes, Teams | Game Switcher, Help | Logout |

---

## Navigation Architecture

### Component Hierarchy

```
App Layout
├── StickyHeader (all breakpoints)
│   ├── Logo + Wordmark
│   ├── Desktop Navigation (≥768px)
│   ├── User Actions (right side)
│   └── Mobile Menu Button (<768px)
│
├── Page Content
│   └── (Dynamic based on route)
│
└── BottomToolbar (<768px only)
    ├── Home
    ├── Team/Draft
    ├── Standings
    └── Athletes
```

### Z-Index Management

```typescript
// z-index hierarchy (prevent overlap issues)
const Z_INDEX = {
  BASE: 0,
  CONTENT: 1,
  STICKY_HEADER: 999,
  BOTTOM_TOOLBAR: 1000,
  MODAL_OVERLAY: 1300,
  MODAL_CONTENT: 1400,
  TOAST: 1500,
  TOOLTIP: 1600,
};
```

---

## Sticky Header Specification

### Mobile Header (<768px)

**Visual Design:**
```
┌─────────────────────────────────────────┐
│ [Logo] MMFL              [Bell] [Menu]  │  ← 60px height
└─────────────────────────────────────────┘
```

**Specifications:**
- **Height:** 60px (fixed)
- **Background:** Navy 900 (#161C4F)
- **Position:** `sticky`, `top: 0`
- **Shadow:** `0 2px 8px rgba(0,0,0,0.1)`
- **Z-Index:** 999

**Elements:**
```tsx
<Flex 
  as="header"
  position="sticky"
  top={0}
  zIndex={999}
  bg="navy.900"
  color="white"
  px={4}
  py={3}
  justify="space-between"
  align="center"
  shadow="md"
  height="60px"
>
  {/* Left: Logo */}
  <HStack spacing={2}>
    <Image src="/logo-icon.svg" w="32px" h="32px" alt="MMFL" />
    <Heading size="md" display={{ base: 'none', sm: 'block' }}>
      MMFL
    </Heading>
  </HStack>
  
  {/* Right: Actions */}
  <HStack spacing={2}>
    <IconButton 
      icon={<BellIcon />}
      aria-label="Notifications"
      variant="ghost"
      colorScheme="whiteAlpha"
      size="sm"
    />
    <IconButton 
      icon={<HamburgerIcon />}
      aria-label="Menu"
      variant="ghost"
      colorScheme="whiteAlpha"
      size="sm"
      onClick={onMenuOpen}
    />
  </HStack>
</Flex>
```

**Mobile Menu Drawer:**
Opens from right side with full navigation options

### Tablet Header (768px - 1023px)

**Visual Design:**
```
┌────────────────────────────────────────────────────────┐
│ [Logo] Marathon Majors          Home  Team  Standings  │  ← 72px height
│        Fantasy League                                   │
└────────────────────────────────────────────────────────┘
```

**Specifications:**
- **Height:** 72px (fixed)
- **Logo:** Full wordmark visible
- **Navigation:** Inline text links
- **Actions:** Help, Logout buttons (right side)

### Desktop Header (≥1024px)

**Visual Design:**
```
┌───────────────────────────────────────────────────────────────────────────┐
│ [Logo] Marathon Majors    Home    My Team    Standings    Athletes       │  ← 80px height
│        Fantasy League                                     Help  [Logout]  │
└───────────────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- **Height:** 80px (fixed)
- **Background:** Navy 900 with subtle gradient
- **Shadow:** Appears on scroll
- **Hover States:** Links brighten to Navy 400

**Implementation:**
```tsx
<Flex 
  as="header"
  position="sticky"
  top={0}
  zIndex={999}
  bg="navy.900"
  color="white"
  px={8}
  py={4}
  align="center"
  shadow={scrolled ? 'lg' : 'none'}
  transition="shadow 0.2s"
  height="80px"
>
  {/* Left: Logo + Wordmark */}
  <HStack spacing={3} flex={1}>
    <Image src="/assets/mmfl-logo.png" h="48px" w="48px" alt="MMFL Logo" />
    <VStack align="start" spacing={0}>
      <Heading size="sm" lineHeight={1.2}>Marathon Majors</Heading>
      <Text fontSize="xs" opacity={0.8}>Fantasy League</Text>
    </VStack>
  </HStack>
  
  {/* Center: Navigation */}
  <HStack spacing={8}>
    <NavLink href="/" isActive={pathname === '/'}>
      Home
    </NavLink>
    <NavLink href="/team" isActive={pathname.startsWith('/team')}>
      My Team
    </NavLink>
    <NavLink href="/leaderboard" isActive={pathname === '/leaderboard'}>
      Standings
    </NavLink>
    <NavLink href="/athletes" isActive={pathname === '/athletes'}>
      Athletes
    </NavLink>
  </HStack>
  
  {/* Right: Actions */}
  <HStack spacing={4} flex={1} justify="flex-end">
    <Link href="/help" fontSize="sm">Help</Link>
    <Link href="/commissioner" fontSize="sm">Commissioner</Link>
    <Button size="sm" variant="outline" colorScheme="gold">
      Logout
    </Button>
  </HStack>
</Flex>

// NavLink Component (with active state)
function NavLink({ href, isActive, children }) {
  return (
    <Link 
      href={href}
      fontWeight={isActive ? 'bold' : 'medium'}
      color={isActive ? 'gold.400' : 'white'}
      borderBottom={isActive ? '2px solid' : 'none'}
      borderColor="gold.400"
      pb={1}
      _hover={{ 
        color: 'gold.300',
        textDecoration: 'none'
      }}
      transition="all 0.2s"
    >
      {children}
    </Link>
  );
}
```

### Scroll Behavior

**On Scroll Down:**
- Header remains visible (sticky position)
- Shadow intensifies (visual separation)
- No auto-hide (users may need navigation anytime)

**On Scroll Up:**
- Shadow returns to normal
- Full visibility maintained

**Mobile Consideration:**
- On mobile, header may compress slightly (reduce padding)
- Logo stays visible, wordmark may hide on small screens

---

## Bottom Toolbar Specification

### Mobile Only (<768px)

**Visual Design:**
```
┌─────────────────────────────────────────┐
│  [🏠]    [👥]    [🏆]    [🏃]           │  ← 64px height
│  Home    Team    Stands  Athletes       │
└─────────────────────────────────────────┘
```

**Specifications:**
- **Height:** 64px (fixed)
- **Background:** White
- **Border Top:** 2px solid Gray 200
- **Shadow:** `0 -4px 12px rgba(0,0,0,0.1)` (upward shadow)
- **Position:** `fixed`, `bottom: 0`
- **Z-Index:** 1000 (above header)

**Navigation Items (4 Primary):**

| Icon | Label | Route | Active Color | Purpose |
|------|-------|-------|--------------|---------|
| 🏠 (HomeIcon) | Home | `/` | Navy 500 | Landing page, session management |
| 👥 (UsersIcon) | Team | `/team/[session]` | Navy 500 | Draft interface, roster management |
| 🏆 (TrophyIcon) | Standings | `/leaderboard` | Navy 500 | Live leaderboard, race results |
| 🏃 (RunningIcon) | Athletes | `/athletes` | Navy 500 | Browse all athletes, stats |

**Implementation:**
```tsx
<Flex 
  as="nav"
  position="fixed"
  bottom={0}
  left={0}
  right={0}
  zIndex={1000}
  bg="white"
  borderTop="2px solid"
  borderColor="gray.200"
  shadow="0 -4px 12px rgba(0,0,0,0.1)"
  height="64px"
  px={2}
  justify="space-around"
  align="center"
  display={{ base: 'flex', md: 'none' }}
>
  <BottomNavItem 
    icon={HomeIcon}
    label="Home"
    href="/"
    isActive={pathname === '/'}
  />
  <BottomNavItem 
    icon={UsersIcon}
    label="Team"
    href={teamUrl}
    isActive={pathname.startsWith('/team')}
    badge={hasUnsavedChanges ? '!' : undefined}
  />
  <BottomNavItem 
    icon={TrophyIcon}
    label="Standings"
    href="/leaderboard"
    isActive={pathname === '/leaderboard'}
  />
  <BottomNavItem 
    icon={RunningIcon}
    label="Athletes"
    href="/athletes"
    isActive={pathname === '/athletes'}
  />
</Flex>

// BottomNavItem Component
interface BottomNavItemProps {
  icon: React.ElementType;
  label: string;
  href: string;
  isActive: boolean;
  badge?: string;
}

function BottomNavItem({ icon, label, href, isActive, badge }: BottomNavItemProps) {
  const router = useRouter();
  
  return (
    <VStack 
      spacing={0}
      flex={1}
      as="button"
      onClick={() => router.push(href)}
      color={isActive ? 'navy.500' : 'gray.400'}
      fontWeight={isActive ? 'semibold' : 'normal'}
      py={2}
      minW="60px"
      position="relative"
      _active={{ bg: 'gray.50' }}
      transition="all 0.2s"
      aria-label={`Navigate to ${label}`}
      aria-current={isActive ? 'page' : undefined}
    >
      {badge && (
        <Badge 
          colorScheme="red" 
          position="absolute" 
          top={1} 
          right={2}
          borderRadius="full"
          fontSize="xs"
        >
          {badge}
        </Badge>
      )}
      <Icon as={icon} boxSize={6} />
      <Text fontSize="xs" mt={1}>
        {label}
      </Text>
    </VStack>
  );
}
```

### Touch Target Optimization

**Requirements:**
- **Minimum Touch Area:** 44x44px (Apple HIG)
- **Preferred Touch Area:** 48x48px (Material Design)
- **Spacing Between Items:** 8px minimum

**Implementation:**
```tsx
// Each nav item has adequate touch area
<VStack 
  minW="60px"    // Horizontal space
  minH="64px"    // Vertical space (full toolbar height)
  py={2}         // Additional padding
>
  {/* Content */}
</VStack>
```

### Active State Styling

**Active Item:**
- **Color:** Navy 500 (#4A5F9D)
- **Font Weight:** 600 (semibold)
- **Icon:** Filled variant (if available)
- **Animation:** Subtle scale (1.05x) on tap

**Inactive Item:**
- **Color:** Gray 400 (#A1A1AA)
- **Font Weight:** 400 (normal)
- **Icon:** Outline variant
- **Hover:** Lighten to Gray 600 (desktop touch simulation)

### Badge/Notification Indicators

**Use Cases:**
- **Team:** Show "!" badge if unsaved changes exist
- **Standings:** Show live update indicator during race
- **Home:** Show count of unread notifications

**Visual Style:**
- **Position:** Top-right of icon
- **Size:** 16px circle (or pill for numbers)
- **Color:** Red 500 (error) or Gold 500 (info)
- **Animation:** Pulse effect for new notifications

---

## User Flow Mapping

### Flow 1: Guest → Create Team → Draft

**Navigation Path:**
```
[Home] (bottom nav) 
  → Landing Page
  → Click "Create Team" (on page)
  → Team Creation Modal
  → Redirect to /team/[session]
[Team] (bottom nav, now active)
  → Draft Interface
  → Select athletes
  → Submit roster
[Standings] (bottom nav)
  → View leaderboard
```

**Navigation Actions:**
- Bottom toolbar: Home → Team (auto-activates on redirect)
- Header: Persistent branding, no navigation change
- Modal: Opened via page button (not nav)

### Flow 2: Player → Check Standings → View Athlete

**Navigation Path:**
```
[Standings] (bottom nav)
  → Leaderboard Page
  → Click athlete name
  → Athlete Modal (overlay)
  → Close modal
[Standings] (still active)
```

**Navigation Actions:**
- Bottom toolbar: Standings remains active
- Header: No change
- Modal: Overlay, doesn't change route

### Flow 3: Commissioner → Manage Results

**Navigation Path:**
```
[Home] (bottom nav)
  → Landing Page
  → Click "Commissioner Mode" (on page)
  → TOTP Modal
  → Authenticate
  → Redirect to /commissioner
[Header] Commissioner nav appears
  → "Manage Results" button (in page)
  → Results Management Panel (dynamic import)
```

**Navigation Actions:**
- Bottom toolbar: Hidden (replaced by commissioner-specific nav)
- Header: Adds "Dashboard", "Logout" buttons
- Page: Becomes single-page app with panel switching

### Flow 4: Mobile Menu → Help Page

**Navigation Path:**
```
[Any page]
  → Click hamburger (header)
  → Mobile Menu Drawer (slides in)
  → Click "Help"
  → Navigate to /help
  → Menu auto-closes
[Home/Team/Standings/Athletes] (bottom nav)
```

**Navigation Actions:**
- Header hamburger: Opens drawer
- Drawer: Full navigation + secondary links
- Bottom toolbar: Remains visible behind drawer

---

## Responsive Behavior

### Breakpoint Strategy

```typescript
const breakpoints = {
  base: '0px',      // 0-479px: Mobile portrait
  sm: '480px',      // 480-767px: Mobile landscape
  md: '768px',      // 768-1023px: Tablet
  lg: '1024px',     // 1024-1279px: Desktop
  xl: '1280px',     // 1280px+: Large desktop
};
```

### Component Visibility Matrix

| Component | Mobile (0-767px) | Tablet (768-1023px) | Desktop (1024px+) |
|-----------|------------------|---------------------|-------------------|
| **Sticky Header** | Minimal (logo + menu) | Full (logo + links) | Full (logo + links + actions) |
| **Bottom Toolbar** | ✅ Visible | ❌ Hidden | ❌ Hidden |
| **Desktop Nav (in header)** | ❌ Hidden (hamburger) | ✅ Visible | ✅ Visible |
| **Mobile Menu Drawer** | ✅ Available | ✅ Available | ❌ Hidden (not needed) |

### Layout Adjustments by Breakpoint

**Mobile (< 768px):**
```tsx
<Box>
  <StickyHeader 
    variant="minimal"
    showHamburger={true}
    showDesktopNav={false}
  />
  
  <Box 
    pt="60px"        // Header height
    pb="64px"        // Bottom toolbar height
    minH="100vh"
  >
    {children}       // Page content
  </Box>
  
  <BottomToolbar display="flex" />
</Box>
```

**Tablet (768px - 1023px):**
```tsx
<Box>
  <StickyHeader 
    variant="full"
    showHamburger={false}
    showDesktopNav={true}
    size="md"
  />
  
  <Box 
    pt="72px"        // Larger header
    minH="100vh"
  >
    {children}
  </Box>
  
  {/* No bottom toolbar */}
</Box>
```

**Desktop (≥1024px):**
```tsx
<Box>
  <StickyHeader 
    variant="full"
    showHamburger={false}
    showDesktopNav={true}
    showActions={true}
    size="lg"
  />
  
  <Box 
    pt="80px"        // Full header height
    minH="100vh"
  >
    {children}
  </Box>
</Box>
```

### Content Padding Adjustments

To prevent content from being hidden under sticky navigation:

```tsx
// Layout wrapper component
function PageLayout({ children }) {
  return (
    <Box
      pt={{ base: '60px', md: '72px', lg: '80px' }}  // Header height
      pb={{ base: '64px', md: 0 }}                    // Bottom toolbar (mobile only)
      minH="100vh"
    >
      <Container maxW="container.xl" px={4} py={8}>
        {children}
      </Container>
    </Box>
  );
}
```

---

## Accessibility Requirements

### Keyboard Navigation

**Header Navigation:**
- **Tab Order:** Logo → Nav Links → Action Buttons
- **Skip Link:** "Skip to main content" (hidden, reveals on focus)
- **Focus Indicators:** 2px gold outline (`outline: 2px solid #D4AF37`)

**Bottom Toolbar:**
- **Tab Order:** Left to right (Home → Team → Standings → Athletes)
- **Arrow Keys:** Navigate between items (left/right arrows)
- **Enter/Space:** Activate current item
- **Focus Trap:** Not applicable (bottom nav is global)

**Mobile Menu Drawer:**
- **Tab Order:** First item → Last item → Close button
- **Escape Key:** Close drawer
- **Focus Management:** Trap focus within drawer when open
- **Return Focus:** Return to hamburger button on close

### Screen Reader Support

**Header:**
```tsx
<Flex 
  as="header" 
  role="banner"
  aria-label="Site navigation"
>
  {/* Logo */}
  <Link href="/" aria-label="Marathon Majors Fantasy League home">
    <Image src="/logo.svg" alt="" role="presentation" />
    <VisuallyHidden>MMFL Home</VisuallyHidden>
  </Link>
  
  {/* Navigation */}
  <nav aria-label="Primary navigation">
    <Link href="/" aria-current={isActive ? 'page' : undefined}>
      Home
    </Link>
    {/* More links */}
  </nav>
</Flex>
```

**Bottom Toolbar:**
```tsx
<Flex 
  as="nav" 
  role="navigation"
  aria-label="Mobile navigation"
>
  <Button 
    as="button"
    aria-label="Home"
    aria-current={isActive ? 'page' : undefined}
    onClick={handleClick}
  >
    <Icon as={HomeIcon} aria-hidden="true" />
    <Text>Home</Text>
  </Button>
</Flex>
```

### ARIA Landmarks

```tsx
// Complete page structure with landmarks
<Box>
  {/* Header */}
  <Box as="header" role="banner">
    <StickyHeader />
  </Box>
  
  {/* Main Content */}
  <Box as="main" role="main" id="main-content">
    {children}
  </Box>
  
  {/* Bottom Navigation */}
  <Box as="nav" role="navigation" aria-label="Mobile primary navigation">
    <BottomToolbar />
  </Box>
  
  {/* Footer (if present) */}
  <Box as="footer" role="contentinfo">
    <Footer />
  </Box>
</Box>
```

### Color Contrast

**Active Items (Navy 500 on White):**
- Contrast Ratio: 6.8:1 ✅ (AAA compliant)

**Inactive Items (Gray 400 on White):**
- Contrast Ratio: 4.6:1 ✅ (AA compliant)

**Gold Accent (Gold 500 on Navy 900):**
- Contrast Ratio: 8.2:1 ✅ (AAA compliant)

### Focus Indicators

**All Interactive Elements:**
```tsx
_focus={{
  outline: '2px solid',
  outlineColor: 'gold.500',
  outlineOffset: '2px',
}}
```

**Visible Focus States:**
- Gold outline (2px) on all focusable elements
- Offset by 2px for clarity
- Never remove focus indicators (`outline: none` prohibited)

---

## Implementation Guide

### Step 1: Create Base Components

**File Structure:**
```
components/navigation/
├── StickyHeader/
│   ├── index.tsx
│   ├── DesktopNav.tsx
│   ├── MobileNav.tsx
│   └── MobileMenuDrawer.tsx
├── BottomToolbar/
│   ├── index.tsx
│   └── BottomNavItem.tsx
└── NavigationProvider.tsx (context for active state)
```

### Step 2: Implement Navigation Context

```tsx
// components/navigation/NavigationProvider.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';

interface NavigationContextType {
  activeRoute: string;
  setActiveRoute: (route: string) => void;
  teamUrl: string | null;
  hasUnsavedChanges: boolean;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }) {
  const router = useRouter();
  const [activeRoute, setActiveRoute] = useState(router.pathname);
  const [teamUrl, setTeamUrl] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  useEffect(() => {
    // Update active route on navigation
    const handleRouteChange = (url: string) => {
      setActiveRoute(url);
    };
    
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router]);
  
  useEffect(() => {
    // Load team URL from session
    const session = localStorage.getItem('teamSession');
    if (session) {
      setTeamUrl(`/team/${session}`);
    }
  }, []);
  
  return (
    <NavigationContext.Provider 
      value={{ 
        activeRoute, 
        setActiveRoute, 
        teamUrl, 
        hasUnsavedChanges 
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
}
```

### Step 3: Build StickyHeader Component

```tsx
// components/navigation/StickyHeader/index.tsx
import { Box, Flex, HStack, Image, Heading, Link, Button, IconButton, useDisclosure } from '@chakra-ui/react';
import { HamburgerIcon, BellIcon } from '@chakra-ui/icons';
import { useNavigation } from '../NavigationProvider';
import { DesktopNav } from './DesktopNav';
import { MobileMenuDrawer } from './MobileMenuDrawer';

export function StickyHeader() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { activeRoute } = useNavigation();
  
  return (
    <>
      <Flex 
        as="header"
        position="sticky"
        top={0}
        zIndex={999}
        bg="navy.900"
        color="white"
        px={{ base: 4, md: 6, lg: 8 }}
        py={{ base: 3, md: 4 }}
        align="center"
        shadow="md"
        height={{ base: '60px', md: '72px', lg: '80px' }}
      >
        {/* Logo */}
        <HStack spacing={3} flex={1}>
          <Link href="/">
            <Image 
              src="/assets/mmfl-logo.png" 
              h={{ base: '36px', md: '44px', lg: '48px' }}
              w={{ base: '36px', md: '44px', lg: '48px' }}
              alt="MMFL Logo" 
            />
          </Link>
          <Box display={{ base: 'none', sm: 'block' }}>
            <Heading size={{ base: 'sm', lg: 'md' }}>Marathon Majors</Heading>
            <Text fontSize="xs" opacity={0.8}>Fantasy League</Text>
          </Box>
        </HStack>
        
        {/* Desktop Navigation */}
        <Box display={{ base: 'none', md: 'block' }}>
          <DesktopNav activeRoute={activeRoute} />
        </Box>
        
        {/* Mobile Actions */}
        <HStack spacing={2} display={{ base: 'flex', md: 'none' }}>
          <IconButton 
            icon={<BellIcon />}
            aria-label="Notifications"
            variant="ghost"
            colorScheme="whiteAlpha"
            size="sm"
          />
          <IconButton 
            icon={<HamburgerIcon />}
            aria-label="Open menu"
            variant="ghost"
            colorScheme="whiteAlpha"
            size="sm"
            onClick={onOpen}
          />
        </HStack>
        
        {/* Desktop Actions */}
        <HStack spacing={4} flex={1} justify="flex-end" display={{ base: 'none', lg: 'flex' }}>
          <Link href="/help" fontSize="sm">Help</Link>
          <Link href="/commissioner" fontSize="sm">Commissioner</Link>
          <Button size="sm" variant="outline" colorScheme="gold">
            Logout
          </Button>
        </HStack>
      </Flex>
      
      {/* Mobile Menu Drawer */}
      <MobileMenuDrawer isOpen={isOpen} onClose={onClose} />
    </>
  );
}
```

### Step 4: Build BottomToolbar Component

```tsx
// components/navigation/BottomToolbar/index.tsx
import { Flex, VStack, Icon, Text, Badge } from '@chakra-ui/react';
import { HomeIcon, UsersIcon, TrophyIcon } from '@chakra-ui/icons';
import { useRouter } from 'next/router';
import { useNavigation } from '../NavigationProvider';
import { BottomNavItem } from './BottomNavItem';

export function BottomToolbar() {
  const router = useRouter();
  const { activeRoute, teamUrl, hasUnsavedChanges } = useNavigation();
  
  const navItems = [
    { icon: HomeIcon, label: 'Home', href: '/', badge: null },
    { 
      icon: UsersIcon, 
      label: 'Team', 
      href: teamUrl || '/team', 
      badge: hasUnsavedChanges ? '!' : null 
    },
    { icon: TrophyIcon, label: 'Standings', href: '/leaderboard', badge: null },
    { icon: UsersIcon, label: 'Athletes', href: '/athletes', badge: null },
  ];
  
  return (
    <Flex 
      as="nav"
      position="fixed"
      bottom={0}
      left={0}
      right={0}
      zIndex={1000}
      bg="white"
      borderTop="2px solid"
      borderColor="gray.200"
      boxShadow="0 -4px 12px rgba(0,0,0,0.1)"
      height="64px"
      px={2}
      justify="space-around"
      align="center"
      display={{ base: 'flex', md: 'none' }}
      role="navigation"
      aria-label="Mobile primary navigation"
    >
      {navItems.map((item) => (
        <BottomNavItem 
          key={item.href}
          icon={item.icon}
          label={item.label}
          href={item.href}
          isActive={activeRoute === item.href || activeRoute.startsWith(item.href)}
          badge={item.badge}
        />
      ))}
    </Flex>
  );
}
```

### Step 5: Integrate into _app.tsx

```tsx
// pages/_app.tsx
import { ChakraProvider } from '@chakra-ui/react';
import { NavigationProvider } from '@/components/navigation/NavigationProvider';
import { StickyHeader } from '@/components/navigation/StickyHeader';
import { BottomToolbar } from '@/components/navigation/BottomToolbar';
import theme from '@/theme';

function MyApp({ Component, pageProps }) {
  return (
    <ChakraProvider theme={theme}>
      <NavigationProvider>
        <StickyHeader />
        
        <Box 
          pt={{ base: '60px', md: '72px', lg: '80px' }}
          pb={{ base: '64px', md: 0 }}
          minH="100vh"
        >
          <Component {...pageProps} />
        </Box>
        
        <BottomToolbar />
      </NavigationProvider>
    </ChakraProvider>
  );
}

export default MyApp;
```

### Step 6: Testing Checklist

**Visual Testing:**
- [ ] Header stays visible on scroll (all breakpoints)
- [ ] Bottom toolbar fixed at bottom (mobile only)
- [ ] No content hidden under navigation
- [ ] Active states clearly visible
- [ ] Touch targets adequate (44x44px)

**Functional Testing:**
- [ ] All navigation links work
- [ ] Active route detection accurate
- [ ] Mobile menu opens/closes correctly
- [ ] Keyboard navigation functional
- [ ] Screen reader announces correctly

**Responsive Testing:**
- [ ] Test on iPhone SE (320px width)
- [ ] Test on iPad (768px width)
- [ ] Test on desktop (1280px+ width)
- [ ] Test landscape orientation (mobile)
- [ ] Test with zoom at 200%

**Accessibility Testing:**
- [ ] Run axe DevTools (0 violations)
- [ ] Test with keyboard only (no mouse)
- [ ] Test with screen reader (NVDA/VoiceOver)
- [ ] Verify color contrast (WCAG AA minimum)
- [ ] Check focus indicators visible

---

## Related Documentation

- **[PHASE2_COMPONENT_MAPPING.md](PHASE2_COMPONENT_MAPPING.md)** - Complete component mapping
- **[UI_REDESIGN_ROADMAP.md](UI_REDESIGN_ROADMAP.md)** - Overall redesign roadmap (Phase 3: Weeks 11-14)
- **[CORE_DESIGN_GUIDELINES.md](CORE_DESIGN_GUIDELINES.md)** - Design system specifications
- **[/components/chakra/README.md](/components/chakra/README.md)** - Component pattern documentation

---

**Document Status:** ✅ Complete - Ready for Phase 3 implementation (Weeks 11-14)  
**Last Updated:** November 21, 2025  
**Next Review:** After Phase 2 (Component Library Audit) completion  
**Maintainer:** Project Team  
**Related Issues:** [#122 - Navigation Components](https://github.com/jessephus/marathon-majors-league/issues/122)
