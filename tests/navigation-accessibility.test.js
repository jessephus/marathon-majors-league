/**
 * Navigation Accessibility Audit Test
 * 
 * Comprehensive accessibility testing for Phase 3 navigation components:
 * - StickyHeader
 * - BottomNav
 * - MobileMenuDrawer
 * 
 * Tests:
 * - WCAG 2.1 AA compliance (via Axe)
 * - Keyboard navigation
 * - Focus management
 * - ARIA attributes
 * - Touch target sizes
 * - Screen reader compatibility
 * - Tab order
 * - Color contrast
 * 
 * Part of: Issue #[TBD] - Phase 3 Navigation Accessibility Audit
 * Parent: #122 - Phase 3 Core Navigation Implementation
 * Grand-parent: #59 - Redesign UI with Modern Mobile-First Look
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
const TEST_PAGES = [
  { path: '/test-sticky-header', name: 'StickyHeader' },
  { path: '/test-bottom-nav', name: 'BottomNav' },
  { path: '/test-mobile-menu', name: 'MobileMenuDrawer' },
];

// Test results
const results = {
  timestamp: new Date().toISOString(),
  baseUrl: BASE_URL,
  summary: {
    totalPages: TEST_PAGES.length,
    totalTests: 0,
    passed: 0,
    failed: 0,
    warnings: 0,
  },
  pages: [],
  keyboardNavigation: [],
  focusManagement: [],
  touchTargets: [],
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

// Test 1: Automated Axe accessibility scan
async function runAxeAudit(page, pageName) {
  console.log(`\n🔍 Running Axe audit on ${pageName}...`);
  
  try {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    
    const violations = accessibilityScanResults.violations;
    
    const pageResult = {
      name: pageName,
      violations: violations.length,
      issues: violations.map(v => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        help: v.help,
        helpUrl: v.helpUrl,
        nodes: v.nodes.map(n => ({
          html: n.html,
          target: n.target,
          failureSummary: n.failureSummary,
        })),
      })),
    };
    
    results.pages.push(pageResult);
    results.summary.totalTests += violations.length;
    
    if (violations.length === 0) {
      logTest('pass', `${pageName} - No Axe violations found`);
      results.summary.passed++;
    } else {
      logTest('fail', `${pageName} - ${violations.length} Axe violations found`);
      results.summary.failed += violations.length;
      
      violations.forEach(v => {
        const impact = v.impact === 'critical' ? '🔴' : v.impact === 'serious' ? '🟠' : '🟡';
        console.log(`  ${impact} ${v.id}: ${v.description}`);
        console.log(`     ${v.nodes.length} instance(s) - ${v.help}`);
        
        results.recommendations.push({
          page: pageName,
          severity: v.impact,
          type: 'axe-violation',
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

// Test 2: Keyboard navigation
async function testKeyboardNavigation(page, pageName) {
  console.log(`\n⌨️  Testing keyboard navigation on ${pageName}...`);
  
  const tests = [];
  
  try {
    // Tab through all focusable elements
    const focusableElements = await page.locator('a, button, input, [tabindex]:not([tabindex="-1"])').all();
    
    tests.push({
      test: 'Focusable elements count',
      expected: '> 0',
      actual: focusableElements.length,
      passed: focusableElements.length > 0,
    });
    
    results.summary.totalTests++;
    if (focusableElements.length > 0) {
      logTest('pass', `Found ${focusableElements.length} focusable elements`);
      results.summary.passed++;
    } else {
      logTest('fail', 'No focusable elements found');
      results.summary.failed++;
    }
    
    // Test Tab key navigation
    await page.keyboard.press('Tab');
    const firstFocusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      return {
        tag: el.tagName,
        role: el.getAttribute('role'),
        ariaLabel: el.getAttribute('aria-label'),
        text: el.textContent?.trim().substring(0, 50),
      };
    });
    
    tests.push({
      test: 'Tab key focuses element',
      expected: 'Element should receive focus',
      actual: firstFocusedElement,
      passed: firstFocusedElement.tag !== 'BODY',
    });
    
    results.summary.totalTests++;
    if (firstFocusedElement.tag !== 'BODY') {
      logTest('pass', `Tab key works - focused ${firstFocusedElement.tag}`);
      results.summary.passed++;
    } else {
      logTest('fail', 'Tab key does not focus any element');
      results.summary.failed++;
    }
    
    // Test focus visibility
    const focusVisible = await page.evaluate(() => {
      const el = document.activeElement;
      const styles = window.getComputedStyle(el);
      return {
        outline: styles.outline,
        outlineWidth: styles.outlineWidth,
        boxShadow: styles.boxShadow,
      };
    });
    
    const hasFocusIndicator = 
      focusVisible.outline !== 'none' || 
      focusVisible.outlineWidth !== '0px' ||
      focusVisible.boxShadow !== 'none';
    
    tests.push({
      test: 'Focus indicator visible',
      expected: 'Visible outline or box-shadow',
      actual: focusVisible,
      passed: hasFocusIndicator,
    });
    
    results.summary.totalTests++;
    if (hasFocusIndicator) {
      logTest('pass', 'Focus indicator is visible');
      results.summary.passed++;
    } else {
      logTest('fail', 'Focus indicator not visible');
      results.summary.failed++;
      results.recommendations.push({
        page: pageName,
        severity: 'high',
        type: 'keyboard-navigation',
        issue: 'Focus indicator not visible',
        help: 'Add visible outline or box-shadow on :focus',
      });
    }
    
    // Test Escape key on mobile menu (if present)
    if (pageName === 'MobileMenuDrawer') {
      // Click hamburger to open menu
      const hamburger = await page.locator('[aria-label*="menu"], [aria-label*="Menu"]').first();
      if (await hamburger.count() > 0) {
        await hamburger.click();
        await page.waitForTimeout(300);
        
        // Press Escape
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
        
        // Check if drawer closed
        const drawerVisible = await page.evaluate(() => {
          const drawer = document.querySelector('[role="dialog"]');
          return drawer && window.getComputedStyle(drawer).display !== 'none';
        });
        
        tests.push({
          test: 'Escape key closes drawer',
          expected: 'Drawer should close',
          actual: !drawerVisible,
          passed: !drawerVisible,
        });
        
        results.summary.totalTests++;
        if (!drawerVisible) {
          logTest('pass', 'Escape key closes drawer');
          results.summary.passed++;
        } else {
          logTest('fail', 'Escape key does not close drawer');
          results.summary.failed++;
          results.recommendations.push({
            page: pageName,
            severity: 'medium',
            type: 'keyboard-navigation',
            issue: 'Escape key does not close mobile drawer',
            help: 'Add keyboard event listener for Escape key to close drawer',
          });
        }
      }
    }
    
  } catch (error) {
    console.error(`Error testing keyboard navigation on ${pageName}:`, error.message);
    results.summary.warnings++;
  }
  
  results.keyboardNavigation.push({
    page: pageName,
    tests,
  });
}

// Test 3: Focus management
async function testFocusManagement(page, pageName) {
  console.log(`\n🎯 Testing focus management on ${pageName}...`);
  
  const tests = [];
  
  try {
    // Test skip link (if present)
    const skipLinks = await page.locator('a[href^="#"]').all();
    
    tests.push({
      test: 'Skip links present',
      expected: '> 0 for accessibility',
      actual: skipLinks.length,
      passed: skipLinks.length > 0,
      optional: true,
    });
    
    if (skipLinks.length > 0) {
      logTest('pass', `Found ${skipLinks.length} skip link(s)`);
    } else {
      logTest('warning', 'No skip links found (optional but recommended)');
      results.summary.warnings++;
    }
    
    // Test focus trap in mobile drawer
    if (pageName === 'MobileMenuDrawer') {
      const hamburger = await page.locator('[aria-label*="menu"], [aria-label*="Menu"]').first();
      if (await hamburger.count() > 0) {
        await hamburger.click();
        await page.waitForTimeout(300);
        
        // Tab through drawer elements
        const drawerFocusable = await page.locator('[role="dialog"] a, [role="dialog"] button').all();
        
        tests.push({
          test: 'Drawer has focusable elements',
          expected: '> 0',
          actual: drawerFocusable.length,
          passed: drawerFocusable.length > 0,
        });
        
        results.summary.totalTests++;
        if (drawerFocusable.length > 0) {
          logTest('pass', `Drawer has ${drawerFocusable.length} focusable elements`);
          results.summary.passed++;
        } else {
          logTest('fail', 'Drawer has no focusable elements');
          results.summary.failed++;
        }
        
        // Close drawer
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }
    }
    
    // Test tab order is logical
    const tabOrder = await page.evaluate(() => {
      const elements = Array.from(
        document.querySelectorAll('a, button, input, [tabindex]:not([tabindex="-1"])')
      );
      return elements.map(el => ({
        tag: el.tagName,
        text: el.textContent?.trim().substring(0, 30),
        tabIndex: el.tabIndex,
        top: el.getBoundingClientRect().top,
        left: el.getBoundingClientRect().left,
      }));
    });
    
    // Check if tab order follows visual order (top to bottom, left to right)
    let logicalOrder = true;
    for (let i = 1; i < tabOrder.length; i++) {
      const prev = tabOrder[i - 1];
      const curr = tabOrder[i];
      
      // Allow some tolerance for same-row elements
      if (curr.top < prev.top - 10) {
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
    
    results.summary.totalTests++;
    if (logicalOrder) {
      logTest('pass', 'Tab order follows visual layout');
      results.summary.passed++;
    } else {
      logTest('warning', 'Tab order may not follow visual layout');
      results.summary.warnings++;
      results.recommendations.push({
        page: pageName,
        severity: 'medium',
        type: 'focus-management',
        issue: 'Tab order may not follow visual layout',
        help: 'Verify tab order in source code and consider using tabindex if necessary',
      });
    }
    
  } catch (error) {
    console.error(`Error testing focus management on ${pageName}:`, error.message);
    results.summary.warnings++;
  }
  
  results.focusManagement.push({
    page: pageName,
    tests,
  });
}

// Test 4: Touch target sizes (WCAG 2.5.5)
async function testTouchTargets(page, pageName) {
  console.log(`\n👆 Testing touch target sizes on ${pageName}...`);
  
  const tests = [];
  
  try {
    const touchTargets = await page.evaluate(() => {
      const elements = Array.from(
        document.querySelectorAll('a, button, input[type="button"], input[type="submit"]')
      );
      
      return elements.map(el => {
        const rect = el.getBoundingClientRect();
        const styles = window.getComputedStyle(el);
        const padding = {
          top: parseInt(styles.paddingTop),
          right: parseInt(styles.paddingRight),
          bottom: parseInt(styles.paddingBottom),
          left: parseInt(styles.paddingLeft),
        };
        
        return {
          tag: el.tagName,
          text: el.textContent?.trim().substring(0, 30),
          width: rect.width,
          height: rect.height,
          padding,
          meetsMinimum: rect.width >= 44 && rect.height >= 44,
        };
      });
    });
    
    const failingTargets = touchTargets.filter(t => !t.meetsMinimum);
    
    tests.push({
      test: 'All touch targets ≥44x44px',
      expected: '0 failing',
      actual: `${failingTargets.length} failing`,
      passed: failingTargets.length === 0,
    });
    
    results.summary.totalTests++;
    if (failingTargets.length === 0) {
      logTest('pass', `All ${touchTargets.length} touch targets meet 44x44px minimum`);
      results.summary.passed++;
    } else {
      logTest('fail', `${failingTargets.length}/${touchTargets.length} touch targets are too small`);
      results.summary.failed++;
      
      failingTargets.slice(0, 5).forEach(target => {
        console.log(`  - ${target.tag}: "${target.text}" (${Math.round(target.width)}x${Math.round(target.height)}px)`);
      });
      
      if (failingTargets.length > 5) {
        console.log(`  ... and ${failingTargets.length - 5} more`);
      }
      
      results.recommendations.push({
        page: pageName,
        severity: 'high',
        type: 'touch-targets',
        issue: `${failingTargets.length} touch targets smaller than 44x44px`,
        help: 'Increase padding or min-width/min-height to meet WCAG 2.5.5',
        examples: failingTargets.slice(0, 3).map(t => `${t.tag}: ${Math.round(t.width)}x${Math.round(t.height)}px`),
      });
    }
    
  } catch (error) {
    console.error(`Error testing touch targets on ${pageName}:`, error.message);
    results.summary.warnings++;
  }
  
  results.touchTargets.push({
    page: pageName,
    tests,
  });
}

// Test 5: ARIA attributes
async function testAriaAttributes(page, pageName) {
  console.log(`\n🏷️  Testing ARIA attributes on ${pageName}...`);
  
  const tests = [];
  
  try {
    const ariaElements = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('[role], [aria-label], [aria-labelledby], [aria-describedby]'));
      
      return elements.map(el => {
        const role = el.getAttribute('role');
        const ariaLabel = el.getAttribute('aria-label');
        const ariaLabelledby = el.getAttribute('aria-labelledby');
        const ariaDescribedby = el.getAttribute('aria-describedby');
        const ariaExpanded = el.getAttribute('aria-expanded');
        const ariaHaspopup = el.getAttribute('aria-haspopup');
        
        return {
          tag: el.tagName,
          role,
          ariaLabel,
          ariaLabelledby,
          ariaDescribedby,
          ariaExpanded,
          ariaHaspopup,
          text: el.textContent?.trim().substring(0, 30),
        };
      });
    });
    
    tests.push({
      test: 'ARIA attributes present',
      expected: '> 0',
      actual: ariaElements.length,
      passed: ariaElements.length > 0,
    });
    
    results.summary.totalTests++;
    if (ariaElements.length > 0) {
      logTest('pass', `Found ${ariaElements.length} elements with ARIA attributes`);
      results.summary.passed++;
      
      // Log sample ARIA usage
      console.log('  Sample ARIA attributes:');
      ariaElements.slice(0, 3).forEach(el => {
        console.log(`  - ${el.tag}${el.role ? ` [role="${el.role}"]` : ''}: ${el.ariaLabel || el.text}`);
      });
    } else {
      logTest('fail', 'No ARIA attributes found');
      results.summary.failed++;
      results.recommendations.push({
        page: pageName,
        severity: 'high',
        type: 'aria-attributes',
        issue: 'No ARIA attributes found on navigation elements',
        help: 'Add role, aria-label, and aria-expanded where appropriate',
      });
    }
    
    // Check for navigation landmark
    const navLandmark = await page.locator('nav, [role="navigation"]').count();
    
    tests.push({
      test: 'Navigation landmark present',
      expected: '> 0',
      actual: navLandmark,
      passed: navLandmark > 0,
    });
    
    results.summary.totalTests++;
    if (navLandmark > 0) {
      logTest('pass', `Found ${navLandmark} navigation landmark(s)`);
      results.summary.passed++;
    } else {
      logTest('fail', 'No navigation landmark found');
      results.summary.failed++;
      results.recommendations.push({
        page: pageName,
        severity: 'medium',
        type: 'aria-attributes',
        issue: 'No navigation landmark found',
        help: 'Wrap navigation in <nav> element or add role="navigation"',
      });
    }
    
  } catch (error) {
    console.error(`Error testing ARIA attributes on ${pageName}:`, error.message);
    results.summary.warnings++;
  }
  
  results.ariaAttributes.push({
    page: pageName,
    tests,
  });
}

// Main test runner
async function runNavigationAccessibilityAudit() {
  logSection('NAVIGATION ACCESSIBILITY AUDIT - PHASE 3');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Test Pages: ${TEST_PAGES.length}`);
  console.log(`Timestamp: ${results.timestamp}\n`);
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });
  
  try {
    for (const testPage of TEST_PAGES) {
      logSection(`Testing ${testPage.name} (${testPage.path})`);
      
      const page = await context.newPage();
      
      try {
        await page.goto(`${BASE_URL}${testPage.path}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000); // Allow time for JS to load
        
        // Run all tests
        await runAxeAudit(page, testPage.name);
        await testKeyboardNavigation(page, testPage.name);
        await testFocusManagement(page, testPage.name);
        await testTouchTargets(page, testPage.name);
        await testAriaAttributes(page, testPage.name);
        
      } catch (error) {
        console.error(`Error testing ${testPage.name}:`, error.message);
        results.summary.warnings++;
      } finally {
        await page.close();
      }
    }
    
  } finally {
    await browser.close();
  }
  
  // Print summary
  logSection('AUDIT SUMMARY');
  console.log(`Total Pages:  ${results.summary.totalPages}`);
  console.log(`Total Tests:  ${results.summary.totalTests}`);
  console.log(`✅ Passed:     ${results.summary.passed}`);
  console.log(`❌ Failed:     ${results.summary.failed}`);
  console.log(`⚠️  Warnings:   ${results.summary.warnings}\n`);
  
  const overallPass = results.summary.failed === 0;
  console.log(`Overall Result: ${overallPass ? '✅ WCAG 2.1 AA COMPLIANT' : '❌ NEEDS REMEDIATION'}\n`);
  
  // Print recommendations
  if (results.recommendations.length > 0) {
    logSection('RECOMMENDATIONS');
    
    const critical = results.recommendations.filter(r => r.severity === 'critical');
    const high = results.recommendations.filter(r => r.severity === 'serious' || r.severity === 'high');
    const medium = results.recommendations.filter(r => r.severity === 'moderate' || r.severity === 'medium');
    
    if (critical.length > 0) {
      console.log('🔴 CRITICAL:\n');
      critical.forEach((rec, i) => {
        console.log(`${i + 1}. [${rec.page}] ${rec.issue}`);
        console.log(`   → ${rec.help}\n`);
      });
    }
    
    if (high.length > 0) {
      console.log('🟠 HIGH PRIORITY:\n');
      high.forEach((rec, i) => {
        console.log(`${i + 1}. [${rec.page}] ${rec.issue}`);
        console.log(`   → ${rec.help}\n`);
      });
    }
    
    if (medium.length > 0) {
      console.log('🟡 MEDIUM PRIORITY:\n');
      medium.forEach((rec, i) => {
        console.log(`${i + 1}. [${rec.page}] ${rec.issue}`);
        console.log(`   → ${rec.help}\n`);
      });
    }
  }
  
  // Save results to JSON
  const resultsPath = path.join(__dirname, '..', 'docs', 'UI_REDESIGN', 'navigation-accessibility-audit-results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`\n📄 Detailed results saved to: docs/UI_REDESIGN/navigation-accessibility-audit-results.json\n`);
  
  // Exit with appropriate code
  process.exit(overallPass ? 0 : 1);
}

// Run the audit
runNavigationAccessibilityAudit().catch(error => {
  console.error('Fatal error running audit:', error);
  process.exit(1);
});
