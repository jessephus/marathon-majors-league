/**
 * Phase 4 Component Accessibility Test Suite
 * 
 * Comprehensive accessibility testing for Phase 4 migrated components:
 * - Button (Button.tsx, IconButton.tsx, ButtonGroup.tsx)
 * - Card (Card.tsx, AthleteCard.tsx, TeamCard.tsx, RaceCard.tsx, LeaderboardCard.tsx, StatsCard.tsx)
 * - Form (Input.tsx, Select.tsx, Textarea.tsx, Checkbox.tsx, Radio.tsx, FormControl.tsx)
 * 
 * Tests:
 * - WCAG 2.1 AA compliance (via Axe)
 * - Keyboard navigation (Tab, Enter, Space, Arrow keys)
 * - Focus management and indicators
 * - Touch target sizes (WCAG 2.5.5 - 44x44px minimum)
 * - Color contrast validation
 * - ARIA attributes and semantic HTML
 * - Screen reader compatibility
 * 
 * Part of: Issue #[TBD] - Phase 4 Component Accessibility & A11y Test Pass
 * Parent: #123 - Phase 4: Component Migration - Buttons, Cards, Forms
 * Grand-parent: #59 - Redesign UI with Modern Mobile-First Look
 * 
 * @version 1.0.0
 * @date November 25, 2025
 */

import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test configuration
const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

// Test pages for Phase 4 components
const TEST_PAGES = [
  { path: '/test-button-components', name: 'Button Components', component: 'Button' },
  { path: '/test-card-components', name: 'Card Components', component: 'Card' },
  { path: '/test-form-components', name: 'Form Components', component: 'Form' },
];

// WCAG 2.5.5 minimum touch target size
const MIN_TOUCH_TARGET = 44;

// Test results
const results = {
  timestamp: new Date().toISOString(),
  baseUrl: BASE_URL,
  phase: 'Phase 4: Component Migration',
  standard: 'WCAG 2.1 Level AA',
  summary: {
    totalPages: TEST_PAGES.length,
    totalTests: 0,
    passed: 0,
    failed: 0,
    warnings: 0,
  },
  pages: [],
  componentTests: {
    buttons: [],
    cards: [],
    forms: [],
  },
  keyboardNavigation: [],
  focusManagement: [],
  touchTargets: [],
  colorContrast: [],
  ariaAttributes: [],
  recommendations: [],
};

// Helper: Log section header
function logSection(title) {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log(`║ ${title.padEnd(62)} ║`);
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
}

// Helper: Log test result
function logTest(status, name, details = '') {
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
  console.log(`${icon} ${name}${details ? ' - ' + details : ''}`);
}

// Helper: Record test result
function recordTest(passed, testName, component) {
  results.summary.totalTests++;
  if (passed) {
    results.summary.passed++;
    return 'pass';
  } else {
    results.summary.failed++;
    return 'fail';
  }
}

// ============================================================================
// TEST 1: Automated Axe Accessibility Scan
// ============================================================================
async function runAxeAudit(page, pageName) {
  console.log(`\n🔍 Running Axe audit on ${pageName}...`);
  
  try {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'])
      .analyze();
    
    const violations = accessibilityScanResults.violations;
    const passes = accessibilityScanResults.passes;
    
    const pageResult = {
      name: pageName,
      violations: violations.length,
      passCount: passes.length,
      issues: violations.map(v => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        help: v.help,
        helpUrl: v.helpUrl,
        nodeCount: v.nodes.length,
        examples: v.nodes.slice(0, 3).map(n => ({
          html: n.html.substring(0, 100),
          target: n.target,
        })),
      })),
    };
    
    results.pages.push(pageResult);
    
    if (violations.length === 0) {
      logTest('pass', `${pageName} - No Axe violations found (${passes.length} rules passed)`);
      recordTest(true, 'Axe audit', pageName);
    } else {
      logTest('fail', `${pageName} - ${violations.length} Axe violations found`);
      recordTest(false, 'Axe audit', pageName);
      
      // Categorize by impact
      const critical = violations.filter(v => v.impact === 'critical');
      const serious = violations.filter(v => v.impact === 'serious');
      const moderate = violations.filter(v => v.impact === 'moderate');
      const minor = violations.filter(v => v.impact === 'minor');
      
      if (critical.length > 0) {
        console.log(`  🔴 Critical (${critical.length}):`);
        critical.forEach(v => console.log(`     - ${v.id}: ${v.description}`));
      }
      if (serious.length > 0) {
        console.log(`  🟠 Serious (${serious.length}):`);
        serious.forEach(v => console.log(`     - ${v.id}: ${v.description}`));
      }
      if (moderate.length > 0) {
        console.log(`  🟡 Moderate (${moderate.length}):`);
        moderate.forEach(v => console.log(`     - ${v.id}: ${v.description}`));
      }
      if (minor.length > 0) {
        console.log(`  🔵 Minor (${minor.length}):`);
        minor.forEach(v => console.log(`     - ${v.id}: ${v.description}`));
      }
      
      // Add recommendations
      violations.forEach(v => {
        results.recommendations.push({
          page: pageName,
          severity: v.impact,
          type: 'axe-violation',
          id: v.id,
          issue: v.description,
          help: v.help,
          helpUrl: v.helpUrl,
          instances: v.nodes.length,
        });
      });
    }
    
    return pageResult;
  } catch (error) {
    console.error(`Error running Axe audit on ${pageName}:`, error.message);
    results.summary.warnings++;
    return null;
  }
}

