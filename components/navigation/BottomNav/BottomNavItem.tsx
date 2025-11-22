/**
 * BottomNavItem Component
 * 
 * Individual navigation item for the mobile bottom toolbar.
 * Features:
 * - Icon + label format
 * - Active state styling with navy color
 * - Touch-optimized (44x44px minimum)
 * - Accessible with ARIA attributes
 * - Smooth transitions
 * 
 * Part of Phase 3: Core Navigation Implementation
 * Spec: docs/UI_REDESIGN/UI_PHASE2_NAVIGATION_SPEC.md
 */

import { VStack, Text, Badge, Box } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { CSSProperties } from 'react';

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
  
  const handleClick = () => {
    router.push(href);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      router.push(href);
    }
  };
  
  return (
    <VStack 
      gap={0}
      flex={1}
      as="button"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
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
      transition="all 0.2s ease-out"
      _active={{ 
        bg: 'gray.50',
        transform: 'scale(0.95)'
      }}
      _hover={{
        bg: 'gray.50'
      }}
      _focus={{
        outline: '2px solid',
        outlineColor: 'gold.500',
        outlineOffset: '2px',
        bg: 'gray.50'
      }}
      aria-label={ariaLabel || `Navigate to ${label}`}
      aria-current={isActive ? 'page' : undefined}
      role="link"
      tabIndex={0}
    >
      {/* Badge/notification indicator */}
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
        >
          {badge}
        </Badge>
      )}
      
      {/* Icon */}
      <Box 
        display="flex"
        alignItems="center"
        justifyContent="center"
        mb={0.5}
      >
        <Icon 
          style={{ 
            width: '24px', 
            height: '24px',
            color: isActive ? 'var(--chakra-colors-navy-500)' : 'var(--chakra-colors-gray-400)',
            transition: 'color 0.2s ease-out'
          }} 
        />
      </Box>
      
      {/* Label */}
      <Text 
        fontSize="xs" 
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
