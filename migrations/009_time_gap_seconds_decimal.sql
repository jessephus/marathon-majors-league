-- Migration 009: Change time_gap_seconds to support sub-second precision
-- Date: 2025-11-02
-- Reason: Support displaying gaps like "+0:00.03" for close finishes

-- Change time_gap_seconds from INTEGER to NUMERIC to support decimals
ALTER TABLE race_results 
  ALTER COLUMN time_gap_seconds TYPE NUMERIC(10,3);

-- Note: NUMERIC(10,3) allows up to 9999999.999 seconds (over 115 days)
-- which is more than sufficient for marathon time gaps
