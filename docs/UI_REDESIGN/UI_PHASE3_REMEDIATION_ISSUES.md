# Navigation Accessibility Remediation - Issue Tracking

This document tracks the remediation issues created from the Phase 3 Navigation Accessibility Audit.

**Audit Date:** November 22, 2025  
**Audit Report:** [UI_PHASE3_NAVIGATION_ACCESSIBILITY_AUDIT.md](./UI_PHASE3_NAVIGATION_ACCESSIBILITY_AUDIT.md)  
**Test Suite:** `tests/navigation-accessibility.test.js`

---

## Critical Issues (MUST FIX before production)

### Issue 1: Fix Touch Targets in Navigation Components

**Priority:** 🔴 Critical  
**WCAG:** 2.5.5 Target Size (Level AAA, but best practice)  
**Estimated Effort:** 2-3 hours  
**Assignee:** TBD  
**GitHub Issue:** [TBD - Create issue]

**Problem:**
ALL navigation touch targets fail WCAG 2.5.5 (44x44px minimum):
- StickyHeader: 22/22 targets failing
- BottomNav: 17/17 targets failing
- MobileMenuDrawer: 34/34 targets failing

**Impact:**
- Affects 100% of mobile users
- Critical for users with motor disabilities
- Makes app difficult to use on small screens

**Files to Update:**
- `components/navigation/StickyHeader/NavLink.tsx`
- `components/navigation/BottomNav/BottomNavItem.tsx`
- `components/navigation/MobileMenuDrawer/index.tsx`

**Required Changes:**

```tsx
// NavLink.tsx - Add minimum touch targets
<Box
  as="a"
  href={href}
  minHeight="44px"
  minWidth="44px"
  padding="12px 16px"
  display="flex"
  alignItems="center"
  {...props}
>
  {children}
</Box>

// BottomNavItem.tsx - Larger for thumb-zone
<Box
  as="a"
  href={href}
  minHeight="60px"
  minWidth="60px"
  padding="12px"
  display="flex"
  flexDirection="column"
  alignItems="center"
  justifyContent="center"
  {...props}
>
  <Icon boxSize="24px" />
  <Text fontSize="xs">{label}</Text>
</Box>
```

**Testing:**
```bash
npm run audit:navigation
# Verify: 0 touch target failures
```

**Success Criteria:**
- [ ] All navigation links ≥44x44px
- [ ] BottomNav items ≥60x60px (optimized for thumb-zone)
- [ ] Touch target test passes: 0 failures
- [ ] Manual testing on iPhone SE, Android devices
- [ ] No visual regressions in layout

---

### Issue 2: Fix Color Contrast in Success Badges

**Priority:** 🟠 High  
**WCAG:** 1.4.3 Contrast (Minimum) - Level AA  
**Estimated Effort:** 1 hour  
**Assignee:** TBD  
**GitHub Issue:** [TBD - Create issue]

