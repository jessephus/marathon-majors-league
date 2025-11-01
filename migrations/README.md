# Migration 003: User Account System

## Overview

This migration implements a comprehensive user account system with multi-factor authentication to replace the simple team code authentication system. It is part of **Phase 1** of Epic #43 - converting to an account-based user system.

## What This Migration Does

### Database Schema Changes

**New Tables Created (11 tables):**

1. **users** - Enhanced user accounts with authentication fields
2. **one_time_passwords** - SMS and email OTP management  
3. **magic_links** - Passwordless authentication via email
4. **user_profiles** - Extended user information and preferences
5. **totp_backup_codes** - Recovery codes for lost TOTP access
6. **user_games** - Enhanced league membership with team customization
7. **invite_codes** - Admin-controlled account creation
8. **invite_code_usage** - Invite code usage tracking
9. **user_sessions** - Session token management
10. **audit_log** - Security and compliance tracking

**Modified Tables:**

- **games** - Added `commissioner_user_id` and `requires_user_accounts` columns

**New Functions:**

- `soft_delete_user(user_id)` - Soft delete user accounts
- `cleanup_expired_auth_tokens()` - Cleanup expired OTPs, magic links, and sessions
- `user_has_valid_auth(user_id)` - Check if user has at least one valid auth method

### Authentication Methods Supported

1. **TOTP (Time-Based One-Time Password)**
   - Google Authenticator, Authy, etc.
   - QR code setup during registration
   - 6-digit time-based codes
   - Backup codes for recovery

2. **SMS One-Time Password**
   - 6-digit codes sent via SMS
   - 5-minute expiration
   - Rate limiting support
   - Requires Twilio or similar integration

3. **Magic Links (Email)**
   - Passwordless authentication
   - 15-minute expiration
   - Multiple purposes: login, verify email, reset TOTP, invitations
   - Cryptographically secure tokens

### Security Features

- **Email verification** required for full access
- **Phone verification** optional for SMS OTP
- **Session management** with 30-day default expiration
- **Audit logging** for all authentication events
- **Soft deletes** to preserve audit trail
- **Rate limiting** support via attempt tracking
- **IP and user agent tracking** for security monitoring

## Prerequisites

Before running this migration:

1. **Backup your database:**
   ```bash
   pg_dump $DATABASE_URL > backup_before_migration_003.sql
   ```

2. **Verify existing schema:**
   - Ensure migrations 001 and 002 have been applied
   - Check that base tables (`games`, `athletes`, etc.) exist

3. **Review the migration file:**
   - Read through `003_user_account_system.sql`
   - Understand what changes will be made

## Running the Migration

### Option 1: Via Neon Console (Recommended)

1. Log in to your Neon console
2. Navigate to your database
3. Go to SQL Editor
4. Copy and paste the contents of `migrations/003_user_account_system.sql`
5. Execute the SQL
6. Verify success messages in the output

### Option 2: Via psql Command Line

```bash
# Connect to your database
psql $DATABASE_URL

# Run the migration
\i migrations/003_user_account_system.sql

# Verify tables were created
\dt users
\dt one_time_passwords
\dt magic_links
\dt user_profiles
\dt user_games

# Verify functions were created
\df cleanup_expired_auth_tokens
\df user_has_valid_auth
\df soft_delete_user
```

### Option 3: Via Node.js Script

```javascript
import { neon } from '@neondatabase/serverless';
import fs from 'fs';

const sql = neon(process.env.DATABASE_URL);

const migrationSQL = fs.readFileSync('./migrations/003_user_account_system.sql', 'utf8');

await sql.unsafe(migrationSQL);
console.log('Migration 003 completed successfully!');
```

## Testing the Migration

After running the migration, verify it worked correctly:

```bash
# Run the migration test suite
node tests/migration-003.test.js
```

