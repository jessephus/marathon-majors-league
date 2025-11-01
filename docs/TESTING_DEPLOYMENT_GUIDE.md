# Account-Free Team Creation - Testing & Deployment Guide

## Pre-Deployment Checklist

### 1. Database Migration
- [ ] Backup current database
- [ ] Run Migration 004 in Neon console
- [ ] Verify all tables and functions created
- [ ] Test session creation with SQL query
- [ ] Confirm no errors in migration logs

### 2. Environment Verification
- [ ] Confirm `DATABASE_URL` is set
- [ ] Verify Neon Postgres connection
- [ ] Check database has gen_random_uuid() support
- [ ] Ensure Migration 003 was completed successfully

### 3. Code Deployment
- [ ] Deploy to Vercel (or your hosting platform)
- [ ] Verify all API endpoints are accessible
- [ ] Check that static assets are served correctly
- [ ] Confirm no build errors

## Testing Plan

### Test 1: Anonymous Commissioner Session Creation
**Objective:** Verify commissioner can create game without password

**Steps:**
1. Open application homepage
2. Click "Commissioner Mode"
3. When prompted for password, leave blank and press OK
4. Verify alert shows unique commissioner URL
5. Copy and save the URL
6. Refresh the page
7. Verify you're automatically logged in as commissioner
8. Check localStorage for session data

**Expected Results:**
- ✅ Unique URL generated and displayed
- ✅ Session saved to localStorage
- ✅ Auto-navigated to commissioner page
- ✅ Session persists across page reload
- ✅ No errors in browser console

**Failure Scenarios:**
- ❌ Alert doesn't show URL → Check session creation API
- ❌ Not auto-logged in → Check session verification
- ❌ Session lost on reload → Check localStorage persistence

---

### Test 2: Player Link Generation
**Objective:** Verify unique player URLs are generated

**Steps:**
1. As commissioner, enter number of players (2-4)
2. Click "Generate Player Codes"
3. Verify unique URLs displayed for each player
4. Click "Copy Link" button for first player
5. Verify clipboard contains complete URL
6. Open copied URL in new incognito window
7. Verify auto-login as that player

**Expected Results:**
- ✅ Unique URL per player with session tokens
- ✅ Copy button works correctly
- ✅ Player auto-logged in via URL
- ✅ Different sessions for each player
- ✅ No cross-contamination between players

**Failure Scenarios:**
- ❌ Same URL for all players → Check session creation loop
- ❌ Copy button doesn't work → Check clipboard API
- ❌ Player not auto-logged in → Check session verification

---

### Test 3: Session Persistence
**Objective:** Verify sessions survive browser restarts

**Steps:**
1. Create commissioner session and save URL
2. Close all browser windows completely
3. Reopen browser
4. Navigate to saved URL
5. Verify auto-logged in as commissioner
6. Repeat for player session

**Expected Results:**
- ✅ Commissioner session restored
- ✅ Player session restored
- ✅ Correct role assigned
- ✅ Auto-navigation works
- ✅ No re-authentication needed

**Failure Scenarios:**
- ❌ Session lost → Check localStorage not disabled
- ❌ Wrong role → Check session type validation
- ❌ Not auto-logged in → Check URL parameter parsing

---

### Test 4: Access Control
**Objective:** Verify session-based access control

**Steps:**
1. Create player session
2. Try to access commissioner functions:
   - Generate player codes
   - Run draft
   - Enter results
3. Verify all operations are blocked with 403 error
4. Create commissioner session
5. Verify commissioner can perform all operations

**Expected Results:**
- ✅ Player blocked from commissioner operations
- ✅ 403 Forbidden errors returned
- ✅ Commissioner can perform all operations
- ✅ Error messages are clear

**Failure Scenarios:**
- ❌ Player can run draft → Check hasCommissionerAccess
- ❌ No error shown → Check frontend error handling
- ❌ Commissioner blocked → Check session token passing

---

### Test 5: Backward Compatibility
**Objective:** Verify legacy password system still works

**Steps:**
1. Clear all sessions and localStorage
2. Click "Commissioner Mode"
3. Enter password "kipchoge"
4. Verify access to commissioner page
5. Verify all commissioner functions work
6. Test with both new and old systems in parallel

**Expected Results:**
- ✅ Legacy password "kipchoge" still works
- ✅ Commissioner page accessible
- ✅ All functions operational
- ✅ Can mix legacy and new sessions
- ✅ No conflicts between systems

**Failure Scenarios:**
- ❌ Password doesn't work → Check handleCommissionerMode
- ❌ Functions broken → Check API compatibility
- ❌ Systems conflict → Check session precedence logic

---

### Test 6: Complete Game Flow
**Objective:** End-to-end test of anonymous game

**Steps:**
1. Create commissioner session
2. Generate 3 player links
3. Open each link in different browsers/profiles
4. Each player ranks athletes and submits
5. Commissioner runs draft
6. Verify all players see their teams
7. Commissioner enters results
8. Verify standings update for all players
9. Commissioner finalizes results
10. Verify winner displayed

**Expected Results:**
- ✅ All players can join and rank
- ✅ Draft executes successfully
- ✅ Teams visible to all players
- ✅ Results update in real-time
- ✅ Winner correctly determined
- ✅ No data loss or conflicts

**Failure Scenarios:**
- ❌ Player can't submit rankings → Check session validation
- ❌ Draft fails → Check team assignment logic
- ❌ Results don't update → Check result submission API

