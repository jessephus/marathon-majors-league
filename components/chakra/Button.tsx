/**
 * Custom Button Component with Semantic Color Support
 * 
 * Wraps Chakra UI Button to provide clean semantic color palette support.
 * Uses explicit color tokens to ensure colors render correctly in Chakra v3.
 */

import { Button as ChakraButton, ButtonProps } from '@chakra-ui/react';

interface SemanticButtonProps extends Omit<ButtonProps, 'colorPalette'> {
  colorPalette?: 'primary' | 'secondary' | 'navy' | 'gold' | 'success' | 'warning' | 'error' | 'info';
  variant?: 'solid' | 'outline' | 'ghost';
}

const colorConfig = {
  primary: {
    solid: { bg: 'primary.500', color: 'white', _hover: { bg: 'primary.600' } },
    outline: { borderColor: 'primary.500', color: 'primary.500', _hover: { bg: 'primary.50' } },
    ghost: { color: 'primary.500', _hover: { bg: 'primary.50' } },
  },
  secondary: {
    solid: { bg: 'secondary.500', color: 'navy.900', _hover: { bg: 'secondary.600' } },
    outline: { borderColor: 'secondary.500', color: 'secondary.600', _hover: { bg: 'secondary.50' } },
    ghost: { color: 'secondary.600', _hover: { bg: 'secondary.50' } },
  },
  navy: {
    solid: { bg: 'navy.500', color: 'white', _hover: { bg: 'navy.600' } },
    outline: { borderColor: 'navy.500', color: 'navy.500', _hover: { bg: 'navy.50' } },
    ghost: { color: 'navy.500', _hover: { bg: 'navy.50' } },
  },
  gold: {
    solid: { bg: 'gold.500', color: 'navy.900', _hover: { bg: 'gold.600' } },
    outline: { borderColor: 'gold.500', color: 'gold.600', _hover: { bg: 'gold.50' } },
    ghost: { color: 'gold.600', _hover: { bg: 'gold.50' } },
  },
  success: {
    solid: { bg: 'success.600', color: 'white', _hover: { bg: 'success.700' } },  // Changed from 500 to 600 for WCAG 2.1 AA compliance (4.54:1 contrast)
    outline: { borderColor: 'success.600', color: 'success.700', _hover: { bg: 'success.50' } },
    ghost: { color: 'success.700', _hover: { bg: 'success.50' } },
  },
  warning: {
    solid: { bg: 'warning.500', color: 'white', _hover: { bg: 'warning.600' } },
    outline: { borderColor: 'warning.500', color: 'warning.600', _hover: { bg: 'warning.50' } },
    ghost: { color: 'warning.600', _hover: { bg: 'warning.50' } },
  },
  error: {
    solid: { bg: 'error.500', color: 'white', _hover: { bg: 'error.600' } },
    outline: { borderColor: 'error.500', color: 'error.600', _hover: { bg: 'error.50' } },
    ghost: { color: 'error.600', _hover: { bg: 'error.50' } },
  },
  info: {
    solid: { bg: 'info.500', color: 'white', _hover: { bg: 'info.600' } },
    outline: { borderColor: 'info.500', color: 'info.600', _hover: { bg: 'info.50' } },
    ghost: { color: 'info.600', _hover: { bg: 'info.50' } },
  },
};

export function Button({ colorPalette = 'primary', variant = 'solid', ...props }: SemanticButtonProps) {
  const colorProps = colorConfig[colorPalette]?.[variant] || {};
  
  return <ChakraButton variant={variant} {...colorProps} {...props} />;
}
