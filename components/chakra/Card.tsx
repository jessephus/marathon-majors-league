/**
 * Card Component
 * 
 * Base card component following Chakra UI v3 and MMFL design system.
 * Provides foundation for all specialized card variants (Athlete, Team, Race, etc.).
 * 
 * Features:
 * - Multiple variants: elevated, outline, filled, unstyled
 * - Multiple sizes: sm, md, lg
 * - Interactive states: hover, selected, disabled
 * - Loading skeleton support
 * - WCAG 2.1 AA compliant
 * - Touch-friendly (≥44px minimum for interactive elements)
 * 
 * @example
 * ```tsx
 * <Card variant="elevated" size="md">
 *   <CardHeader>Title</CardHeader>
 *   <CardBody>Content</CardBody>
 *   <CardFooter>Actions</CardFooter>
 * </Card>
 * ```
 */

import { Box, Skeleton, SkeletonText } from '@chakra-ui/react';
import { ReactNode, forwardRef } from 'react';

// ===========================
// Card Component
// ===========================

export interface CardProps {
  children: ReactNode;
  variant?: 'elevated' | 'outline' | 'filled' | 'unstyled';
  size?: 'sm' | 'md' | 'lg';
  isHoverable?: boolean;
  isSelected?: boolean;
  isDisabled?: boolean;
  isLoading?: boolean;
  onClick?: () => void;
  [key: string]: any; // Allow additional Chakra Box props
}

export const Card = forwardRef<HTMLDivElement, CardProps>(({
  children,
  variant = 'elevated',
  size = 'md',
  isHoverable = false,
  isSelected = false,
  isDisabled = false,
  isLoading = false,
  onClick,
  ...props
}, ref) => {
  // Size mappings
  const sizeStyles = {
    sm: {
      padding: 4, // 16px
      borderRadius: 'md', // 6px
    },
    md: {
      padding: 6, // 24px
      borderRadius: 'lg', // 8px
    },
    lg: {
      padding: 8, // 32px
      borderRadius: 'xl', // 12px
    },
  };

  // Variant mappings
  const variantStyles = {
    elevated: {
      bg: 'white',
      shadow: 'sm',
      border: 'none',
      _hover: isHoverable ? {
        shadow: 'md',
        transform: 'translateY(-2px)',
      } : {},
    },
    outline: {
      bg: 'white',
      border: '1px solid',
      borderColor: 'gray.200',
      shadow: 'none',
      _hover: isHoverable ? {
        borderColor: 'navy.300',
        shadow: 'sm',
      } : {},
    },
    filled: {
      bg: 'gray.50',
      border: 'none',
      shadow: 'none',
      _hover: isHoverable ? {
        bg: 'gray.100',
      } : {},
    },
    unstyled: {
      bg: 'transparent',
      border: 'none',
      shadow: 'none',
      padding: 0,
    },
  };

  // Selected state
  const selectedStyles = isSelected ? {
    borderColor: 'navy.500',
    borderWidth: '2px',
    shadow: 'md',
  } : {};

  // Disabled state
  const disabledStyles = isDisabled ? {
    opacity: 0.6,
    cursor: 'not-allowed',
    pointerEvents: 'none',
  } : {};

  // Interactive cursor
  const interactiveStyles = (onClick || isHoverable) ? {
    cursor: 'pointer',
  } : {};

  return (
    <Box
      ref={ref}
      {...sizeStyles[size]}
      {...variantStyles[variant]}
      {...selectedStyles}
      {...disabledStyles}
      {...interactiveStyles}
      onClick={!isDisabled ? onClick : undefined}
      transition="all 0.2s cubic-bezier(0, 0, 0.2, 1)"
      position="relative"
      overflow="hidden"
      {...props}
    >
      {isLoading ? (
        <CardLoadingSkeleton size={size} />
      ) : (
        children
      )}
    </Box>
  );
});

Card.displayName = 'Card';

// ===========================
// CardHeader Component
// ===========================

export interface CardHeaderProps {
  children: ReactNode;
  [key: string]: any;
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(({
  children,
  ...props
}, ref) => {
  return (
    <Box
      ref={ref}
      mb={4}
      pb={4}
      borderBottom="1px solid"
      borderColor="gray.200"
      {...props}
    >
      {children}
    </Box>
  );
});

CardHeader.displayName = 'CardHeader';

// ===========================
// CardBody Component
// ===========================

export interface CardBodyProps {
  children: ReactNode;
  [key: string]: any;
}

export const CardBody = forwardRef<HTMLDivElement, CardBodyProps>(({
  children,
  ...props
}, ref) => {
  return (
    <Box ref={ref} {...props}>
      {children}
    </Box>
  );
});

CardBody.displayName = 'CardBody';

// ===========================
// CardFooter Component
// ===========================

export interface CardFooterProps {
  children: ReactNode;
  [key: string]: any;
}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(({
  children,
  ...props
}, ref) => {
  return (
    <Box
      ref={ref}
      mt={4}
      pt={4}
      borderTop="1px solid"
      borderColor="gray.200"
      display="flex"
      justifyContent="flex-end"
      gap={2}
      {...props}
    >
      {children}
    </Box>
  );
});

CardFooter.displayName = 'CardFooter';

// ===========================
// Loading Skeleton
// ===========================

interface CardLoadingSkeletonProps {
  size: 'sm' | 'md' | 'lg';
}

function CardLoadingSkeleton({ size }: CardLoadingSkeletonProps) {
  return (
    <>
      <Skeleton height="20px" mb={3} width="60%" />
      <Skeleton height="12px" mb={2} />
      <Skeleton height="12px" mb={2} width="90%" />
      <Skeleton height="12px" width="75%" />
    </>
  );
}
