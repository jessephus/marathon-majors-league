# Database Migration History

## Overview
This document summarizes the database migrations for the Marathon Majors Fantasy League application, tracking the evolution from a simple blob storage system to a full-featured user account system with relational database architecture.

## Migration Timeline

### Migration 1: Vercel Postgres → Vercel Blob Storage (Original)
**Date**: October 2024  
**Direction**: Postgres → Blob Storage  
**Reason**: Simplified deployment and reduced complexity

- **10 files modified**
- **175 lines added, 236 lines removed** (net reduction of 61 lines)
- **Code became simpler and more maintainable**

### Migration 2: Vercel Blob Storage → Neon Postgres
**Date**: October 2024  
**Direction**: Blob Storage → Neon Postgres  
**Reason**: Better data structure, query capabilities, and scalability

This migration restores relational database capabilities while using Neon's serverless PostgreSQL platform for better scalability and data management.

### Migration 3: User Account System (Current)
**Date**: October 2025  
**Direction**: Team Code System → Account-Based Authentication  
**Reason**: Modern user experience, security, and feature enablement

This migration implements a comprehensive user account system to replace the simple team code authentication. Key features:
- **Multi-factor Authentication**: TOTP (Google Authenticator), SMS OTP, and Magic Links
- **User Profiles**: Customizable team names, sponsors, and owner names
- **League Management**: Invitation system, role-based access control
- **Admin Controls**: Invite code system for controlled rollout during preview phase
- **Security**: Session management, audit logging, soft deletes
- **Backward Compatibility**: Legacy team codes supported during transition period

**Migration Files:**
- `migrations/003_user_account_system.sql` - Forward migration
- `migrations/003_user_account_system_rollback.sql` - Rollback script

**Related Issues:**
- Issue #13: Requirements for account-based user system
- Issue #43: Epic for phased conversion to user accounts

### Migration 010: Session-Based Team Identification
**Date**: November 2025  
**Direction**: PlayerCode Composite Keys → Session ID Foreign Keys  
**Reason**: Referential integrity, unique team identification, and automatic data cleanup

#### Problem Statement
Teams were identified by `(game_id, player_code)` composite key where `player_code` is a user-chosen string. The database constraint `unique_active_game_player` only ensures uniqueness among ACTIVE teams:

```sql
UNIQUE (game_id, player_code) WHERE is_active = true
```

This allowed multiple suspended teams to share the same `player_code`, creating ambiguity in delete/suspend operations. Additionally, there was no referential integrity between team tables and the `anonymous_sessions` table, leading to orphaned data when sessions were deleted.

#### Solution
Added `session_id` foreign key column to all three team-related tables:
- `salary_cap_teams`
- `draft_teams`
- `player_rankings`

All foreign keys reference `anonymous_sessions(id)` with `ON DELETE CASCADE` to ensure automatic cleanup of related data when a session is deleted.

#### Schema Changes

**salary_cap_teams:**
```sql
ALTER TABLE salary_cap_teams 
ADD COLUMN session_id INTEGER;

ALTER TABLE salary_cap_teams 
ADD CONSTRAINT fk_salary_cap_teams_session 
FOREIGN KEY (session_id) 
REFERENCES anonymous_sessions(id) 
ON DELETE CASCADE;

CREATE INDEX idx_salary_cap_teams_session_id 
ON salary_cap_teams(session_id);
```

**draft_teams:**
```sql
ALTER TABLE draft_teams 
ADD COLUMN session_id INTEGER;

ALTER TABLE draft_teams 
ADD CONSTRAINT fk_draft_teams_session 
FOREIGN KEY (session_id) 
REFERENCES anonymous_sessions(id) 
ON DELETE CASCADE;

CREATE INDEX idx_draft_teams_session_id 
ON draft_teams(session_id);
```

**player_rankings:**
```sql
ALTER TABLE player_rankings 
ADD COLUMN session_id INTEGER;

ALTER TABLE player_rankings 
ADD CONSTRAINT fk_player_rankings_session 
FOREIGN KEY (session_id) 
REFERENCES anonymous_sessions(id) 
ON DELETE CASCADE;

CREATE INDEX idx_player_rankings_session_id 
ON player_rankings(session_id);
```

#### Data Migration Process

**Backfill Process:**
1. Matched existing team records to sessions by `(game_id, player_code)` composite
2. Updated 192 rows in `salary_cap_teams` with correct `session_id`
3. Identified 6 orphaned rows with no matching session (from deleted test game)
4. Cleaned up orphaned rows: `DELETE FROM salary_cap_teams WHERE session_id IS NULL`

