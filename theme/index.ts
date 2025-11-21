/**
 * Chakra UI v3 Theme Configuration - Marathon Majors Fantasy League
 * 
 * Main theme file that combines all design tokens for Chakra UI v3:
 * - Colors (navy/gold palette + semantics)
 * - Typography (Inter/Roboto fonts)
 * - Spacing (4px base unit)
 * - Breakpoints (mobile-first)
 * - Component overrides
 * 
 * This theme implements the design system specified in:
 * docs/CORE_DESIGN_GUIDELINES.md
 * 
 * Note: Chakra UI v3 uses a different theming API than v2.
 * We use createSystem() to define the theme configuration.
 * 
 * @version 1.0.0
 * @date November 21, 2025
 */

import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';
import { colors } from './colors';

const config = defineConfig({
  theme: {
    tokens: {
      colors,
      fonts: {
        heading: { value: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` },
        body: { value: `'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` },
        mono: { value: `'Roboto Mono', Menlo, Monaco, 'Courier New', monospace` },
      },
      fontSizes: {
        xs: { value: '0.75rem' },    // 12px
        sm: { value: '0.875rem' },   // 14px
        md: { value: '1rem' },       // 16px
        lg: { value: '1.125rem' },   // 18px
        xl: { value: '1.25rem' },    // 20px
        '2xl': { value: '1.5rem' },  // 24px
        '3xl': { value: '1.875rem' },// 30px
        '4xl': { value: '2.25rem' }, // 36px
        '5xl': { value: '3rem' },    // 48px
      },
      fontWeights: {
        normal: { value: 400 },
        medium: { value: 500 },
        semibold: { value: 600 },
        bold: { value: 700 },
        extrabold: { value: 800 },
      },
      lineHeights: {
        none: { value: 1 },
        tight: { value: 1.25 },
        snug: { value: 1.375 },
        normal: { value: 1.5 },
        relaxed: { value: 1.625 },
        loose: { value: 1.75 },
      },
      letterSpacings: {
        tighter: { value: '-0.05em' },
        tight: { value: '-0.025em' },
        normal: { value: '0' },
        wide: { value: '0.025em' },
        wider: { value: '0.05em' },
        widest: { value: '0.1em' },
      },
      radii: {
        none: { value: '0' },
        sm: { value: '0.125rem' },
        base: { value: '0.25rem' },
        md: { value: '0.375rem' },
        lg: { value: '0.5rem' },
        xl: { value: '0.75rem' },
        '2xl': { value: '1rem' },
        '3xl': { value: '1.5rem' },
        full: { value: '9999px' },
      },
    },
    breakpoints: {
      sm: '480px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
  },
});

export const system = createSystem(defaultConfig, config);
export default system;
