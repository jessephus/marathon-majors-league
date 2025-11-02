-- Migration 006: Add missing split columns to race_results
-- Date: 2025-11-02
-- Purpose: Add split_15k, split_20k, split_25k columns for complete marathon tracking

-- Add missing split columns
ALTER TABLE race_results 
ADD COLUMN IF NOT EXISTS split_15k VARCHAR(10),
ADD COLUMN IF NOT EXISTS split_20k VARCHAR(10),
ADD COLUMN IF NOT EXISTS split_25k VARCHAR(10);

-- Verify columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'race_results' 
  AND column_name LIKE 'split_%'
ORDER BY column_name;
