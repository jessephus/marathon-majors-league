/**
 * BottomNavItem Component
 * 
 * Individual navigation item for the mobile bottom toolbar.
 * Features:
 * - Icon + label format
 * - Active state styling with navy color
 * - Touch-optimized (44x44px minimum)
 * - Accessible with ARIA attributes
 * - Smooth transitions and microinteractions
 * - Tap feedback with scale animation
 * - Ripple effect on interaction
 * 
 * Part of Phase 3: Core Navigation Implementation (Polish)
 * Spec: docs/UI_REDESIGN/UI_PHASE2_NAVIGATION_SPEC.md
 */

import { VStack, Text, Badge, Box } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { CSSProperties, useState } from 'react';

export interface BottomNavItemProps {
  icon: React.ComponentType<{ style?: CSSProperties }>;
  label: string;
  href: string;
  isActive: boolean;
  badge?: string | number;
  'aria-label'?: string;
}

export function BottomNavItem({ 
  icon: Icon, 
  label, 
  href, 
  isActive, 
  badge,
  'aria-label': ariaLabel 
}: BottomNavItemProps) {
  const router = useRouter();
  const [isPressed, setIsPressed] = useState(false);
  const [showRipple, setShowRipple] = useState(false);
  
  const handleClick = () => {
    // Trigger ripple effect
    setShowRipple(true);
    setTimeout(() => setShowRipple(false), 600);
    
    router.push(href);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      // Trigger ripple effect
      setShowRipple(true);
      setTimeout(() => setShowRipple(false), 600);
      router.push(href);
    }
  };
  
  const handleTouchStart = () => {
    setIsPressed(true);
  };
  
  const handleTouchEnd = () => {
    setIsPressed(false);
  };
  
  return (
    <VStack 
      gap={0}
      flex={1}
      as="button"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
      color={isActive ? 'navy.500' : 'gray.400'}
      fontWeight={isActive ? 'semibold' : 'normal'}
      py={2}
      px={1}
      minW="60px"
      minH="60px"
      position="relative"
      bg="transparent"
      border="none"
      cursor="pointer"
      // Enhanced transitions with proper timing
      transition="all 0.15s cubic-bezier(0, 0, 0.2, 1)"
      transform={isPressed ? 'scale(0.92)' : isActive ? 'translateY(-2px)' : 'none'}
      _active={{ 
        bg: 'gray.50',
      }}
      _hover={{
        bg: 'gray.50',
        color: isActive ? 'navy.600' : 'gray.500',
        transform: isActive ? 'translateY(-2px)' : 'translateY(-1px)',
      }}
      _focus={{
        outline: 'none',
        boxShadow: 'inset 0 0 0 2px var(--chakra-colors-gold-500)',
        bg: 'gray.50'
      }}
      aria-label={ariaLabel || `Navigate to ${label}`}
      aria-current={isActive ? 'page' : undefined}
      role="link"
      tabIndex={0}
      // Respect user's motion preferences
      css={{
        '@media (prefers-reduced-motion: reduce)': {
          transition: 'none',
          transform: 'none !important',
        }
      }}
    >
      {/* Ripple effect container */}
      {showRipple && (
        <Box
          position="absolute"
          top="50%"
          left="50%"
          width="0"
          height="0"
          borderRadius="50%"
          bg="navy.500"
          opacity={0.3}
          animation="ripple 0.6s cubic-bezier(0, 0, 0.2, 1)"
          css={{
            '@keyframes ripple': {
              '0%': {
                width: '0',
                height: '0',
                marginTop: '0',
                marginLeft: '0',
                opacity: 0.3,
              },
              '100%': {
                width: '100px',
                height: '100px',
                marginTop: '-50px',
                marginLeft: '-50px',
                opacity: 0,
              },
            },
            '@media (prefers-reduced-motion: reduce)': {
              animation: 'none',
              display: 'none',
            }
          }}
        />
      )}

      {/* Badge/notification indicator with pulse animation */}
      {badge && (
        <Badge 
          colorPalette="error"
          position="absolute" 
          top={1} 
          right="20%"
          borderRadius="full"
          fontSize="2xs"
          minW="16px"
          h="16px"
          display="flex"
          alignItems="center"
          justifyContent="center"
          px={badge.toString().length > 1 ? 1 : 0}
          animation="pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
          css={{
            '@keyframes pulse': {
              '0%, 100%': {
                opacity: 1,
              },
              '50%': {
                opacity: 0.7,
              },
            },
            '@media (prefers-reduced-motion: reduce)': {
              animation: 'none',
            }
          }}
        >
          {badge}
        </Badge>
      )}
      
      {/* Icon with scale animation */}
      <Box 
        display="flex"
        alignItems="center"
        justifyContent="center"
        mb={0.5}
        transform={isActive ? 'scale(1.1)' : 'scale(1)'}
        transition="transform 0.2s cubic-bezier(0, 0, 0.2, 1)"
        css={{
          '@media (prefers-reduced-motion: reduce)': {
            transform: 'none',
          }
        }}
      >
        <Icon 
          style={{ 
            width: '24px', 
            height: '24px',
            color: isActive ? 'var(--chakra-colors-navy-500)' : 'var(--chakra-colors-gray-400)',
            transition: 'color 0.15s cubic-bezier(0, 0, 0.2, 1)'
          }} 
        />
      </Box>
      
      {/* Label */}
      <Text 
        fontSize="2xs" 
        lineHeight="1.2"
        whiteSpace="nowrap"
        overflow="hidden"
        textOverflow="ellipsis"
        maxW="100%"
      >
        {label}
      </Text>
    </VStack>
  );
}
