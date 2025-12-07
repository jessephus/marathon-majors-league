/**
 * Tooltip Component - Chakra UI v3 compatible wrapper
 * 
 * Uses native browser tooltip (title attribute) for simplicity and
 * compatibility with Chakra UI v3's strict typing.
 * 
 * Usage:
 *   <Tooltip label="Tooltip text">
 *     <Button>Hover me</Button>
 *   </Tooltip>
 */

import { PropsWithChildren, cloneElement, isValidElement } from 'react';

interface TooltipProps extends PropsWithChildren {
  label: string;
  placement?: 'top' | 'right' | 'bottom' | 'left';
  isDisabled?: boolean;
}

/**
 * Tooltip Component
 * 
 * A simple tooltip wrapper that adds a native browser tooltip (title attribute)
 * to the child element.
 */
export function Tooltip({ 
  label, 
  placement = 'top', // For API compatibility, not used with native tooltips
  isDisabled = false,
  children 
}: TooltipProps) {
  if (isDisabled) {
    return <>{children}</>;
  }

  // If children is a valid React element, clone it with title prop
  if (isValidElement(children)) {
    return cloneElement(children as any, {
      title: label,
      'aria-label': label,
    });
  }

  // Fallback: wrap in span with title
  return (
    <span title={label} aria-label={label}>
      {children}
    </span>
  );
}