Expected output:
```
╔════════════════════════════════════════════════════════════╗
║   Migration 003: User Account System - Schema Tests       ║
╚════════════════════════════════════════════════════════════╝

✅ users table exists
✅ one_time_passwords table exists
✅ magic_links table exists
...
Total Tests: 65
Passed: 65 ✅
Failed: 0 ❌
Pass Rate: 100.0%

🎉 All migration tests passed! Migration 003 schema is correct. ✨
```

### Manual Verification

```sql
-- 1. Verify admin account was created
SELECT * FROM users WHERE email = 'admin@marathon-majors-league.com';

-- 2. Verify admin profile was created
SELECT * FROM user_profiles WHERE user_id = (
  SELECT id FROM users WHERE email = 'admin@marathon-majors-league.com'
);

-- 3. Test cleanup function
SELECT cleanup_expired_auth_tokens();

-- 4. Count tables created
SELECT count(*) 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'users', 'one_time_passwords', 'magic_links', 
  'user_profiles', 'totp_backup_codes', 'user_games',
  'invite_codes', 'invite_code_usage', 'user_sessions', 'audit_log'
);
-- Should return 10
```

## Post-Migration Steps

### 1. Update Admin Account

Replace the placeholder admin account with real credentials:

```sql
UPDATE users
SET email = 'your-email@example.com',
    display_name = 'Your Name'
WHERE email = 'admin@marathon-majors-league.com';
```

### 2. Generate Initial Invite Codes

Create invite codes for your initial users (preview phase):

```sql
-- Generate 10 single-use admin invite codes
INSERT INTO invite_codes (code, code_type, max_uses, created_by, expires_at)
SELECT 
  'PREVIEW-' || upper(substr(md5(random()::text), 1, 8)),
  'admin',
  1,
  id,
  CURRENT_TIMESTAMP + INTERVAL '30 days'
FROM users
WHERE is_admin = TRUE
LIMIT 10;

-- View generated codes
SELECT code, expires_at FROM invite_codes WHERE is_active = TRUE;
```

### 3. Update Application Configuration

Add these environment variables:

```env
# Session secret for token generation
SESSION_SECRET=your-random-secret-here

# TOTP encryption key (32 bytes, base64 encoded)
TOTP_ENCRYPTION_KEY=your-encryption-key-here

# Email service (SendGrid, AWS SES, etc.)
EMAIL_SERVICE_API_KEY=your-email-api-key

# SMS service (Twilio, etc.) - optional
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890
```

### 4. Enable User Accounts for New Games

```sql
-- New games will require user accounts by default
UPDATE games
SET requires_user_accounts = TRUE
WHERE created_at > CURRENT_TIMESTAMP;
```

## Rollback Procedure

⚠️ **WARNING:** Rolling back will DELETE all user account data!

If you need to rollback this migration:

```bash
# Option 1: Via psql
psql $DATABASE_URL -f migrations/003_user_account_system_rollback.sql

# Option 2: Via Neon Console
# Copy and paste contents of 003_user_account_system_rollback.sql
```

This will:
- Drop all user account tables
- Remove user account columns from games table
- Restore placeholder users and user_games tables
- Preserve existing game data

## Backward Compatibility

The migration maintains full backward compatibility:

### Legacy System Still Works

- **Team codes** - Existing team code system continues to function
- **Commissioner password** - "kipchoge" password still works
- **Existing games** - All existing games continue without modification
- **Player data** - No data loss or corruption

### Gradual Migration Strategy

The `games.requires_user_accounts` flag allows gradual rollout:

```sql
-- Existing games: legacy system
UPDATE games 
SET requires_user_accounts = FALSE 
WHERE created_at < CURRENT_TIMESTAMP;

-- New games: require user accounts
UPDATE games 
SET requires_user_accounts = TRUE 
WHERE created_at >= CURRENT_TIMESTAMP;

-- Specific game: enable user accounts
UPDATE games 
SET requires_user_accounts = TRUE 
WHERE game_id = 'my-game-id';
```

## Common Issues and Solutions

### Issue: Migration fails on games table

**Error:** `column "commissioner_user_id" already exists`

