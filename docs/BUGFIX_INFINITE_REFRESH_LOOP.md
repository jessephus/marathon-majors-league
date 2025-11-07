# Bug Fix: Infinite Refresh Loop When Toggling Feature Flag

## Problem

When changing the `NEXT_PUBLIC_USE_NEW_WELCOME_CARD` environment variable and restarting the development server, the application would enter an infinite refresh loop with the following error:

```
Cannot read properties of null (reading 'addEventListener')
```

**Workaround:** Clearing browser cache (images and files) would temporarily fix the issue.

## Root Cause

The issue occurred due to a mismatch between the DOM structure and the JavaScript initialization code:

1. **`app.js` always loaded**: The `public/app.js` script was unconditionally loaded via `<Script>` tag in `pages/index.js` (line 94), regardless of the feature flag state.

2. **Different DOM structures**: 
   - When `USE_NEW_WELCOME_CARD = true`: The new WelcomeCard React component renders with a minimal structure (container, loading overlay, WelcomeCard, footer)
   - When `USE_NEW_WELCOME_CARD = false`: Legacy HTML renders via `getMainHTML()` with all the legacy page elements

3. **Missing DOM elements**: When the feature flag was ON, `app.js` would still run and call `setupEventListeners()` (line 293), which attempted to attach event listeners to elements like:
   - `landing-page` (line 297: `showPage('landing-page')`)
   - `create-team-btn` (line 361)
   - `close-team-modal` (line 363)
   - `home-button`, `commissioner-mode` (footer buttons)
   - And 30+ other legacy elements

4. **Null reference errors**: Since these elements didn't exist in the new welcome card structure, calling `.addEventListener()` on null elements threw errors.

5. **Infinite refresh**: The error during initialization likely triggered a React error boundary or dev server HMR (Hot Module Replacement) recovery, causing the page to reload, which triggered the error again, creating an infinite loop.

## Solution

### Primary Fix: Conditional Script Loading

Modified `pages/index.js` to **only load `app.js` when the feature flag is OFF** (legacy mode):

```javascript
{/* Load app.js only in legacy mode - it expects specific DOM structure */}
{!USE_NEW_WELCOME_CARD && <Script src="/app.js" strategy="afterInteractive" />}
<Script src="/salary-cap-draft.js" strategy="afterInteractive" />
```

**Location:** `pages/index.js`, lines 95-96

**Rationale:** 
- `app.js` contains vanilla JavaScript that manages the legacy HTML structure
- When using the new WelcomeCard React component, this legacy JavaScript is not needed
- By conditionally loading the script, we prevent the initialization errors entirely

### Secondary Fix: Guard Clause

Added a guard clause at the beginning of `public/app.js` to prevent execution if the legacy structure doesn't exist:

```javascript
// Guard: Only run this script if legacy HTML structure exists
// This prevents errors when the new WelcomeCard React component is active
if (typeof window !== 'undefined' && !document.getElementById('landing-page')) {
    console.log('[App.js] Legacy HTML structure not found, skipping initialization');
    // Exit immediately without setting up event listeners
} else {
    // All existing app.js code wrapped in this else block
}
```

**Location:** `public/app.js`, lines 1-4 (opening) and line 6474 (closing)

**Rationale:**
- Provides defense-in-depth protection
- Handles edge cases where `app.js` might be manually included or cached
- Fails gracefully with a console message instead of throwing errors
- Uses `landing-page` element as a sentinel to detect legacy HTML structure

## Testing

### Test Case 1: Toggle Feature Flag OFF → ON

1. Set `NEXT_PUBLIC_USE_NEW_WELCOME_CARD=false` in `.env.local`
2. Start dev server: `npm run dev`
3. Verify legacy HTML loads correctly
4. Stop server (Ctrl+C)
5. Set `NEXT_PUBLIC_USE_NEW_WELCOME_CARD=true` in `.env.local`
6. Start dev server again: `npm run dev`
7. **Expected:** New WelcomeCard renders without errors
8. **Expected:** No infinite refresh loop
9. **Expected:** Console shows: `[App.js] Legacy HTML structure not found, skipping initialization`