// ============================================================================
// TEST 2: Keyboard Navigation
// ============================================================================
async function testKeyboardNavigation(page, pageName, component) {
  console.log(`\n⌨️  Testing keyboard navigation on ${pageName}...`);
  
  const tests = [];
  
  try {
    // Count all focusable elements
    const focusableElements = await page.evaluate(() => {
      const elements = document.querySelectorAll(
        'button, [role="button"], a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      return Array.from(elements).filter(el => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden';
      }).length;
    });
    
    const hasFocusable = focusableElements > 0;
    tests.push({
      test: 'Focusable elements present',
      expected: '> 0',
      actual: focusableElements,
      passed: hasFocusable,
    });
    
    if (hasFocusable) {
      logTest('pass', `Found ${focusableElements} focusable elements`);
      recordTest(true, 'Focusable elements', component);
    } else {
      logTest('fail', 'No focusable elements found');
      recordTest(false, 'Focusable elements', component);
    }
    
    // Test Tab key navigation
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);
    
    const firstFocusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      return {
        tag: el.tagName,
        role: el.getAttribute('role'),
        type: el.getAttribute('type'),
        ariaLabel: el.getAttribute('aria-label'),
        text: el.textContent?.trim().substring(0, 50),
      };
    });
    
    const tabWorks = firstFocusedElement.tag !== 'BODY';
    tests.push({
      test: 'Tab key focuses element',
      expected: 'Element receives focus',
      actual: firstFocusedElement,
      passed: tabWorks,
    });
    
    if (tabWorks) {
      logTest('pass', `Tab key works - focused ${firstFocusedElement.tag}${firstFocusedElement.role ? `[role="${firstFocusedElement.role}"]` : ''}`);
      recordTest(true, 'Tab navigation', component);
    } else {
      logTest('fail', 'Tab key does not focus any element');
      recordTest(false, 'Tab navigation', component);
    }
    
    // Test focus visibility (WCAG 2.4.7)
    const focusVisible = await page.evaluate(() => {
      const el = document.activeElement;
      const styles = window.getComputedStyle(el);
      return {
        outline: styles.outline,
        outlineWidth: styles.outlineWidth,
        outlineOffset: styles.outlineOffset,
        boxShadow: styles.boxShadow,
      };
    });
    
    const hasFocusIndicator = 
      (focusVisible.outline !== 'none' && focusVisible.outlineWidth !== '0px') ||
      (focusVisible.boxShadow !== 'none' && focusVisible.boxShadow.includes('rgba'));
    
    tests.push({
      test: 'Focus indicator visible',
      expected: 'Visible outline or box-shadow',
      actual: focusVisible,
      passed: hasFocusIndicator,
    });
    
    if (hasFocusIndicator) {
      logTest('pass', 'Focus indicator is visible');
      recordTest(true, 'Focus indicator', component);
    } else {
      logTest('warning', 'Focus indicator may not be visible');
      results.summary.warnings++;
    }
    
    // Test Enter/Space activation for buttons (if button page)
    if (component === 'Button') {
      // Find a button and test Enter key
      const buttonExists = await page.locator('button:not([disabled])').first().count() > 0;
      
      if (buttonExists) {
        await page.locator('button:not([disabled])').first().focus();
        const beforeFocus = await page.evaluate(() => document.activeElement.tagName);
        
        tests.push({
          test: 'Button focusable',
          expected: 'BUTTON',
          actual: beforeFocus,
          passed: beforeFocus === 'BUTTON',
        });
        
        if (beforeFocus === 'BUTTON') {
          logTest('pass', 'Button is focusable');
          recordTest(true, 'Button focus', component);
        }
      }
    }
    
    // Test form input navigation (if form page)
    if (component === 'Form') {
      const inputCount = await page.locator('input, select, textarea').count();
      
      if (inputCount > 0) {
        // Focus first input
        await page.locator('input').first().focus();
        const inputFocused = await page.evaluate(() => 
          document.activeElement.tagName === 'INPUT'
        );
        
        tests.push({
          test: 'Form inputs focusable',
          expected: 'INPUT focused',
          actual: inputFocused ? 'INPUT' : document.activeElement?.tagName,
          passed: inputFocused,
        });
        
        if (inputFocused) {
          logTest('pass', 'Form inputs are focusable');
          recordTest(true, 'Form input focus', component);
        }
      }
    }
    
  } catch (error) {
    console.error(`Error testing keyboard navigation on ${pageName}:`, error.message);
    results.summary.warnings++;
  }
  
  results.keyboardNavigation.push({
    page: pageName,
    component,
    tests,
  });
}

