# Manual Testing Guide - PR #116: Extract Shared Utilities

**PR:** [#116 - Extract shared utilities and constants from monolithic app.js](https://github.com/jessephus/marathon-majors-league/pull/116)  
**Branch:** `copilot/extract-centralize-utils`  
**Type:** Code organization (no behavioral changes expected)

## Overview

This PR extracts formatting utilities and configuration constants from `public/app.js` into standalone modules while keeping the original functions in place. **No application behavior should change.**

## Quick Verification (5 minutes)

### ✅ Step 1: Verify New Modules Exist

Check that new files were created:

```bash
ls -la utils/formatting.js
ls -la config/constants.js
ls -la tests/formatting-utils.test.js
ls -la utils/README.md
ls -la config/README.md
ls -la PHASE_1_COMPLETION.md
```

**Expected:** All 6 files should exist.

---

### ✅ Step 2: Run Unit Tests

Run the comprehensive test suite:

```bash
npm run test:formatting
```

**Expected Output:**
```
✓ All tests passed!
Function Coverage: 100%
```

**What it tests:**
- 81 tests covering all 10 formatting functions
- Time formatting (hours:minutes:seconds)
- Pace calculations
- Ordinal numbers (1st, 2nd, 3rd)
- XSS escaping
- Country flags
- Record badges (WR/CR)

---

### ✅ Step 3: Verify App Still Works (No Regressions)

Start the development server:

```bash
npm run dev
```

Visit: `http://localhost:3000`

**Test Checklist:**

- [ ] **Landing page loads** without console errors
- [ ] **WelcomeCard displays** correctly (session-based cards)
- [ ] **Time formatting works** (e.g., "2:15:30" displays correctly)
- [ ] **Athlete cards show** properly formatted data
- [ ] **Country flags display** (🇺🇸 🇰🇪 🇪🇹)
- [ ] **No JavaScript errors** in browser console

---

### ✅ Step 4: Test Live App Features

#### 4a. Create a Team (Salary Cap Draft)

1. Click **"Create Team"** on landing page
2. Select 3 men and 3 women within $30K budget
3. Submit team

**Verify:**
- [ ] Budget tracker works (shows remaining budget)
- [ ] Athlete prices display correctly (e.g., "$7,500")
- [ ] Time formatting in athlete cards correct (PB times)
- [ ] No errors on submission

#### 4b. Check Results Page (if available)

If you have race results entered:

1. Visit leaderboard/results page
2. Check athlete finish times
3. Check time gap formatting

**Verify:**
- [ ] Finish times formatted as "2:15:30"
- [ ] Time gaps show as "+2:34" (minutes:seconds)
- [ ] Ordinals display correctly (1st, 2nd, 3rd)
- [ ] Points display correctly

---

### ✅ Step 5: Verify Documentation

Quick scan of updated docs:

```bash
head -50 utils/README.md
head -50 config/README.md
head -100 PHASE_1_COMPLETION.md
```

**Expected:**
- `utils/README.md` - Documents all 10 formatting functions with examples
- `config/README.md` - Documents all configuration constants
- `PHASE_1_COMPLETION.md` - Summary of Phase 1 work

---

## Deep Testing (Optional, 10 minutes)

### Test Formatting Functions Manually

Open browser console on any page and test:

```javascript
// These functions should still work from app.js
console.log(formatTimeGap(154));  // Should show: '+2:34'
console.log(getOrdinal(21));      // Should show: '21st'
console.log(formatTimeFromMs(8130000)); // Should show: '2:15:30'
```

**Expected:** All functions work as before (still in `app.js` for now).

---

### Test Edge Cases

1. **Very long times:** Enter a 5-hour marathon time → Should format correctly
2. **Sub-second precision:** Time like "2:05:30.789" → Should round to "2:05:31"
3. **Special ordinals:** Check 11th, 12th, 13th (not 11st, 12nd, 13rd)
4. **XSS protection:** Try entering `<script>alert('test')</script>` in team name → Should be escaped

---

## Regression Testing (Critical Paths)

### Game Flow Test

Complete end-to-end workflow:

1. ✅ Create new team with salary cap draft
2. ✅ View team roster (check formatting)
3. ✅ Check leaderboard (if results exist)
4. ✅ Verify all times display correctly
5. ✅ Check no console errors throughout

**Time:** ~3 minutes

---

## CI/CD Verification

Check GitHub Actions workflow:

1. Visit: https://github.com/jessephus/marathon-majors-league/pull/116
2. Scroll to CI checks
3. Verify **"Test Suite Results"** comment

**Expected:**
```
✅ Test Suite Results
Status: SUCCESS
Test Results (14/14 passed)

✅ State Manager Unit Tests
✅ State Manager Integration Tests
✅ Draft Validation Tests
✅ API Client Tests
✅ SSR Integration Tests
✅ Formatting Utilities Tests  ← NEW
✅ API Endpoint Tests
✅ Database Tests
...
```

---

## What to Look For (Red Flags)

### ❌ Problems That Should NOT Occur

1. **Broken time formatting** - Times show as "undefined" or malformed
2. **Missing country flags** - Show as "USA" instead of 🇺🇸
3. **Broken ordinals** - Shows "21th" instead of "21st"
4. **Console errors** - Any new JavaScript errors
5. **Layout issues** - Formatting changes broke CSS
6. **Performance regression** - App noticeably slower

### ✅ What IS Expected

1. **No visual changes** - App looks identical
2. **New test files** - But they don't run automatically in browser
3. **Same behavior** - Everything works exactly as before
4. **Clean console** - Only existing logs (no new errors)

---

## Success Criteria

- [ ] All 81 unit tests pass (`npm run test:formatting`)
- [ ] Landing page loads without errors
- [ ] Salary cap draft works (can create team)
- [ ] All time formatting displays correctly
- [ ] Country flags render properly
- [ ] No new console errors
- [ ] Documentation files exist and are readable
- [ ] CI/CD shows 14/14 tests passing

---

## Rollback Plan

If critical issues found:

```bash
# Switch back to main branch
git checkout main

# Or abort the PR
# (Don't merge PR #116)
```

**Note:** Since this PR only adds new files and updates docs (doesn't modify existing app.js behavior), rollback is very low-risk.

---

## Notes

- **No app.js changes:** Original functions remain in place (not removed)
- **Migration deferred:** Switching app.js to use new modules happens in Phase 4
- **Zero breaking changes:** This is purely additive/organizational
- **100% test coverage:** All 10 functions have comprehensive tests

---

## Estimated Testing Time

- **Quick Verification:** 5 minutes
- **Deep Testing:** 10 minutes (optional)
- **Total:** 5-15 minutes depending on thoroughness

---

**Last Updated:** November 11, 2025  
**Tester:** Jesse Geraci  
**Status:** Ready for review
