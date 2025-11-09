/**
 * Migration 010: Add session_id Foreign Keys to Team Tables
 * 
 * Problem: Currently, team-related tables use (game_id, player_code) as the composite key
 * to identify teams. However, player_code is user-chosen and only unique among ACTIVE sessions.
 * Multiple suspended teams can have the same player_code, making deletion ambiguous.
 * 
 * Solution: Add session_id foreign key to all team-related tables, linking to anonymous_sessions.id
 * 
 * Tables affected:
 * - salary_cap_teams: Add session_id FK
 * - draft_teams: Add session_id FK (legacy system)
 * - player_rankings: Add session_id FK (legacy system)
 * 
 * Backward compatibility:
 * - session_id is nullable initially to allow existing rows
 * - player_code columns remain for backward compatibility
 * - After data migration, session_id can be made NOT NULL
 */

-- ============================================================================
-- Step 1: Add session_id columns (nullable for now)
-- ============================================================================

-- Add session_id to salary_cap_teams
ALTER TABLE salary_cap_teams 
ADD COLUMN IF NOT EXISTS session_id INTEGER;

-- Add session_id to draft_teams (legacy system)
ALTER TABLE draft_teams 
ADD COLUMN IF NOT EXISTS session_id INTEGER;

-- Add session_id to player_rankings (legacy system)
ALTER TABLE player_rankings 
ADD COLUMN IF NOT EXISTS session_id INTEGER;

-- ============================================================================
-- Step 2: Add foreign key constraints
-- ============================================================================

-- FK: salary_cap_teams -> anonymous_sessions
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_salary_cap_teams_session'
  ) THEN
    ALTER TABLE salary_cap_teams 
    ADD CONSTRAINT fk_salary_cap_teams_session 
    FOREIGN KEY (session_id) 
    REFERENCES anonymous_sessions(id) 
    ON DELETE CASCADE;
  END IF;
END $$;

-- FK: draft_teams -> anonymous_sessions
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_draft_teams_session'
  ) THEN
    ALTER TABLE draft_teams 
    ADD CONSTRAINT fk_draft_teams_session 
    FOREIGN KEY (session_id) 
    REFERENCES anonymous_sessions(id) 
    ON DELETE CASCADE;
  END IF;
END $$;

-- FK: player_rankings -> anonymous_sessions
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_player_rankings_session'
  ) THEN
    ALTER TABLE player_rankings 
    ADD CONSTRAINT fk_player_rankings_session 
    FOREIGN KEY (session_id) 
    REFERENCES anonymous_sessions(id) 
    ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================================
-- Step 3: Backfill session_id for existing rows
-- ============================================================================

-- Update salary_cap_teams: match by game_id + player_code
UPDATE salary_cap_teams sct
SET session_id = (
  SELECT id 
  FROM anonymous_sessions 
  WHERE game_id = sct.game_id 
    AND player_code = sct.player_code
    AND session_type = 'player'
  ORDER BY created_at DESC
  LIMIT 1
)
WHERE session_id IS NULL;

-- Update draft_teams: match by game_id + player_code
UPDATE draft_teams dt
SET session_id = (
  SELECT id 
  FROM anonymous_sessions 
  WHERE game_id = dt.game_id 
    AND player_code = dt.player_code
    AND session_type = 'player'
  ORDER BY created_at DESC
  LIMIT 1
)
WHERE session_id IS NULL;

-- Update player_rankings: match by game_id + player_code
UPDATE player_rankings pr
SET session_id = (
  SELECT id 
  FROM anonymous_sessions 
  WHERE game_id = pr.game_id 
    AND player_code = pr.player_code
    AND session_type = 'player'
  ORDER BY created_at DESC
  LIMIT 1
)
WHERE session_id IS NULL;

-- ============================================================================
-- Step 4: Add indexes for performance
-- ============================================================================

-- Index on salary_cap_teams.session_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_salary_cap_teams_session_id 
ON salary_cap_teams(session_id);

-- Index on draft_teams.session_id
CREATE INDEX IF NOT EXISTS idx_draft_teams_session_id 
ON draft_teams(session_id);

-- Index on player_rankings.session_id
CREATE INDEX IF NOT EXISTS idx_player_rankings_session_id 
ON player_rankings(session_id);

-- ============================================================================
-- Step 5: Optional - Make session_id NOT NULL (commented out for safety)
-- ============================================================================

-- Uncomment these after verifying all rows have been backfilled:
-- ALTER TABLE salary_cap_teams ALTER COLUMN session_id SET NOT NULL;
-- ALTER TABLE draft_teams ALTER COLUMN session_id SET NOT NULL;
-- ALTER TABLE player_rankings ALTER COLUMN session_id SET NOT NULL;

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Check for rows without session_id
-- SELECT 'salary_cap_teams' as table_name, COUNT(*) as missing_session_id 
-- FROM salary_cap_teams WHERE session_id IS NULL
-- UNION ALL
-- SELECT 'draft_teams', COUNT(*) FROM draft_teams WHERE session_id IS NULL
-- UNION ALL
-- SELECT 'player_rankings', COUNT(*) FROM player_rankings WHERE session_id IS NULL;

-- ============================================================================
-- Rollback Instructions
-- ============================================================================

-- To rollback this migration:
-- DROP INDEX IF EXISTS idx_salary_cap_teams_session_id;
-- DROP INDEX IF EXISTS idx_draft_teams_session_id;
-- DROP INDEX IF EXISTS idx_player_rankings_session_id;
-- ALTER TABLE salary_cap_teams DROP CONSTRAINT IF EXISTS fk_salary_cap_teams_session;
-- ALTER TABLE draft_teams DROP CONSTRAINT IF EXISTS fk_draft_teams_session;
-- ALTER TABLE player_rankings DROP CONSTRAINT IF EXISTS fk_player_rankings_session;
-- ALTER TABLE salary_cap_teams DROP COLUMN IF EXISTS session_id;
-- ALTER TABLE draft_teams DROP COLUMN IF EXISTS session_id;
-- ALTER TABLE player_rankings DROP COLUMN IF EXISTS session_id;
