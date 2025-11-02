-- Migration 008: Add finish_time_ms column for precise time sorting
-- Date: November 2, 2025
-- Purpose: Store finish times in milliseconds to support sub-second precision sorting
--          This is critical for tie-breaking when runners finish within milliseconds

-- Add finish_time_ms column to store times as milliseconds (BIGINT)
ALTER TABLE race_results
ADD COLUMN IF NOT EXISTS finish_time_ms BIGINT;

-- Create index for fast sorting by finish time
CREATE INDEX IF NOT EXISTS idx_results_finish_time_ms 
ON race_results(game_id, finish_time_ms);

-- Note: The scoring engine will auto-populate this from finish_time column
-- Example: "2:08:09.03" → 7,689,030 milliseconds