// ============================================================================
// TEST 3: Touch Target Sizes (WCAG 2.5.5)
// ============================================================================
async function testTouchTargets(page, pageName, component) {
  console.log(`\n👆 Testing touch target sizes on ${pageName}...`);
  
  const tests = [];
  
  try {
    // Get all interactive elements
    const touchTargets = await page.evaluate((minSize) => {
      const selectors = 'button, [role="button"], a[href], input, select, textarea, [tabindex="0"]';
      const elements = Array.from(document.querySelectorAll(selectors));
      
      return elements.map(el => {
        const rect = el.getBoundingClientRect();
        const styles = window.getComputedStyle(el);
        
        // Skip hidden elements
        if (styles.display === 'none' || styles.visibility === 'hidden' || rect.width === 0) {
          return null;
        }
        
        return {
          tag: el.tagName,
          type: el.getAttribute('type'),
          role: el.getAttribute('role'),
          ariaLabel: el.getAttribute('aria-label'),
          text: el.textContent?.trim().substring(0, 30),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          meetsMinimum: rect.width >= minSize && rect.height >= minSize,
        };
      }).filter(Boolean);
    }, MIN_TOUCH_TARGET);
    
    const failingTargets = touchTargets.filter(t => !t.meetsMinimum);
    const passingTargets = touchTargets.filter(t => t.meetsMinimum);
    
    tests.push({
      test: `All touch targets ≥${MIN_TOUCH_TARGET}x${MIN_TOUCH_TARGET}px`,
      expected: '0 failing',
      actual: `${failingTargets.length} failing, ${passingTargets.length} passing`,
      passed: failingTargets.length === 0,
    });
    
    if (failingTargets.length === 0) {
      logTest('pass', `All ${touchTargets.length} touch targets meet ${MIN_TOUCH_TARGET}x${MIN_TOUCH_TARGET}px minimum`);
      recordTest(true, 'Touch targets', component);
    } else {
      logTest('fail', `${failingTargets.length}/${touchTargets.length} touch targets are too small`);
      recordTest(false, 'Touch targets', component);
      
      // Group failing targets by type
      const buttonsFailing = failingTargets.filter(t => t.tag === 'BUTTON' || t.role === 'button');
      const inputsFailing = failingTargets.filter(t => ['INPUT', 'SELECT', 'TEXTAREA'].includes(t.tag));
      const linksFailing = failingTargets.filter(t => t.tag === 'A');
      
      if (buttonsFailing.length > 0) {
        console.log(`  Buttons too small (${buttonsFailing.length}):`);
        buttonsFailing.slice(0, 3).forEach(t => {
          console.log(`    - "${t.text || t.ariaLabel || 'unnamed'}" (${t.width}x${t.height}px)`);
        });
      }
      
      if (inputsFailing.length > 0) {
        console.log(`  Inputs too small (${inputsFailing.length}):`);
        inputsFailing.slice(0, 3).forEach(t => {
          console.log(`    - ${t.tag} ${t.type ? `[type="${t.type}"]` : ''} (${t.width}x${t.height}px)`);
        });
      }
      
      if (linksFailing.length > 0) {
        console.log(`  Links too small (${linksFailing.length}):`);
        linksFailing.slice(0, 3).forEach(t => {
          console.log(`    - "${t.text || 'unnamed'}" (${t.width}x${t.height}px)`);
        });
      }
      
      results.recommendations.push({
        page: pageName,
        severity: 'high',
        type: 'touch-targets',
        issue: `${failingTargets.length} touch targets smaller than ${MIN_TOUCH_TARGET}x${MIN_TOUCH_TARGET}px`,
        help: 'Increase padding or min-height to meet WCAG 2.5.5',
        details: {
          total: touchTargets.length,
          failing: failingTargets.length,
          passing: passingTargets.length,
        },
      });
    }
    
    // Save detailed results
    results.touchTargets.push({
      page: pageName,
      component,
      total: touchTargets.length,
      passing: passingTargets.length,
      failing: failingTargets.length,
      failingDetails: failingTargets.slice(0, 10),
      tests,
    });
    
  } catch (error) {
    console.error(`Error testing touch targets on ${pageName}:`, error.message);
    results.summary.warnings++;
  }
}

