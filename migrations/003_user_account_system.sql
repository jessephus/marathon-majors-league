-- Migration 003: User Account System
-- Implements account-based authentication with TOTP, SMS OTP, and Magic Links
-- Based on Issue #13 requirements and Epic #43 Phase 1
--
-- This migration enhances the existing user tables to support:
-- - Email and phone-based user accounts
-- - TOTP (Google Authenticator) authentication
-- - SMS-based one-time passwords
-- - Email magic links as fallback authentication
-- - User profiles with customizable team information
-- - League membership and invitation system
-- - Admin/staff role controls

-- ============================================================================
-- USERS TABLE - Enhanced for Authentication
-- ============================================================================

-- Drop the existing placeholder users table to recreate with enhanced schema
DROP TABLE IF EXISTS user_games CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create enhanced users table with authentication support
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    
    -- Basic account information
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20) UNIQUE,  -- E.164 format (e.g., +1234567890)
    display_name VARCHAR(255),
    
    -- Authentication fields
    totp_secret VARCHAR(255),  -- Base32 encoded TOTP secret (encrypted at application layer)
    totp_enabled BOOLEAN DEFAULT FALSE,
    totp_verified_at TIMESTAMP,
    
    -- Account status
    is_active BOOLEAN DEFAULT TRUE,
    is_admin BOOLEAN DEFAULT FALSE,  -- Super admin flag for initial preview/testing phase
    is_staff BOOLEAN DEFAULT FALSE,  -- Staff member flag for future features
    email_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMP,
    phone_verified BOOLEAN DEFAULT FALSE,
    phone_verified_at TIMESTAMP,
    
    -- Account lifecycle
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    
    -- Soft delete support
    deleted_at TIMESTAMP,
    
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT valid_phone CHECK (phone_number IS NULL OR phone_number ~* '^\+[1-9]\d{1,14}$')
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_phone ON users(phone_number) WHERE phone_number IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_users_active ON users(is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_admin ON users(is_admin) WHERE is_admin = TRUE AND deleted_at IS NULL;
CREATE INDEX idx_users_last_login ON users(last_login DESC);

-- Trigger for automatic timestamp updates
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ONE-TIME PASSWORDS TABLE - For SMS-based authentication
-- ============================================================================

CREATE TABLE one_time_passwords (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- OTP details
    otp_code VARCHAR(6) NOT NULL,  -- 6-digit numeric code
    delivery_method VARCHAR(20) NOT NULL CHECK (delivery_method IN ('sms', 'email')),
    
    -- Lifecycle
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    used BOOLEAN DEFAULT FALSE,
    
    -- Security tracking
    ip_address INET,
    user_agent TEXT,
    attempts INTEGER DEFAULT 0,  -- Failed verification attempts
    
    CONSTRAINT otp_code_format CHECK (otp_code ~* '^\d{6}$'),
    CONSTRAINT expires_after_creation CHECK (expires_at > created_at)
);

-- Indexes for performance and security
CREATE INDEX idx_otp_user_id ON one_time_passwords(user_id);
CREATE INDEX idx_otp_code ON one_time_passwords(otp_code) WHERE used = FALSE;
CREATE INDEX idx_otp_expires ON one_time_passwords(expires_at) WHERE used = FALSE;
CREATE INDEX idx_otp_created ON one_time_passwords(created_at DESC);

-- ============================================================================
-- MAGIC LINKS TABLE - For email-based passwordless authentication
-- ============================================================================

CREATE TABLE magic_links (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Magic link details
    token VARCHAR(255) UNIQUE NOT NULL,  -- Cryptographically secure random token
    purpose VARCHAR(50) NOT NULL CHECK (purpose IN ('login', 'verify_email', 'reset_totp', 'invite')),
    
    -- Lifecycle
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    used BOOLEAN DEFAULT FALSE,
    
    -- Security tracking
    ip_address INET,
    user_agent TEXT,
    
    -- Metadata
    metadata JSONB,  -- Store additional context (e.g., invited_to_game_id)
    
    CONSTRAINT expires_after_creation CHECK (expires_at > created_at)
);

-- Indexes for performance and security
CREATE INDEX idx_magic_links_user_id ON magic_links(user_id);
CREATE INDEX idx_magic_links_token ON magic_links(token) WHERE used = FALSE;
CREATE INDEX idx_magic_links_expires ON magic_links(expires_at) WHERE used = FALSE;
CREATE INDEX idx_magic_links_purpose ON magic_links(purpose);
CREATE INDEX idx_magic_links_created ON magic_links(created_at DESC);

-- ============================================================================
-- USER PROFILES TABLE - Extended user information
-- ============================================================================

CREATE TABLE user_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Profile information
    avatar_url TEXT,
    bio TEXT,
    location VARCHAR(255),
    timezone VARCHAR(50),
    
    -- Preferences
    preferred_auth_method VARCHAR(20) CHECK (preferred_auth_method IN ('totp', 'sms', 'magic_link')),
    notification_preferences JSONB DEFAULT '{"email": true, "sms": false}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TOTP BACKUP CODES TABLE - Recovery codes for lost authenticator access
-- ============================================================================

CREATE TABLE totp_backup_codes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Backup code details
    code_hash VARCHAR(255) NOT NULL,  -- Hashed backup code (bcrypt/argon2)
    used_at TIMESTAMP,
    used BOOLEAN DEFAULT FALSE,
    
    -- Lifecycle
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,  -- Optional expiration
    
    UNIQUE(user_id, code_hash)
);

