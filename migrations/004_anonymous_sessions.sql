-- Migration 004: Anonymous Sessions for Account-Free Team Creation
-- Implements session-based access without requiring user accounts
-- Based on Issue: Implement Account-Free Team Creation and Management
--
-- This migration adds support for anonymous users to create and manage teams
-- without traditional account registration, while preserving the existing
-- user account system (Migration 003) for future use.
--
-- Key Features:
-- - Cryptographically secure session tokens (UUIDs)
-- - Unique URLs for team access
-- - Session persistence across browser restarts
-- - Future upgrade path to user accounts

-- ============================================================================
-- ANONYMOUS SESSIONS TABLE - Session management for account-free users
-- ============================================================================

CREATE TABLE IF NOT EXISTS anonymous_sessions (
    id SERIAL PRIMARY KEY,
    
    -- Session identifier
    session_token VARCHAR(255) UNIQUE NOT NULL,  -- UUID v4 format
    
    -- Session metadata
    session_type VARCHAR(50) NOT NULL CHECK (session_type IN ('commissioner', 'player', 'spectator')),
    display_name VARCHAR(255),  -- Optional display name for the session
    
    -- Association with games
    game_id VARCHAR(255),  -- Optional: associate session with specific game
    player_code VARCHAR(255),  -- Optional: legacy player code for compatibility
    
    -- Security tracking
    ip_address INET,
    user_agent TEXT,
    
    -- Lifecycle
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Upgrade path to user accounts
    upgraded_to_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    upgraded_at TIMESTAMP,
    
    CONSTRAINT expires_after_creation CHECK (expires_at > created_at)
);

-- Indexes for performance and security
CREATE INDEX idx_anonymous_sessions_token ON anonymous_sessions(session_token) WHERE is_active = TRUE;
CREATE INDEX idx_anonymous_sessions_game_id ON anonymous_sessions(game_id) WHERE game_id IS NOT NULL;
CREATE INDEX idx_anonymous_sessions_expires ON anonymous_sessions(expires_at) WHERE is_active = TRUE;
CREATE INDEX idx_anonymous_sessions_last_activity ON anonymous_sessions(last_activity DESC);
CREATE INDEX idx_anonymous_sessions_type ON anonymous_sessions(session_type);
CREATE INDEX idx_anonymous_sessions_upgraded ON anonymous_sessions(upgraded_to_user_id) WHERE upgraded_to_user_id IS NOT NULL;

-- ============================================================================
-- GAMES TABLE - Add anonymous session support
-- ============================================================================

-- Add columns to support anonymous commissioners
ALTER TABLE games ADD COLUMN IF NOT EXISTS anonymous_session_token VARCHAR(255);
ALTER TABLE games ADD COLUMN IF NOT EXISTS allow_anonymous_access BOOLEAN DEFAULT TRUE;
ALTER TABLE games ADD COLUMN IF NOT EXISTS anonymous_access_enabled_at TIMESTAMP;

-- Index for anonymous session lookups
CREATE INDEX IF NOT EXISTS idx_games_anonymous_session ON games(anonymous_session_token) WHERE anonymous_session_token IS NOT NULL;

-- ============================================================================
-- USER_GAMES TABLE - Add anonymous player support
-- ============================================================================

-- Add columns to support anonymous players
ALTER TABLE user_games ADD COLUMN IF NOT EXISTS anonymous_access_token VARCHAR(255);
ALTER TABLE user_games ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT FALSE;

-- Partial unique index for anonymous access tokens
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_games_anonymous_token ON user_games(anonymous_access_token) WHERE anonymous_access_token IS NOT NULL;

-- Index for anonymous player lookups
CREATE INDEX IF NOT EXISTS idx_user_games_anonymous ON user_games(is_anonymous) WHERE is_anonymous = TRUE;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to create an anonymous session
CREATE OR REPLACE FUNCTION create_anonymous_session(
    p_session_type VARCHAR(50),
    p_display_name VARCHAR(255) DEFAULT NULL,
    p_game_id VARCHAR(255) DEFAULT NULL,
    p_player_code VARCHAR(255) DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_expiry_days INTEGER DEFAULT 90
)
RETURNS TABLE(session_token VARCHAR, expires_at TIMESTAMP) AS $$
DECLARE
    v_token VARCHAR(255);
    v_expires_at TIMESTAMP;
BEGIN
    -- Generate UUID v4 token
    v_token := gen_random_uuid()::text;
    v_expires_at := CURRENT_TIMESTAMP + (p_expiry_days || ' days')::interval;
    
    -- Insert session
    INSERT INTO anonymous_sessions (
        session_token,
        session_type,
        display_name,
        game_id,
        player_code,
        ip_address,
        user_agent,
        expires_at
    )
    VALUES (
        v_token,
        p_session_type,
        p_display_name,
        p_game_id,
        p_player_code,
        p_ip_address,
        p_user_agent,
        v_expires_at
    );
    
    RETURN QUERY SELECT v_token, v_expires_at;
END;
$$ LANGUAGE plpgsql;

