-- Migration: Add additional split columns for live race tracking
-- Date: 2025-10-31
-- Description: Adds 15K, 20K, and 25K split columns to race_results table
--              to support more granular live updates during marathon races

-- Add new split columns
ALTER TABLE race_results 
ADD COLUMN IF NOT EXISTS split_15k VARCHAR(10),
ADD COLUMN IF NOT EXISTS split_20k VARCHAR(10),
ADD COLUMN IF NOT EXISTS split_25k VARCHAR(10);

-- Add comments to document the columns
COMMENT ON COLUMN race_results.split_15k IS '15 kilometer split time (HH:MM:SS or MM:SS format)';
COMMENT ON COLUMN race_results.split_20k IS '20 kilometer split time (HH:MM:SS or MM:SS format)';
COMMENT ON COLUMN race_results.split_25k IS '25 kilometer split time (HH:MM:SS or MM:SS format)';

-- Note: These columns are used by the bookmarklet import system to capture
-- additional split times throughout the race for more engaging live updates.
-- While only half-marathon and finish times are needed for scoring, having
-- more splits (5K, 10K, 15K, 20K, Half, 25K, 30K, 35K, 40K) makes the live
-- leaderboard more interesting for users watching the race.
