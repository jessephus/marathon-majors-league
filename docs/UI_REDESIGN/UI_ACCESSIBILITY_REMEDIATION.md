# Accessibility Remediation Tracking

**Created:** November 22, 2025  
**Related Issue:** [#121 - Phase 2: Design System & Tokens Setup](https://github.com/jessephus/marathon-majors-league/issues/121)  
**Parent Issue:** [#59 - Redesign UI](https://github.com/jessephus/marathon-majors-league/issues/59)  
**Audit Report:** [UI_ACCESSIBILITY_AUDIT_REPORT.md](./UI_ACCESSIBILITY_AUDIT_REPORT.md)  
**Status:** 📋 Planning

---

## Overview

This document tracks the remediation of accessibility issues identified in the November 2025 audit. The audit found a 74.6% pass rate (44/59 tests), with 12 failures and 3 warnings requiring attention.

**Goal:** Achieve 100% WCAG 2.1 AA compliance for all design tokens and components.

---

## Remediation Phases

### Phase 1: Documentation Updates ✅ COMPLETE
**Priority:** Critical  
**Timeline:** 1 week (Nov 22 - Nov 29, 2025)  
**Status:** ✅ Complete

- [x] Update `theme/colors.ts` with inline accessibility warnings
- [x] Add comprehensive accessibility section to `CORE_DESIGN_GUIDELINES.md`
- [x] Create color usage decision tree
- [x] Document line height usage guidelines
- [x] Document touch target size requirements
- [x] Add this audit report to documentation
- [x] Create automated testing script (`npm run audit:a11y`)

**Completion Date:** November 22, 2025

---

### Phase 2: Component Default Updates
**Priority:** High  
**Timeline:** 2 weeks (Dec 2 - Dec 13, 2025)  
**Owner:** Component Development Team  
**Status:** 📋 Planned

#### Tasks

##### 2.1 Alert Component
- [ ] Audit current Alert component implementation
- [ ] Update default text colors to use semantic.600 or semantic.700
- [ ] Update background colors to use semantic.50 or semantic.100
- [ ] Add accessible variants for all statuses (success, warning, error, info)
- [ ] Test with screen readers
- [ ] Update Storybook examples

**Current Issue:** Alert may default to semantic.500 for text, which fails WCAG AA on white.

**Solution:**
```tsx
// ✅ Good: Use darker shades for text
<Alert status="success">
  <AlertIcon />
  <Text color="success.700">Team saved successfully!</Text>
</Alert>
```

##### 2.2 Button Component
- [ ] Audit all button variants (solid, outline, ghost)
- [ ] Ensure all variants meet WCAG AA contrast
- [ ] Update gold button variant to use gold.700+ or navy background
- [ ] Test semantic color button variants
- [ ] Add touch target validation (minimum 44x44px on mobile)
- [ ] Update Storybook examples

**Current Issue:** Gold buttons on white may use gold.500-600, failing WCAG AA.

**Solution:**
```tsx
// ✅ Good: Use darker gold or navy background
<Button colorScheme="secondary" color="gold.700">
  Premium Feature
</Button>

// OR use gold on navy background
<Button bg="navy.900" color="gold.500">
  Premium Feature
</Button>
```

##### 2.3 Badge Component
- [ ] Audit badge color variants
- [ ] Update gold badge to use accessible combinations
- [ ] Test badge text readability at small sizes
- [ ] Ensure badges don't rely solely on color
- [ ] Update Storybook examples

**Current Issue:** Gold badges may use gold.500 on white, failing WCAG AA.

**Solution:**
```tsx
// ✅ Good: Use darker gold for text
<Badge colorScheme="secondary" color="gold.700">
  Premium
</Badge>

// OR use gold on dark background
<Badge bg="navy.900" color="gold.500">
  Premium
</Badge>
```

##### 2.4 Toast Component
- [ ] Audit toast notification colors
- [ ] Update text colors to use semantic.600 or semantic.700
- [ ] Update background colors for contrast
- [ ] Test toast visibility in bright conditions
- [ ] Update Storybook examples

##### 2.5 Form Components
- [ ] Audit Input, Select, Textarea components
- [ ] Ensure error states use accessible colors (error.600+)
- [ ] Ensure success states use accessible colors (success.600+)
- [ ] Test focus indicators visibility
- [ ] Validate touch target sizes on mobile
- [ ] Update Storybook examples

**Success Criteria:**
- [ ] All components meet WCAG AA by default
- [ ] Unit tests validate contrast ratios
- [ ] Storybook shows accessible variants
- [ ] Documentation includes accessibility notes

---

### Phase 3: Automated Testing Integration
**Priority:** Medium  
**Timeline:** 1 week (Dec 16 - Dec 20, 2025)  
**Owner:** DevOps Team  
**Status:** 📋 Planned

#### Tasks

##### 3.1 CI/CD Integration
- [ ] Create GitHub Actions workflow for accessibility testing
- [ ] Configure workflow to run on PRs touching `/theme` directory
- [ ] Configure workflow to run on PRs touching component files
- [ ] Set up automated comments on PRs with audit results
- [ ] Configure build to fail if new violations introduced

**Workflow File:** `.github/workflows/accessibility-audit.yml`
```yaml
name: Accessibility Audit

on:
  pull_request:
    paths:
      - 'theme/**'
      - 'components/**'
      - 'docs/CORE_DESIGN_GUIDELINES.md'

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run audit:a11y
      - name: Comment PR
        uses: actions/github-script@v6
        if: always()
        with:
          script: |
            const fs = require('fs');
            const results = JSON.parse(fs.readFileSync('docs/UI_REDESIGN/accessibility-audit-results.json'));
            // Post results as PR comment
```

##### 3.2 Metrics Dashboard
- [ ] Set up accessibility metrics tracking
- [ ] Create dashboard showing pass rate over time
- [ ] Track violations by category (color, typography, layout)
- [ ] Set up alerts for new violations

##### 3.3 Pre-commit Hooks
- [ ] Add Husky pre-commit hook for accessibility audit
- [ ] Configure to run only on theme/component changes
- [ ] Provide clear error messages for failures

**Success Criteria:**
- [ ] CI/CD runs audit automatically
- [ ] PRs show audit results in comments
- [ ] New violations block merges
- [ ] Team has visibility into trends

---

### Phase 4: Developer Education
**Priority:** Low  
**Timeline:** Ongoing (Starting Dec 2025)  
**Owner:** Developer Experience Team  
**Status:** 📋 Planned

#### Tasks

##### 4.1 Documentation & Training
- [ ] Create internal "Accessibility Best Practices" guide
- [ ] Host team training session on WCAG 2.1
- [ ] Record training video for async learning
- [ ] Create accessibility quick reference card
- [ ] Add accessibility section to onboarding docs

##### 4.2 Development Process
- [ ] Add accessibility checklist to PR template
- [ ] Create Slack bot for accessibility reminders
- [ ] Establish monthly accessibility office hours
- [ ] Set up accessibility champions program

##### 4.3 Resources
- [ ] Compile list of accessibility testing tools
- [ ] Create library of accessible component examples
- [ ] Document common accessibility patterns
- [ ] Create troubleshooting guide for common issues

**Success Criteria:**
- [ ] All developers understand WCAG AA requirements
- [ ] Accessibility considered in all design decisions
- [ ] Violations caught early in development
- [ ] Team proactively improves accessibility

---

## Issue Tracking

### High Priority Issues (Must Fix Before Phase 3)

#### Issue #1: Semantic Color 500 Shades Fail WCAG AA
**Status:** 📋 Documented, awaiting component updates  
**Severity:** High  
**Impact:** Users with low vision cannot read success/warning/error messages

**Affected Components:**
- Alert component
- Toast notifications
- Form validation messages
- Status indicators

**Remediation:**
1. Update Alert component to use semantic.600 or semantic.700 for text
2. Update Toast component to use semantic.600 or semantic.700 for text
3. Add unit tests validating contrast ratios
4. Update Storybook examples

**Timeline:** Phase 2 (Dec 2-13, 2025)

---

#### Issue #2: Gold 500-600 Fail on White
**Status:** 📋 Documented, awaiting component updates  
**Severity:** High  
**Impact:** Gold elements not visible to users with visual impairments

**Affected Use Cases:**
- Achievement badges
- Premium feature indicators
- Star ratings
- Gold accent buttons

**Remediation:**
1. Update Badge component to use gold.700+ for text on white
2. Update Button component to use gold on navy.900 background
3. Ensure gold elements paired with text labels
4. Add decorative-only markers for non-essential gold elements

**Timeline:** Phase 2 (Dec 2-13, 2025)

---

### Medium Priority Issues (Should Fix in Phase 3)

#### Issue #3: Line Height Tokens Below WCAG Recommendations
**Status:** ✅ Documented with usage guidelines  
**Severity:** Medium  
**Impact:** Reduced readability for users with cognitive disabilities

**Affected Tokens:**
- lineHeight="none" (1.0)
- lineHeight="tight" (1.25)
- lineHeight="snug" (1.375)

**Remediation:**
1. ✅ Document usage restrictions (headings only)
2. ✅ Recommend lineHeight="normal" (1.5) for body text
3. [ ] Consider increasing tight to 1.4, snug to 1.45
4. [ ] Add ESLint rule to warn against tight/snug on body text

**Timeline:** Phase 3 (Dec 2025) or later

---

#### Issue #4: spacing.10 Below Touch Target Minimum
**Status:** ✅ Documented with usage guidelines  
**Severity:** Medium  
**Impact:** Users with motor impairments may have difficulty tapping

**Affected Use Cases:**
- Small buttons
- Icon-only buttons
- Compact form fields

**Remediation:**
1. ✅ Document minimum 44x44px requirement
2. ✅ Recommend spacing.12 (48px) for interactive elements
3. [ ] Update Button component to enforce minimum size on mobile
4. [ ] Add visual regression tests for touch target sizes

**Timeline:** Phase 2 (Dec 2-13, 2025)

---

## Testing & Validation

### Automated Testing
- [x] Design token audit script created (`npm run audit:a11y`)
- [x] Watch mode for continuous validation (`npm run audit:a11y:watch`)
- [ ] CI/CD integration (GitHub Actions)
- [ ] Pre-commit hooks
- [ ] Metrics dashboard

### Manual Testing Checklist

**Before Each Release:**
- [ ] Run `npm run audit:a11y` and verify no new violations
- [ ] Test with NVDA screen reader (Windows)
- [ ] Test with VoiceOver (macOS/iOS)
- [ ] Test with TalkBack (Android)
- [ ] Validate keyboard navigation on all new features
- [ ] Check focus indicators on all interactive elements
- [ ] Verify text zoom to 200% doesn't break layout
- [ ] Test in high contrast mode
- [ ] Validate touch targets on actual mobile devices

**Browser Testing:**
- [ ] Chrome (Windows, macOS) + NVDA/VoiceOver
- [ ] Firefox (Windows, macOS) + NVDA/VoiceOver
- [ ] Safari (macOS) + VoiceOver
- [ ] Edge (Windows) + NVDA
- [ ] Safari (iOS) + VoiceOver
- [ ] Chrome (Android) + TalkBack

---

## Progress Tracking

### Overall Completion
- **Phase 1 (Documentation):** ✅ 100% (7/7 tasks)
- **Phase 2 (Components):** 📋 0% (0/15 tasks)
- **Phase 3 (Automation):** 📋 0% (0/6 tasks)
- **Phase 4 (Education):** 📋 0% (0/7 tasks)

**Total Progress:** 20% (7/35 tasks)

### WCAG Compliance Rate
- **Baseline (Nov 22, 2025):** 74.6% (44/59 tests)
- **Current:** 74.6% (44/59 tests)
- **Target:** 100% (59/59 tests)

### Issues Resolved
- **High Priority:** 0/2 resolved
- **Medium Priority:** 0/2 resolved
- **Total:** 0/4 resolved

---

## Timeline Summary

| Phase | Priority | Start Date | End Date | Duration | Status |
|-------|----------|------------|----------|----------|--------|
| Phase 1: Documentation | Critical | Nov 22, 2025 | Nov 22, 2025 | 1 day | ✅ Complete |
| Phase 2: Components | High | Dec 2, 2025 | Dec 13, 2025 | 2 weeks | 📋 Planned |
| Phase 3: Automation | Medium | Dec 16, 2025 | Dec 20, 2025 | 1 week | 📋 Planned |
| Phase 4: Education | Low | Dec 2025 | Ongoing | Ongoing | 📋 Planned |

**Estimated Total Duration:** 4 weeks (excluding ongoing Phase 4)

---

## Next Steps

### Immediate Actions (This Week)
1. Review this remediation plan with project stakeholders
2. Assign owners for Phase 2 component updates
3. Create GitHub issues for each component update task
4. Schedule kickoff meeting for Phase 2

### Week of Dec 2, 2025
1. Begin Phase 2 component updates
2. Start with Alert and Button components (most critical)
3. Create unit tests for contrast ratio validation
4. Update Storybook examples

### Week of Dec 9, 2025
1. Complete remaining component updates
2. Run full accessibility audit
3. Verify all high-priority issues resolved

### Week of Dec 16, 2025
1. Begin Phase 3 CI/CD integration
2. Create GitHub Actions workflow
3. Set up metrics dashboard
4. Configure pre-commit hooks

---

## Resources

### Tools
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Axe DevTools](https://www.deque.com/axe/devtools/) (Browser extension)
- [Lighthouse](https://developer.chrome.com/docs/lighthouse/) (Chrome DevTools)
- [NVDA Screen Reader](https://www.nvaccess.org/) (Windows)
- VoiceOver (macOS/iOS - built-in)

### Documentation
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [Chakra UI Accessibility](https://chakra-ui.com/docs/styled-system/style-props#accessibility)
- [A11y Project](https://www.a11yproject.com/)

### Internal Documentation
- [UI_ACCESSIBILITY_AUDIT_REPORT.md](./UI_ACCESSIBILITY_AUDIT_REPORT.md) - Full audit report
- [CORE_DESIGN_GUIDELINES.md](../CORE_DESIGN_GUIDELINES.md) - Design guidelines with a11y section
- [theme/colors.ts](../../theme/colors.ts) - Color tokens with accessibility warnings

---

## Sign-Off

**Prepared By:** Accessibility Audit Team  
**Date:** November 22, 2025  
**Status:** Awaiting Review

**Approval Required:**
- [ ] Project Owner
- [ ] Design System Lead
- [ ] Engineering Lead
- [ ] Accessibility Champion (TBD)

---

**Document Status:** 📋 Active  
**Last Updated:** November 22, 2025  
**Next Review:** After Phase 2 completion (December 2025)
