# Account-Free Team Creation Feature

## Overview

Marathon Majors Fantasy League now supports **account-free team creation and management**. Users can create teams, join games, and compete without traditional account registration. This feature provides a frictionless experience while maintaining security and data persistence through anonymous sessions.

## Key Features

### 🎯 No Account Required
- Create and manage teams without email/password registration
- Share unique URLs instead of account credentials
- Perfect for casual games with friends

### 🔗 Unique Session URLs
- Each user gets a cryptographically secure unique URL
- URLs are tied to specific roles (commissioner or player)
- Sessions persist for 90 days by default
- Can be bookmarked or saved to mobile home screen

### 💾 Session Persistence
- Sessions stored in browser localStorage
- Survives browser restarts and tab closures
- Auto-restore session on page reload
- Session tokens included automatically in API requests

### 🔒 Security Features
- UUIDs generated via PostgreSQL's `gen_random_uuid()` (256-bit)
- IP address and user agent tracking
- Session expiration with configurable duration
- Access control on all protected endpoints
- Hard-to-guess tokens prevent unauthorized access

### ♻️ Upgrade Path
- Anonymous sessions can be upgraded to user accounts later
- Game data preserved during account migration
- No data loss when transitioning to authenticated users

### 🔄 Backward Compatibility
- Legacy "kipchoge" password system still works
- Existing games unaffected by new feature
- Gradual migration path for users
- Can use both systems in parallel

## How It Works

### For Commissioners

1. **Create Anonymous Session**
   - Click "Commissioner Mode" button
   - Leave password blank (or use legacy password)
   - System generates unique commissioner URL
   - Save/bookmark the URL to return later

2. **Generate Player Links**
   - Set number of players (2-4)
   - Click "Generate Player Codes"
   - System creates unique URL for each player
   - Share URLs with friends via copy/paste

3. **Manage Game**
   - All commissioner functions work with session
   - Run draft when rankings complete
   - Enter race results
   - Finalize winners

### For Players

1. **Join via Unique URL**
   - Click link shared by commissioner
   - Automatically logged in with session
   - No code entry required
   - Redirected to appropriate page

2. **Submit Rankings**
   - Rank 10 men and 10 women
   - Submit rankings
   - Wait for draft completion

3. **View Results**
   - Check drafted team
   - Follow live race results
   - See standings and winner

## Technical Architecture

### Database Schema

#### Anonymous Sessions Table
```sql
CREATE TABLE anonymous_sessions (
    id SERIAL PRIMARY KEY,
    session_token VARCHAR(255) UNIQUE NOT NULL,  -- UUID v4
    session_type VARCHAR(50) NOT NULL,  -- commissioner, player, spectator
    display_name VARCHAR(255),
    game_id VARCHAR(255),
    player_code VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    upgraded_to_user_id INTEGER REFERENCES users(id),
    upgraded_at TIMESTAMP
);
```

#### Games Table Enhancements
```sql
ALTER TABLE games ADD COLUMN anonymous_session_token VARCHAR(255);
ALTER TABLE games ADD COLUMN allow_anonymous_access BOOLEAN DEFAULT TRUE;
ALTER TABLE games ADD COLUMN anonymous_access_enabled_at TIMESTAMP;
```

#### User Games Table Enhancements
```sql
ALTER TABLE user_games ADD COLUMN anonymous_access_token VARCHAR(255);
ALTER TABLE user_games ADD COLUMN is_anonymous BOOLEAN DEFAULT FALSE;
```

### Team-Session Relationships (Migration 010)

#### Foreign Key Architecture
All team-related tables now have proper referential integrity with the `anonymous_sessions` table through `session_id` foreign keys:

**Affected Tables:**
- `salary_cap_teams` - Roster assignments for salary cap draft mode
- `draft_teams` - Team assignments for snake draft mode
- `player_rankings` - Athlete preference rankings

**Schema:**
```sql
-- Each table has this structure
ALTER TABLE salary_cap_teams ADD COLUMN session_id INTEGER;
ALTER TABLE salary_cap_teams ADD CONSTRAINT fk_salary_cap_teams_session 
    FOREIGN KEY (session_id) REFERENCES anonymous_sessions(id) ON DELETE CASCADE;
CREATE INDEX idx_salary_cap_teams_session_id ON salary_cap_teams(session_id);

-- Same pattern for draft_teams and player_rankings
```

#### CASCADE Delete Behavior
When a session is deleted (hard-delete), all related team data is automatically removed:

```
anonymous_sessions (id: 42)
  ↓ CASCADE DELETE
  ├─ salary_cap_teams (session_id: 42) → All roster assignments deleted
  ├─ draft_teams (session_id: 42) → All draft picks deleted
  └─ player_rankings (session_id: 42) → All preference rankings deleted
```

