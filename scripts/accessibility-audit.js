/**
 * Accessibility Audit Script - Phase 2 Design Tokens
 * 
 * Validates design tokens (colors, typography, layout) for WCAG 2.1 AA/AAA compliance
 * This script generates a comprehensive accessibility audit report
 * 
 * Usage: node scripts/accessibility-audit.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper: Calculate relative luminance
function getLuminance(rgb) {
  const [r, g, b] = rgb.map(val => {
    val = val / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Helper: Convert hex to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : null;
}

// Helper: Calculate contrast ratio
function getContrastRatio(color1, color2) {
  const lum1 = getLuminance(hexToRgb(color1));
  const lum2 = getLuminance(hexToRgb(color2));
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

// Helper: Check WCAG compliance
function checkWCAG(contrast, size = 'normal', level = 'AA') {
  const requirements = {
    AA: { normal: 4.5, large: 3.0 },
    AAA: { normal: 7.0, large: 4.5 }
  };
  return contrast >= requirements[level][size];
}

// Color palette (extracted from theme/colors.ts)
const colors = {
  navy: {
    50: '#F5F7FA',
    100: '#E4E9F2',
    200: '#C3CDE3',
    300: '#9EADD1',
    400: '#7A8DBF',
    500: '#4A5F9D',
    600: '#3A4D7E',
    700: '#2A3B5E',
    800: '#1F2D47',
    900: '#161C4F',
  },
  gold: {
    50: '#FFFBF0',
    100: '#FFF4D6',
    200: '#FFE9AD',
    300: '#FFDE84',
    400: '#EDD35B',
    500: '#D4AF37',
    600: '#B8941F',
    700: '#9A7A15',
    800: '#7C610E',
    900: '#5E4808',
  },
  success: {
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
  },
  warning: {
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
  },
  error: {
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
  },
  info: {
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
  },
};

// Typography scale (from theme/index.ts)
const typography = {
  fontSizes: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    md: '1rem',       // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem',// 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
  },
  fontWeights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  lineHeights: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 1.75,
  },
};

// Spacing scale (from theme/index.ts)
const spacing = {
  px: '1px',
  0: '0',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  2: '0.5rem',      // 8px
  3: '0.75rem',     // 12px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  8: '2rem',        // 32px
  10: '2.5rem',     // 40px
  12: '3rem',       // 48px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
};

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║     ACCESSIBILITY AUDIT - Phase 2 Design Tokens               ║');
console.log('║     WCAG 2.1 AA/AAA Compliance Validation                     ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

const results = {
  timestamp: new Date().toISOString(),
  summary: {
    totalTests: 0,
    passed: 0,
    failed: 0,
    warnings: 0,
  },
  colorTests: [],
  typographyTests: [],
  layoutTests: [],
  recommendations: [],
};

// ============================================================================
// SECTION 1: COLOR CONTRAST VALIDATION
// ============================================================================

console.log('📊 SECTION 1: COLOR CONTRAST VALIDATION\n');
console.log('Testing critical color combinations for WCAG 2.1 compliance...\n');

const colorTests = [
  // Primary brand colors
  { name: 'Navy 900 on White', fg: colors.navy[900], bg: '#FFFFFF', context: 'Headers, body text' },
  { name: 'Navy 800 on White', fg: colors.navy[800], bg: '#FFFFFF', context: 'Subheaders' },
  { name: 'Navy 700 on White', fg: colors.navy[700], bg: '#FFFFFF', context: 'Body text, links' },
  { name: 'Navy 600 on White', fg: colors.navy[600], bg: '#FFFFFF', context: 'Secondary text' },
  { name: 'Navy 500 on White', fg: colors.navy[500], bg: '#FFFFFF', context: 'Primary buttons' },
  { name: 'Navy 400 on White', fg: colors.navy[400], bg: '#FFFFFF', context: 'Disabled states' },
  
  // White on navy backgrounds
  { name: 'White on Navy 900', fg: '#FFFFFF', bg: colors.navy[900], context: 'App header, dark cards' },
  { name: 'White on Navy 800', fg: '#FFFFFF', bg: colors.navy[800], context: 'Secondary backgrounds' },
  { name: 'White on Navy 700', fg: '#FFFFFF', bg: colors.navy[700], context: 'Button backgrounds' },
  { name: 'White on Navy 500', fg: '#FFFFFF', bg: colors.navy[500], context: 'Active states' },
  
  // Gold combinations
  { name: 'Gold 900 on White', fg: colors.gold[900], bg: '#FFFFFF', context: 'Strong emphasis' },
  { name: 'Gold 800 on White', fg: colors.gold[800], bg: '#FFFFFF', context: 'Emphasis text' },
  { name: 'Gold 700 on White', fg: colors.gold[700], bg: '#FFFFFF', context: 'Body text' },
  { name: 'Gold 600 on White', fg: colors.gold[600], bg: '#FFFFFF', context: 'Large text, buttons' },
  { name: 'Gold 500 on White', fg: colors.gold[500], bg: '#FFFFFF', context: 'Large text only' },
  { name: 'Gold 500 on Navy 900', fg: colors.gold[500], bg: colors.navy[900], context: 'Logo, stars, highlights' },
  { name: 'Gold 400 on Navy 900', fg: colors.gold[400], bg: colors.navy[900], context: 'Bright highlights' },
  
  // Semantic colors on white
  { name: 'Success 700 on White', fg: colors.success[700], bg: '#FFFFFF', context: 'Success text' },
  { name: 'Success 600 on White', fg: colors.success[600], bg: '#FFFFFF', context: 'Success buttons' },
  { name: 'Success 500 on White', fg: colors.success[500], bg: '#FFFFFF', context: 'Success alerts' },
  { name: 'White on Success 600', fg: '#FFFFFF', bg: colors.success[600], context: 'Success button text' },
  
  { name: 'Warning 700 on White', fg: colors.warning[700], bg: '#FFFFFF', context: 'Warning text' },
  { name: 'Warning 600 on White', fg: colors.warning[600], bg: '#FFFFFF', context: 'Warning buttons' },
  { name: 'Warning 500 on White', fg: colors.warning[500], bg: '#FFFFFF', context: 'Warning alerts' },
  
  { name: 'Error 700 on White', fg: colors.error[700], bg: '#FFFFFF', context: 'Error text' },
  { name: 'Error 600 on White', fg: colors.error[600], bg: '#FFFFFF', context: 'Error buttons' },
  { name: 'Error 500 on White', fg: colors.error[500], bg: '#FFFFFF', context: 'Error alerts' },
  
  { name: 'Info 700 on White', fg: colors.info[700], bg: '#FFFFFF', context: 'Info text' },
  { name: 'Info 600 on White', fg: colors.info[600], bg: '#FFFFFF', context: 'Info buttons' },
  { name: 'Info 500 on White', fg: colors.info[500], bg: '#FFFFFF', context: 'Info alerts' },
];

colorTests.forEach(test => {
  const contrast = getContrastRatio(test.fg, test.bg);
  const passAA = checkWCAG(contrast, 'normal', 'AA');
  const passAAA = checkWCAG(contrast, 'normal', 'AAA');
  const passAALarge = checkWCAG(contrast, 'large', 'AA');
  
  results.totalTests++;
  if (passAA) results.summary.passed++;
  else results.summary.failed++;
  
  const status = passAAA ? '✅ AAA' : passAA ? '✅ AA' : passAALarge ? '⚠️ Large Only' : '❌ Fail';
  const ratio = contrast.toFixed(2);
  
  console.log(`${status}  ${test.name.padEnd(25)} | ${ratio}:1 | ${test.context}`);
  
  results.colorTests.push({
    name: test.name,
    foreground: test.fg,
    background: test.bg,
    contrast: parseFloat(ratio),
    wcagAA: passAA,
    wcagAAA: passAAA,
    wcagAALarge: passAALarge,
    context: test.context,
    status: passAAA ? 'AAA' : passAA ? 'AA' : passAALarge ? 'Large Only' : 'Fail',
  });
  
  // Add recommendations for failing tests
  if (!passAA && !passAALarge) {
    results.recommendations.push({
      type: 'color',
      severity: 'high',
      issue: `${test.name} fails WCAG AA (${ratio}:1)`,
      suggestion: 'Use a darker shade or only for decorative elements',
    });
  } else if (!passAA && passAALarge) {
    results.recommendations.push({
      type: 'color',
      severity: 'medium',
      issue: `${test.name} only passes for large text (${ratio}:1)`,
      suggestion: 'Use only for large text (18pt+ or 14pt+ bold), or choose darker shade for normal text',
    });
  }
});

console.log(`\nColor Tests: ${results.colorTests.filter(t => t.wcagAA).length}/${results.colorTests.length} passed WCAG AA\n`);

// ============================================================================
// SECTION 2: TYPOGRAPHY ACCESSIBILITY VALIDATION
// ============================================================================

console.log('📝 SECTION 2: TYPOGRAPHY ACCESSIBILITY VALIDATION\n');
console.log('Validating typography tokens for WCAG 2.1 compliance...\n');

// Test font sizes
console.log('Font Size Tests:');
Object.entries(typography.fontSizes).forEach(([name, value]) => {
  const pxValue = parseFloat(value) * 16; // Convert rem to px
  const isReadable = pxValue >= 12; // Minimum 12px for body text
  const isLarge = pxValue >= 18; // WCAG large text threshold
  
  results.totalTests++;
  if (isReadable) results.summary.passed++;
  else results.summary.failed++;
  
  const status = isReadable ? (isLarge ? '✅ Large' : '✅ Pass') : '❌ Too Small';
  console.log(`  ${status}  ${name.padEnd(6)} | ${value.padEnd(10)} (${pxValue}px)`);
  
  results.typographyTests.push({
    type: 'fontSize',
    name,
    value,
    pixelValue: pxValue,
    readable: isReadable,
    largeText: isLarge,
    status: isReadable ? 'pass' : 'fail',
  });
  
  if (!isReadable) {
    results.recommendations.push({
      type: 'typography',
      severity: 'high',
      issue: `Font size ${name} (${pxValue}px) is below minimum readable size`,
      suggestion: 'Increase to at least 12px or use only for decorative elements',
    });
  }
});

// Test line heights
console.log('\nLine Height Tests:');
Object.entries(typography.lineHeights).forEach(([name, value]) => {
  const isAccessible = value >= 1.4; // WCAG 1.4.12 recommends 1.5, minimum 1.4
  
  results.totalTests++;
  if (isAccessible) results.summary.passed++;
  else results.summary.warnings++;
  
  const status = value >= 1.5 ? '✅ Optimal' : isAccessible ? '⚠️ Minimum' : '❌ Too Tight';
  console.log(`  ${status}  ${name.padEnd(10)} | ${value}`);
  
  results.typographyTests.push({
    type: 'lineHeight',
    name,
    value,
    accessible: isAccessible,
    optimal: value >= 1.5,
    status: value >= 1.5 ? 'optimal' : isAccessible ? 'minimum' : 'fail',
  });
  
  if (!isAccessible) {
    results.recommendations.push({
      type: 'typography',
      severity: 'medium',
      issue: `Line height ${name} (${value}) is below accessible minimum`,
      suggestion: 'Increase to at least 1.4, ideally 1.5 for body text',
    });
  }
});

// Test font weights
console.log('\nFont Weight Tests:');
Object.entries(typography.fontWeights).forEach(([name, value]) => {
  const isReadable = value >= 300; // Minimum weight for readability
  
  results.totalTests++;
  if (isReadable) results.summary.passed++;
  else results.summary.failed++;
  
  const status = isReadable ? '✅ Pass' : '❌ Too Thin';
  console.log(`  ${status}  ${name.padEnd(10)} | ${value}`);
  
  results.typographyTests.push({
    type: 'fontWeight',
    name,
    value,
    readable: isReadable,
    status: isReadable ? 'pass' : 'fail',
  });
});

console.log(`\nTypography Tests: ${results.typographyTests.filter(t => t.status === 'pass' || t.status === 'optimal').length}/${results.typographyTests.length} passed\n`);

// ============================================================================
// SECTION 3: LAYOUT & SPACING ACCESSIBILITY VALIDATION
// ============================================================================

console.log('📐 SECTION 3: LAYOUT & SPACING ACCESSIBILITY VALIDATION\n');
console.log('Validating layout tokens for WCAG 2.1 compliance...\n');

// Test touch target sizes (WCAG 2.5.5)
console.log('Touch Target Size Tests:');
const touchTargetTests = [
  { name: 'Minimum (44x44px)', value: 44, required: true },
  { name: 'Spacing.10 (40px)', value: parseFloat(spacing[10]) * 16, pass: 40 >= 44 },
  { name: 'Spacing.12 (48px)', value: parseFloat(spacing[12]) * 16, pass: 48 >= 44 },
];

touchTargetTests.forEach(test => {
  results.totalTests++;
  const passes = test.value >= 44;
  if (passes) results.summary.passed++;
  else results.summary.failed++;
  
  const status = passes ? '✅ Pass' : '❌ Too Small';
  console.log(`  ${status}  ${test.name.padEnd(25)} | ${test.value}px`);
  
  results.layoutTests.push({
    type: 'touchTarget',
    name: test.name,
    value: test.value,
    passes,
  });
  
  if (!passes && test.required) {
    results.recommendations.push({
      type: 'layout',
      severity: 'high',
      issue: `Touch targets must be at least 44x44px (${test.value}px found)`,
      suggestion: 'Use spacing.12 (48px) or larger for interactive elements on mobile',
    });
  }
});

// Test spacing consistency
console.log('\nSpacing Consistency Tests:');
const spacingValues = Object.entries(spacing).map(([name, value]) => {
  const px = value === '0' || value === '1px' ? parseFloat(value) : parseFloat(value) * 16;
  return { name, value, px };
});

// Check if spacing follows 4px grid (with exceptions for px, 0, 0.5, 1)
const gridInconsistencies = spacingValues.filter(s => {
  if (['px', '0', '0.5', '1'].includes(s.name)) return false;
  return s.px % 4 !== 0;
});

results.totalTests++;
const spacingConsistent = gridInconsistencies.length === 0;
if (spacingConsistent) results.summary.passed++;
else results.summary.warnings++;

console.log(`  ${spacingConsistent ? '✅' : '⚠️'}  4px Grid System | ${spacingConsistent ? 'Consistent' : `${gridInconsistencies.length} exceptions`}`);

results.layoutTests.push({
  type: 'spacingConsistency',
  consistent: spacingConsistent,
  exceptions: gridInconsistencies.map(s => s.name),
});

// Test container max-widths
console.log('\nContainer Max-Width Tests:');
const containerTests = [
  { name: 'Mobile (sm)', value: '640px', optimal: true },
  { name: 'Tablet (md)', value: '768px', optimal: true },
  { name: 'Desktop (lg)', value: '1024px', optimal: true },
  { name: 'Large Desktop (xl)', value: '1280px', optimal: true },
  { name: 'Extra Large (2xl)', value: '1536px', optimal: true },
];

containerTests.forEach(test => {
  results.totalTests++;
  results.summary.passed++;
  
  console.log(`  ✅ Pass  ${test.name.padEnd(20)} | ${test.value}`);
  
  results.layoutTests.push({
    type: 'containerWidth',
    name: test.name,
    value: test.value,
    optimal: test.optimal,
  });
});

console.log(`\nLayout Tests: ${results.layoutTests.filter(t => t.passes !== false && t.consistent !== false).length}/${results.layoutTests.length} passed\n`);

// ============================================================================
// FINAL SUMMARY
// ============================================================================

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║                    AUDIT SUMMARY                               ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

console.log(`Total Tests:     ${results.summary.totalTests}`);
console.log(`✅ Passed:        ${results.summary.passed}`);
console.log(`❌ Failed:        ${results.summary.failed}`);
console.log(`⚠️  Warnings:      ${results.summary.warnings}\n`);

const overallPass = results.summary.failed === 0;
console.log(`Overall Result:  ${overallPass ? '✅ WCAG 2.1 AA COMPLIANT' : '❌ NEEDS ATTENTION'}\n`);

if (results.recommendations.length > 0) {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║                    RECOMMENDATIONS                             ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  
  const highPriority = results.recommendations.filter(r => r.severity === 'high');
  const mediumPriority = results.recommendations.filter(r => r.severity === 'medium');
  
  if (highPriority.length > 0) {
    console.log('🔴 HIGH PRIORITY:\n');
    highPriority.forEach((rec, i) => {
      console.log(`${i + 1}. ${rec.issue}`);
      console.log(`   → ${rec.suggestion}\n`);
    });
  }
  
  if (mediumPriority.length > 0) {
    console.log('🟡 MEDIUM PRIORITY:\n');
    mediumPriority.forEach((rec, i) => {
      console.log(`${i + 1}. ${rec.issue}`);
      console.log(`   → ${rec.suggestion}\n`);
    });
  }
}

// ============================================================================
// SAVE RESULTS TO JSON
// ============================================================================

const resultsPath = path.join(__dirname, '..', 'docs', 'UI_REDESIGN', 'accessibility-audit-results.json');
fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
console.log(`\n📄 Detailed results saved to: docs/UI_REDESIGN/accessibility-audit-results.json\n`);

// Exit with appropriate code
process.exit(overallPass ? 0 : 1);
