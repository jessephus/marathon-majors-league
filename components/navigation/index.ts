/**
 * Navigation Module - Public API
 * 
 * Centralized exports for all navigation components.
 * Use this module for importing navigation components throughout the app.
 * 
 * Part of Phase 3: Core Navigation Implementation
 */

// Main Navigation Components
export { StickyHeader } from './StickyHeader';
export type { StickyHeaderProps, NavItem as HeaderNavItem } from './StickyHeader';

export { BottomNav, BottomNavItem } from './BottomNav';
export type { BottomNavProps, BottomNavItemProps } from './BottomNav';

// Navigation Wrapper with Feature Flags
export { NavigationWrapper, useNewNavigation } from './NavigationWrapper';
export type { NavigationWrapperProps } from './NavigationWrapper';

// Sub-components (for advanced usage)
export { NavLink } from './StickyHeader/NavLink';
export type { NavLinkProps } from './StickyHeader/NavLink';