**Benefits:**
1. **Data Integrity**: Impossible to have orphaned team data
2. **Automatic Cleanup**: No manual deletion from multiple tables
3. **Simplified API**: Delete session, CASCADE handles the rest
4. **Data Quality**: Identified and cleaned up 6 orphaned rows during migration

#### Team Identification Best Practices

**Preferred: Use sessionToken**
```javascript
// Query by unique sessionToken
const session = await sql`
  SELECT * FROM anonymous_sessions 
  WHERE session_token = ${sessionToken}
`;

// Get team roster using session_id
const roster = await sql`
  SELECT * FROM salary_cap_teams 
  WHERE session_id = ${session[0].id}
`;
```

**Legacy: Use playerCode (backward compatible)**
```javascript
// Query by (gameId, playerCode) composite
const session = await sql`
  SELECT * FROM anonymous_sessions 
  WHERE game_id = ${gameId} AND player_code = ${playerCode}
`;
```

**Key Distinction:**
- `playerCode` = User-chosen display name (e.g., "RUNNER", "SWIFT")
- `sessionToken` = Globally unique identifier (UUID v4)
- `session_id` = Internal database primary key

**Why sessionToken is preferred:**
- **Globally unique**: No ambiguity, even across games
- **Secure**: Cryptographically random, hard to guess
- **Reliable**: Works even if playerCode is reused by suspended teams
- **Future-proof**: Compatible with user account system upgrade path

### API Endpoints

#### Session Management

**Create Session**
```http
POST /api/session/create
Content-Type: application/json

{
  "sessionType": "commissioner",  // or "player", "spectator"
  "displayName": "Player Name",   // optional
  "gameId": "default",            // optional
  "expiryDays": 90                // optional, default 90
}
```

**Verify Session**
```http
GET /api/session/verify?token={sessionToken}
```

**Extend Session**
```http
POST /api/session/extend
Content-Type: application/json

{
  "token": "uuid-token-here",
  "additionalDays": 90
}
```

#### Authenticated Requests

Sessions can be passed via query parameter or Authorization header:

**Query Parameter**
```http
GET /api/game-state?gameId=default&session=uuid-token
```

**Authorization Header**
```http
GET /api/game-state?gameId=default
Authorization: Bearer uuid-token
```

### Frontend Session Management

#### Session Storage
```javascript
// Session object structure
{
    token: "uuid-v4-token",
    type: "commissioner",  // or "player"
    expiresAt: "2025-01-27T00:00:00Z",
    displayName: "Player Name"
}
```

Sessions are stored in `localStorage` under key `marathon_fantasy_session`.

#### Auto-Detection Flow
1. Check URL for `?session=` parameter
2. If found, verify with backend
3. Save to localStorage if valid
4. Clean URL parameters
5. Auto-navigate to appropriate page

#### API Integration
```javascript
// Add session to headers
function getAPIHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (anonymousSession.token) {
        headers['Authorization'] = `Bearer ${anonymousSession.token}`;
    }
    return headers;
}

// Add session to URL
function addSessionToURL(url) {
    if (!anonymousSession.token) return url;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}session=${anonymousSession.token}`;
}
```

## Migration Guide

### Running Migration 004

**Prerequisites:**
- Migration 003 (User Account System) must be completed
- Database backup recommended

**Via Neon Console:**
1. Open Neon SQL editor
2. Copy contents of `migrations/004_anonymous_sessions.sql`
3. Execute SQL
4. Verify success messages

**Via psql:**
```bash
psql $DATABASE_URL -f migrations/004_anonymous_sessions.sql
```

**Via Node.js:**
```javascript
import { neon } from '@neondatabase/serverless';
import fs from 'fs';

const sql = neon(process.env.DATABASE_URL);
const migration = fs.readFileSync('./migrations/004_anonymous_sessions.sql', 'utf8');
await sql.unsafe(migration);
```

### Verification

Check that tables and functions were created:
```sql
-- Verify table exists
SELECT COUNT(*) FROM anonymous_sessions;

-- Verify all required functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'create_anonymous_session',
    'verify_anonymous_session',
    'cleanup_expired_anonymous_sessions',
    'upgrade_anonymous_session_to_user',
    'extend_anonymous_session'
  )
ORDER BY routine_name;
-- Should return 5 rows

-- Test session creation
SELECT * FROM create_anonymous_session('player', 'Test Player', 'default');
```

## Configuration

### Environment Variables

No additional environment variables required. Uses existing:
- `DATABASE_URL` - PostgreSQL connection string

### Session Settings

Default settings (can be customized in code):
- **Session Duration**: 90 days
- **Session Type**: commissioner, player, or spectator
- **Storage**: localStorage
- **Token Format**: UUID v4

### Cleanup Schedule

Expired sessions are automatically marked inactive. Run cleanup periodically:

**Manual Cleanup:**
```sql
-- Run this manually or via application cron job
SELECT cleanup_expired_anonymous_sessions();
```

**Automated Cleanup Options:**

1. **Via Node.js Application Cron:**
```javascript
// Example using node-cron
import cron from 'node-cron';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