**Verification Queries:**
```sql
-- Check backfill results
SELECT 
  COUNT(*) as total,
  COUNT(session_id) as with_session_id,
  COUNT(*) - COUNT(session_id) as missing_session_id
FROM salary_cap_teams;
-- Result: 198 total, 192 with session_id, 6 missing

-- Identify orphaned data
SELECT game_id, player_code, team_name 
FROM salary_cap_teams 
WHERE session_id IS NULL;
-- Result: 6 rows from deleted "test-game" session
```

#### API Endpoint Changes

**Both `/api/session/delete` and `/api/session/hard-delete` now accept:**
- `sessionToken` (preferred) - Unique token from `anonymous_sessions.session_token`
- `gameId + playerCode` (legacy) - Backward compatibility for transition period

**Query Pattern:**
```javascript
// Preferred: Query by sessionToken
const session = await sql`
  SELECT * FROM anonymous_sessions 
  WHERE session_token = ${sessionToken}
`;

// Legacy fallback: Query by composite
const session = await sql`
  SELECT * FROM anonymous_sessions 
  WHERE game_id = ${gameId} 
  AND player_code = ${playerCode}
`;

// Update/delete by session.id (most reliable)
await sql`
  UPDATE anonymous_sessions 
  SET is_active = false 
  WHERE id = ${session.id}
`;
```

**Hard-Delete Simplification:**
Before Migration 010, hard-delete required manual deletion from multiple tables:
```javascript
// OLD: Manual deletion from each table
await sql`DELETE FROM salary_cap_teams WHERE game_id = ${gameId} AND player_code = ${playerCode}`;
await sql`DELETE FROM draft_teams WHERE game_id = ${gameId} AND player_code = ${playerCode}`;
await sql`DELETE FROM anonymous_sessions WHERE game_id = ${gameId} AND player_code = ${playerCode}`;
```

After Migration 010, CASCADE handles child table cleanup automatically:
```javascript
// NEW: Single delete, CASCADE does the rest
await sql`DELETE FROM anonymous_sessions WHERE id = ${sessionId}`;
// Automatically deletes related rows from salary_cap_teams, draft_teams, player_rankings
```

#### Frontend Changes

**TeamsOverviewPanel.tsx:**
- `handleSuspendTeam` signature changed: `(playerCode, teamName, isActive)` → `(sessionToken, teamName, isActive)`
- `handleHardDeleteTeam` signature changed: `(playerCode, teamName)` → `(sessionToken, teamName)`
- All button `onClick` handlers now pass `team.sessionToken` instead of `team.playerCode`
- Added validation: both handlers check `if (!sessionToken)` and show error if missing

**Request Body Changes:**
```javascript
// OLD: Pass gameId and playerCode
const response = await fetch('/api/session/delete', {
  method: 'POST',
  body: JSON.stringify({ gameId, playerCode })
});

// NEW: Pass only sessionToken
const response = await fetch('/api/session/delete', {
  method: 'POST',
  body: JSON.stringify({ sessionToken })
});
```

#### Benefits

1. **Referential Integrity**: Foreign key constraints ensure data consistency
2. **Unique Identification**: Each team has globally unique `session_id` and `session_token`
3. **Automatic Cleanup**: CASCADE deletes prevent orphaned roster data
4. **Simplified Operations**: Delete/suspend operations more reliable and less error-prone
5. **Backward Compatible**: Legacy `playerCode` method still works during transition period
6. **Data Quality**: Identified and cleaned up 6 orphaned rows during migration

#### Rollback Instructions

If rollback is needed:
```sql
-- Drop foreign key constraints
ALTER TABLE salary_cap_teams DROP CONSTRAINT IF EXISTS fk_salary_cap_teams_session;
ALTER TABLE draft_teams DROP CONSTRAINT IF EXISTS fk_draft_teams_session;
ALTER TABLE player_rankings DROP CONSTRAINT IF EXISTS fk_player_rankings_session;

-- Drop indexes
DROP INDEX IF EXISTS idx_salary_cap_teams_session_id;
DROP INDEX IF EXISTS idx_draft_teams_session_id;
DROP INDEX IF EXISTS idx_player_rankings_session_id;

-- Drop columns (optional - data loss)
ALTER TABLE salary_cap_teams DROP COLUMN IF EXISTS session_id;
ALTER TABLE draft_teams DROP COLUMN IF EXISTS session_id;
ALTER TABLE player_rankings DROP COLUMN IF EXISTS session_id;
```

