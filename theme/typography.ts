/**
 * Typography System - Marathon Majors Fantasy League
 * 
 * Configures fonts, type scale, weights, line heights, and letter spacing.
 * 
 * NOTE: This file serves as reference documentation for Chakra UI v3.
 * The actual typography tokens are defined inline in theme/index.ts
 * using the Chakra v3 token format. This file is kept for:
 * 1. Documentation of typography decisions
 * 2. Reference for font guidelines
 * 3. Future potential use if Chakra v3 API changes
 * 
 * Reference: docs/CORE_DESIGN_GUIDELINES.md
 */

export const fonts = {
  // Heading Font: Inter - Modern, geometric, authoritative
  heading: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
  
  // Body Font: Roboto - Clean, readable, screen-optimized
  body: `'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
  
  // Monospace Font: For code, technical data, timestamps
  mono: `'Roboto Mono', Menlo, Monaco, 'Courier New', monospace`,
};

export const fontSizes = {
  xs: '0.75rem',    // 12px - Captions, fine print
  sm: '0.875rem',   // 14px - Secondary text, labels
  md: '1rem',       // 16px - Base body text (DEFAULT)
  lg: '1.125rem',   // 18px - Large body, emphasized text
  xl: '1.25rem',    // 20px - Small headings, subheadings
  '2xl': '1.5rem',  // 24px - Section headings (H3)
  '3xl': '1.875rem',// 30px - Page titles (H2)
  '4xl': '2.25rem', // 36px - Hero headings (H1)
  '5xl': '3rem',    // 48px - Display text (rare, desktop only)
};

export const fontWeights = {
  normal: 400,      // Body text
  medium: 500,      // Emphasized body text
  semibold: 600,    // Button text, labels
  bold: 700,        // Headings, strong emphasis
  extrabold: 800,   // Hero headings (use sparingly)
};

export const lineHeights = {
  none: 1,          // Avoid (causes overlap)
  tight: 1.25,      // Large headings (H1, H2)
  snug: 1.375,      // Small headings (H3, H4)
  normal: 1.5,      // Body text (DEFAULT)
  relaxed: 1.625,   // Long-form content
  loose: 1.75,      // Very relaxed (rare)
};

export const letterSpacings = {
  tighter: '-0.05em',  // Tight headings
  tight: '-0.025em',   // Large headings
  normal: '0',         // Body text (DEFAULT)
  wide: '0.025em',     // Buttons, all-caps labels
  wider: '0.05em',     // Overline text, eyebrows
  widest: '0.1em',     // Extreme emphasis (rare)
};

/**
 * Usage Guidelines:
 * 
 * Font Weights:
 * - 400: All body text by default
 * - 500: Subtle emphasis within paragraphs
 * - 600: Buttons, form labels, data labels
 * - 700: H1, H2, H3 headings
 * - 800: Hero text only (rare)
 * 
 * Line Heights:
 * - H1 (48px): lineHeight="tight" (60px)
 * - H2 (36px): lineHeight="tight" (45px)
 * - H3 (24px): lineHeight="snug" (33px)
 * - Body (16px): lineHeight="normal" (24px)
 * - Small (14px): lineHeight="normal" (21px)
 * 
 * Letter Spacing:
 * - Headings (48px+): letterSpacing="tight"
 * - Body text: letterSpacing="normal"
 * - Buttons: letterSpacing="wide"
 * - All-caps labels: letterSpacing="wider"
 */
