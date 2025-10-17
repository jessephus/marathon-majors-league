-- Migration: Add sync tracking fields to athletes table
-- Run this on existing databases that don't have these columns yet

-- Add new columns for sync tracking
ALTER TABLE athletes 
  ADD COLUMN IF NOT EXISTS ranking_source VARCHAR(50) DEFAULT 'world_marathon',
  ADD COLUMN IF NOT EXISTS last_fetched_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS data_hash TEXT,
  ADD COLUMN IF NOT EXISTS raw_json JSONB;

-- Add UNIQUE constraint to world_athletics_id if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'athletes_world_athletics_id_key'
  ) THEN
    ALTER TABLE athletes ADD CONSTRAINT athletes_world_athletics_id_key UNIQUE (world_athletics_id);
  END IF;
END $$;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_athletes_data_hash ON athletes(data_hash);
CREATE INDEX IF NOT EXISTS idx_athletes_last_seen ON athletes(last_seen_at);
CREATE INDEX IF NOT EXISTS idx_athletes_ranking_source ON athletes(ranking_source);

-- Update existing records with initial values
UPDATE athletes 
SET 
  last_seen_at = updated_at,
  ranking_source = 'world_marathon'
WHERE last_seen_at IS NULL;

COMMENT ON COLUMN athletes.ranking_source IS 'Source of the ranking data (e.g., world_marathon)';
COMMENT ON COLUMN athletes.last_fetched_at IS 'Last time full athlete details were fetched from World Athletics';
COMMENT ON COLUMN athletes.last_seen_at IS 'Last time athlete appeared in top-100 rankings';
COMMENT ON COLUMN athletes.data_hash IS 'SHA256 hash of canonical athlete JSON for change detection';
COMMENT ON COLUMN athletes.raw_json IS 'Complete athlete data from World Athletics API for debugging';
