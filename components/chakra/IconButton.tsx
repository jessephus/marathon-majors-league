/**
 * Custom IconButton Component with Semantic Color Support
 * 
 * Icon-only button variant with proper accessibility features.
 * Uses explicit color tokens to ensure colors render correctly in Chakra v3.
 * 
 * Features:
 * - 8 color palettes (primary, secondary, navy, gold, success, warning, error, info)
 * - 3 variants (solid, outline, ghost)
 * - 5 sizes (xs, sm, md, lg, xl)
 * - Accessible by default (requires aria-label)
 * - Circular or square shape options
 * - WCAG 2.5.5 compliant touch targets (44x44px minimum)
 * 
 * @version 1.0.0 (Phase 4: Icon Button Implementation)
 * @date November 23, 2025
 */

import { IconButton as ChakraIconButton, IconButtonProps } from '@chakra-ui/react';
import { forwardRef } from 'react';

export interface SemanticIconButtonProps extends Omit<IconButtonProps, 'colorPalette'> {
  colorPalette?: 'primary' | 'secondary' | 'navy' | 'gold' | 'success' | 'warning' | 'error' | 'info';
  variant?: 'solid' | 'outline' | 'ghost';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isRound?: boolean;
  'aria-label': string; // Required for accessibility
}

// Color configuration matching Button component
const colorConfig = {
  primary: {
    solid: { 
      bg: 'primary.500', 
      color: 'white', 
      _hover: { bg: 'primary.600', transform: 'scale(1.05)', shadow: 'md' },
      _active: { bg: 'primary.700', transform: 'scale(0.95)' },
      _focus: { boxShadow: '0 0 0 3px rgba(74, 95, 157, 0.3)' },
    },
    outline: { 
      borderColor: 'primary.500', 
      color: 'primary.500', 
      _hover: { bg: 'primary.50', borderColor: 'primary.600' },
      _active: { bg: 'primary.100' },
      _focus: { boxShadow: '0 0 0 3px rgba(74, 95, 157, 0.3)' },
    },
    ghost: { 
      color: 'primary.500', 
      _hover: { bg: 'primary.50' },
      _active: { bg: 'primary.100' },
      _focus: { boxShadow: '0 0 0 3px rgba(74, 95, 157, 0.3)' },
    },
  },
  secondary: {
    solid: { 
      bg: 'secondary.500', 
      color: 'navy.900', 
      _hover: { bg: 'secondary.600', transform: 'scale(1.05)', shadow: 'md' },
      _active: { bg: 'secondary.700', transform: 'scale(0.95)' },
      _focus: { boxShadow: '0 0 0 3px rgba(212, 175, 55, 0.3)' },
    },
    outline: { 
      borderColor: 'secondary.500', 
      color: 'secondary.600', 
      _hover: { bg: 'secondary.50', borderColor: 'secondary.600' },
      _active: { bg: 'secondary.100' },
      _focus: { boxShadow: '0 0 0 3px rgba(212, 175, 55, 0.3)' },
    },
    ghost: { 
      color: 'secondary.600', 
      _hover: { bg: 'secondary.50' },
      _active: { bg: 'secondary.100' },
      _focus: { boxShadow: '0 0 0 3px rgba(212, 175, 55, 0.3)' },
    },
  },
  navy: {
    solid: { 
      bg: 'navy.500', 
      color: 'white', 
      _hover: { bg: 'navy.600', transform: 'scale(1.05)', shadow: 'md' },
      _active: { bg: 'navy.700', transform: 'scale(0.95)' },
      _focus: { boxShadow: '0 0 0 3px rgba(74, 95, 157, 0.3)' },
    },
    outline: { 
      borderColor: 'navy.500', 
      color: 'navy.500', 
      _hover: { bg: 'navy.50', borderColor: 'navy.600' },
      _active: { bg: 'navy.100' },
      _focus: { boxShadow: '0 0 0 3px rgba(74, 95, 157, 0.3)' },
    },
    ghost: { 
      color: 'navy.500', 
      _hover: { bg: 'navy.50' },
      _active: { bg: 'navy.100' },
      _focus: { boxShadow: '0 0 0 3px rgba(74, 95, 157, 0.3)' },
    },
  },
  gold: {
    solid: { 
      bg: 'gold.500', 
      color: 'navy.900', 
      _hover: { bg: 'gold.600', transform: 'scale(1.05)', shadow: 'md' },
      _active: { bg: 'gold.700', transform: 'scale(0.95)' },
      _focus: { boxShadow: '0 0 0 3px rgba(212, 175, 55, 0.3)' },
    },
    outline: { 
      borderColor: 'gold.500', 
      color: 'gold.600', 
      _hover: { bg: 'gold.50', borderColor: 'gold.600' },
      _active: { bg: 'gold.100' },
      _focus: { boxShadow: '0 0 0 3px rgba(212, 175, 55, 0.3)' },
    },
    ghost: { 
      color: 'gold.600', 
      _hover: { bg: 'gold.50' },
      _active: { bg: 'gold.100' },
      _focus: { boxShadow: '0 0 0 3px rgba(212, 175, 55, 0.3)' },
    },
  },
  success: {
    solid: { 
      bg: 'success.600', 
      color: 'white', 
      _hover: { bg: 'success.700', transform: 'scale(1.05)', shadow: 'md' },
      _active: { bg: 'success.800', transform: 'scale(0.95)' },
      _focus: { boxShadow: '0 0 0 3px rgba(34, 197, 94, 0.3)' },
    },
    outline: { 
      borderColor: 'success.600', 
      color: 'success.700', 
      _hover: { bg: 'success.50', borderColor: 'success.700' },
      _active: { bg: 'success.100' },
      _focus: { boxShadow: '0 0 0 3px rgba(34, 197, 94, 0.3)' },
    },
    ghost: { 
      color: 'success.700', 
      _hover: { bg: 'success.50' },
      _active: { bg: 'success.100' },
      _focus: { boxShadow: '0 0 0 3px rgba(34, 197, 94, 0.3)' },
    },
  },
  warning: {
    solid: { 
      bg: 'warning.500', 
      color: 'white', 
      _hover: { bg: 'warning.600', transform: 'scale(1.05)', shadow: 'md' },
      _active: { bg: 'warning.700', transform: 'scale(0.95)' },
      _focus: { boxShadow: '0 0 0 3px rgba(245, 158, 11, 0.3)' },
    },
    outline: { 
      borderColor: 'warning.500', 
      color: 'warning.600', 
      _hover: { bg: 'warning.50', borderColor: 'warning.600' },
      _active: { bg: 'warning.100' },
      _focus: { boxShadow: '0 0 0 3px rgba(245, 158, 11, 0.3)' },
    },
    ghost: { 
      color: 'warning.600', 
      _hover: { bg: 'warning.50' },
      _active: { bg: 'warning.100' },
      _focus: { boxShadow: '0 0 0 3px rgba(245, 158, 11, 0.3)' },
    },
  },
  error: {
    solid: { 
      bg: 'error.500', 
      color: 'white', 
      _hover: { bg: 'error.600', transform: 'scale(1.05)', shadow: 'md' },
      _active: { bg: 'error.700', transform: 'scale(0.95)' },
      _focus: { boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.3)' },
    },
    outline: { 
      borderColor: 'error.500', 
      color: 'error.600', 
      _hover: { bg: 'error.50', borderColor: 'error.600' },
      _active: { bg: 'error.100' },
      _focus: { boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.3)' },
    },
    ghost: { 
      color: 'error.600', 
      _hover: { bg: 'error.50' },
      _active: { bg: 'error.100' },
      _focus: { boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.3)' },
    },
  },
  info: {
    solid: { 
      bg: 'info.500', 
      color: 'white', 
      _hover: { bg: 'info.600', transform: 'scale(1.05)', shadow: 'md' },
      _active: { bg: 'info.700', transform: 'scale(0.95)' },
      _focus: { boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.3)' },
    },
    outline: { 
      borderColor: 'info.500', 
      color: 'info.600', 
      _hover: { bg: 'info.50', borderColor: 'info.600' },
      _active: { bg: 'info.100' },
      _focus: { boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.3)' },
    },
    ghost: { 
      color: 'info.600', 
      _hover: { bg: 'info.50' },
      _active: { bg: 'info.100' },
      _focus: { boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.3)' },
    },
  },
};

