-- Migration 014: Add active_race_id to games table
-- 
-- This migration adds the ability for each game to have a single active race.
-- The active race determines which athletes are shown as "confirmed" for that game.
-- 
-- The relationship is: 
--   - Each game can have at most one active race
--   - Each race can be the active race for multiple games
--   - This replaces the previous approach of checking `races.is_active` globally

-- Add active_race_id column to games table
ALTER TABLE games 
ADD COLUMN IF NOT EXISTS active_race_id INTEGER REFERENCES races(id) ON DELETE SET NULL;

-- Create an index on active_race_id for faster joins
CREATE INDEX IF NOT EXISTS idx_games_active_race_id ON games(active_race_id);

-- For existing games, set the active_race_id to the first active race found
-- This maintains backward compatibility with the existing behavior
UPDATE games 
SET active_race_id = (
  SELECT id FROM races WHERE is_active = true ORDER BY date DESC LIMIT 1
)
WHERE active_race_id IS NULL;

-- Add a comment to document the column
COMMENT ON COLUMN games.active_race_id IS 'The active race for this game. Athletes confirmed for this race are available for draft. Foreign key to races.id.';

-- Trigger to update updated_at when active_race_id changes
CREATE OR REPLACE FUNCTION update_games_active_race_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.active_race_id IS DISTINCT FROM OLD.active_race_id THEN
        NEW.updated_at = CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists first, then create
DROP TRIGGER IF EXISTS trigger_games_active_race_updated_at ON games;
CREATE TRIGGER trigger_games_active_race_updated_at
    BEFORE UPDATE ON games
    FOR EACH ROW
    EXECUTE FUNCTION update_games_active_race_updated_at();

-- Done!
