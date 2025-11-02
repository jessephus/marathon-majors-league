-- Migration 005: Add roster_lock_time field to games table
-- This allows setting a deadline for roster edits

-- Add roster_lock_time column if it doesn't exist
ALTER TABLE games 
ADD COLUMN IF NOT EXISTS roster_lock_time TIMESTAMP WITH TIME ZONE;

-- Set the roster lock time for the default game to 8:35am EST on November 2, 2025
-- EST is UTC-5, so 8:35am EST = 1:35pm UTC (13:35 UTC)
UPDATE games 
SET roster_lock_time = '2025-11-02 13:35:00+00'::timestamptz
WHERE game_id = 'default' AND roster_lock_time IS NULL;

-- Add comment to explain the field
COMMENT ON COLUMN games.roster_lock_time IS 'Timestamp when roster edits are permanently locked. After this time, no team changes are allowed.';