// Run daily at 2 AM
cron.schedule('0 2 * * *', async () => {
  const result = await sql`SELECT cleanup_expired_anonymous_sessions()`;
  console.log(`Cleaned ${result[0].cleanup_expired_anonymous_sessions} sessions`);
});
```

2. **Via pg_cron Extension** (if available in your PostgreSQL instance):
```sql
-- Note: Requires pg_cron extension to be installed first
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule('cleanup-sessions', '0 2 * * *', 
  'SELECT cleanup_expired_anonymous_sessions()');
```

3. **Via External Cron Job:**
```bash
# Add to crontab: 0 2 * * * /path/to/cleanup.sh
psql $DATABASE_URL -c "SELECT cleanup_expired_anonymous_sessions();"
```

## User Experience Flows

### Commissioner Flow
```
1. Click "Commissioner Mode"
2. Leave password blank
3. Receive unique commissioner URL
4. Save/bookmark URL
5. Generate player links
6. Share links with players
7. Monitor ranking submissions
8. Run draft when ready
9. Enter race results
10. Finalize and crown winner
```

### Player Flow
```
1. Receive unique URL from commissioner
2. Click link
3. Automatically authenticated
4. Rank athletes (10 men + 10 women)
5. Submit rankings
6. Wait for draft
7. View drafted team
8. Follow live results
9. Celebrate victory!
```

## Security Best Practices

### For Developers
- Always validate session tokens on protected endpoints
- Use `hasCommissionerAccess()` for admin operations
- Use `hasPlayerAccess()` for player-specific operations
- Log security events to audit trail
- Rotate session secrets periodically
- Monitor for suspicious activity patterns

### For Users
- **Save your URLs** - Bookmark or screenshot
- **Don't share commissioner URLs** - Players get own links
- **Keep URLs private** - Anyone with URL has access
- **Check expiration** - Sessions expire after 90 days
- **Use HTTPS** - Ensure secure connection
- **Clear sessions** - Log out when using shared devices

## Troubleshooting

### Session Not Found
**Symptoms:** "Session not found" error
**Causes:** 
- Token expired (>90 days old)
- Session was revoked
- Invalid token in URL

**Solutions:**
- Generate new session via commissioner mode
- Check localStorage for valid session
- Verify URL wasn't truncated

### Access Denied
**Symptoms:** 403 Forbidden error
**Causes:**
- Wrong session type (player trying commissioner action)
- Session not associated with game
- Token doesn't match game commissioner

**Solutions:**
- Use correct URL for your role
- Re-generate session if needed
- Contact commissioner for new link

### Session Not Persisting
**Symptoms:** Need to re-authenticate on reload
**Causes:**
- localStorage disabled
- Private browsing mode
- Browser clearing storage

**Solutions:**
- Enable localStorage in browser
- Use normal browsing mode
- Don't clear browser data
- Save URL externally

## Future Enhancements

### Planned Features
- [ ] Session upgrade to user account UI
- [ ] Session upgrade API endpoint (`/api/session/upgrade`)
- [ ] Session expiry warning notifications
- [ ] Multi-device session sync
- [ ] Session revocation interface
- [ ] QR code generation for mobile sharing
- [ ] Push notifications for session events
- [ ] Session analytics dashboard

### Migration to User Accounts (Future)

When the session upgrade feature is implemented, users will be able to convert anonymous sessions to full accounts:

**Planned Frontend Flow:**
```javascript
// This endpoint will be implemented in a future update
await fetch('/api/session/upgrade', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionToken: anonymousSession.token,
    email: 'user@example.com',
    inviteCode: 'INVITE-CODE'  // During preview phase
  })
});
```

**Database Function Already Implemented:**
```sql
-- This function is already available via Migration 004
SELECT upgrade_anonymous_session_to_user(
  'session-token-here',
  123  -- user_id from newly created user account
);
```

The backend will automatically:
1. Create user account (via existing `/api/auth/register`)
2. Link session data to user (via `upgrade_anonymous_session_to_user`)
3. Preserve game associations
4. Transfer team ownership
5. Deactivate anonymous session

## Support

For issues or questions:
1. Check this documentation
2. Review migration guide
3. Check browser console for errors
4. Verify database migration completed
5. Create GitHub issue with:
   - Error messages
   - Steps to reproduce
   - Browser and OS details
   - Session token (redacted)

## License

MIT License - See [LICENSE](../LICENSE) file for details.

---

**Ready to play without accounts?** Just click "Commissioner Mode", leave the password blank, and start your game! 🏃‍♂️🎮
