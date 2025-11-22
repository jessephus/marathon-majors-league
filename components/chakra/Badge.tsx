/**
 * Custom Badge Component with Semantic Color Support
 * 
 * Wraps Chakra UI Badge to provide clean semantic color palette support.
 * Uses explicit color tokens to ensure colors render correctly in Chakra v3.
 */

import { Badge as ChakraBadge, BadgeProps } from '@chakra-ui/react';

interface SemanticBadgeProps extends Omit<BadgeProps, 'colorPalette'> {
  colorPalette?: 'primary' | 'secondary' | 'navy' | 'gold' | 'success' | 'warning' | 'error' | 'info';
}

const colorConfig = {
  primary: { bg: 'primary.500', color: 'white' },
  secondary: { bg: 'secondary.500', color: 'navy.900' },
  navy: { bg: 'navy.500', color: 'white' },
  gold: { bg: 'gold.500', color: 'navy.900' },
  success: { bg: 'success.600', color: 'white' },  // Changed from 500 to 600 for WCAG 2.1 AA compliance (4.54:1 contrast)
  warning: { bg: 'warning.500', color: 'white' },
  error: { bg: 'error.500', color: 'white' },
  info: { bg: 'info.500', color: 'white' },
};

export function Badge({ colorPalette = 'primary', ...props }: SemanticBadgeProps) {
  const colorProps = colorConfig[colorPalette] || {};
  
  return <ChakraBadge {...colorProps} {...props} />;
}
