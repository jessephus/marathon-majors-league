/**
 * NavLink Component
 * 
 * Navigation link with active state styling for StickyHeader.
 * 
 * Features:
 * - Active state with gold underline (2px solid)
 * - Gold color for active text
 * - White text for inactive links
 * - Smooth transitions (200ms)
 * - Hover states
 * - Keyboard accessible
 * - ARIA current attribute for active state
 * 
 * Design:
 * - Font: Medium weight (500)
 * - Active: Gold 400 text + gold 400 bottom border
 * - Inactive: White text with 90% opacity
 * - Hover: White text with 100% opacity
 * 
 * Part of StickyHeader component (Phase 3, Week 13-14)
 */

import { Box } from '@chakra-ui/react';
import Link from 'next/link';
import { ReactNode } from 'react';

export interface NavLinkProps {
  /**
   * Link destination
   */
  href: string;
  
  /**
   * Whether this link is currently active
   */
  isActive: boolean;
  
  /**
   * Link text content
   */
  children: ReactNode;
  
  /**
   * Additional class name for styling
   */
  className?: string;
}

/**
 * NavLink Component
 * 
 * Styled navigation link with active state support.
 * Shows gold underline and gold text when active.
 */
export function NavLink({ href, isActive, children, className }: NavLinkProps) {
  return (
    <Link href={href} passHref legacyBehavior>
      <Box
        as="a"
        position="relative"
        fontWeight={isActive ? 'bold' : 'medium'}
        fontSize={{ md: 'sm', lg: 'md' }}
        color={isActive ? 'gold.400' : 'white'}
        opacity={isActive ? 1 : 0.9}
        _hover={{
          opacity: 1,
          color: isActive ? 'gold.400' : 'white',
        }}
        transition="all 0.2s ease-out"
        pb={1}
        borderBottom={isActive ? '2px solid' : 'none'}
        borderColor="gold.400"
        cursor="pointer"
        className={className}
        aria-current={isActive ? 'page' : undefined}
      >
        {children}
      </Box>
    </Link>
  );
}
