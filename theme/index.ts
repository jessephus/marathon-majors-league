/**
 * Chakra UI v3 Theme Configuration - Marathon Majors Fantasy League
 * 
 * Main theme file that combines all design tokens for Chakra UI v3:
 * - Colors (navy/gold palette + semantics)
 * - Typography (Inter/Roboto fonts)
 * - Spacing (4px base unit)
 * - Shadows (elevation system)
 * - Transitions (animation durations)
 * - Z-index (layering system)
 * - Breakpoints (mobile-first)
 * - Recipes (component color palette support)
 * 
 * This theme implements the design system specified in:
 * docs/CORE_DESIGN_GUIDELINES.md
 * 
 * Note: Chakra UI v3 uses the `colorPalette` prop system.
 * Components automatically apply colorPalette.500, colorPalette.600, etc.
 * 
 * @version 2.1.0 (Phase 2 Complete + Proper Color Palettes)
 * @date November 22, 2025
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
      // Spacing Scale (4px base unit)
      // Note: Values follow Chakra UI defaults with selective additions
      // to maintain consistency with the ecosystem. Intermediate values
      // (7, 9, 11, 14, 18) are intentionally omitted to enforce the 4px
      // grid system. Use responsive props or combinations for edge cases.
      spacing: {
        px: { value: '1px' },          // Hairline
        0: { value: '0' },             // No space
        0.5: { value: '0.125rem' },    // 2px - Micro adjustments
        1: { value: '0.25rem' },       // 4px - Tiny gap
        2: { value: '0.5rem' },        // 8px - Compact spacing
        3: { value: '0.75rem' },       // 12px - Small spacing
        4: { value: '1rem' },          // 16px - Base unit (DEFAULT)
        5: { value: '1.25rem' },       // 20px - Medium spacing
        6: { value: '1.5rem' },        // 24px - Large spacing
        8: { value: '2rem' },          // 32px - Extra large
        10: { value: '2.5rem' },       // 40px - Section spacing
        12: { value: '3rem' },         // 48px - Major sections
        16: { value: '4rem' },         // 64px - Hero spacing
        20: { value: '5rem' },         // 80px - Extra large sections
        24: { value: '6rem' },         // 96px - Maximum spacing
      },
      // Shadow System (Elevation)
      shadows: {
        xs: { value: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' },                    // Subtle
        sm: { value: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)' },
        md: { value: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)' },
        lg: { value: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)' },
        xl: { value: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' },
        '2xl': { value: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' },
        inner: { value: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)' },
        none: { value: 'none' },
      },
      // Transition Durations
      durations: {
        ultra: { value: '75ms' },      // Instant feedback (hover colors)
        faster: { value: '100ms' },    // Quick (button press)
        fast: { value: '150ms' },      // Standard (hover effects)
        normal: { value: '250ms' },    // Comfortable (modal open) - DEFAULT
        slow: { value: '350ms' },      // Deliberate (page transition)
        slower: { value: '500ms' },    // Dramatic (rarely used)
      },
      // Easing Functions
      easings: {
        easeIn: { value: 'cubic-bezier(0.4, 0, 1, 1)' },       // Accelerate
        easeOut: { value: 'cubic-bezier(0, 0, 0.2, 1)' },      // Decelerate (DEFAULT)
        easeInOut: { value: 'cubic-bezier(0.4, 0, 0.2, 1)' },  // Smooth (organic)
        sharp: { value: 'cubic-bezier(0.4, 0, 0.6, 1)' },      // Snappy
      },
      // Z-Index Scale (Layering)
      zIndex: {
        hide: { value: -1 },           // Hidden elements
        auto: { value: 'auto' },       // Natural stacking
        base: { value: 0 },            // Base layer
        docked: { value: 10 },         // Sticky elements (header)
        dropdown: { value: 1000 },     // Dropdown menus
        sticky: { value: 1100 },       // Sticky positioning
        banner: { value: 1200 },       // Fixed banners
        overlay: { value: 1300 },      // Overlay backgrounds
        modal: { value: 1400 },        // Modal dialogs
        popover: { value: 1500 },      // Popovers
        skipLink: { value: 1600 },     // Skip navigation links
        toast: { value: 1700 },        // Toast notifications
        tooltip: { value: 1800 },      // Tooltips (highest)
      },
      // Container Sizes (Max-width)
      sizes: {
        container: {
          sm: { value: '640px' },      // Mobile landscape
          md: { value: '768px' },      // Tablet
          lg: { value: '1024px' },     // Desktop
          xl: { value: '1280px' },     // Large desktop (DEFAULT for MMFL)
          '2xl': { value: '1536px' },  // Extra large
        },
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