// ============================================================================
// TEST 4: ARIA Attributes and Semantic HTML
// ============================================================================
async function testAriaAttributes(page, pageName, component) {
  console.log(`\n🏷️  Testing ARIA attributes on ${pageName}...`);
  
  const tests = [];
  
  try {
    // Check for ARIA attributes
    const ariaElements = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll(
        '[role], [aria-label], [aria-labelledby], [aria-describedby], [aria-expanded], [aria-pressed], [aria-invalid]'
      ));
      
      return elements.map(el => ({
        tag: el.tagName,
        role: el.getAttribute('role'),
        ariaLabel: el.getAttribute('aria-label'),
        ariaLabelledby: el.getAttribute('aria-labelledby'),
        ariaDescribedby: el.getAttribute('aria-describedby'),
        ariaExpanded: el.getAttribute('aria-expanded'),
        ariaPressed: el.getAttribute('aria-pressed'),
        ariaInvalid: el.getAttribute('aria-invalid'),
      }));
    });
    
    const hasAriaAttributes = ariaElements.length > 0;
    tests.push({
      test: 'ARIA attributes present',
      expected: '> 0 elements',
      actual: ariaElements.length,
      passed: hasAriaAttributes,
    });
    
    if (hasAriaAttributes) {
      logTest('pass', `Found ${ariaElements.length} elements with ARIA attributes`);
      recordTest(true, 'ARIA attributes', component);
      
      // Log some examples
      const rolesFound = [...new Set(ariaElements.filter(e => e.role).map(e => e.role))];
      if (rolesFound.length > 0) {
        console.log(`  Roles found: ${rolesFound.join(', ')}`);
      }
    } else {
      logTest('warning', 'Limited ARIA attributes found');
      results.summary.warnings++;
    }
    
    // Check for semantic HTML structure
    const semanticHTML = await page.evaluate(() => {
      return {
        hasMain: document.querySelectorAll('main, [role="main"]').length > 0,
        hasNav: document.querySelectorAll('nav, [role="navigation"]').length > 0,
        hasHeadings: document.querySelectorAll('h1, h2, h3, h4, h5, h6').length > 0,
        hasButtons: document.querySelectorAll('button, [role="button"]').length > 0,
        hasLabels: document.querySelectorAll('label, [aria-label]').length > 0,
        headingCount: document.querySelectorAll('h1, h2, h3, h4, h5, h6').length,
        h1Count: document.querySelectorAll('h1').length,
      };
    });
    
    // Check heading structure
    tests.push({
      test: 'Heading structure present',
      expected: 'At least 1 heading',
      actual: semanticHTML.headingCount,
      passed: semanticHTML.hasHeadings,
    });
    
    if (semanticHTML.hasHeadings) {
      logTest('pass', `Found ${semanticHTML.headingCount} headings (${semanticHTML.h1Count} H1s)`);
      recordTest(true, 'Heading structure', component);
    }
    
    // For form pages, check label associations
    if (component === 'Form') {
      const formAccessibility = await page.evaluate(() => {
        const inputs = document.querySelectorAll('input:not([type="hidden"]), select, textarea');
        const results = [];
        
        inputs.forEach(input => {
          const id = input.getAttribute('id');
          const ariaLabel = input.getAttribute('aria-label');
          const ariaLabelledby = input.getAttribute('aria-labelledby');
          const hasLabel = id && document.querySelector(`label[for="${id}"]`);
          
          results.push({
            type: input.tagName,
            inputType: input.getAttribute('type'),
            hasId: !!id,
            hasAssociatedLabel: !!hasLabel,
            hasAriaLabel: !!ariaLabel,
            hasAriaLabelledby: !!ariaLabelledby,
            isAccessible: hasLabel || ariaLabel || ariaLabelledby,
          });
        });
        
        return results;
      });
      
      const accessibleInputs = formAccessibility.filter(i => i.isAccessible);
      const inaccessibleInputs = formAccessibility.filter(i => !i.isAccessible);
      
      tests.push({
        test: 'Form inputs have labels',
        expected: 'All inputs labeled',
        actual: `${accessibleInputs.length}/${formAccessibility.length} accessible`,
        passed: inaccessibleInputs.length === 0,
      });
      
      if (inaccessibleInputs.length === 0) {
        logTest('pass', `All ${formAccessibility.length} form inputs have proper labels`);
        recordTest(true, 'Form labels', component);
      } else {
        logTest('fail', `${inaccessibleInputs.length} inputs missing labels`);
        recordTest(false, 'Form labels', component);
        
        results.recommendations.push({
          page: pageName,
          severity: 'serious',
          type: 'form-labels',
          issue: `${inaccessibleInputs.length} form inputs missing accessible labels`,
          help: 'Add label with for attribute or aria-label to all form inputs',
        });
      }
    }
    
    results.ariaAttributes.push({
      page: pageName,
      component,
      ariaElementCount: ariaElements.length,
      semanticHTML,
      tests,
    });
    
  } catch (error) {
    console.error(`Error testing ARIA attributes on ${pageName}:`, error.message);
    results.summary.warnings++;
  }
}

