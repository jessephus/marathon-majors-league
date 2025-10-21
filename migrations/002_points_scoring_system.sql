-- Migration 002: Points-Based Scoring System (Version 2)
-- Adds comprehensive scoring system with placement points, time gap bonuses,
-- performance bonuses, and record tracking

-- ============================================================================
-- RACE RESULTS - Add Scoring Columns
-- ============================================================================

-- Add placement and scoring columns
ALTER TABLE race_results ADD COLUMN IF NOT EXISTS placement INTEGER;
ALTER TABLE race_results ADD COLUMN IF NOT EXISTS placement_points INTEGER DEFAULT 0;
ALTER TABLE race_results ADD COLUMN IF NOT EXISTS finish_time_ms BIGINT;
ALTER TABLE race_results ADD COLUMN IF NOT EXISTS time_gap_seconds INTEGER;
ALTER TABLE race_results ADD COLUMN IF NOT EXISTS time_gap_points INTEGER DEFAULT 0;
ALTER TABLE race_results ADD COLUMN IF NOT EXISTS performance_bonus_points INTEGER DEFAULT 0;
ALTER TABLE race_results ADD COLUMN IF NOT EXISTS record_bonus_points INTEGER DEFAULT 0;
ALTER TABLE race_results ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0;
ALTER TABLE race_results ADD COLUMN IF NOT EXISTS points_version INTEGER DEFAULT 1;
ALTER TABLE race_results ADD COLUMN IF NOT EXISTS breakdown JSONB;

-- Add split time columns (in milliseconds for precision)
ALTER TABLE race_results ADD COLUMN IF NOT EXISTS first_half_time_ms BIGINT;
ALTER TABLE race_results ADD COLUMN IF NOT EXISTS second_half_time_ms BIGINT;
ALTER TABLE race_results ADD COLUMN IF NOT EXISTS last_5k_time_ms BIGINT;

-- Add record tracking columns
ALTER TABLE race_results ADD COLUMN IF NOT EXISTS is_course_record BOOLEAN DEFAULT false;
ALTER TABLE race_results ADD COLUMN IF NOT EXISTS is_world_record BOOLEAN DEFAULT false;
ALTER TABLE race_results ADD COLUMN IF NOT EXISTS record_type VARCHAR(20) DEFAULT 'NONE' CHECK (record_type IN ('NONE', 'COURSE', 'WORLD'));
ALTER TABLE race_results ADD COLUMN IF NOT EXISTS record_status VARCHAR(20) DEFAULT 'none' CHECK (record_status IN ('none', 'provisional', 'confirmed', 'rejected'));
ALTER TABLE race_results ADD COLUMN IF NOT EXISTS record_source TEXT;
ALTER TABLE race_results ADD COLUMN IF NOT EXISTS record_confirmed_at TIMESTAMP;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_race_results_placement ON race_results(game_id, placement);
CREATE INDEX IF NOT EXISTS idx_race_results_total_points ON race_results(game_id, total_points DESC);
CREATE INDEX IF NOT EXISTS idx_race_results_points_version ON race_results(points_version);
CREATE INDEX IF NOT EXISTS idx_race_results_record_type ON race_results(record_type);
CREATE INDEX IF NOT EXISTS idx_race_results_record_status ON race_results(record_status);

-- ============================================================================
-- SCORING RULES - Configuration Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS scoring_rules (
    id SERIAL PRIMARY KEY,
    version INTEGER UNIQUE NOT NULL,
    rules JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    description TEXT
);

CREATE INDEX IF NOT EXISTS idx_scoring_rules_version ON scoring_rules(version);