**Migration Files:**
- `migrations/010_add_session_id_foreign_keys.sql` - Forward migration with backfill

**Affected Files:**
- Database: 3 tables (`salary_cap_teams`, `draft_teams`, `player_rankings`)
- API: 2 endpoints (`/api/session/delete.js`, `/api/session/hard-delete.js`)
- Frontend: 1 component (`components/commissioner/TeamsOverviewPanel.tsx`)

---

## Current State: User Account System with Neon Postgres

### Why Neon Postgres Was Chosen

#### Previous Option: Vercel Blob Storage ❌
**Issues identified:**
- Limited query capabilities (no complex filters or joins)
- No relational data integrity
- Difficult to implement advanced features (leaderboards, analytics)
- No support for user accounts and authentication
- Manual data consistency management

#### Current Solution: Neon Postgres ✅
**Selected because:**
- **Full relational database** with ACID compliance
- **Serverless architecture** - automatic scaling and cost efficiency
- **Zero cold starts** with Neon's architecture
- **PostgreSQL compatibility** - industry-standard SQL
- **Built-in connection pooling** for serverless functions
- **Future-ready** for user accounts and advanced features
- **Better data integrity** with foreign keys and constraints
- **Query optimization** with indexes and query planner
- **Vercel integration** - seamless setup via marketplace

---

## Technical Changes

### Data Storage Pattern

**Before (Blob Storage):**
```
Files: game-state.json, rankings.json, teams.json, results.json
Access: Direct fetch by path (fantasy-marathon/{gameId}/{type}.json)
```

**After (Neon Postgres):**
```
Tables: athletes, games, player_rankings, draft_teams, race_results
Access: SQL queries with indexes, joins, and transactions
```

### Database Schema

#### Core Tables

**athletes** - Elite runner profiles
```sql
CREATE TABLE athletes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    country CHAR(3) NOT NULL,
    gender VARCHAR(10) NOT NULL,
    personal_best VARCHAR(10) NOT NULL,
    headshot_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**games** - Game configuration
```sql
CREATE TABLE games (
    id SERIAL PRIMARY KEY,
    game_id VARCHAR(255) UNIQUE NOT NULL,
    players TEXT[] NOT NULL DEFAULT '{}',
    draft_complete BOOLEAN DEFAULT FALSE,
    results_finalized BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**player_rankings** - Player athlete preferences
```sql
CREATE TABLE player_rankings (
    id SERIAL PRIMARY KEY,
    game_id VARCHAR(255) NOT NULL,
    player_code VARCHAR(255) NOT NULL,
    gender VARCHAR(10) NOT NULL,
    athlete_id INTEGER NOT NULL REFERENCES athletes(id),
    rank_order INTEGER NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(game_id, player_code, gender, rank_order)
);
```

**draft_teams** - Post-draft assignments
```sql
CREATE TABLE draft_teams (
    id SERIAL PRIMARY KEY,
    game_id VARCHAR(255) NOT NULL,
    player_code VARCHAR(255) NOT NULL,
    athlete_id INTEGER NOT NULL REFERENCES athletes(id),
    drafted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(game_id, athlete_id)
);
```

**race_results** - Race finish times
```sql
CREATE TABLE race_results (
    id SERIAL PRIMARY KEY,
    game_id VARCHAR(255) NOT NULL,
    athlete_id INTEGER NOT NULL REFERENCES athletes(id),
    finish_time VARCHAR(10),
    is_final BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(game_id, athlete_id)
);
```

#### Future-Ready Tables

**users** - User account support (enhanced in Migration 003)
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20) UNIQUE,
    display_name VARCHAR(255),
    totp_secret VARCHAR(255),
    totp_enabled BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    is_admin BOOLEAN DEFAULT FALSE,
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);
```

**one_time_passwords** - SMS and email OTP authentication
```sql
CREATE TABLE one_time_passwords (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    otp_code VARCHAR(6) NOT NULL,
    delivery_method VARCHAR(20) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**magic_links** - Passwordless authentication via email
```sql
CREATE TABLE magic_links (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    token VARCHAR(255) UNIQUE NOT NULL,
    purpose VARCHAR(50) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**user_profiles** - Extended user information and preferences
```sql
CREATE TABLE user_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id),
    avatar_url TEXT,
    bio TEXT,
    preferred_auth_method VARCHAR(20),
    notification_preferences JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**user_games** - User-league associations (enhanced in Migration 003)
```sql
CREATE TABLE user_games (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    game_id VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    player_code VARCHAR(255),
    team_name VARCHAR(255),
    team_sponsor VARCHAR(255),
    owner_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, game_id)
);
```

