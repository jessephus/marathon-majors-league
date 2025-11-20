-- Migration: Add visual and timing fields to races table
-- Date: 2025-11-20
-- Purpose: Add lock_time, logo_url, background_image_url, and theme colors for race customization

-- Add lock_time for roster locking
ALTER TABLE races ADD COLUMN IF NOT EXISTS lock_time TIMESTAMP WITH TIME ZONE;

-- Add visual customization fields
ALTER TABLE races ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE races ADD COLUMN IF NOT EXISTS background_image_url TEXT;

-- Add theme color fields (stored as hex color codes, e.g., '#FF5733')
ALTER TABLE races ADD COLUMN IF NOT EXISTS primary_color VARCHAR(7);
ALTER TABLE races ADD COLUMN IF NOT EXISTS secondary_color VARCHAR(7);
ALTER TABLE races ADD COLUMN IF NOT EXISTS accent_color VARCHAR(7);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_races_lock_time ON races(lock_time);

-- Add comments
COMMENT ON COLUMN races.lock_time IS 'Timestamp when rosters lock for this race (e.g., race start time)';
COMMENT ON COLUMN races.logo_url IS 'URL to the race logo image';
COMMENT ON COLUMN races.background_image_url IS 'URL to the race background/hero image';
COMMENT ON COLUMN races.primary_color IS 'Primary theme color (hex format, e.g., #FF5733)';
COMMENT ON COLUMN races.secondary_color IS 'Secondary theme color (hex format, e.g., #33C3FF)';
COMMENT ON COLUMN races.accent_color IS 'Accent theme color (hex format, e.g., #FFD700)';