**Solution:** The migration uses `ADD COLUMN IF NOT EXISTS`, so this shouldn't happen. If it does:
```sql
-- Check if column exists
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'games' AND column_name = 'commissioner_user_id';

-- If it exists but migration still fails, drop and re-run
ALTER TABLE games DROP COLUMN commissioner_user_id;
-- Then re-run migration
```

### Issue: Cannot connect to database

**Error:** `Connection refused` or `Authentication failed`

**Solution:**
1. Verify DATABASE_URL is correct: `echo $DATABASE_URL`
2. Check Neon console for database status
3. Verify your IP is allowed in Neon security settings

### Issue: Function already exists

**Error:** `function "cleanup_expired_auth_tokens" already exists`

**Solution:** The migration uses `CREATE OR REPLACE FUNCTION`, so this shouldn't happen. If it does:
```sql
-- Drop functions manually
DROP FUNCTION IF EXISTS cleanup_expired_auth_tokens();
DROP FUNCTION IF EXISTS user_has_valid_auth(INTEGER);
DROP FUNCTION IF EXISTS soft_delete_user(INTEGER);
-- Then re-run migration
```

### Issue: Admin user already exists

**Error:** `duplicate key value violates unique constraint "users_email_key"`

**Solution:** The migration uses `ON CONFLICT DO NOTHING`, so this is safe to ignore. The existing admin user will be preserved.

## Performance Considerations

### Indexes

All critical query paths are indexed for optimal performance:

- Email lookups: `idx_users_email`
- Phone lookups: `idx_users_phone`
- Token verification: `idx_magic_links_token`, `idx_user_sessions_token`
- OTP validation: `idx_otp_code`
- Audit queries: `idx_audit_log_user_id`, `idx_audit_log_created`

### Query Performance Estimates

With proper indexes:
- User lookup by email: < 5ms
- Session validation: < 10ms
- OTP verification: < 15ms
- Audit log insertion: < 20ms

### Cleanup Recommendations

Run the cleanup function regularly (e.g., daily via cron):

```sql
-- Schedule this to run daily
SELECT cleanup_expired_auth_tokens();
```

Or set up a scheduled job in your application:

```javascript
// Example: Run daily at 2 AM
import { sql } from './db.js';

async function cleanupExpiredTokens() {
  const result = await sql`SELECT cleanup_expired_auth_tokens()`;
  console.log(`Cleaned up ${result[0].cleanup_expired_auth_tokens} expired tokens`);
}

// Schedule with node-cron or similar
```

## Next Steps

After completing this migration, proceed with:

1. **Phase 2: Authentication API Implementation**
   - Create API endpoints for user registration
   - Implement TOTP setup and verification
   - Add OTP generation and sending
   - Build magic link generation and verification
   - Add session management endpoints

2. **Phase 3: Frontend UI**
   - Account creation flow
   - Login page with auth method selection
   - TOTP setup wizard
   - Profile management
   - Team customization

3. **Phase 4: League Management**
   - League creation UI
   - Invitation flow
   - Member management
   - Role assignment

See [Issue #43](https://github.com/jessephus/marathon-majors-league/issues/43) for the complete epic roadmap.

## Documentation

For more detailed information:

- **Migration Guide**: [MIGRATION.md](../docs/MIGRATION.md) - Complete migration history and procedures
- **Architecture**: [ARCHITECTURE.md](../docs/ARCHITECTURE.md) - Authentication architecture details
- **Database Functions**: [db.js](../pages/api/db.js) - Helper functions for user account operations
- **Test Suite**: [migration-003.test.js](../tests/migration-003.test.js) - Automated schema verification

## Support

If you encounter issues:

1. Check this README for common issues
2. Review the test output for specific failures
3. Consult MIGRATION.md for detailed procedures
4. Check GitHub Issues for similar problems
5. Create a new issue with:
   - Error message
   - Steps to reproduce
   - Database version
   - Migration file version

## License

MIT License - See [LICENSE](../LICENSE) file for details.
