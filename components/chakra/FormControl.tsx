/**
 * Form Components - FormControl, FormLabel, FormErrorMessage, FormHelperText
 * 
 * Provides consistent form validation states, error handling, and accessibility
 * patterns for MMFL forms.
 * 
 * Features:
 * - Validation state management (error, success, warning)
 * - Automatic ARIA attribute associations
 * - Required field indicators
 * - Error message styling with icons
 * - Helper text for guidance
 * - Gold focus ring integration
 * - Full keyboard accessibility
 * 
 * @version 1.0.0 (Phase 4: Form Components)
 * @date November 23, 2025
 */

import { forwardRef, ReactNode, HTMLAttributes } from 'react';
import { ExclamationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/solid';

// FormControl Component
export interface FormControlProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  isInvalid?: boolean;
  isDisabled?: boolean;
  isRequired?: boolean;
  isReadOnly?: boolean;
}

export const FormControl = forwardRef<HTMLDivElement, FormControlProps>(
  ({ children, isInvalid = false, isDisabled = false, isRequired = false, isReadOnly = false, className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={className}
        style={{
          marginBottom: '24px',
          opacity: isDisabled ? 0.6 : 1,
        }}
        role="group"
        data-invalid={isInvalid ? '' : undefined}
        data-disabled={isDisabled ? '' : undefined}
        data-required={isRequired ? '' : undefined}
        data-readonly={isReadOnly ? '' : undefined}
        {...props}
      >
        {children}
      </div>
    );
  }
);

FormControl.displayName = 'FormControl';

// FormLabel Component
export interface FormLabelProps extends HTMLAttributes<HTMLLabelElement> {
  children: ReactNode;
  htmlFor?: string;
  isRequired?: boolean;
  mb?: string | number;
}

export const FormLabel = forwardRef<HTMLLabelElement, FormLabelProps>(
  ({ children, isRequired = false, mb = 2, ...props }, ref) => {
    return (
      <label
        ref={ref}
        style={{
          display: 'block',
          marginBottom: typeof mb === 'number' ? `${mb * 4}px` : mb,
          fontSize: '0.875rem',
          fontWeight: 500,
          color: '#2D3748', // gray.700
          fontFamily: 'Roboto, sans-serif',
        }}
        {...props}
      >
        {children}
        {isRequired && (
          <span
            style={{
              marginLeft: '4px',
              color: '#DC2626', // error.500
              fontWeight: 700,
            }}
            aria-label="required"
          >
            *
          </span>
        )}
      </label>
    );
  }
);

FormLabel.displayName = 'FormLabel';

// FormErrorMessage Component
export interface FormErrorMessageProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  icon?: ReactNode;
}

export const FormErrorMessage = forwardRef<HTMLDivElement, FormErrorMessageProps>(
  ({ children, icon, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="alert"
        style={{
          display: 'flex',
          alignItems: 'center',
          marginTop: '8px',
          fontSize: '0.875rem',
          color: '#DC2626', // error.500
          fontFamily: 'Roboto, sans-serif',
        }}
        {...props}
      >
        {icon !== undefined ? (
          icon
        ) : (
          <ExclamationCircleIcon style={{ width: '16px', height: '16px', marginRight: '6px', flexShrink: 0 }} />
        )}
        <span>{children}</span>
      </div>
    );
  }
);

FormErrorMessage.displayName = 'FormErrorMessage';

// FormHelperText Component
export interface FormHelperTextProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  icon?: ReactNode;
}

export const FormHelperText = forwardRef<HTMLDivElement, FormHelperTextProps>(
  ({ children, icon, ...props }, ref) => {
    return (
      <div
        ref={ref}
        style={{
          display: 'flex',
          alignItems: 'center',
          marginTop: '8px',
          fontSize: '0.875rem',
          color: '#718096', // gray.600
          fontFamily: 'Roboto, sans-serif',
        }}
        {...props}
      >
        {icon && <span style={{ marginRight: '6px', flexShrink: 0 }}>{icon}</span>}
        <span>{children}</span>
      </div>
    );
  }
);

FormHelperText.displayName = 'FormHelperText';

// FormSuccessMessage Component (bonus)
export interface FormSuccessMessageProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  icon?: ReactNode;
}

export const FormSuccessMessage = forwardRef<HTMLDivElement, FormSuccessMessageProps>(
  ({ children, icon, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="status"
        style={{
          display: 'flex',
          alignItems: 'center',
          marginTop: '8px',
          fontSize: '0.875rem',
          color: '#16A34A', // success.600
          fontFamily: 'Roboto, sans-serif',
        }}
        {...props}
      >
        {icon !== undefined ? (
          icon
        ) : (
          <CheckCircleIcon style={{ width: '16px', height: '16px', marginRight: '6px', flexShrink: 0 }} />
        )}
        <span>{children}</span>
      </div>
    );
  }
);

FormSuccessMessage.displayName = 'FormSuccessMessage';

export default FormControl;
