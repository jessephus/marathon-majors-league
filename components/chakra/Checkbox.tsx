/**
 * Custom Checkbox Component with Semantic Color Support
 * 
 * Provides consistent checkbox styling with the MMFL design system.
 * Uses native HTML checkbox with custom styling for maximum compatibility.
 * 
 * Features:
 * - 3 sizes (sm: 16px, md: 20px, lg: 24px)
 * - Custom colors (navy and gold theme)
 * - Validation states (default, error)
 * - Accessible by default (WCAG 2.1 AA compliant)
 * - Full keyboard support (Space to toggle)
 * - Touch target minimum 44px for mobile
 * 
 * @version 1.0.0 (Phase 4: Form Components)
 * @date November 23, 2025
 */

import { forwardRef, ReactNode, InputHTMLAttributes } from 'react';
import { CheckIcon } from '@heroicons/react/24/solid';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  children?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  isInvalid?: boolean;
  isDisabled?: boolean;
  isRequired?: boolean;
  colorPalette?: 'navy' | 'gold' | 'primary' | 'secondary';
}

// Size configuration (with proper touch targets)
const sizeConfig = {
  sm: {
    checkboxSize: 16,
    fontSize: '0.875rem', // 14px
    minHeight: 44,
  },
  md: {
    checkboxSize: 20,
    fontSize: '1rem', // 16px
    minHeight: 44,
  },
  lg: {
    checkboxSize: 24,
    fontSize: '1.125rem', // 18px
    minHeight: 48,
  },
};

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ 
    children, 
    size = 'md', 
    colorPalette = 'navy', 
    isInvalid = false, 
    isDisabled = false,
    isRequired = false,
    className = '',
    ...props 
  }, ref) => {
    const config = sizeConfig[size];
    const colorValue = colorPalette === 'gold' ? '#D4AF37' : '#161C4F';
    const colorValueHover = colorPalette === 'gold' ? '#B8941F' : '#0F1333';

    return (
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          minHeight: `${config.minHeight}px`,
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          fontFamily: 'Roboto, sans-serif',
          fontSize: config.fontSize,
          color: isDisabled ? '#718096' : '#2D3748',
          opacity: isDisabled ? 0.6 : 1,
        }}
        className={className}
      >
        <input
          ref={ref}
          type="checkbox"
          disabled={isDisabled}
          required={isRequired}
          style={{
            width: `${config.checkboxSize}px`,
            height: `${config.checkboxSize}px`,
            border: `2px solid ${isInvalid ? '#DC2626' : '#D1D5DB'}`,
            borderRadius: '2px',
            outline: 'none',
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            transition: 'all 150ms cubic-bezier(0, 0, 0.2, 1)',
            accentColor: colorValue,
            marginRight: children ? '8px' : '0',
          }}
          {...props}
        />
        {children && <span>{children}</span>}
        <style jsx>{`
          input[type="checkbox"]:hover:not(:disabled) {
            border-color: ${colorValue};
          }
          input[type="checkbox"]:focus {
            box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.3);
          }
          input[type="checkbox"]:checked {
            background-color: ${colorValue};
            border-color: ${colorValue};
          }
          input[type="checkbox"]:checked:hover:not(:disabled) {
            background-color: ${colorValueHover};
            border-color: ${colorValueHover};
          }
        `}</style>
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;