-- Insert default Version 2 scoring rules
INSERT INTO scoring_rules (version, rules, created_by, description)
VALUES (2, '{
  "placement_points": [10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
  "max_scored_place": 10,
  "time_gap_windows": [
    {"max_gap_seconds": 60, "points": 5},
    {"max_gap_seconds": 120, "points": 4},
    {"max_gap_seconds": 180, "points": 3},
    {"max_gap_seconds": 300, "points": 2},
    {"max_gap_seconds": 600, "points": 1}
  ],
  "performance_bonuses": {
    "NegativeSplit": {"enabled": true, "points": 2},
    "EvenPace": {"enabled": true, "points": 1, "tolerance_ratio": 0.005},
    "FastFinishKick": {"enabled": true, "points": 1, "pace_improvement_ratio": 0.03}
  },
  "bonus_exclusions": {},
  "record_bonuses": {
    "CourseRecord": {"enabled": true, "points": 5},
    "WorldRecord": {"enabled": true, "points": 15}
  },
  "record_bonuses_mutually_exclusive": true,
  "record_bonus_precedence": ["WorldRecord", "CourseRecord"],
  "record_requires_confirmation": true,
  "record_provisional_points_policy": "withhold",
  "retroactive_apply_record_changes": false,
  "baseline_awards_course_record": false,
  "rounding": {"gap": "floor_seconds"},
  "max_recalculation_batch_size": 200,
  "scoring_concurrency": 4
}'::jsonb, 'system', 'Version 2 - Initial points-based scoring system')
ON CONFLICT (version) DO NOTHING;

-- Insert Version 1 (legacy) for historical reference
INSERT INTO scoring_rules (version, rules, created_by, description)
VALUES (1, '{
  "scoring_method": "lowest_combined_time",
  "description": "Legacy system - team with lowest combined finish time wins"
}'::jsonb, 'system', 'Version 1 - Legacy lowest combined time scoring')
ON CONFLICT (version) DO NOTHING;

-- ============================================================================
-- LEAGUE STANDINGS - Cached Leaderboard Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS league_standings (
    id SERIAL PRIMARY KEY,
    game_id VARCHAR(255) NOT NULL,
    player_code VARCHAR(255) NOT NULL,
    races_count INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    top3 INTEGER DEFAULT 0,
    total_points INTEGER DEFAULT 0,
    average_points DECIMAL(8,2) DEFAULT 0,
    world_records INTEGER DEFAULT 0,
    course_records INTEGER DEFAULT 0,
    last_race_points INTEGER,
    last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(game_id, player_code)
);

CREATE INDEX IF NOT EXISTS idx_standings_game_id ON league_standings(game_id);
CREATE INDEX IF NOT EXISTS idx_standings_total_points ON league_standings(game_id, total_points DESC);
CREATE INDEX IF NOT EXISTS idx_standings_player ON league_standings(game_id, player_code);

-- ============================================================================
-- RECORDS AUDIT - Record Change Tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS records_audit (
    id SERIAL PRIMARY KEY,
    race_result_id INTEGER REFERENCES race_results(id) ON DELETE CASCADE,
    game_id VARCHAR(255) NOT NULL,
    athlete_id INTEGER REFERENCES athletes(id) ON DELETE CASCADE,
    record_type VARCHAR(20) NOT NULL CHECK (record_type IN ('COURSE', 'WORLD')),
    status_before VARCHAR(20),
    status_after VARCHAR(20),
    points_delta INTEGER DEFAULT 0,
    changed_by VARCHAR(255),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_records_audit_result ON records_audit(race_result_id);
CREATE INDEX IF NOT EXISTS idx_records_audit_game ON records_audit(game_id);
CREATE INDEX IF NOT EXISTS idx_records_audit_athlete ON records_audit(athlete_id);
CREATE INDEX IF NOT EXISTS idx_records_audit_changed_at ON records_audit(changed_at DESC);

-- ============================================================================
-- COURSE AND WORLD RECORDS - Reference Data
-- ============================================================================

CREATE TABLE IF NOT EXISTS race_records (
    id SERIAL PRIMARY KEY,
    race_id INTEGER REFERENCES races(id) ON DELETE CASCADE,
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('men', 'women')),
    record_type VARCHAR(20) NOT NULL CHECK (record_type IN ('COURSE', 'WORLD')),
    time_ms BIGINT NOT NULL,
    athlete_name VARCHAR(255),
    set_date DATE,
    verified BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(race_id, gender, record_type)
);

CREATE INDEX IF NOT EXISTS idx_race_records_race_gender ON race_records(race_id, gender);

-- Seed initial world records (as of 2024)
-- Men's Marathon World Record: Kelvin Kiptum, 2:00:35 (Chicago 2023)
-- Women's Marathon World Record: Tigst Assefa, 2:11:53 (Berlin 2023)
INSERT INTO race_records (race_id, gender, record_type, time_ms, athlete_name, set_date, verified, notes)
SELECT 
    r.id,
    'men',
    'WORLD',
    7235000, -- 2:00:35 in milliseconds
    'Kelvin Kiptum',
    '2023-10-08'::date,
    true,
    'Set at Chicago Marathon 2023'
FROM races r
WHERE r.is_active = true
LIMIT 1
ON CONFLICT (race_id, gender, record_type) DO NOTHING;

INSERT INTO race_records (race_id, gender, record_type, time_ms, athlete_name, set_date, verified, notes)
SELECT 
    r.id,
    'women',
    'WORLD',
    7913000, -- 2:11:53 in milliseconds
    'Tigst Assefa',
    '2023-09-24'::date,
    true,
    'Set at Berlin Marathon 2023'
FROM races r
WHERE r.is_active = true
LIMIT 1
ON CONFLICT (race_id, gender, record_type) DO NOTHING;

-- NYC Marathon Course Records (as of 2024)
-- Men: Geoffrey Mutai, 2:05:06 (2011)
-- Women: Margaret Okayo, 2:22:31 (2003)
INSERT INTO race_records (race_id, gender, record_type, time_ms, athlete_name, set_date, verified, notes)
SELECT 
    r.id,
    'men',
    'COURSE',
    7506000, -- 2:05:06 in milliseconds
    'Geoffrey Mutai',
    '2011-11-06'::date,
    true,
    'NYC Marathon Course Record'
FROM races r
WHERE r.name = 'NYC Marathon' AND r.is_active = true
LIMIT 1
ON CONFLICT (race_id, gender, record_type) DO NOTHING;

INSERT INTO race_records (race_id, gender, record_type, time_ms, athlete_name, set_date, verified, notes)
SELECT 
    r.id,
    'women',
    'COURSE',
    8551000, -- 2:22:31 in milliseconds
    'Margaret Okayo',
    '2003-11-02'::date,
    true,
    'NYC Marathon Course Record'
FROM races r
WHERE r.name = 'NYC Marathon' AND r.is_active = true
LIMIT 1
ON CONFLICT (race_id, gender, record_type) DO NOTHING;

-- ============================================================================
-- TRIGGER: Update Standings on Result Change
-- ============================================================================

CREATE OR REPLACE FUNCTION update_standings_on_result_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Mark standings as needing recalculation
    -- Actual recalculation is done by the application layer
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE league_standings
        SET last_updated_at = CURRENT_TIMESTAMP
        WHERE game_id = NEW.game_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_standings
AFTER INSERT OR UPDATE ON race_results
FOR EACH ROW
EXECUTE FUNCTION update_standings_on_result_change();

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function to convert time string (H:MM:SS or M:SS) to milliseconds
CREATE OR REPLACE FUNCTION time_string_to_ms(time_str VARCHAR)
RETURNS BIGINT AS $$
DECLARE
    parts TEXT[];
    hours INTEGER := 0;
    minutes INTEGER := 0;
    seconds NUMERIC := 0;
BEGIN
    IF time_str IS NULL OR time_str = '' THEN
        RETURN NULL;
    END IF;
    
    parts := string_to_array(time_str, ':');
    
    IF array_length(parts, 1) = 3 THEN
        -- H:MM:SS format
        hours := parts[1]::INTEGER;
        minutes := parts[2]::INTEGER;
        seconds := parts[3]::NUMERIC;
    ELSIF array_length(parts, 1) = 2 THEN
        -- MM:SS format
        minutes := parts[1]::INTEGER;
        seconds := parts[2]::NUMERIC;
    ELSE
        RETURN NULL;
    END IF;
    
    RETURN ((hours * 3600 + minutes * 60)::BIGINT * 1000 + (seconds * 1000)::BIGINT);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to convert milliseconds to time string
CREATE OR REPLACE FUNCTION ms_to_time_string(ms BIGINT)
RETURNS VARCHAR AS $$
DECLARE
    hours INTEGER;
    minutes INTEGER;
    seconds NUMERIC;
BEGIN
    IF ms IS NULL THEN
        RETURN NULL;
    END IF;
    
    hours := ms / 3600000;
    minutes := (ms % 3600000) / 60000;
    seconds := ((ms % 60000)::NUMERIC) / 1000;
    
    IF hours > 0 THEN
        RETURN hours || ':' || LPAD(minutes::TEXT, 2, '0') || ':' || LPAD(TO_CHAR(seconds, 'FM00.00'), 5, '0');
    ELSE
        RETURN minutes || ':' || LPAD(TO_CHAR(seconds, 'FM00.00'), 5, '0');
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Add comment to track migration
COMMENT ON TABLE scoring_rules IS 'Versioned scoring configuration for points-based system';
COMMENT ON TABLE league_standings IS 'Cached leaderboard standings for each game';
COMMENT ON TABLE records_audit IS 'Audit trail for record status changes';
COMMENT ON TABLE race_records IS 'Course and world records for comparison';