**invite_codes** - Admin-controlled account creation
```sql
CREATE TABLE invite_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(255) UNIQUE NOT NULL,
    code_type VARCHAR(50) DEFAULT 'admin',
    max_uses INTEGER DEFAULT 1,
    current_uses INTEGER DEFAULT 0,
    created_by INTEGER REFERENCES users(id),
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);
```

**user_sessions** - Session token management
```sql
CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked BOOLEAN DEFAULT FALSE
);
```

**audit_log** - Security and compliance tracking
```sql
CREATE TABLE audit_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id VARCHAR(255),
    details JSONB,
    ip_address INET,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Benefits of Current Architecture

### 1. Better Data Modeling
- **Normalized structure** reduces data duplication
- **Foreign keys** ensure referential integrity
- **Indexes** improve query performance
- **Constraints** prevent invalid data

### 2. Advanced Queries
```sql
-- Get leaderboard with total times
SELECT 
    dt.player_code,
    SUM(EXTRACT(EPOCH FROM rr.finish_time::interval)) as total_seconds
FROM draft_teams dt
JOIN race_results rr ON dt.athlete_id = rr.athlete_id
WHERE dt.game_id = 'default'
GROUP BY dt.player_code
ORDER BY total_seconds ASC;

-- Get player's team with results
SELECT 
    a.name, a.country, a.pb,
    rr.finish_time
FROM draft_teams dt
JOIN athletes a ON dt.athlete_id = a.id
LEFT JOIN race_results rr ON dt.athlete_id = rr.athlete_id 
    AND dt.game_id = rr.game_id
WHERE dt.game_id = 'default' AND dt.player_code = 'RUNNER';
```

### 3. Scalability
- **Connection pooling** via Neon for serverless
- **Automatic scaling** based on usage
- **Read replicas** available for high traffic
- **Query optimization** with EXPLAIN ANALYZE

### 4. Future Features Enabled
- User authentication and accounts
- Historical game tracking
- Advanced analytics and statistics
- Multi-marathon support
- Social features (comments, reactions)

---

## Migration Guide

### For New Deployments

1. **Add Neon Integration** via Vercel Marketplace
2. **Run schema.sql** in Neon console
3. **Deploy application** to Vercel
4. **Seed data** by visiting `/api/init-db`

### For Existing Blob Storage Users

1. **Set up Neon database** following above steps
2. **Old data is not migrated** - users start fresh
3. **Remove blob storage** (optional, to save costs)
4. **Update bookmarks** to new deployment

### Local Development

```bash
# Pull DATABASE_URL from Vercel
vercel env pull

