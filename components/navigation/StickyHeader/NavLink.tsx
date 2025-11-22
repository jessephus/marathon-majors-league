/**
 * NavLink Component
 * 
 * Navigation link with active state styling for StickyHeader.
 * 
 * Features:
 * - Active state with gold underline (2px solid)
 * - Gold color for active text
 * - White text for inactive links
 * - Smooth transitions with microinteractions
 * - Enhanced hover states with slide animation
 * - Keyboard accessible
 * - ARIA current attribute for active state
 * - Touch feedback for mobile
 * 
 * Design:
 * - Font: Medium weight (500)
 * - Active: Gold 400 text + gold 400 bottom border with slide-in animation
 * - Inactive: White text with 90% opacity
 * - Hover: White text with 100% opacity + underline slide
 * 
 * Part of StickyHeader component (Phase 3, Week 13-14 + Polish)
 */

import { Box } from '@chakra-ui/react';
import Link from 'next/link';
import { ReactNode, useState } from 'react';

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
 * Styled navigation link with active state support and microinteractions.
 * Shows gold underline and gold text when active with smooth slide animation.
 */
export function NavLink({ href, isActive, children, className }: NavLinkProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <Link href={href} passHref legacyBehavior>
      <Box
        as="a"
        position="relative"
        fontWeight={isActive ? 'bold' : 'medium'}
        fontSize={{ md: 'sm', lg: 'md' }}
        color={isActive ? 'gold.400' : 'white'}
        opacity={isActive ? 1 : 0.9}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        _hover={{
          opacity: 1,
          color: isActive ? 'gold.400' : 'white',
        }}
        // Enhanced transitions with proper easing
        transition="all 0.15s cubic-bezier(0, 0, 0.2, 1)"
        pb={1}
        cursor="pointer"
        className={className}
        aria-current={isActive ? 'page' : undefined}
        // WCAG 2.5.5 Touch Target Size - Minimum 44x44px
        minHeight="44px"
        minWidth="44px"
        padding="12px 16px"
        display="flex"
        alignItems="center"
        // Respect user's motion preferences
        css={{
          '@media (prefers-reduced-motion: reduce)': {
            transition: 'none',
          }
        }}
      >
        {children}
        
        {/* Animated underline with slide effect */}
        <Box
          position="absolute"
          bottom={0}
          left={0}
          right={0}
          height="2px"
          bg="gold.400"
          transformOrigin="left"
          transform={isActive ? 'scaleX(1)' : isHovered ? 'scaleX(1)' : 'scaleX(0)'}
          transition="transform 0.25s cubic-bezier(0, 0, 0.2, 1)"
          css={{
            '@media (prefers-reduced-motion: reduce)': {
              transform: isActive ? 'scaleX(1)' : 'scaleX(0)',
              transition: 'none',
            }
          }}
        />
      </Box>
    </Link>
  );
}