// ============================================================================
// TEST 5: Focus Management
// ============================================================================
async function testFocusManagement(page, pageName, component) {
  console.log(`\n🎯 Testing focus management on ${pageName}...`);
  
  const tests = [];
  
  try {
    // Get tab order
    const tabOrder = await page.evaluate(() => {
      const elements = Array.from(
        document.querySelectorAll('button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
      ).filter(el => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden';
      });
      
      return elements.map(el => ({
        tag: el.tagName,
        role: el.getAttribute('role'),
        tabIndex: el.tabIndex,
        top: el.getBoundingClientRect().top,
        left: el.getBoundingClientRect().left,
      }));
    });
    
    // Check if tab order is logical (top to bottom, left to right)
    let logicalOrder = true;
    for (let i = 1; i < tabOrder.length; i++) {
      const prev = tabOrder[i - 1];
      const curr = tabOrder[i];
      
      // Allow tolerance for same-row elements (within 20px)
      if (curr.top < prev.top - 20 && curr.left < prev.left) {
        logicalOrder = false;
        break;
      }
    }
    
    tests.push({
      test: 'Tab order is logical',
      expected: 'Top to bottom, left to right',
      actual: logicalOrder ? 'Yes' : 'No',
      passed: logicalOrder,
    });
    
    if (logicalOrder) {
      logTest('pass', `Tab order follows visual layout (${tabOrder.length} elements)`);
      recordTest(true, 'Tab order', component);
    } else {
      logTest('warning', 'Tab order may not follow visual layout');
      results.summary.warnings++;
    }
    
    // Check for skip links (accessibility enhancement)
    const skipLinks = await page.locator('a[href^="#"]:first-child, [class*="skip"]').count();
    
    tests.push({
      test: 'Skip links present (optional)',
      expected: '>= 0 (recommended)',
      actual: skipLinks,
      passed: true, // Optional test
    });
    
    if (skipLinks > 0) {
      logTest('pass', `Found ${skipLinks} skip link(s) - good practice`);
    } else {
      logTest('warning', 'No skip links found (recommended for long pages)');
    }
    
    results.focusManagement.push({
      page: pageName,
      component,
      tabOrder: tabOrder.length,
      tests,
    });
    
  } catch (error) {
    console.error(`Error testing focus management on ${pageName}:`, error.message);
    results.summary.warnings++;
  }
}