# Verify connection
vercel dev
# Visit http://localhost:3000/api/init-db
```

---

## API Changes

### New Endpoint
- **`/api/athletes`** - GET athletes from database instead of static JSON

### Modified Endpoints
All endpoints now use PostgreSQL instead of blob storage:
- `/api/game-state` - Uses `games` table
- `/api/rankings` - Uses `player_rankings` table  
- `/api/draft` - Uses `draft_teams` table
- `/api/results` - Uses `race_results` table
- `/api/init-db` - Initializes schema and seeds athletes

### Response Format
API responses remain backward compatible - same JSON structure maintained.

---

## Dependencies

### Added
- **@neondatabase/serverless** - Neon's serverless Postgres driver

### Removed
- **@vercel/blob** - No longer needed

---

## Performance Considerations

### Neon Advantages
- **Sub-50ms queries** with proper indexing
- **Auto-suspend** when idle (cost savings)
- **Instant activation** on request (no cold start)
- **Branching** for testing (Pro plan)

### Query Optimization
- Strategic indexes on frequently queried columns
- Minimal round trips using JOINs
- Connection pooling reduces overhead

---

## Security Improvements

### Database Security
- **Encrypted connections** (TLS by default)
- **SQL injection prevention** via parameterized queries
- **Row-level security** available (not currently used)
- **Audit logging** in Neon console

### Future Authentication
- Schema supports password hashing
- Email verification ready
- Role-based access control prepared

---

## Backup and Recovery

### Neon Features
- **Automatic backups** with point-in-time recovery
- **Retention policy** based on plan
- **Manual snapshots** available

### Data Export
```sql
-- Export all game data
COPY (SELECT * FROM games) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM race_results) TO STDOUT WITH CSV HEADER;
```

---

## Cost Analysis

### Neon Pricing (Free Tier)
- 3 GB storage (sufficient for thousands of games)
- Unlimited queries
- Auto-suspend (no idle costs)
- 1 project included

### Scaling Options
- **Pro plan**: More storage, branching, higher limits
- **Pay-as-you-go**: Only pay for actual usage

---

## Lessons Learned

### Migration 1 (Postgres → Blob)
- ✅ Simplified initial deployment
- ✅ Reduced infrastructure complexity
- ❌ Limited query capabilities
- ❌ Harder to add advanced features

### Migration 2 (Blob → Neon Postgres)
- ✅ Restored relational capabilities
- ✅ Serverless cost efficiency
- ✅ Future-proof architecture
- ✅ Better developer experience
- ✅ Production-ready scaling

---

## Conclusion

The current architecture combines:
- **Neon Postgres** - Serverless PostgreSQL for relational data
- **User Account System** - Multi-factor authentication with TOTP, SMS, and Magic Links
- **Backward Compatibility** - Legacy team code system still supported during transition

This provides the best balance of:
- **Simplicity** - Easy setup via Vercel integration
- **Power** - Full SQL capabilities for complex features
- **Security** - Modern authentication with audit logging
- **Scalability** - Automatic scaling with serverless
- **Cost** - Free tier for hobby projects, affordable scaling

This architecture supports the current game while being ready for future enhancements like user accounts, analytics, and multi-event support.

---

## Migration 003: User Account System - Detailed Guide

### Overview

Migration 003 transforms the application from a simple team code system to a modern account-based authentication platform. This enables:

1. **Secure Authentication** - Multiple authentication methods (TOTP, SMS, Magic Links)
2. **User Profiles** - Customizable team names, sponsors, and preferences
3. **League Management** - Invitation system with role-based access
4. **Admin Controls** - Restricted account creation for preview phase
5. **Audit Trail** - Complete security and compliance logging

### Database Schema Changes

#### New Tables Created (11 tables)

1. **users** - Enhanced with authentication fields
   - Email and phone number support
   - TOTP secret storage (encrypted)
   - Verification status tracking
   - Admin and staff roles
   - Soft delete support

2. **one_time_passwords** - SMS/Email OTP management
   - 6-digit numeric codes
   - Delivery method tracking
   - Expiration and usage status
   - Rate limiting support via attempts field

3. **magic_links** - Passwordless authentication
   - Secure token generation
   - Multiple purposes (login, verify, invite)
   - Expiration and single-use enforcement
   - Metadata for context storage

4. **user_profiles** - Extended user information
   - Avatar and bio
   - Timezone and location
   - Preferred authentication method
   - Notification preferences

5. **totp_backup_codes** - Recovery codes
   - Hashed backup codes for TOTP recovery
   - Single-use enforcement
   - Optional expiration

6. **user_games** - Enhanced league membership
   - User-to-league associations
   - Role management (commissioner, player, spectator)
   - Team customization (name, sponsor, owner)
   - Invitation tracking
   - Legacy player code support

7. **invite_codes** - Controlled account creation
   - Admin-generated invite codes
   - Usage limits and tracking
   - Expiration support
   - Metadata for context

8. **invite_code_usage** - Usage tracking
   - Links invite codes to users
   - IP and user agent logging
   - Prevents duplicate usage

9. **user_sessions** - Session management
   - Secure session tokens
   - Expiration tracking
   - Revocation support
   - Activity monitoring

10. **audit_log** - Security tracking
    - User action logging
    - Resource access tracking
    - IP and user agent capture
    - Compliance support

11. **race_records** (from Migration 002) - Record reference data
    - Course and world records
    - Gender-specific records
    - Verification status

#### Modified Tables

**games** - Added user account integration
- `commissioner_user_id` - Links commissioner to user account
- `commissioner_password` - Legacy password (backward compatibility)
- `requires_user_accounts` - Toggle for migration period

### Authentication Flow

#### 1. TOTP (Time-Based One-Time Password)

```sql
-- User setup flow
UPDATE users SET 
    totp_secret = '[encrypted_base32_secret]',
    totp_enabled = TRUE,
    totp_verified_at = CURRENT_TIMESTAMP
WHERE id = [user_id];

-- Login verification
SELECT totp_secret FROM users WHERE email = '[email]';
-- Application verifies TOTP code against secret
```

**Backup Codes:**
```sql
-- Generate 5-10 backup codes on TOTP setup
INSERT INTO totp_backup_codes (user_id, code_hash)
VALUES ([user_id], '[bcrypt_hash]');
```

#### 2. SMS One-Time Password

```sql
-- Generate and send OTP
INSERT INTO one_time_passwords (
    user_id, 
    otp_code, 
    delivery_method, 
    expires_at
) VALUES (
    [user_id],
    '[6_digit_code]',
    'sms',
    CURRENT_TIMESTAMP + INTERVAL '5 minutes'
);