**Problem:**
Success badges fail color contrast requirements:
- White text on success green (#22c55e): 2.27:1
- Required: 4.5:1 minimum
- Gap: 2.23:1 below requirement

**Impact:**
- Users with low vision cannot read badges
- Affects color-blind users
- Poor visibility in bright sunlight

**Files to Update:**
- `theme/colors.ts`
- Any components using success badges

**Required Changes:**

```typescript
// theme/colors.ts - Update semantic success color
export const colors = {
  // ... other colors
  semantic: {
    primary: 'navy',
    secondary: 'gold',
    success: colors.success[600],  // Changed from 500 to 600
    warning: colors.warning[600],
    error: colors.error[600],
    info: colors.info[600],
  },
};

// Verify new contrast:
// White on #16a34a (success.600) = 4.54:1 ✅ PASSES AA
```

**Alternative Fix (if visual change unacceptable):**
```tsx
// Use dark text on light background instead
<Badge colorPalette="success" variant="subtle">
  AAA  // Dark text on light green background
</Badge>
```

**Testing:**
```bash
npm run audit:a11y
# Verify: No color contrast failures for success colors

npm run audit:navigation
# Verify: Success badges pass contrast tests
```

**Success Criteria:**
- [ ] Success badge contrast ≥4.5:1
- [ ] All semantic colors pass contrast tests
- [ ] Visual review: badges still look good
- [ ] No regressions in other components using success color

---

### Issue 3: Add Page Titles to Test Pages

**Priority:** 🟡 Medium  
**WCAG:** 2.4.2 Page Titled - Level A  
**Estimated Effort:** 30 minutes  
**Assignee:** TBD  
**GitHub Issue:** [TBD - Create issue]

**Problem:**
Test pages lack `<title>` elements, affecting:
- Screen reader navigation
- Browser tab identification
- SEO (though test pages aren't indexed)

**Impact:**
- Screen readers announce page as "untitled"
- Poor user experience
- Affects test page accessibility

**Files to Update:**
- `pages/test-sticky-header.tsx`
- `pages/test-bottom-nav.tsx`
- `pages/test-mobile-menu.tsx`

**Required Changes:**

```tsx
// pages/test-sticky-header.tsx
import Head from 'next/head';

export default function TestStickyHeader() {
  return (
    <>
      <Head>
        <title>StickyHeader Test - Marathon Majors Fantasy League</title>
        <meta name="description" content="Accessibility test page for StickyHeader component" />
      </Head>
      {/* Component content */}
    </>
  );
}

// Similar changes for:
// - pages/test-bottom-nav.tsx → "BottomNav Test - MMFL"
// - pages/test-mobile-menu.tsx → "Mobile Menu Test - MMFL"
```

**Testing:**
```bash
npm run audit:navigation
# Verify: No document-title violations
```

**Success Criteria:**
- [ ] All test pages have descriptive `<title>` elements
- [ ] Screen readers announce page titles correctly
- [ ] Browser tabs show appropriate titles
- [ ] Axe audit shows 0 document-title violations

---

## Recommended Enhancements (Post-launch improvements)

### Enhancement 1: Add Skip Links

**Priority:** 🟡 Medium  
**WCAG:** 2.4.1 Bypass Blocks - Level A  
**Estimated Effort:** 1 hour  
**Assignee:** TBD  
**GitHub Issue:** [TBD - Create issue]

**Problem:**
No skip links present - keyboard users must tab through entire header to reach main content.

**Files to Update:**
- `components/navigation/StickyHeader/index.tsx`

**Required Changes:**

```tsx
// Add skip link at top of StickyHeader
<Box
  as="a"
  href="#main-content"
  position="absolute"
  left="-9999px"
  zIndex={9999}
  padding="12px 16px"
  background="navy.900"
  color="white"
  borderRadius="md"
  _focus={{
    position: 'fixed',
    top: '4px',
    left: '4px',
  }}
>
  Skip to main content
</Box>

// Add id to main content area
<main id="main-content">
  {/* Page content */}
</main>
```

**Success Criteria:**
- [ ] Skip link appears on Tab focus
- [ ] Clicking skip link jumps to main content
- [ ] Visual styling matches brand
- [ ] Keyboard navigation improved

---

### Enhancement 2: Implement Focus Trap in Mobile Drawer

**Priority:** 🟡 Medium  
**WCAG:** Best practice for modal/drawer accessibility  
**Estimated Effort:** 2-3 hours  
**Assignee:** TBD  
**GitHub Issue:** [TBD - Create issue]

**Problem:**
Mobile drawer should trap focus when open to prevent tabbing out of drawer.

**Files to Update:**
- `components/navigation/MobileMenuDrawer/index.tsx`
- Create new hook: `lib/useFocusTrap.ts`

**Required Changes:**

```tsx
// lib/useFocusTrap.ts - Create focus trap hook
export function useFocusTrap(isActive: boolean) {
  const ref = useRef<HTMLElement>(null);
  
  useEffect(() => {
    if (!isActive || !ref.current) return;
    
    const element = ref.current;
    const focusableElements = element.querySelectorAll(
      'a, button, input, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };
    
    element.addEventListener('keydown', handleTabKey);
    firstElement.focus();
    
    return () => element.removeEventListener('keydown', handleTabKey);
  }, [isActive]);
  
  return ref;
}

// MobileMenuDrawer/index.tsx - Use focus trap
import { useFocusTrap } from '@/lib/useFocusTrap';

function MobileMenuDrawer({ isOpen, onClose }) {
  const drawerRef = useFocusTrap(isOpen);
  
  return (
    <Drawer isOpen={isOpen} onClose={onClose}>
      <DrawerOverlay />
      <DrawerContent ref={drawerRef}>
        {/* Drawer content */}
      </DrawerContent>
    </Drawer>
  );
}
```

**Success Criteria:**
- [ ] Focus trapped when drawer opens
- [ ] Tab cycles through drawer elements only
- [ ] Shift+Tab works in reverse
- [ ] Focus returns to trigger button on close
- [ ] Escape key still closes drawer

---

### Enhancement 3: Manual Testing & Documentation

**Priority:** 🟡 Medium  
**Estimated Effort:** 2-3 hours  
**Assignee:** TBD  
**GitHub Issue:** [TBD - Create issue]

**Activities:**

1. **Manual Keyboard Testing**
   - [ ] Tab through all navigation components
   - [ ] Verify logical tab order
   - [ ] Test Escape key on mobile drawer
   - [ ] Test Enter/Space on buttons/links
   - [ ] Document any issues found

2. **Screen Reader Testing**
   - [ ] Test with NVDA (Windows)
   - [ ] Test with JAWS (Windows, trial)
   - [ ] Test with VoiceOver (macOS/iOS)
   - [ ] Verify ARIA labels announced correctly
   - [ ] Verify state changes announced

3. **Mobile Device Testing**
   - [ ] iPhone SE (small screen)
   - [ ] iPhone 14 Pro (notch)
   - [ ] Samsung Galaxy S21 (Android)
   - [ ] iPad (tablet)
   - [ ] Verify touch targets easy to tap
   - [ ] Verify no accidental taps

4. **Documentation Updates**
   - [ ] Update component README files with accessibility notes
   - [ ] Document keyboard shortcuts
   - [ ] Add accessibility testing guide
   - [ ] Update UI_REDESIGN_ROADMAP.md

**Deliverables:**
- Manual testing report
- Updated component documentation
- Accessibility testing guide
- Video/screenshots of successful tests

---

## Testing & Verification

After completing remediation, run full test suite:

```bash
# 1. Run navigation accessibility audit
npm run audit:navigation

# Expected result:
# Total Tests: 24
# ✅ Passed: 22+
# ❌ Failed: 0
# ⚠️ Warnings: 2 or fewer

# 2. Run design token audit
npm run audit:a11y

# Expected result:
# All color combinations pass WCAG AA

# 3. Build project
npm run build

# Verify: No errors

# 4. Manual testing
npm run dev
# Navigate to test pages and verify:
# - Touch targets are larger
# - Colors have good contrast
# - Page titles present
```

---

## Timeline

**Week 1: Critical Fixes**
- Day 1-2: Touch targets fix
- Day 2-3: Color contrast fix
- Day 3: Page titles fix
- Day 4: Testing and verification

**Week 2: Enhancements**
- Day 5: Skip links
- Day 6: Focus trap
- Day 7-8: Manual testing

**Week 3: Documentation & Sign-off**
- Day 9-10: Documentation updates
- Day 11: Final verification
- Day 12: Sign-off and close issues

---

## Issue Template

Use this template when creating GitHub issues:

```markdown
## Description
[Brief description of the issue]

## Priority
🔴 Critical / 🟠 High / 🟡 Medium / 🟢 Low

## WCAG Criterion
[e.g., 2.5.5 Target Size - Level AAA]

## Impact
- Who: [e.g., All mobile users, users with motor disabilities]
- What: [e.g., Cannot easily tap navigation links]
- Why: [e.g., Touch targets too small]

## Files to Update
- [ ] `path/to/file1.tsx`
- [ ] `path/to/file2.tsx`

## Required Changes
[Code examples or descriptions]

## Testing
```bash
# Commands to verify fix
npm run audit:navigation
```

## Success Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] No visual regressions

## Related
- Audit Report: [UI_PHASE3_NAVIGATION_ACCESSIBILITY_AUDIT.md](../docs/UI_REDESIGN/UI_PHASE3_NAVIGATION_ACCESSIBILITY_AUDIT.md)
- Parent Issue: #122
- Grand-parent: #59
```

---

**Document Status:** ✅ Complete - Ready for Issue Creation  
**Last Updated:** November 22, 2025  
**Next Step:** Create GitHub issues for each remediation task
