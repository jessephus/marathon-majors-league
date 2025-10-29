# Migration 004: Anonymous Sessions - Quick Start

## What This Does

Adds account-free team creation and management via anonymous sessions. Users can create and join games using unique URLs without traditional account registration.

## Prerequisites

- Migration 003 (User Account System) must be completed
- Database backup recommended

## Quick Run

### Via Neon Console
1. Copy contents of `004_anonymous_sessions.sql`
2. Paste into Neon SQL Editor
3. Execute

### Via psql
```bash
psql $DATABASE_URL -f migrations/004_anonymous_sessions.sql
```

### Via Node.js
```javascript
import { neon } from '@neondatabase/serverless';
import fs from 'fs';

const sql = neon(process.env.DATABASE_URL);
const migration = fs.readFileSync('./migrations/004_anonymous_sessions.sql', 'utf8');
await sql.unsafe(migration);
console.log('✅ Migration 004 completed');
```

## Verify Installation

```sql
-- Check table created
SELECT COUNT(*) FROM anonymous_sessions;

-- Check functions created
\df *anonymous_session*

-- Test session creation
SELECT * FROM create_anonymous_session('player', 'Test', 'default');
```

## What Gets Created

### Tables
- `anonymous_sessions` - Session token storage

### Functions
- `create_anonymous_session()` - Generate new session
- `verify_anonymous_session()` - Validate token
- `cleanup_expired_anonymous_sessions()` - Remove old sessions
- `upgrade_anonymous_session_to_user()` - Convert to user account
- `extend_anonymous_session()` - Extend expiration

### Indexes
- Fast token lookups
- Game association queries
- Expiration checks

## Usage After Migration

### Create Commissioner Session
```sql
SELECT * FROM create_anonymous_session(
    'commissioner',    -- session type
    'My Name',        -- display name
    'default',        -- game ID
    NULL,             -- player code
    '192.168.1.1',   -- IP address
    'Mozilla/5.0',    -- user agent
    90                -- expiry days
);
```

### Verify Session
```sql
SELECT * FROM verify_anonymous_session('uuid-token-here');
```

### Cleanup Expired
```sql
SELECT cleanup_expired_anonymous_sessions();
```

## Frontend Integration

Sessions are automatically handled in `app.js`:
- Auto-detect from URL: `?session=uuid-token`
- Store in localStorage
- Include in API requests
- Auto-navigate based on role

## Troubleshooting

### Migration Fails
- Check prerequisites (Migration 003)
- Verify database connectivity
- Review error messages
- Check permissions

### Functions Not Found
- Ensure migration completed successfully
- Check function creation section
- Run `\df` to list functions

### Session Creation Fails
- Check UUID extension: `SELECT gen_random_uuid();`
- Verify table structure
- Check constraints

## Complete Documentation

See [docs/ACCOUNT_FREE_TEAMS.md](../docs/ACCOUNT_FREE_TEAMS.md) for:
- Complete feature guide
- Security best practices
- User flows
- API documentation
- Troubleshooting

## Rollback

If needed, anonymous sessions can be removed:
```sql
DROP TABLE anonymous_sessions CASCADE;
ALTER TABLE games DROP COLUMN anonymous_session_token;
ALTER TABLE games DROP COLUMN allow_anonymous_access;
ALTER TABLE user_games DROP COLUMN anonymous_access_token;
ALTER TABLE user_games DROP COLUMN is_anonymous;
```

## Support

Issues? Check:
1. This README
2. Main documentation
3. Migration file comments
4. GitHub Issues

---

**Ready to run?** Copy `004_anonymous_sessions.sql` to your Neon console and execute! ✅