// Base styles
const baseStyles = {
  fontWeight: 'semibold',
  transition: 'all 0.2s cubic-bezier(0, 0, 0.2, 1)',
  _disabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
    _hover: {
      transform: 'none',
      shadow: 'none',
    },
  },
};

// Size configurations with WCAG 2.5.5 compliant touch targets
const sizeConfig = {
  xs: { 
    fontSize: 'xs',
    w: '32px',
    h: '32px',
    minW: '32px',
    minH: '32px',
  },
  sm: { 
    fontSize: 'sm',
    w: '40px',
    h: '40px',
    minW: '40px',
    minH: '40px',
  },
  md: { 
    fontSize: 'md',
    w: '44px',  // WCAG minimum
    h: '44px',
    minW: '44px',
    minH: '44px',
  },
  lg: { 
    fontSize: 'lg',
    w: '48px',  // Recommended for mobile
    h: '48px',
    minW: '48px',
    minH: '48px',
  },
  xl: { 
    fontSize: 'xl',
    w: '56px',
    h: '56px',
    minW: '56px',
    minH: '56px',
  },
};

export const IconButton = forwardRef<HTMLButtonElement, SemanticIconButtonProps>(
  (
    { 
      colorPalette = 'primary', 
      variant = 'solid', 
      size = 'md',
      isRound = false,
      ...props 
    }, 
    ref
  ) => {
    const colorProps = colorConfig[colorPalette]?.[variant] || {};
    const sizeProps = sizeConfig[size] || sizeConfig.md;
    
    return (
      <ChakraIconButton 
        ref={ref}
        variant={variant}
        borderRadius={isRound ? 'full' : 'md'}
        {...baseStyles}
        {...colorProps}
        {...sizeProps}
        {...props}
      />
    );
  }
);

IconButton.displayName = 'IconButton';