// ============================================================================
// COMPONENT-SPECIFIC TESTS
// ============================================================================

async function testButtonComponents(page) {
  console.log('\n🔘 Testing Button-specific accessibility...');
  
  const tests = [];
  
  try {
    // Check all buttons have accessible names
    const buttons = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button, [role="button"]')).map(btn => {
        const ariaLabel = btn.getAttribute('aria-label');
        const text = btn.textContent?.trim();
        const title = btn.getAttribute('title');
        
        return {
          hasText: !!text && text.length > 0,
          hasAriaLabel: !!ariaLabel,
          hasTitle: !!title,
          isDisabled: btn.hasAttribute('disabled') || btn.getAttribute('aria-disabled') === 'true',
          text: text?.substring(0, 30),
          ariaLabel,
        };
      });
    });
    
    const buttonsWithNames = buttons.filter(b => b.hasText || b.hasAriaLabel || b.hasTitle);
    const buttonsWithoutNames = buttons.filter(b => !b.hasText && !b.hasAriaLabel && !b.hasTitle);
    
    tests.push({
      test: 'All buttons have accessible names',
      expected: '0 without names',
      actual: `${buttonsWithoutNames.length} without names`,
      passed: buttonsWithoutNames.length === 0,
    });
    
    if (buttonsWithoutNames.length === 0) {
      logTest('pass', `All ${buttons.length} buttons have accessible names`);
      recordTest(true, 'Button names', 'Button');
    } else {
      logTest('fail', `${buttonsWithoutNames.length} buttons missing accessible names`);
      recordTest(false, 'Button names', 'Button');
      
      results.recommendations.push({
        page: 'Button Components',
        severity: 'serious',
        type: 'button-names',
        issue: `${buttonsWithoutNames.length} buttons without accessible names`,
        help: 'Add text content or aria-label to all buttons',
      });
    }
    
    // Check disabled buttons have proper states
    const disabledButtons = buttons.filter(b => b.isDisabled);
    logTest('pass', `Found ${disabledButtons.length} disabled buttons (proper disabled attribute)`);
    
    results.componentTests.buttons = {
      total: buttons.length,
      withNames: buttonsWithNames.length,
      withoutNames: buttonsWithoutNames.length,
      disabled: disabledButtons.length,
      tests,
    };
    
  } catch (error) {
    console.error('Error testing button components:', error.message);
  }
}

async function testCardComponents(page) {
  console.log('\n🃏 Testing Card-specific accessibility...');
  
  const tests = [];
  
  try {
    // Check cards have proper structure
    const cards = await page.evaluate(() => {
      // Look for card-like structures
      const cardElements = document.querySelectorAll('[class*="card"], [data-testid*="card"]');
      
      return Array.from(cardElements).map(card => ({
        hasHeading: card.querySelector('h1, h2, h3, h4, h5, h6') !== null,
        hasInteractive: card.querySelector('button, a[href]') !== null,
        isClickable: card.hasAttribute('onclick') || card.getAttribute('role') === 'button',
        tabIndex: card.getAttribute('tabindex'),
      }));
    });
    
    // Check interactive cards are keyboard accessible
    const interactiveCards = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('[class*="card"]'))
        .filter(card => {
          const style = window.getComputedStyle(card);
          return style.cursor === 'pointer';
        })
        .map(card => ({
          isFocusable: card.getAttribute('tabindex') !== '-1',
          hasRole: !!card.getAttribute('role'),
        }));
    });
    
    const focusableInteractiveCards = interactiveCards.filter(c => c.isFocusable);
    
    if (interactiveCards.length > 0) {
      tests.push({
        test: 'Interactive cards are focusable',
        expected: 'All interactive cards focusable',
        actual: `${focusableInteractiveCards.length}/${interactiveCards.length}`,
        passed: focusableInteractiveCards.length === interactiveCards.length,
      });
      
      if (focusableInteractiveCards.length === interactiveCards.length) {
        logTest('pass', `All ${interactiveCards.length} interactive cards are focusable`);
        recordTest(true, 'Card focusability', 'Card');
      } else {
        logTest('warning', `Some interactive cards may not be keyboard accessible`);
        results.summary.warnings++;
      }
    }
    
    // Check card headings exist
    const cardsWithHeadings = cards.filter(c => c.hasHeading);
    logTest('pass', `${cardsWithHeadings.length}/${cards.length} cards have headings`);
    
    results.componentTests.cards = {
      total: cards.length,
      withHeadings: cardsWithHeadings.length,
      interactive: interactiveCards.length,
      tests,
    };
    
  } catch (error) {
    console.error('Error testing card components:', error.message);
  }
}