-- Function to verify an anonymous session
CREATE OR REPLACE FUNCTION verify_anonymous_session(p_session_token VARCHAR)
RETURNS TABLE(
    is_valid BOOLEAN,
    session_id INTEGER,
    session_type VARCHAR,
    game_id VARCHAR,
    display_name VARCHAR,
    expires_at TIMESTAMP,
    days_until_expiry INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (is_active AND expires_at > CURRENT_TIMESTAMP) as is_valid,
        id as session_id,
        anonymous_sessions.session_type,
        anonymous_sessions.game_id,
        anonymous_sessions.display_name,
        anonymous_sessions.expires_at,
        EXTRACT(DAY FROM (anonymous_sessions.expires_at - CURRENT_TIMESTAMP))::INTEGER as days_until_expiry
    FROM anonymous_sessions
    WHERE session_token = p_session_token;
    
    -- Update last activity if valid
    UPDATE anonymous_sessions
    SET last_activity = CURRENT_TIMESTAMP
    WHERE session_token = p_session_token
      AND is_active = TRUE
      AND expires_at > CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup expired anonymous sessions
CREATE OR REPLACE FUNCTION cleanup_expired_anonymous_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Mark expired sessions as inactive
    UPDATE anonymous_sessions
    SET is_active = FALSE
    WHERE expires_at < CURRENT_TIMESTAMP
      AND is_active = TRUE;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Delete very old inactive sessions (older than 1 year)
    DELETE FROM anonymous_sessions
    WHERE is_active = FALSE
      AND expires_at < CURRENT_TIMESTAMP - INTERVAL '1 year';
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to upgrade anonymous session to user account
CREATE OR REPLACE FUNCTION upgrade_anonymous_session_to_user(
    p_session_token VARCHAR,
    p_user_id INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    v_session_id INTEGER;
    v_game_id VARCHAR;
BEGIN
    -- Get session details
    SELECT id, game_id INTO v_session_id, v_game_id
    FROM anonymous_sessions
    WHERE session_token = p_session_token
      AND is_active = TRUE
      AND upgraded_to_user_id IS NULL;
    
    IF v_session_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Mark session as upgraded
    UPDATE anonymous_sessions
    SET upgraded_to_user_id = p_user_id,
        upgraded_at = CURRENT_TIMESTAMP,
        is_active = FALSE
    WHERE id = v_session_id;
    
    -- If session was associated with a game, create user_game association
    IF v_game_id IS NOT NULL THEN
        INSERT INTO user_games (user_id, game_id, role, joined_at)
        SELECT p_user_id, v_game_id, 
               CASE WHEN session_type = 'commissioner' THEN 'commissioner'::VARCHAR 
                    ELSE 'player'::VARCHAR END,
               CURRENT_TIMESTAMP
        FROM anonymous_sessions
        WHERE id = v_session_id
        ON CONFLICT (user_id, game_id) DO NOTHING;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to extend session expiration
CREATE OR REPLACE FUNCTION extend_anonymous_session(
    p_session_token VARCHAR,
    p_additional_days INTEGER DEFAULT 90
)
RETURNS TIMESTAMP AS $$
DECLARE
    v_new_expiry TIMESTAMP;
BEGIN
    UPDATE anonymous_sessions
    SET expires_at = CURRENT_TIMESTAMP + (p_additional_days || ' days')::interval
    WHERE session_token = p_session_token
      AND is_active = TRUE
    RETURNING expires_at INTO v_new_expiry;
    
    RETURN v_new_expiry;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- HELPER VIEWS
-- ============================================================================

-- View for active anonymous sessions
CREATE OR REPLACE VIEW active_anonymous_sessions AS
SELECT 
    id,
    session_token,
    session_type,
    display_name,
    game_id,
    player_code,
    created_at,
    last_activity,
    expires_at,
    EXTRACT(DAY FROM (expires_at - CURRENT_TIMESTAMP))::INTEGER as days_until_expiry,
    (upgraded_to_user_id IS NOT NULL) as is_upgraded
FROM anonymous_sessions
WHERE is_active = TRUE
  AND expires_at > CURRENT_TIMESTAMP;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE anonymous_sessions IS 'Session management for account-free users. Enables team creation without registration.';
COMMENT ON COLUMN anonymous_sessions.session_token IS 'UUID v4 format - cryptographically secure random identifier';
COMMENT ON COLUMN anonymous_sessions.session_type IS 'Type of session: commissioner, player, or spectator';
COMMENT ON COLUMN anonymous_sessions.upgraded_to_user_id IS 'If set, indicates session was upgraded to a user account';

COMMENT ON COLUMN games.anonymous_session_token IS 'Session token for anonymous commissioner access';
COMMENT ON COLUMN games.allow_anonymous_access IS 'If TRUE, allows anonymous access; if FALSE, requires user accounts';

COMMENT ON COLUMN user_games.anonymous_access_token IS 'Unique token for anonymous player to access this game';
COMMENT ON COLUMN user_games.is_anonymous IS 'If TRUE, this is an anonymous player (no user account)';

COMMENT ON FUNCTION create_anonymous_session IS 'Creates a new anonymous session with UUID token and configurable expiry';
COMMENT ON FUNCTION verify_anonymous_session IS 'Validates session token and updates last activity timestamp';
COMMENT ON FUNCTION cleanup_expired_anonymous_sessions IS 'Marks expired sessions as inactive and deletes very old ones';
COMMENT ON FUNCTION upgrade_anonymous_session_to_user IS 'Upgrades an anonymous session to a user account, preserving game associations';
COMMENT ON FUNCTION extend_anonymous_session IS 'Extends session expiration by additional days';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Log migration completion
DO $$
BEGIN
    RAISE NOTICE '✅ Migration 004: Anonymous Sessions completed successfully';
    RAISE NOTICE '📊 Created 1 new table: anonymous_sessions';
    RAISE NOTICE '🔧 Enhanced games table with anonymous session support';
    RAISE NOTICE '🔧 Enhanced user_games table with anonymous player support';
    RAISE NOTICE '⚙️ Added 5 helper functions for session management';
    RAISE NOTICE '📊 Added 1 view: active_anonymous_sessions';
    RAISE NOTICE '🔒 All tokens use cryptographically secure UUIDs';
    RAISE NOTICE '♻️ Upgrade path to user accounts preserved';
END $$;