-- Verify OTP
SELECT * FROM one_time_passwords
WHERE user_id = [user_id]
  AND otp_code = '[submitted_code]'
  AND delivery_method = 'sms'
  AND expires_at > CURRENT_TIMESTAMP
  AND used = FALSE;

-- Mark as used
UPDATE one_time_passwords 
SET used = TRUE, used_at = CURRENT_TIMESTAMP
WHERE id = [otp_id];
```

#### 3. Magic Link (Email)

```sql
-- Generate magic link
INSERT INTO magic_links (
    user_id,
    token,
    purpose,
    expires_at
) VALUES (
    [user_id],
    '[secure_random_token]',
    'login',
    CURRENT_TIMESTAMP + INTERVAL '15 minutes'
);

-- Verify magic link
SELECT * FROM magic_links
WHERE token = '[submitted_token]'
  AND expires_at > CURRENT_TIMESTAMP
  AND used = FALSE;

-- Mark as used
UPDATE magic_links
SET used = TRUE, used_at = CURRENT_TIMESTAMP
WHERE token = '[submitted_token]';
```

### League Invitation Flow

#### 1. Commissioner Creates League

```sql
-- Create game with user account requirement
INSERT INTO games (game_id, commissioner_user_id, requires_user_accounts)
VALUES ('[game_id]', [commissioner_user_id], TRUE);

-- Create user_games entry for commissioner
INSERT INTO user_games (user_id, game_id, role, status)
VALUES ([commissioner_user_id], '[game_id]', 'commissioner', 'active');
```

#### 2. Invite Players

```sql
-- Generate magic link for invitation
INSERT INTO magic_links (
    user_id,
    token,
    purpose,
    expires_at,
    metadata
) VALUES (
    [invitee_user_id],  -- Can be NULL for new users
    '[secure_token]',
    'invite',
    CURRENT_TIMESTAMP + INTERVAL '7 days',
    '{"game_id": "[game_id]", "invited_by": [commissioner_user_id]}'::jsonb
);

-- Track invitation
INSERT INTO user_games (
    user_id,
    game_id,
    role,
    status,
    invited_by,
    invited_at
) VALUES (
    [invitee_user_id],
    '[game_id]',
    'player',
    'invited',
    [commissioner_user_id],
    CURRENT_TIMESTAMP
);
```

#### 3. Player Accepts Invitation

```sql
-- Update status when player accepts
UPDATE user_games
SET status = 'active',
    joined_at = CURRENT_TIMESTAMP
WHERE user_id = [user_id] AND game_id = '[game_id]';

-- Mark magic link as used
UPDATE magic_links
SET used = TRUE, used_at = CURRENT_TIMESTAMP
WHERE token = '[submitted_token]';
```

### Admin Invite Code System

During preview/testing phase, new accounts require an admin invite code:

```sql
-- Admin creates invite code
INSERT INTO invite_codes (
    code,
    code_type,
    max_uses,
    created_by,
    expires_at
) VALUES (
    '[unique_code]',
    'admin',
    1,  -- Single use
    [admin_user_id],
    CURRENT_TIMESTAMP + INTERVAL '30 days'
);

-- User registers with invite code
-- 1. Verify code is valid
SELECT * FROM invite_codes
WHERE code = '[submitted_code]'
  AND is_active = TRUE
  AND current_uses < max_uses
  AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP);

-- 2. Create user account
INSERT INTO users (email, display_name, ...)
VALUES (...);

-- 3. Record invite code usage
INSERT INTO invite_code_usage (invite_code_id, user_id)
VALUES ([code_id], [new_user_id]);

-- 4. Increment usage counter
UPDATE invite_codes
SET current_uses = current_uses + 1
WHERE id = [code_id];
```

### Session Management

```sql
-- Create session on login
INSERT INTO user_sessions (
    user_id,
    session_token,
    expires_at,
    ip_address,
    user_agent
) VALUES (
    [user_id],
    '[secure_session_token]',
    CURRENT_TIMESTAMP + INTERVAL '30 days',
    '[ip_address]'::inet,
    '[user_agent]'
);

-- Validate session
SELECT * FROM user_sessions
WHERE session_token = '[token]'
  AND expires_at > CURRENT_TIMESTAMP
  AND revoked = FALSE;

-- Update activity
UPDATE user_sessions
SET last_activity = CURRENT_TIMESTAMP
WHERE session_token = '[token]';

