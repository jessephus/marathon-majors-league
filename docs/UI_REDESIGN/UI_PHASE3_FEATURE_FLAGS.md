# UI Phase 3: Navigation Feature Flags & Gradual Rollout

**Document Version:** 1.0  
**Created:** November 22, 2025  
**Phase:** 3 - Core Navigation Implementation (Feature Flags)  
**Status:** ✅ Complete  
**Related Issue:** Navigation Feature Flags & Gradual Rollout  
**Parent Issue:** [#122 - Core Navigation Implementation](https://github.com/jessephus/marathon-majors-league/issues/122)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Feature Flag System Overview](#feature-flag-system-overview)
3. [Navigation Feature Flags](#navigation-feature-flags)
4. [Implementation Architecture](#implementation-architecture)
5. [Rollout Strategy](#rollout-strategy)
6. [Testing Guide](#testing-guide)
7. [Troubleshooting](#troubleshooting)
8. [Next Steps](#next-steps)

---

## Executive Summary

Successfully implemented a feature flag system for Phase 3 navigation components, enabling **zero-downtime gradual rollout** of new Chakra UI navigation. The system supports A/B testing, percentage-based rollout, and instant fallback to legacy navigation.

### Key Achievements

✅ **Two Navigation Feature Flags** - `chakra_header` and `chakra_bottom_nav`  
✅ **Gradual Rollout** - Start at 10%, scale to 100% with monitoring  
✅ **Zero Downtime** - Seamless fallback to legacy navigation  
✅ **Developer Tools** - Console helpers for testing and debugging  
✅ **NavigationWrapper** - Smart component that handles flag logic  
✅ **Documentation** - Complete rollout plan and testing guide

---

## Feature Flag System Overview

### Architecture

The feature flag system is centralized in `/lib/feature-flags.ts` and provides:

1. **TypeScript Enum** - Type-safe flag definitions
2. **Configuration Registry** - Centralized flag settings
3. **Rollout Percentage** - Hash-based user distribution (0-100%)
4. **Environment Control** - Development, preview, production targeting
5. **User Allowlist** - Opt-in specific users for beta testing
6. **Manual Overrides** - Console commands for local testing
7. **React Hook** - `useFeatureFlag(flag)` for components

### Key Components

```typescript
// Feature flag definition
export enum FeatureFlag {
  CHAKRA_HEADER = 'chakra_header',
  CHAKRA_BOTTOM_NAV = 'chakra_bottom_nav',
  // ... other flags
}

// Configuration
const featureFlagRegistry = {
  [FeatureFlag.CHAKRA_HEADER]: {
    enabled: true,
    description: 'Replace legacy header with Chakra UI StickyHeader',
    rolloutPercentage: 10, // Start at 10%
    environment: ['development', 'production', 'preview'],
  },
  // ...
};

// React hook
const isEnabled = useFeatureFlag(FeatureFlag.CHAKRA_HEADER);
```

---

## Navigation Feature Flags

### 1. `chakra_header` Flag

**Purpose:** Enables new Chakra UI StickyHeader component  
**Default State:** Enabled with 10% rollout  
**Environments:** Development, preview, production  

**When Enabled:**
- Shows new Chakra UI StickyHeader component
- Hides legacy header via CSS
- Applies proper top padding (60px/72px/80px)
- Route-aware active states work
- Scroll shadow effect active

**When Disabled:**
- Falls back to legacy header from `public/app.js`
- No visual changes for users
- Zero downtime

### 2. `chakra_bottom_nav` Flag

**Purpose:** Enables new Chakra UI BottomNav component  
**Default State:** Enabled with 10% rollout  
**Environments:** Development, preview, production  

**When Enabled:**
- Shows new Chakra UI BottomNav on mobile (<768px)
- Hides legacy mobile navigation via CSS
- Applies proper bottom padding (64px on mobile only)
- Touch-optimized 60x60px targets
- Route-aware active states work

**When Disabled:**
- Falls back to legacy mobile navigation
- No visual changes for users
- Zero downtime

### Flag Synchronization

The flags are **independent** - you can roll out header and bottom nav separately:

- **Both enabled:** Full new navigation experience
- **Header only:** New header, legacy mobile nav
- **Bottom nav only:** Legacy header, new mobile nav
- **Both disabled:** Full legacy navigation

---

## Implementation Architecture

### Component Structure

```
pages/_app.tsx                              // App wrapper
└── <NavigationWrapper>                     // Feature flag wrapper
    ├── <StickyHeader />                    // If chakra_header enabled
    ├── <main>                              // Content with padding
    │   └── <Component {...pageProps} />   // Your page
    └── <BottomNav />                       // If chakra_bottom_nav enabled
```

### NavigationWrapper Logic

The `NavigationWrapper` component (`/components/navigation/NavigationWrapper.tsx`) handles:

1. **Feature Flag Detection**
   ```typescript
   const useChakraHeader = useFeatureFlag(FeatureFlag.CHAKRA_HEADER);
   const useChakraBottomNav = useFeatureFlag(FeatureFlag.CHAKRA_BOTTOM_NAV);
   ```

2. **Conditional Rendering**
   - Renders Chakra components when flags are enabled
   - Falls back to legacy navigation when disabled
   - Hides legacy navigation via CSS when Chakra is active

3. **Dynamic Padding**
   - Calculates top padding based on header presence
   - Calculates bottom padding based on bottom nav presence
   - Ensures no content overlap with fixed navigation

4. **CSS Hiding of Legacy Nav**
   ```jsx
   <style jsx global>{`
     #legacy-header { display: none !important; }
     #legacy-mobile-nav { display: none !important; }
   `}</style>
   ```

### Integration in _app.tsx

```tsx
// pages/_app.tsx
import { NavigationWrapper } from '@/components/navigation';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ChakraProvider value={system}>
      <NavigationWrapper>
        <Component {...pageProps} />
      </NavigationWrapper>
    </ChakraProvider>
  );
}
```

---

## Rollout Strategy

### Phase 1: Internal Testing (Week 1)

**Rollout Percentage:** 0% (manual overrides only)  
**Target:** Development team and QA testers  

**Actions:**
1. Deploy to staging environment
2. Use console commands to enable flags:
   ```javascript
   toggleFeatureFlag('chakra_header', true);
   toggleFeatureFlag('chakra_bottom_nav', true);
   ```
3. Test all pages and routes
4. Verify responsive behavior (mobile, tablet, desktop)
5. Test keyboard navigation and accessibility
6. Fix critical bugs

**Success Criteria:**
- ✅ Zero visual regressions
- ✅ All navigation links work
- ✅ Active states highlight correctly
- ✅ Responsive behavior matches spec
- ✅ Accessibility compliance (WCAG 2.1 AA)

### Phase 2: Beta Testing (Week 2)

**Rollout Percentage:** 10%  
**Target:** Random 10% of production users  

**Actions:**
1. Update rollout percentage in `lib/feature-flags.ts`:
   ```typescript
   rolloutPercentage: 10
   ```
2. Deploy to production
3. Monitor error rates (Sentry, Vercel Analytics)
4. Track user feedback and bug reports
5. Monitor Core Web Vitals (LCP, FID, CLS)
6. Fix non-critical bugs

**Success Criteria:**
- ✅ Error rate < 0.5%
- ✅ No increase in bounce rate
- ✅ Positive user feedback
- ✅ Core Web Vitals stable

**Rollback Plan:**
- If error rate > 1%, set `rolloutPercentage: 0` and redeploy
- If critical bugs found, disable flags entirely: `enabled: false`

### Phase 3: Gradual Expansion (Weeks 3-4)

**Rollout Schedule:**
- **Day 1-3:** 25% (increase from 10%)
- **Day 4-7:** 50% (increase from 25%)
- **Day 8-14:** 75% (increase from 50%)
- **Day 15+:** 100% (full rollout)

**Actions per increment:**
1. Update rollout percentage
2. Deploy to production
3. Monitor for 2-3 days
4. Check metrics (errors, feedback, vitals)
5. Proceed to next increment if stable

**Success Criteria:**
- ✅ Error rate remains < 0.5%
- ✅ User engagement stable or improved
- ✅ No critical bugs reported
- ✅ Core Web Vitals within targets

**Rollback at Any Stage:**
- Reduce rollout percentage if issues arise
- Disable flags entirely for critical bugs
- Revert to previous stable percentage

### Phase 4: Full Launch (Week 5)

**Rollout Percentage:** 100%  
**Target:** All users  

**Actions:**
1. Set `rolloutPercentage: 100` in both flags
2. Deploy to production
3. Monitor for 1 week
4. Collect final user feedback
5. Celebrate successful migration! 🎉

**Success Criteria:**
- ✅ 100% of users see new navigation
- ✅ Error rate < 0.5%
- ✅ User satisfaction high
- ✅ Core Web Vitals pass targets

### Phase 5: Legacy Cleanup (Week 6)

**After 100% rollout is stable:**

1. Remove feature flags from code:
   ```typescript
   // Remove conditional logic
   // Always render Chakra navigation
   ```
2. Delete legacy navigation code from `public/app.js`
3. Remove legacy CSS from `public/style.css`
4. Update documentation
5. Close related GitHub issues

---

## Testing Guide

### Local Development Testing

#### 1. Enable Flags Manually

Open browser console and run:

```javascript
// Enable both navigation flags
toggleFeatureFlag('chakra_header', true);
toggleFeatureFlag('chakra_bottom_nav', true);

// Refresh page to see changes
window.location.reload();
```

#### 2. Disable Flags Manually

```javascript
// Disable both flags
toggleFeatureFlag('chakra_header', false);
toggleFeatureFlag('chakra_bottom_nav', false);

// Refresh page to see legacy navigation
window.location.reload();
```

#### 3. View All Flag Status

```javascript
// Show table of all feature flags
getFeatureFlags();
```

#### 4. Test Specific User Experience

```javascript
// Simulate 10% rollout for current session
// Reload page multiple times to see different states
window.sessionStorage.removeItem('feature_flag_session_id');
window.location.reload();
```

### Automated Testing

#### Unit Tests (Future)

```typescript
// tests/navigation/feature-flags.test.tsx
describe('NavigationWrapper', () => {
  it('renders Chakra header when flag enabled', () => {
    // Mock feature flag
    jest.mock('@/lib/feature-flags', () => ({
      useFeatureFlag: (flag) => flag === 'chakra_header',
    }));
    
    // Test rendering
    const { getByRole } = render(<NavigationWrapper>Content</NavigationWrapper>);
    expect(getByRole('banner')).toBeInTheDocument();
  });
  
  it('hides Chakra header when flag disabled', () => {
    // Mock feature flag
    jest.mock('@/lib/feature-flags', () => ({
      useFeatureFlag: () => false,
    }));
    
    // Test rendering
    const { queryByRole } = render(<NavigationWrapper>Content</NavigationWrapper>);
    expect(queryByRole('banner')).not.toBeInTheDocument();
  });
});
```

#### Integration Tests (Future)

Use Playwright or Cypress to test:
- Navigation between pages
- Active state highlighting
- Responsive breakpoints
- Mobile bottom nav visibility
- Header scroll shadow effect

### Manual Testing Checklist

Before each rollout increment, verify:

- [ ] **Header Component**
  - [ ] Logo and wordmark visible
  - [ ] Navigation links work (Home, Team, Standings, Athletes)
  - [ ] Active page highlighted with gold underline
  - [ ] Help and Commissioner links work (desktop only)
  - [ ] Logout button visible (desktop only)
  - [ ] Hamburger menu button works (mobile only)
  - [ ] Scroll shadow appears after scrolling

- [ ] **Bottom Nav Component**
  - [ ] Visible on mobile (<768px) only
  - [ ] 4 navigation items rendered
  - [ ] Icons and labels clear
  - [ ] Active page highlighted with navy color
  - [ ] Touch targets adequate (60x60px)
  - [ ] Navigation works between pages

- [ ] **Responsive Behavior**
  - [ ] Test at 320px width (smallest mobile)
  - [ ] Test at 768px width (tablet breakpoint)
  - [ ] Test at 1024px+ width (desktop)
  - [ ] No content overlap with header/footer
  - [ ] Padding applied correctly

- [ ] **Accessibility**
  - [ ] Keyboard navigation works (Tab, Enter, Escape)
  - [ ] Focus indicators visible
  - [ ] Screen reader announces navigation landmarks
  - [ ] ARIA labels correct

- [ ] **Performance**
  - [ ] Page load time < 2 seconds
  - [ ] No layout shift when navigation loads
  - [ ] Smooth transitions (200ms)

---

## Troubleshooting

### Issue: Feature flag not working

**Symptoms:** Flag enabled but old navigation still showing

**Solution:**
1. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
2. Check rollout percentage (might be 0%)
3. Check environment (flag might be disabled for current env)
4. Verify user is in rollout cohort (check console for session ID)
5. Check browser console for errors

### Issue: Both old and new navigation visible

**Symptoms:** Double navigation (legacy + Chakra) showing

**Solution:**
1. Check CSS is hiding legacy nav (inspect element)
2. Verify `NavigationWrapper` is rendering correctly
3. Look for CSS specificity conflicts
4. Check if legacy nav has different class names than expected

### Issue: Content hidden under header/footer

**Symptoms:** Page content overlaps with fixed navigation

**Solution:**
1. Verify `NavigationWrapper` is applying padding
2. Check padding values match header/footer heights
3. Inspect element to see computed padding
4. Ensure no negative margins on page content

### Issue: Navigation not updating after flag change

**Symptoms:** Console toggle works but UI doesn't update

**Solution:**
1. Must refresh page after toggle (flags read on mount)
2. Use `window.location.reload()` after toggle
3. Feature flags are not reactive (by design for simplicity)

### Issue: High error rate after rollout

**Symptoms:** Error rate > 1% in production

**Solution:**
1. **Immediate:** Reduce rollout percentage to 0%
2. Check Sentry for error details
3. Check Vercel logs for server errors
4. Identify breaking pages/routes
5. Fix bugs in staging
6. Re-test before increasing rollout

### Issue: Users reporting inconsistent navigation

**Symptoms:** Some users see new nav, others see old nav

**Solution:**
1. **Expected behavior** during gradual rollout
2. Users are assigned to cohorts via session hash
3. Same user should see consistent experience
4. If truly inconsistent, check session storage persistence
5. Verify rollout percentage is stable

---

## Next Steps

### Immediate (Completed ✅)

- [x] Implement navigation feature flags
- [x] Create `NavigationWrapper` component
- [x] Integrate into `_app.tsx`
- [x] Document feature flag strategy
- [x] Update `UI_REDESIGN_ROADMAP.md`

### Short-Term (Week 1-2)

- [ ] Internal testing with development team
- [ ] Fix any bugs discovered during testing
- [ ] Prepare rollout plan for stakeholders
- [ ] Set up monitoring and alerting

### Medium-Term (Week 3-5)

- [ ] Execute gradual rollout (10% → 25% → 50% → 75% → 100%)
- [ ] Monitor metrics at each stage
- [ ] Collect user feedback
- [ ] Adjust rollout speed based on stability

### Long-Term (Week 6+)

- [ ] Achieve 100% rollout
- [ ] Monitor for 1 week after full launch
- [ ] Remove feature flags from code
- [ ] Delete legacy navigation code
- [ ] Close Phase 3 GitHub issues
- [ ] Celebrate successful migration! 🎉

---

## Console Helpers Reference

The feature flag system exposes these global helpers for debugging:

```javascript
// View all feature flags and their status
getFeatureFlags();

// Toggle a specific flag (for current session only)
toggleFeatureFlag('chakra_header', true);    // Enable
toggleFeatureFlag('chakra_header', false);   // Disable
toggleFeatureFlag('chakra_header');          // Toggle current state

// Access the feature flag manager directly
__featureFlags.isEnabled('chakra_header');   // Check status
__featureFlags.getAll();                     // Get all flags
__featureFlags.export();                     // Export state as JSON
__featureFlags.clearOverrides();             // Clear all manual overrides
```

---

## Metrics to Monitor

### During Rollout

1. **Error Rate**
   - Target: < 0.5%
   - Alert: > 1%
   - Monitor: Sentry, Vercel logs

2. **Core Web Vitals**
   - LCP (Largest Contentful Paint): < 2.5s
   - FID (First Input Delay): < 100ms
   - CLS (Cumulative Layout Shift): < 0.1
   - Monitor: Vercel Analytics, Chrome User Experience Report

3. **User Engagement**
   - Bounce rate: Should not increase
   - Session duration: Should stay stable or improve
   - Pages per session: Should stay stable or improve
   - Monitor: Google Analytics, Vercel Analytics

4. **User Feedback**
   - Positive feedback: Target > 80%
   - Bug reports: Target < 5%
   - Feature requests: Document for future phases

### Post-Launch (After 100%)

1. **Performance**
   - Bundle size: Verify no unexpected increase
   - Page load time: < 2 seconds
   - Time to interactive: < 3 seconds

2. **Adoption**
   - 100% of users see new navigation
   - Zero fallbacks to legacy navigation
   - Feature flags can be removed

3. **Business Metrics**
   - Team creation rate: Should improve
   - Return visitor rate: Should improve
   - User satisfaction: Survey results

---

## Related Documentation

- **Feature Flag System:** `/lib/feature-flags.ts`
- **NavigationWrapper:** `/components/navigation/NavigationWrapper.tsx`
- **StickyHeader:** `/components/navigation/StickyHeader/index.tsx`
- **BottomNav:** `/components/navigation/BottomNav/index.tsx`
- **Roadmap:** `/docs/UI_REDESIGN_ROADMAP.md` (Phase 3)
- **Navigation Spec:** `/docs/UI_REDESIGN/UI_PHASE2_NAVIGATION_SPEC.md`
- **StickyHeader Implementation:** `/docs/UI_REDESIGN/UI_PHASE3_STICKYHEADER_IMPLEMENTATION.md`
- **BottomNav Implementation:** `/docs/UI_REDESIGN/UI_PHASE3_BOTTOMNAV_IMPLEMENTATION.md`

---

**Document Status:** Active implementation guide  
**Last Updated:** November 22, 2025  
**Next Review:** After Phase 1 rollout (10% → 25%)  
**Maintainer:** Development team