CREATE INDEX idx_totp_backup_codes_user_id ON totp_backup_codes(user_id);
CREATE INDEX idx_totp_backup_codes_used ON totp_backup_codes(used) WHERE used = FALSE;

-- ============================================================================
-- USER GAMES TABLE - Enhanced for user-league associations
-- ============================================================================

CREATE TABLE user_games (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game_id VARCHAR(255) NOT NULL,  -- References games.game_id
    
    -- Role and permissions
    role VARCHAR(50) NOT NULL CHECK (role IN ('commissioner', 'player', 'spectator')),
    
    -- Team customization (for players)
    player_code VARCHAR(255),  -- Legacy player code for backward compatibility
    team_name VARCHAR(255),  -- Custom team name
    team_sponsor VARCHAR(255),  -- Custom team sponsor
    owner_name VARCHAR(255),  -- Owner display name (can differ from user display_name)
    
    -- Membership status
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('invited', 'active', 'inactive', 'removed')),
    invited_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    invited_at TIMESTAMP,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, game_id),
    UNIQUE(game_id, player_code) WHERE player_code IS NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_user_games_user_id ON user_games(user_id);
CREATE INDEX idx_user_games_game_id ON user_games(game_id);
CREATE INDEX idx_user_games_role ON user_games(game_id, role);
CREATE INDEX idx_user_games_status ON user_games(status);
CREATE INDEX idx_user_games_invited_by ON user_games(invited_by);

CREATE TRIGGER update_user_games_updated_at BEFORE UPDATE ON user_games
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INVITE CODES TABLE - Admin-controlled invite system for preview phase
-- ============================================================================

CREATE TABLE invite_codes (
    id SERIAL PRIMARY KEY,
    
    -- Invite code details
    code VARCHAR(255) UNIQUE NOT NULL,  -- Unique invite code
    code_type VARCHAR(50) DEFAULT 'admin' CHECK (code_type IN ('admin', 'league', 'friend')),
    
    -- Usage limits
    max_uses INTEGER DEFAULT 1,
    current_uses INTEGER DEFAULT 0,
    
    -- Lifecycle
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    metadata JSONB,  -- Store additional context (e.g., for_game_id, notes)
    
    CONSTRAINT valid_usage CHECK (current_uses <= max_uses)
);

-- Indexes for performance
CREATE INDEX idx_invite_codes_code ON invite_codes(code) WHERE is_active = TRUE;
CREATE INDEX idx_invite_codes_created_by ON invite_codes(created_by);
CREATE INDEX idx_invite_codes_expires ON invite_codes(expires_at) WHERE is_active = TRUE;
CREATE INDEX idx_invite_codes_type ON invite_codes(code_type);

-- ============================================================================
-- INVITE CODE USAGE TABLE - Track who used which invite codes
-- ============================================================================

CREATE TABLE invite_code_usage (
    id SERIAL PRIMARY KEY,
    invite_code_id INTEGER NOT NULL REFERENCES invite_codes(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Usage details
    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT,
    
    UNIQUE(invite_code_id, user_id)
);

CREATE INDEX idx_invite_code_usage_code ON invite_code_usage(invite_code_id);
CREATE INDEX idx_invite_code_usage_user ON invite_code_usage(user_id);
CREATE INDEX idx_invite_code_usage_used_at ON invite_code_usage(used_at DESC);

-- ============================================================================
-- SESSIONS TABLE - User session management
-- ============================================================================

CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Session details
    session_token VARCHAR(255) UNIQUE NOT NULL,
    
    -- Security tracking
    ip_address INET,
    user_agent TEXT,
    
    -- Lifecycle
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMP,
    
    CONSTRAINT expires_after_creation CHECK (expires_at > created_at)
);

-- Indexes for performance and security
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token) WHERE revoked = FALSE;
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at) WHERE revoked = FALSE;
CREATE INDEX idx_user_sessions_last_activity ON user_sessions(last_activity DESC);

-- ============================================================================
-- AUDIT LOG TABLE - Security and compliance tracking
-- ============================================================================

CREATE TABLE audit_log (
    id SERIAL PRIMARY KEY,
    
    -- Who and what
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),  -- e.g., 'user', 'game', 'magic_link'
    resource_id VARCHAR(255),
    
    -- Details
    details JSONB,
    
    -- Security context
    ip_address INET,
    user_agent TEXT,
    
    -- Timestamp
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for audit queries
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_resource ON audit_log(resource_type, resource_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at DESC);

-- ============================================================================
-- GAMES TABLE - Add commissioner user reference
-- ============================================================================