-- Revoke session (logout)
UPDATE user_sessions
SET revoked = TRUE, revoked_at = CURRENT_TIMESTAMP
WHERE session_token = '[token]';
```

### Security Features

#### 1. Audit Logging

```sql
-- Log user action
INSERT INTO audit_log (
    user_id,
    action,
    resource_type,
    resource_id,
    details,
    ip_address,
    user_agent
) VALUES (
    [user_id],
    'LOGIN',
    'session',
    '[session_id]',
    '{"method": "totp", "success": true}'::jsonb,
    '[ip_address]'::inet,
    '[user_agent]'
);
```

#### 2. Cleanup Functions

```sql
-- Regularly cleanup expired tokens
SELECT cleanup_expired_auth_tokens();
-- Returns count of deleted records

-- Manual cleanup examples:
DELETE FROM one_time_passwords WHERE expires_at < CURRENT_TIMESTAMP - INTERVAL '7 days';
DELETE FROM magic_links WHERE expires_at < CURRENT_TIMESTAMP - INTERVAL '7 days';
DELETE FROM user_sessions WHERE expires_at < CURRENT_TIMESTAMP - INTERVAL '7 days';
```

#### 3. Soft Deletes

```sql
-- Soft delete user (preserves audit trail)
SELECT soft_delete_user([user_id]);

-- Or manually:
UPDATE users
SET deleted_at = CURRENT_TIMESTAMP,
    is_active = FALSE
WHERE id = [user_id];
```

### Migration Execution

#### Running the Migration

```sql
-- Connect to your Neon database
-- Run the migration file
\i migrations/003_user_account_system.sql

-- Verify tables created
\dt users
\dt one_time_passwords
\dt magic_links
\dt user_profiles
\dt user_games
\dt invite_codes
\dt user_sessions
\dt audit_log

-- Verify functions created
\df cleanup_expired_auth_tokens
\df user_has_valid_auth
\df soft_delete_user
```

#### Post-Migration Steps

1. **Update Admin Account**
   ```sql
   -- Update the placeholder admin account with real credentials
   UPDATE users
   SET email = 'your-actual-admin@email.com',
       display_name = 'Your Name'
   WHERE email = 'admin@marathon-majors-league.com';
   ```

2. **Generate Admin Invite Codes**
   ```sql
   -- Create invite codes for initial users
   INSERT INTO invite_codes (code, code_type, max_uses, created_by)
   SELECT 
       'PREVIEW-' || substr(md5(random()::text), 1, 8),
       'admin',
       1,
       id
   FROM users
   WHERE is_admin = TRUE
   LIMIT 10;
   ```

3. **Enable User Accounts for New Games**
   ```sql
   -- New games will require user accounts
   -- Existing games continue with legacy system
   UPDATE games
   SET requires_user_accounts = TRUE
   WHERE created_at > CURRENT_TIMESTAMP;
   ```

### Rollback Procedure

If you need to rollback this migration:

```sql
-- WARNING: This will delete ALL user account data!
\i migrations/003_user_account_system_rollback.sql

-- Verify rollback completed
\dt users
\dt user_games
-- Should show only the simple placeholder tables
```

**Important:** Make a database backup before running the migration:

```bash
# Using Neon CLI or pg_dump
pg_dump $DATABASE_URL > backup_before_migration_003.sql

# Or via Neon console: Settings > Operations > Backup
```

### Backward Compatibility

The migration maintains backward compatibility:

1. **Legacy Team Codes** - Still work for existing games
2. **Commissioner Password** - "kipchoge" remains default
3. **Games Table** - `requires_user_accounts` flag allows gradual rollout
4. **Player Code Support** - `user_games.player_code` links to legacy system

**Transition Strategy:**
- **Phase 1**: Run migration, create user accounts (this phase)
- **Phase 2**: Implement authentication flows
- **Phase 3**: Add UI for account creation and login
- **Phase 4**: Migrate existing users to accounts (optional)
- **Phase 5**: Deprecate team code system (future)

### Performance Considerations

#### Indexes

All critical query paths are indexed:
- Email and phone lookups (users)
- Token verification (magic_links, user_sessions)
- OTP validation (one_time_passwords)
- Audit queries (audit_log)
- League membership (user_games)

#### Query Performance

Estimated query times (with proper indexes):
- User lookup by email: < 5ms
- Session validation: < 10ms
- OTP verification: < 15ms
- Audit log insertion: < 20ms

#### Cleanup Strategy

Run cleanup function regularly (e.g., daily cron):
```sql
-- Add to scheduled job
SELECT cleanup_expired_auth_tokens();
```

### Security Best Practices

1. **Encrypt TOTP Secrets** - Never store plaintext
2. **Hash Backup Codes** - Use bcrypt or argon2
3. **Secure Tokens** - Use crypto-grade randomness (32+ bytes)
4. **Rate Limiting** - Implement at application layer
5. **IP Tracking** - Monitor for suspicious patterns
6. **Audit Everything** - Log all auth-related actions
7. **Session Expiry** - Enforce reasonable timeouts
8. **Email Verification** - Required before full access

### Testing the Migration

```sql
-- Test 1: Create test user with TOTP
INSERT INTO users (email, display_name, totp_enabled, email_verified)
VALUES ('test@example.com', 'Test User', TRUE, TRUE)
RETURNING id;