---

### Test 7: Multi-Device Access
**Objective:** Verify same session works on multiple devices

**Steps:**
1. Create commissioner session on desktop
2. Copy unique URL
3. Open URL on mobile device
4. Verify auto-login works
5. Perform operation on mobile (e.g., generate codes)
6. Refresh on desktop
7. Verify changes visible on both devices

**Expected Results:**
- ✅ Session works on multiple devices
- ✅ Operations sync correctly
- ✅ No session conflicts
- ✅ Both devices show same data

**Failure Scenarios:**
- ❌ Mobile doesn't recognize session → Check URL parsing
- ❌ Changes don't sync → Check database updates
- ❌ Session conflicts → Check session token uniqueness

---

### Test 8: Session Expiration
**Objective:** Verify expired sessions are handled

**Steps:**
1. Create test session with 1-minute expiry (requires code change)
2. Wait for expiration
3. Try to perform operation
4. Verify appropriate error message
5. Verify ability to create new session

**Expected Results:**
- ✅ Expired session rejected
- ✅ Clear error message
- ✅ User can create new session
- ✅ No data corruption

**Failure Scenarios:**
- ❌ Expired session still works → Check expiry validation
- ❌ No error message → Check error handling
- ❌ Can't create new session → Check session creation API

---

## Performance Testing

### Load Test: Session Creation
**Objective:** Verify system handles multiple simultaneous sessions

**Test:**
```javascript
// Create 100 sessions concurrently
const promises = Array(100).fill(0).map((_, i) => 
  fetch('/api/session/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionType: 'player',
      displayName: `Player ${i}`,
      gameId: 'load-test'
    })
  })
);

const results = await Promise.all(promises);
console.log(`Success: ${results.filter(r => r.ok).length}/100`);
```

**Expected Results:**
- ✅ All 100 sessions created successfully
- ✅ Response time < 500ms per session
- ✅ No duplicate tokens
- ✅ Database handles concurrent inserts

---

### Load Test: Session Verification
**Objective:** Verify verification performance

**Test:**
```javascript
// Verify 100 sessions concurrently
const promises = sessionTokens.map(token =>
  fetch(`/api/session/verify?token=${token}`)
);

const results = await Promise.all(promises);
console.log(`Valid: ${results.filter(r => r.ok).length}/100`);
```

**Expected Results:**
- ✅ All valid sessions verified
- ✅ Response time < 200ms per verification
- ✅ Last activity timestamp updated
- ✅ No database connection issues

---

## Security Testing

### Test: Token Uniqueness
**Objective:** Verify no duplicate tokens generated

**Steps:**
1. Create 1000 sessions
2. Extract all tokens
3. Check for duplicates
4. Verify all are valid UUIDs

**Expected Results:**
- ✅ No duplicate tokens
- ✅ All tokens are valid UUID v4 format
- ✅ Tokens are 36 characters (with hyphens)

---

### Test: Unauthorized Access
**Objective:** Verify security measures prevent unauthorized access

**Steps:**
1. Try to access protected endpoints without session
2. Try to access with invalid/expired session
3. Try to perform operations with wrong session type
4. Try SQL injection in session token parameter
5. Try to guess valid session tokens

**Expected Results:**
- ✅ All unauthorized requests blocked
- ✅ 401/403 errors returned appropriately
- ✅ SQL injection prevented
- ✅ Tokens impossible to guess

---

## Production Deployment

### Pre-Deployment
1. Run all tests in staging environment
2. Verify migration 004 completed successfully
3. Backup production database
4. Review all code changes
5. Check for security vulnerabilities

### Deployment Steps
1. Deploy code to production
2. Monitor logs for errors
3. Test with real users
4. Monitor database performance
5. Check error rates

### Post-Deployment
1. Run smoke tests
2. Verify all features working
3. Monitor session creation rate
4. Check database growth
5. Set up automated cleanup cron job

### Rollback Plan
If issues occur:
1. Revert code deployment
2. Database migration is safe to keep (backward compatible)
3. Monitor for any stuck sessions
4. Clear localStorage if needed
5. Communicate with active users

---

## Monitoring

### Key Metrics to Track
- Session creation rate
- Session verification success rate
- Active sessions count
- Expired sessions cleanup frequency
- API response times
- Error rates by endpoint
- Database connection pool usage

### Alerts to Configure
- High session creation rate (potential abuse)
- High verification failure rate
- Database connection issues
- API errors > 5% threshold
- Disk space for session storage

---

## Troubleshooting

### Issue: Sessions not persisting
**Check:**
- localStorage is enabled in browser
- Not in private/incognito mode
- No browser extensions blocking localStorage
- Session token is valid UUID format

### Issue: Access denied errors
**Check:**
- Session token matches game
- Session type matches required role
- Session not expired
- Token passed correctly in API calls

### Issue: Session creation fails
**Check:**
- Database connection working
- gen_random_uuid() function available
- Migration 004 completed
- No constraints violated

---

## Success Criteria

✅ **Feature is ready for production when:**
- All 8 manual tests pass
- Load tests handle 100+ concurrent sessions
- Security tests show no vulnerabilities
- Backward compatibility verified
- Documentation complete
- Code review approved
- Database migration tested
- Monitoring in place

---

**Questions?** See [docs/ACCOUNT_FREE_TEAMS.md](ACCOUNT_FREE_TEAMS.md) for complete documentation.
