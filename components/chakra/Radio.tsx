/**
 * Custom Radio Component with Semantic Color Support
 * 
 * Provides consistent radio button styling with the MMFL design system.
 * Uses native HTML radio with custom styling for maximum compatibility.
 * 
 * Features:
 * - 3 sizes (sm: 16px, md: 20px, lg: 24px)
 * - Custom colors (navy and gold theme)
 * - Validation states (default, error)
 * - Accessible by default (WCAG 2.1 AA compliant)
 * - Full keyboard support (Arrow keys, Space to select)
 * - Touch target minimum 44px for mobile
 * 
 * @version 1.0.0 (Phase 4: Form Components)
 * @date November 23, 2025
 */

import { forwardRef, ReactNode, InputHTMLAttributes, HTMLAttributes } from 'react';

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {
  children?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  isInvalid?: boolean;
  isDisabled?: boolean;
  colorPalette?: 'navy' | 'gold' | 'primary' | 'secondary';
}

// Size configuration (with proper touch targets)
const sizeConfig = {
  sm: {
    radioSize: 16,
    fontSize: '0.875rem', // 14px
    minHeight: 44,
  },
  md: {
    radioSize: 20,
    fontSize: '1rem', // 16px
    minHeight: 44,
  },
  lg: {
    radioSize: 24,
    fontSize: '1.125rem', // 18px
    minHeight: 48,
  },
};

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ 
    children, 
    size = 'md', 
    colorPalette = 'navy', 
    isInvalid = false, 
    isDisabled = false,
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
          type="radio"
          disabled={isDisabled}
          style={{
            width: `${config.radioSize}px`,
            height: `${config.radioSize}px`,
            border: `2px solid ${isInvalid ? '#DC2626' : '#D1D5DB'}`,
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
          input[type="radio"]:hover:not(:disabled) {
            border-color: ${colorValue};
          }
          input[type="radio"]:focus {
            box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.3);
          }
          input[type="radio"]:checked {
            border-color: ${colorValue};
          }
          input[type="radio"]:checked:hover:not(:disabled) {
            border-color: ${colorValueHover};
          }
        `}</style>
      </label>
    );
  }
);

Radio.displayName = 'Radio';

// Simple RadioGroup wrapper for semantic grouping
export interface RadioGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  children: ReactNode;
  name?: string;
  value?: string;
  onChange?: (value: string) => void;
  colorPalette?: 'navy' | 'gold' | 'primary' | 'secondary';
}

export const RadioGroup = ({ children, name, value, onChange, colorPalette, ...props }: RadioGroupProps) => {
  return <div role="radiogroup" {...props}>{children}</div>;
};

RadioGroup.displayName = 'RadioGroup';

export default Radio;
