-- Migration 003 ROLLBACK: User Account System
-- Safely reverts the user account system changes
--
-- WARNING: This will DROP all user account data including:
-- - User accounts and profiles
-- - Authentication tokens (OTPs, magic links, sessions)
-- - Invite codes and usage history
-- - Audit logs
-- - User-game associations
--
-- USE WITH EXTREME CAUTION IN PRODUCTION

-- ============================================================================
-- CONFIRM ROLLBACK
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '⚠️  ROLLBACK WARNING ⚠️';
    RAISE NOTICE 'This will delete all user account data from the database.';
    RAISE NOTICE 'Make sure you have a backup before proceeding.';
    RAISE NOTICE '';
    RAISE NOTICE 'Rolling back Migration 003: User Account System...';
END $$;

-- ============================================================================
-- DROP TABLES IN REVERSE ORDER (respecting foreign key dependencies)
-- ============================================================================

-- Drop audit and tracking tables
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS invite_code_usage CASCADE;
DROP TABLE IF EXISTS invite_codes CASCADE;

-- Drop session management
DROP TABLE IF EXISTS user_sessions CASCADE;

-- Drop authentication tables
DROP TABLE IF EXISTS totp_backup_codes CASCADE;
DROP TABLE IF EXISTS magic_links CASCADE;
DROP TABLE IF EXISTS one_time_passwords CASCADE;

-- Drop profile and association tables
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS user_games CASCADE;

-- Drop main users table
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================================
-- REMOVE GAMES TABLE ENHANCEMENTS
-- ============================================================================

-- Remove user account columns from games table
ALTER TABLE games DROP COLUMN IF EXISTS commissioner_user_id CASCADE;
ALTER TABLE games DROP COLUMN IF EXISTS requires_user_accounts CASCADE;

-- Note: We keep commissioner_password as it existed before the migration

-- ============================================================================
-- DROP HELPER FUNCTIONS
-- ============================================================================

DROP FUNCTION IF EXISTS cleanup_expired_auth_tokens() CASCADE;
DROP FUNCTION IF EXISTS user_has_valid_auth(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS soft_delete_user(INTEGER) CASCADE;

-- ============================================================================
-- RECREATE PLACEHOLDER TABLES (from original schema.sql)
-- ============================================================================

-- Recreate basic users table (pre-migration state)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Recreate basic user_games table (pre-migration state)
CREATE TABLE IF NOT EXISTS user_games (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game_id VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('commissioner', 'player')),
    player_code VARCHAR(255),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, game_id)
);

CREATE INDEX idx_user_games_user_id ON user_games(user_id);
CREATE INDEX idx_user_games_game_id ON user_games(game_id);

-- ============================================================================
-- ROLLBACK COMPLETE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Rollback of Migration 003 completed successfully';
    RAISE NOTICE '📋 Restored placeholder user tables to pre-migration state';
    RAISE NOTICE '🗑️  Removed all user account system tables and data';
    RAISE NOTICE '🔙 Database reverted to state before user account system';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  IMPORTANT: Any user account data has been permanently deleted';
    RAISE NOTICE '💾 Restore from backup if this was executed in error';
END $$;
