-- Migration: Add is_complete column to salary_cap_teams table
-- Purpose: Distinguish between auto-saved partial rosters and fully submitted rosters
-- Date: 2025-11-13

-- Add is_complete column to track submission status
ALTER TABLE salary_cap_teams 
ADD COLUMN IF NOT EXISTS is_complete BOOLEAN DEFAULT FALSE;

-- Mark all existing rosters as complete (they were manually submitted before auto-save feature)
-- Only update rosters that have 6 athletes (3 men + 3 women)
UPDATE salary_cap_teams sct1
SET is_complete = TRUE
WHERE (
  SELECT COUNT(*)
  FROM salary_cap_teams sct2
  WHERE sct2.game_id = sct1.game_id 
    AND sct2.player_code = sct1.player_code
) = 6;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_salary_cap_teams_is_complete 
ON salary_cap_teams(game_id, player_code, is_complete);
