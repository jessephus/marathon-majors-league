# Landing Page SSR Migration

## Overview

This document describes the server-side rendering (SSR) implementation for the landing page with session-aware routing logic, part of the componentization migration effort.

## Feature Flag

The new SSR landing page is controlled by a feature flag:

```bash
NEXT_PUBLIC_USE_NEW_WELCOME_CARD=true
```

### Enabling the Feature

**Development:**
```bash
# In .env.local
NEXT_PUBLIC_USE_NEW_WELCOME_CARD=true

# Or inline
NEXT_PUBLIC_USE_NEW_WELCOME_CARD=true npm run dev
```

**Production (Vercel):**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add: `NEXT_PUBLIC_USE_NEW_WELCOME_CARD` = `true`
3. Redeploy

### Default Behavior

When the feature flag is **not set** or set to `false`, the application uses the legacy HTML-based landing page, maintaining full backward compatibility.

## Architecture

### New Components

#### `lib/session-utils.js`
Server-side utilities for session detection that work in both SSR and client-side contexts:

```javascript
import { detectSessionType, SessionType } from '../lib/session-utils';

// In getServerSideProps
const sessionType = detectSessionType(req.headers.cookie);

// Returns: SessionType.ANONYMOUS | SessionType.TEAM | SessionType.COMMISSIONER
```

**Functions:**
- `detectSessionType(cookies)` - Detects current session type from cookies/localStorage
- `getSessionFromURL(query)` - Extracts session token from URL query parameters
- `isValidSessionToken(token)` - Validates session token format (32+ characters)

#### `components/WelcomeCard.jsx`
React component for the landing page welcome section:

```jsx
<WelcomeCard 
  sessionType={SessionType.ANONYMOUS}
  onCreateTeam={handleCreateTeam}
/>
```

**Props:**
- `sessionType` - One of: `SessionType.ANONYMOUS`, `SessionType.TEAM`, `SessionType.COMMISSIONER`
- `onCreateTeam` - Callback function for team creation button

**Features:**
- Session-aware content rendering
- Inline critical CSS for faster first paint
- No global state dependencies
- Compatible with existing event handlers

### SSR Flow

```
1. User requests page (/)
   ↓
2. Next.js getServerSideProps executes server-side
   ↓
3. Server detects session type from:
   - Cookies (if set)
   - URL query parameter (?session=token)
   ↓
4. Server pre-renders appropriate content:
   - Anonymous: "Create a New Team" CTA
   - Team: "View My Team" button
   - Commissioner: "Go to Dashboard" button
   ↓
5. HTML sent to client (no flicker!)
   ↓
6. Client hydrates React components
   ↓
7. Additional session detection on client-side
   (checks localStorage which server can't access)
```

## Performance Improvements

### Critical CSS Inlining

The `WelcomeCard` component includes inline critical CSS to improve first paint time:

```jsx
const criticalStyles = {
  card: { /* styles */ },
  heading: { /* styles */ },
  // ... minimal styles for above-the-fold content
};
```

**Expected improvements:**
- Faster First Contentful Paint (FCP)
- Reduced layout shift
- Better Core Web Vitals scores

### HTML Size

- **Legacy mode**: 57.78 KB (gzipped)
- **New mode**: Similar size (minimal overhead)

## Testing

Run the SSR-specific tests:

```bash
# Start dev server
npm run dev

# In another terminal, run tests
node tests/landing-page-ssr.test.js
```

**Test Coverage:**
- Session detection utilities (4 tests)
- WelcomeCard component rendering (1 test)
- SSR page rendering (4 tests)
- Session-aware routing (2 tests)
- Feature flag support (1 test)
- No client-side flicker (2 tests)
- Backward compatibility (2 tests)
- Performance optimization (2 tests)

**Total: 18 tests**

## Migration Guide

### For Developers

1. **Review the implementation:**
   - Read `lib/session-utils.js` to understand session detection
   - Review `components/WelcomeCard.jsx` for the React component
   - Check `pages/index.js` for SSR integration

2. **Test locally:**
   ```bash
   NEXT_PUBLIC_USE_NEW_WELCOME_CARD=true npm run dev
   ```

3. **Verify backward compatibility:**
   ```bash
   # Without flag (default)
   npm run dev
   
   # Ensure landing page still works
   ```

4. **Run tests:**
   ```bash
   node tests/landing-page-ssr.test.js
   ```

### For Production Deployment

1. **Enable in staging first:**
   - Set `NEXT_PUBLIC_USE_NEW_WELCOME_CARD=true` in Vercel staging environment
   - Test all user flows
   - Verify analytics/tracking still works

2. **Monitor metrics:**
   - Lighthouse scores (before/after)
   - Core Web Vitals
   - User session creation rate
   - Error rates

3. **Rollout to production:**
   - Enable feature flag in production environment
   - Monitor for 24-48 hours
   - Roll back if issues detected

## Compatibility

### Backward Compatibility

✅ **Fully compatible** with existing functionality:
- All legacy page sections maintained
- Event handler IDs unchanged
- Modal dialogs work identically
- Footer buttons function the same
- Game state management unaffected

### Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Next.js SSR supported environments
- JavaScript required for full functionality
- Progressive enhancement for basic content

## Troubleshooting

### Issue: Hydration Mismatch Warning

**Symptom:** Console warning about server/client HTML mismatch

**Solution:**
- Ensure feature flag is consistent between build and runtime
- Check that session detection logic is identical on server and client
- Verify no browser-only APIs used in SSR code

### Issue: Session Not Detected on First Load

**Symptom:** User shows as anonymous despite having session cookie

**Solution:**
- Verify cookie names match: `marathon_fantasy_team`, `marathon_fantasy_commissioner`
- Check cookie expiration dates
- Ensure cookies are HTTP-accessible (not `HttpOnly`)

### Issue: Feature Flag Not Working

**Symptom:** Changes not visible after setting environment variable

**Solution:**
- Restart dev server after changing `.env.local`
- In production, redeploy after changing Vercel environment variables
- Verify variable name: `NEXT_PUBLIC_USE_NEW_WELCOME_CARD` (must start with `NEXT_PUBLIC_`)

## Future Enhancements

1. **Remove `showPage()` dependency** - Replace with Next.js routing
2. **Add Lighthouse CI** - Automated performance monitoring
3. **Implement more components** - Extend pattern to other pages
4. **Add A/B testing** - Compare old vs new implementation
5. **Optimize bundle size** - Code splitting for component

## References

- [Issue #82: Componentization](https://github.com/jessephus/marathon-majors-league/issues/82)
- [PROCESS_MONOLITH_AUDIT.md](./PROCESS_MONOLITH_AUDIT.md)
- [Next.js SSR Documentation](https://nextjs.org/docs/basic-features/data-fetching/get-server-side-props)
- [Next.js Script Component](https://nextjs.org/docs/api-reference/next/script)