-- Test 2: Generate OTP
INSERT INTO one_time_passwords (user_id, otp_code, delivery_method, expires_at)
SELECT id, '123456', 'sms', CURRENT_TIMESTAMP + INTERVAL '5 minutes'
FROM users WHERE email = 'test@example.com';

-- Test 3: Create magic link
INSERT INTO magic_links (user_id, token, purpose, expires_at)
SELECT id, 'test-token-' || md5(random()::text), 'login', CURRENT_TIMESTAMP + INTERVAL '15 minutes'
FROM users WHERE email = 'test@example.com';

-- Test 4: Verify cleanup function
SELECT cleanup_expired_auth_tokens();

-- Test 5: Verify user has valid auth
SELECT user_has_valid_auth(id) FROM users WHERE email = 'test@example.com';

-- Cleanup test data
DELETE FROM users WHERE email = 'test@example.com';
```

### Monitoring and Maintenance

#### Key Metrics to Track

```sql
-- Active users count
SELECT COUNT(*) FROM users WHERE is_active = TRUE AND deleted_at IS NULL;

-- Authentication method distribution
SELECT 
    SUM(CASE WHEN totp_enabled THEN 1 ELSE 0 END) as totp_users,
    SUM(CASE WHEN phone_verified THEN 1 ELSE 0 END) as phone_users,
    SUM(CASE WHEN email_verified THEN 1 ELSE 0 END) as email_users
FROM users
WHERE is_active = TRUE;

-- Recent login activity
SELECT COUNT(*), DATE(last_login)
FROM users
WHERE last_login > CURRENT_TIMESTAMP - INTERVAL '30 days'
GROUP BY DATE(last_login)
ORDER BY DATE(last_login) DESC;

-- Expired tokens needing cleanup
SELECT 
    (SELECT COUNT(*) FROM one_time_passwords WHERE expires_at < CURRENT_TIMESTAMP AND used = FALSE) as expired_otps,
    (SELECT COUNT(*) FROM magic_links WHERE expires_at < CURRENT_TIMESTAMP AND used = FALSE) as expired_links,
    (SELECT COUNT(*) FROM user_sessions WHERE expires_at < CURRENT_TIMESTAMP AND revoked = FALSE) as expired_sessions;

-- Invite code usage
SELECT 
    code,
    current_uses,
    max_uses,
    created_at,
    expires_at
FROM invite_codes
WHERE is_active = TRUE
ORDER BY created_at DESC;
```

### Troubleshooting

#### Issue: Migration fails on existing games table

**Solution:** The migration handles existing columns gracefully with `ADD COLUMN IF NOT EXISTS`. If issues persist, check for active constraints.

#### Issue: TOTP secret storage concerns

**Solution:** Secrets must be encrypted at the application layer before storage. The database column is VARCHAR(255) to accommodate encrypted values.

#### Issue: Session tokens not expiring

**Solution:** Run the cleanup function regularly:
```sql
SELECT cleanup_expired_auth_tokens();
```

#### Issue: Users locked out of TOTP

**Solution:** Use backup codes or magic links to reset TOTP:
```sql
-- Disable TOTP for user (admin action)
UPDATE users
SET totp_enabled = FALSE, totp_secret = NULL
WHERE id = [user_id];
```

### Next Steps

After completing Migration 003:

1. **Phase 2**: Implement authentication API endpoints
2. **Phase 3**: Build account creation and login UI
3. **Phase 4**: Add league invitation flows
4. **Phase 5**: Implement TOTP setup wizard
5. **Phase 6**: Add SMS OTP integration (Twilio)
6. **Phase 7**: Implement magic link email sending
7. **Phase 8**: Create admin dashboard for invite codes

See Issue #43 for the complete epic roadmap.