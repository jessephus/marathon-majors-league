/**
 * ButtonGroup Component
 * 
 * Groups multiple buttons together with consistent spacing and optional dividers.
 * Useful for action bars, toolbars, and form button groups.
 * 
 * Features:
 * - Consistent spacing between buttons
 * - Horizontal or vertical orientation
 * - Optional dividers
 * - Responsive spacing
 * - Attached button styles (connected buttons)
 * 
 * @version 1.0.0 (Phase 4: Button Group Implementation)
 * @date November 23, 2025
 */

import { Stack, StackProps } from '@chakra-ui/react';
import { forwardRef, Children, cloneElement, isValidElement } from 'react';

export interface ButtonGroupProps extends Omit<StackProps, 'direction'> {
  /** Spacing between buttons */
  spacing?: StackProps['gap'];
  /** Orientation of button group */
  orientation?: 'horizontal' | 'vertical';
  /** Make buttons full width */
  isFullWidth?: boolean;
  /** Attach buttons together (remove gap, round only outer corners) */
  isAttached?: boolean;
  /** Size to apply to all buttons */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Variant to apply to all buttons */
  variant?: 'solid' | 'outline' | 'ghost';
  /** Color palette to apply to all buttons */
  colorPalette?: 'primary' | 'secondary' | 'navy' | 'gold' | 'success' | 'warning' | 'error' | 'info';
}

export const ButtonGroup = forwardRef<HTMLDivElement, ButtonGroupProps>(
  (
    {
      spacing = 2,
      orientation = 'horizontal',
      isFullWidth = false,
      isAttached = false,
      size,
      variant,
      colorPalette,
      children,
      ...props
    },
    ref
  ) => {
    const direction = orientation === 'horizontal' ? 'row' : 'column';
    
    // Clone children to add group-specific props
    const enhancedChildren = Children.map(children, (child, index) => {
      if (!isValidElement(child)) return child;
      
      const isFirst = index === 0;
      const isLast = index === Children.count(children) - 1;
      
      // Props to pass to each button
      const buttonProps: any = {};
      
      // Apply group size, variant, colorPalette if not overridden on button
      const childProps = child.props as any;
      if (size && !childProps.size) buttonProps.size = size;
      if (variant && !childProps.variant) buttonProps.variant = variant;
      if (colorPalette && !childProps.colorPalette) buttonProps.colorPalette = colorPalette;
      
      // Apply full width if specified
      if (isFullWidth) buttonProps.width = 'full';
      
      // Apply attached styles
      if (isAttached) {
        if (orientation === 'horizontal') {
          if (!isFirst && !isLast) {
            buttonProps.borderRadius = '0';
            buttonProps.borderLeftWidth = '0';
          } else if (isFirst) {
            buttonProps.borderRightRadius = '0';
          } else if (isLast) {
            buttonProps.borderLeftRadius = '0';
            buttonProps.borderLeftWidth = '0';
          }
        } else {
          // vertical orientation
          if (!isFirst && !isLast) {
            buttonProps.borderRadius = '0';
            buttonProps.borderTopWidth = '0';
          } else if (isFirst) {
            buttonProps.borderBottomRadius = '0';
          } else if (isLast) {
            buttonProps.borderTopRadius = '0';
            buttonProps.borderTopWidth = '0';
          }
        }
      }
      
      return cloneElement(child, buttonProps);
    });
    
    return (
      <Stack
        ref={ref}
        direction={direction}
        gap={isAttached ? 0 : spacing}
        width={isFullWidth ? 'full' : 'auto'}
        {...props}
      >
        {enhancedChildren}
      </Stack>
    );
  }
);

ButtonGroup.displayName = 'ButtonGroup';