### Test Case 2: Toggle Feature Flag ON → OFF

1. Set `NEXT_PUBLIC_USE_NEW_WELCOME_CARD=true` in `.env.local`
2. Start dev server: `npm run dev`
3. Verify new WelcomeCard loads correctly
4. Stop server (Ctrl+C)
5. Set `NEXT_PUBLIC_USE_NEW_WELCOME_CARD=false` in `.env.local`
6. Start dev server again: `npm run dev`
7. **Expected:** Legacy HTML renders correctly
8. **Expected:** `app.js` loads and initializes event listeners
9. **Expected:** No console errors related to missing elements

### Test Case 3: Browser Cache Persistence

1. With feature flag ON (new welcome card), load the page
2. Open DevTools → Application → Clear site data (or manually clear cache)
3. Refresh the page
4. **Expected:** Page loads correctly without errors
5. Toggle feature flag OFF and restart server
6. Refresh the page (do NOT clear cache)
7. **Expected:** Legacy HTML loads correctly (old React chunks may be cached but app.js now conditionally loads)

## Files Modified

1. **pages/index.js**
   - Line 95-96: Added conditional loading of `app.js` based on feature flag
   - Comment added to explain why script is conditionally loaded

2. **public/app.js**
   - Lines 1-4: Added guard clause at file beginning
   - Line 6474: Closed guard clause at file end
   - All existing code wrapped in else block

## Related Issues

- Original bug report: Infinite refresh with "Cannot read properties of null" error
- Related to: PR #107 (SSR Landing Page Implementation)
- Feature flag: `NEXT_PUBLIC_USE_NEW_WELCOME_CARD`

## Additional Notes

### Why Not Add Null Checks to setupEventListeners()?

We could have added null checks to every `getElementById()` call in `setupEventListeners()`:

```javascript
const createTeamBtn = document.getElementById('create-team-btn');
if (createTeamBtn) {
    createTeamBtn.addEventListener('click', showTeamCreationModal);
}
```

**However, this approach was rejected because:**
1. **30+ checks needed**: There are 30+ event listeners to guard, making the code verbose
2. **Still unnecessary work**: Even with null checks, the entire script would still parse and execute for no reason
3. **Maintenance burden**: Future additions to `setupEventListeners()` would also need null checks
4. **Not idiomatic**: The better pattern is to only load scripts when they're actually needed
5. **Performance**: Conditional loading is more efficient than loading + checking + skipping

### Alternative Considered: Separate Initialization for Each Mode

Another approach would be to split `app.js` into:
- `app-legacy.js` - Legacy mode initialization
- `app-shared.js` - Shared utilities used by both modes

**This was not pursued because:**
1. The current fix is simpler and achieves the same goal
2. Future work will migrate away from legacy mode entirely (see PR #107)
3. Over-engineering for a transitional feature flag

## Prevention for Future Features

When adding new conditional rendering based on feature flags:

1. **Audit script dependencies**: Check what DOM elements each script expects
2. **Conditional script loading**: Use feature flags to conditionally load scripts
3. **Guard clauses**: Add defensive checks at script entry points
4. **Testing checklist**: Always test toggling feature flags with server restart

## Conclusion

The infinite refresh loop was caused by unconditional loading of `app.js`, which expected a legacy DOM structure that didn't exist when the new welcome card was active. The fix conditionally loads the script only when needed, with a secondary guard clause for defense-in-depth protection.

This bug highlighted the importance of carefully managing script dependencies during feature flag transitions, especially when mixing React components with legacy vanilla JavaScript.

---

**Bug Fixed:** January 2025  
**Related PR:** #107 (SSR Landing Page Implementation)  
**Feature Flag:** `NEXT_PUBLIC_USE_NEW_WELCOME_CARD`
