# Feature Flags Testing Guide

## Quick Start

This guide demonstrates how to test navigation feature flags in your browser console.

## Prerequisites

1. Start development server:
   ```bash
   npm run dev
   ```

2. Open http://localhost:3000 in your browser

3. Open browser console (F12 or Cmd+Option+J on Mac)

## Console Commands

### View All Feature Flags

```javascript
getFeatureFlags();
```

**Output:** Table showing all feature flags with their status and descriptions.

### Check Navigation Flags

```javascript
// Check individual flags
__featureFlags.isEnabled('chakra_header');
__featureFlags.isEnabled('chakra_bottom_nav');
```

**Output:** `true` or `false` depending on rollout percentage and user cohort.

### Enable Navigation Flags (Testing)

```javascript
// Enable both navigation flags
toggleFeatureFlag('chakra_header', true);
toggleFeatureFlag('chakra_bottom_nav', true);

// Refresh page to see effect
window.location.reload();
```

**Expected:** After reload, you'll see Chakra UI navigation components.

### Disable Navigation Flags (Fallback Test)

```javascript
// Disable both navigation flags
toggleFeatureFlag('chakra_header', false);
toggleFeatureFlag('chakra_bottom_nav', false);

// Refresh page to see legacy navigation
window.location.reload();
```

**Expected:** After reload, you'll see legacy navigation from `public/app.js`.

### View Current Configuration

```javascript
// Export full feature flag state
console.log(__featureFlags.export());
```

**Output:** JSON with all flags, environment, user cohort, and timestamps.

### Clear Manual Overrides

```javascript
// Clear all manual toggles
__featureFlags.clearOverrides();

// Refresh to return to rollout percentage
window.location.reload();
```

## Testing Scenarios

### Scenario 1: Test New Navigation

```javascript
// 1. Enable both flags
toggleFeatureFlag('chakra_header', true);
toggleFeatureFlag('chakra_bottom_nav', true);

// 2. Reload page
window.location.reload();

// 3. Verify:
// - Navy header at top with logo and nav links
// - Bottom nav on mobile (<768px) with 4 items
// - No legacy navigation visible
// - Content has proper padding
```

### Scenario 2: Test Legacy Fallback

```javascript
// 1. Disable both flags
toggleFeatureFlag('chakra_header', false);
toggleFeatureFlag('chakra_bottom_nav', false);

// 2. Reload page
window.location.reload();

// 3. Verify:
// - Legacy header visible
// - Legacy mobile nav visible
// - No Chakra components
// - App functions normally
```

### Scenario 3: Test Mixed State (Header Only)

```javascript
// 1. Enable header, disable bottom nav
toggleFeatureFlag('chakra_header', true);
toggleFeatureFlag('chakra_bottom_nav', false);

// 2. Reload page
window.location.reload();

// 3. Verify:
// - Chakra header visible
// - Legacy mobile nav visible
// - Mixed navigation works correctly
```

### Scenario 4: Test Rollout Percentage

```javascript
// 1. Check if you're in the 10% rollout cohort
__featureFlags.isEnabled('chakra_header');
__featureFlags.isEnabled('chakra_bottom_nav');

// 2. If false, you can manually enable for testing
toggleFeatureFlag('chakra_header', true);
window.location.reload();

// 3. To simulate different users, clear session and reload
sessionStorage.removeItem('feature_flag_session_id');
window.location.reload();
```

## Visual Verification Checklist

When testing, verify these aspects:

### Header (Desktop ≥768px)
- [ ] Navy background (#161C4F)
- [ ] Logo + "Marathon Majors Fantasy League" text
- [ ] Navigation links: Home, My Team, Standings, Athletes
- [ ] Help and Commissioner links on right
- [ ] Logout button (gold outline)
- [ ] Active page has gold underline
- [ ] Scroll shadow appears after 10px scroll

### Header (Mobile <768px)
- [ ] Navy background
- [ ] Logo visible (compact)
- [ ] Hamburger menu button
- [ ] No navigation links (hidden)
- [ ] Height: 60px

### Bottom Nav (Mobile <768px only)
- [ ] Visible at bottom of screen
- [ ] 4 items: Home, Team, Standings, Athletes
- [ ] Icons + labels clear
- [ ] Active page highlighted (navy color)
- [ ] White background with gray border
- [ ] Height: 64px
- [ ] Touch targets: 60x60px

### Bottom Nav (Desktop ≥768px)
- [ ] Completely hidden
- [ ] No visual artifact
- [ ] No extra spacing

### Content Padding
- [ ] No content hidden under header
- [ ] No content hidden under bottom nav
- [ ] Proper spacing on all pages
- [ ] Responsive padding: 60px (mobile), 72px (tablet), 80px (desktop)

## Troubleshooting

### Issue: Console commands not found

**Solution:**
```javascript
// Verify feature flags are loaded
typeof __featureFlags !== 'undefined'  // Should return true
typeof getFeatureFlags === 'function'  // Should return true
```

If false, refresh the page - feature flags initialize on page load.

### Issue: Flags don't change after toggle

**Solution:**
```javascript
// Toggles only apply in memory - must reload page
toggleFeatureFlag('chakra_header', true);
window.location.reload();  // Required!
```

### Issue: Both old and new navigation visible

**Solution:**
This shouldn't happen, but if it does:

1. Check CSS hiding is working:
   ```javascript
   document.querySelector('#legacy-header')?.style.display
   // Should be 'none' when chakra_header is enabled
   ```

2. Clear overrides and test again:
   ```javascript
   __featureFlags.clearOverrides();
   window.location.reload();
   ```

### Issue: Can't see new navigation (10% rollout)

**Solution:**
```javascript
// You might not be in the 10% cohort
// Manually enable for testing:
toggleFeatureFlag('chakra_header', true);
toggleFeatureFlag('chakra_bottom_nav', true);
window.location.reload();
```

## Reporting Issues

If you find bugs during testing:

1. **Capture state:**
   ```javascript
   // Copy this output to bug report
   console.log(__featureFlags.export());
   ```

2. **Include screenshots:**
   - Mobile view (<768px)
   - Desktop view (≥1024px)
   - Console errors (if any)

3. **Steps to reproduce:**
   - Which flags were enabled
   - What page you were on
   - What action triggered the bug

## Next Steps

After testing:
1. Report findings to development team
2. Document any issues in GitHub
3. Proceed with gradual rollout plan (10% → 25% → 50% → 75% → 100%)

---

**Documentation:** See `docs/UI_REDESIGN/UI_PHASE3_FEATURE_FLAGS.md` for complete guide  
**Status:** Ready for internal testing  
**Last Updated:** November 22, 2025