-- Add columns to existing games table to link commissioners to user accounts
ALTER TABLE games ADD COLUMN IF NOT EXISTS commissioner_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE games ADD COLUMN IF NOT EXISTS commissioner_password VARCHAR(255) DEFAULT 'kipchoge';  -- Legacy support
ALTER TABLE games ADD COLUMN IF NOT EXISTS requires_user_accounts BOOLEAN DEFAULT FALSE;  -- Toggle for migration period

CREATE INDEX idx_games_commissioner ON games(commissioner_user_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to soft delete a user
CREATE OR REPLACE FUNCTION soft_delete_user(p_user_id INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE users
    SET deleted_at = CURRENT_TIMESTAMP,
        is_active = FALSE
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup expired tokens and OTPs
CREATE OR REPLACE FUNCTION cleanup_expired_auth_tokens()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete expired OTPs
    DELETE FROM one_time_passwords
    WHERE expires_at < CURRENT_TIMESTAMP AND used = FALSE;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Delete expired magic links
    DELETE FROM magic_links
    WHERE expires_at < CURRENT_TIMESTAMP AND used = FALSE;
    
    GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
    
    -- Delete expired sessions
    DELETE FROM user_sessions
    WHERE expires_at < CURRENT_TIMESTAMP AND revoked = FALSE;
    
    GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user has valid auth method
CREATE OR REPLACE FUNCTION user_has_valid_auth(p_user_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    has_totp BOOLEAN;
    has_phone BOOLEAN;
    has_email BOOLEAN;
BEGIN
    SELECT 
        totp_enabled,
        phone_verified,
        email_verified
    INTO has_totp, has_phone, has_email
    FROM users
    WHERE id = p_user_id;
    
    RETURN (has_totp OR has_phone OR has_email);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- MIGRATION DATA - Seed initial admin account
-- ============================================================================

-- Note: This creates a placeholder admin account that should be updated
-- with real credentials during deployment setup
INSERT INTO users (email, display_name, is_admin, is_active, email_verified, created_at)
VALUES (
    'admin@marathon-majors-league.com',
    'System Administrator',
    TRUE,
    TRUE,
    TRUE,
    CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO NOTHING;

-- Create a default profile for the admin
INSERT INTO user_profiles (user_id, preferred_auth_method)
SELECT id, 'magic_link'
FROM users
WHERE email = 'admin@marathon-majors-league.com'
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE users IS 'User accounts with multi-factor authentication support (TOTP, SMS, Magic Links)';
COMMENT ON TABLE one_time_passwords IS 'SMS and email-based one-time passwords for authentication';
COMMENT ON TABLE magic_links IS 'Email magic links for passwordless authentication and account actions';
COMMENT ON TABLE user_profiles IS 'Extended user profile information and preferences';
COMMENT ON TABLE totp_backup_codes IS 'Recovery codes for users who lose access to their TOTP authenticator';
COMMENT ON TABLE user_games IS 'User membership in fantasy leagues with role and team customization';
COMMENT ON TABLE invite_codes IS 'Admin-controlled invite codes for restricted account creation';
COMMENT ON TABLE invite_code_usage IS 'Tracking of invite code usage for security and analytics';
COMMENT ON TABLE user_sessions IS 'User session tokens for maintaining logged-in state';
COMMENT ON TABLE audit_log IS 'Security audit trail for all user actions';

COMMENT ON COLUMN users.totp_secret IS 'Base32-encoded TOTP secret - MUST be encrypted at application layer';
COMMENT ON COLUMN users.phone_number IS 'E.164 format international phone number (e.g., +1234567890)';
COMMENT ON COLUMN users.is_admin IS 'Super admin flag for preview/testing phase - controls invite code creation';

COMMENT ON COLUMN user_games.player_code IS 'Legacy player code for backward compatibility during migration';
COMMENT ON COLUMN user_games.team_name IS 'User-customizable fantasy team name';
COMMENT ON COLUMN user_games.team_sponsor IS 'User-customizable team sponsor name';
COMMENT ON COLUMN user_games.owner_name IS 'Display name for team owner (can differ from user display_name)';

COMMENT ON COLUMN games.requires_user_accounts IS 'If TRUE, game requires user accounts; if FALSE, allows legacy team code access';
COMMENT ON COLUMN games.commissioner_password IS 'Legacy commissioner password for backward compatibility';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Log migration completion
DO $$
BEGIN
    RAISE NOTICE '✅ Migration 003: User Account System completed successfully';
    RAISE NOTICE '📊 Created 11 new tables:';
    RAISE NOTICE '   - users (enhanced)';
    RAISE NOTICE '   - one_time_passwords';
    RAISE NOTICE '   - magic_links';
    RAISE NOTICE '   - user_profiles';
    RAISE NOTICE '   - totp_backup_codes';
    RAISE NOTICE '   - user_games (enhanced)';
    RAISE NOTICE '   - invite_codes';
    RAISE NOTICE '   - invite_code_usage';
    RAISE NOTICE '   - user_sessions';
    RAISE NOTICE '   - audit_log';
    RAISE NOTICE '🔧 Enhanced games table with user account support';
    RAISE NOTICE '🛡️ Added security functions and audit logging';
    RAISE NOTICE '👤 Created initial admin account (update credentials in production)';
END $$;