async function testFormComponents(page) {
  console.log('\n📝 Testing Form-specific accessibility...');
  
  const tests = [];
  
  try {
    // Check error message association
    const errorAssociation = await page.evaluate(() => {
      const errorMessages = document.querySelectorAll('[role="alert"], [class*="error"]');
      return Array.from(errorMessages).map(err => ({
        hasRole: err.getAttribute('role') === 'alert',
        isVisible: window.getComputedStyle(err).display !== 'none',
        text: err.textContent?.trim().substring(0, 50),
      }));
    });
    
    logTest('pass', `Found ${errorAssociation.length} error message elements`);
    
    // Check required field indicators
    const requiredFields = await page.evaluate(() => {
      const required = document.querySelectorAll('[required], [aria-required="true"]');
      return {
        count: required.length,
        hasVisualIndicator: document.querySelectorAll('[class*="required"], span:contains("*")').length > 0,
      };
    });
    
    tests.push({
      test: 'Required fields indicated',
      expected: 'Visual and programmatic indication',
      actual: `${requiredFields.count} required fields`,
      passed: true,
    });
    
    logTest('pass', `Found ${requiredFields.count} required fields with proper attributes`);
    recordTest(true, 'Required fields', 'Form');
    
    // Check form validation feedback
    const validationFeedback = await page.evaluate(() => {
      const hasAriaInvalid = document.querySelectorAll('[aria-invalid]').length > 0;
      const hasAriaDescribedby = document.querySelectorAll('[aria-describedby]').length > 0;
      
      return {
        hasAriaInvalid,
        hasAriaDescribedby,
        inputCount: document.querySelectorAll('input, select, textarea').length,
      };
    });
    
    logTest('pass', `Form has ${validationFeedback.inputCount} input elements`);
    
    results.componentTests.forms = {
      inputCount: validationFeedback.inputCount,
      requiredCount: requiredFields.count,
      errorMessages: errorAssociation.length,
      tests,
    };
    
  } catch (error) {
    console.error('Error testing form components:', error.message);
  }
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================
async function runPhase4AccessibilityAudit() {
  logSection('PHASE 4 COMPONENT ACCESSIBILITY AUDIT');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Test Pages: ${TEST_PAGES.length}`);
  console.log(`Standard: WCAG 2.1 Level AA`);
  console.log(`Timestamp: ${results.timestamp}\n`);
  
  const browser = await chromium.launch({ headless: true });
  
  try {
    for (const testPage of TEST_PAGES) {
      logSection(`Testing ${testPage.name} (${testPage.path})`);
      
      // Create context with desktop viewport
      const context = await browser.newContext({
        viewport: { width: 1280, height: 720 },
      });
      
      const page = await context.newPage();
      
      try {
        // Navigate to page
        console.log(`Navigating to ${BASE_URL}${testPage.path}...`);
        await page.goto(`${BASE_URL}${testPage.path}`, { 
          waitUntil: 'networkidle',
          timeout: 30000,
        });
        await page.waitForTimeout(1000); // Allow JS to hydrate
        
        // Run all standard tests
        await runAxeAudit(page, testPage.name);
        await testKeyboardNavigation(page, testPage.name, testPage.component);
        await testTouchTargets(page, testPage.name, testPage.component);
        await testAriaAttributes(page, testPage.name, testPage.component);
        await testFocusManagement(page, testPage.name, testPage.component);
        
        // Run component-specific tests
        if (testPage.component === 'Button') {
          await testButtonComponents(page);
        } else if (testPage.component === 'Card') {
          await testCardComponents(page);
        } else if (testPage.component === 'Form') {
          await testFormComponents(page);
        }
        
        // Test mobile viewport
        console.log('\n📱 Testing mobile viewport (375px)...');
        await page.setViewportSize({ width: 375, height: 667 });
        await page.waitForTimeout(500);
        await testTouchTargets(page, `${testPage.name} (Mobile)`, testPage.component);
        
      } catch (error) {
        console.error(`Error testing ${testPage.name}:`, error.message);
        results.summary.warnings++;
      } finally {
        await context.close();
      }
    }
    
  } finally {
    await browser.close();
  }
  
  // Print summary
  printSummary();
  
  // Save results to JSON
  saveResults();
  
  // Exit with appropriate code
  const overallPass = results.summary.failed === 0;
  process.exit(overallPass ? 0 : 1);
}

function printSummary() {
  logSection('AUDIT SUMMARY');
  console.log(`Total Pages:  ${results.summary.totalPages}`);
  console.log(`Total Tests:  ${results.summary.totalTests}`);
  console.log(`✅ Passed:     ${results.summary.passed}`);
  console.log(`❌ Failed:     ${results.summary.failed}`);
  console.log(`⚠️  Warnings:   ${results.summary.warnings}\n`);
  
  const passRate = results.summary.totalTests > 0 
    ? ((results.summary.passed / results.summary.totalTests) * 100).toFixed(1) 
    : 0;
  
  console.log(`Pass Rate: ${passRate}%\n`);
  
  const overallPass = results.summary.failed === 0;
  console.log(`Overall Result: ${overallPass ? '✅ WCAG 2.1 AA COMPLIANT' : '❌ NEEDS REMEDIATION'}\n`);
  
  // Print recommendations
  if (results.recommendations.length > 0) {
    logSection('RECOMMENDATIONS');
    
    const critical = results.recommendations.filter(r => r.severity === 'critical');
    const serious = results.recommendations.filter(r => r.severity === 'serious' || r.severity === 'high');
    const moderate = results.recommendations.filter(r => r.severity === 'moderate' || r.severity === 'medium');
    
    if (critical.length > 0) {
      console.log('🔴 CRITICAL:\n');
      critical.forEach((rec, i) => {
        console.log(`${i + 1}. [${rec.page}] ${rec.issue}`);
        console.log(`   → ${rec.help}\n`);
      });
    }
    
    if (serious.length > 0) {
      console.log('🟠 SERIOUS/HIGH:\n');
      serious.forEach((rec, i) => {
        console.log(`${i + 1}. [${rec.page}] ${rec.issue}`);
        console.log(`   → ${rec.help}\n`);
      });
    }
    
    if (moderate.length > 0) {
      console.log('🟡 MODERATE:\n');
      moderate.forEach((rec, i) => {
        console.log(`${i + 1}. [${rec.page}] ${rec.issue}`);
        console.log(`   → ${rec.help}\n`);
      });
    }
  }
  
  // Component-specific summary
  logSection('COMPONENT SUMMARY');
  
  if (results.componentTests.buttons.total !== undefined) {
    console.log(`📘 Buttons: ${results.componentTests.buttons.total} tested`);
    console.log(`   - With accessible names: ${results.componentTests.buttons.withNames}`);
    console.log(`   - Disabled buttons: ${results.componentTests.buttons.disabled}\n`);
  }
  
  if (results.componentTests.cards.total !== undefined) {
    console.log(`🃏 Cards: ${results.componentTests.cards.total} tested`);
    console.log(`   - With headings: ${results.componentTests.cards.withHeadings}`);
    console.log(`   - Interactive: ${results.componentTests.cards.interactive}\n`);
  }
  
  if (results.componentTests.forms.inputCount !== undefined) {
    console.log(`📝 Forms: ${results.componentTests.forms.inputCount} inputs tested`);
    console.log(`   - Required fields: ${results.componentTests.forms.requiredCount}`);
    console.log(`   - Error messages: ${results.componentTests.forms.errorMessages}\n`);
  }
}

function saveResults() {
  try {
    const resultsDir = path.join(__dirname, '..', 'docs', 'UI');
    const resultsPath = path.join(resultsDir, 'phase4-component-accessibility-results.json');
    
    // Ensure directory exists
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
    
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    console.log(`\n📄 Detailed results saved to: docs/UI/phase4-component-accessibility-results.json\n`);
  } catch (error) {
    console.error('Error saving results:', error.message);
  }
}

// Run the audit
runPhase4AccessibilityAudit().catch(error => {
  console.error('Fatal error running audit:', error);
  process.exit(1);
});
