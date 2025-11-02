-- Migration 007: Add Sub-Second Precision to Race Times
-- Date: November 2, 2025
-- Purpose: Support hundredths/milliseconds for extremely close finishes
--          Example: Top 2 finishers separated by 0.03 seconds

-- Expand time columns from VARCHAR(10) to VARCHAR(13) to support "HH:MM:SS.mmm" format
-- Examples: "2:05:30.12" (hundredths) or "2:05:30.123" (milliseconds)

ALTER TABLE race_results
    ALTER COLUMN finish_time TYPE VARCHAR(13),
    ALTER COLUMN split_5k TYPE VARCHAR(13),
    ALTER COLUMN split_10k TYPE VARCHAR(13),
    ALTER COLUMN split_15k TYPE VARCHAR(13),
    ALTER COLUMN split_20k TYPE VARCHAR(13),
    ALTER COLUMN split_25k TYPE VARCHAR(13),
    ALTER COLUMN split_half TYPE VARCHAR(13),
    ALTER COLUMN split_30k TYPE VARCHAR(13),
    ALTER COLUMN split_35k TYPE VARCHAR(13),
    ALTER COLUMN split_40k TYPE VARCHAR(13);

-- Note: Existing data remains unchanged (e.g., "2:05:30" is still valid)
-- New data can include decimals (e.g., "2:05:30.03" for close finishes)
