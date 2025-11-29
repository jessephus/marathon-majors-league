-- Fantasy NY Marathon - Postgres Database Schema
-- Migration from Vercel Blob Storage to Neon Postgres

-- Athletes table (replacing athletes.json)
CREATE TABLE IF NOT EXISTS athletes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    country CHAR(3) NOT NULL,
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('men', 'women')),
    personal_best VARCHAR(10) NOT NULL,
    headshot_url TEXT,
    world_athletics_id VARCHAR(50) UNIQUE,
    world_athletics_profile_url TEXT,
    marathon_rank INTEGER,
    road_running_rank INTEGER,
    overall_rank INTEGER,
    age INTEGER,
    date_of_birth DATE,
    sponsor VARCHAR(255),
    season_best VARCHAR(10),
    salary INTEGER DEFAULT 5000,
    ranking_source VARCHAR(50) DEFAULT 'world_marathon',
    last_fetched_at TIMESTAMP WITH TIME ZONE,
    last_seen_at TIMESTAMP WITH TIME ZONE,
    data_hash TEXT,
    raw_json JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_athletes_gender ON athletes(gender);
CREATE INDEX idx_athletes_wa_id ON athletes(world_athletics_id);
CREATE INDEX idx_athletes_marathon_rank ON athletes(marathon_rank);
CREATE INDEX idx_athletes_overall_rank ON athletes(overall_rank);
CREATE INDEX idx_athletes_data_hash ON athletes(data_hash);
CREATE INDEX idx_athletes_last_seen ON athletes(last_seen_at);
CREATE INDEX idx_athletes_ranking_source ON athletes(ranking_source);

-- Races table (tracks different marathon events)
CREATE TABLE IF NOT EXISTS races (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    location VARCHAR(255) NOT NULL,
    distance VARCHAR(50) DEFAULT 'Marathon (42.195 km)',
    event_type VARCHAR(100) DEFAULT 'Marathon Majors',
    world_athletics_event_id VARCHAR(50),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    lock_time TIMESTAMP WITH TIME ZONE,
    logo_url TEXT,
    background_image_url TEXT,
    primary_color VARCHAR(7),
    secondary_color VARCHAR(7),
    accent_color VARCHAR(7),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_races_date ON races(date);
CREATE INDEX idx_races_is_active ON races(is_active);
CREATE INDEX idx_races_lock_time ON races(lock_time);

-- Athlete-Race junction table (links athletes to races they're competing in)
CREATE TABLE IF NOT EXISTS athlete_races (
    id SERIAL PRIMARY KEY,
    athlete_id INTEGER NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
    race_id INTEGER NOT NULL REFERENCES races(id) ON DELETE CASCADE,
    bib_number VARCHAR(20),
    confirmed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(athlete_id, race_id)
);

CREATE INDEX idx_athlete_races_athlete ON athlete_races(athlete_id);
CREATE INDEX idx_athlete_races_race ON athlete_races(race_id);

-- Fantasy NY Marathon Database Schema
-- Neon Postgres (Serverless PostgreSQL)

-- ============================================================================
-- GAMES TABLE - Game configuration and state
-- ============================================================================
--
-- ⚠️ DEPRECATION NOTICE - players column:
-- The `players` TEXT[] column is DEPRECATED for salary cap draft games.
-- It's only used for legacy snake draft mode compatibility.
--
-- For salary cap draft teams:
--   - Teams are tracked in anonymous_sessions table
--   - Query: SELECT * FROM anonymous_sessions WHERE game_id = ? AND is_active = true
--   - Do NOT add/remove from players[] array
--
-- The players[] array was a cache from before proper database tables existed.
-- Modern code should query anonymous_sessions directly.
--
-- See: components/commissioner/TeamsOverviewPanel.tsx for reference
-- See: /api/salary-cap-draft for team queries
--
CREATE TABLE IF NOT EXISTS games (
    id SERIAL PRIMARY KEY,
    game_id VARCHAR(255) UNIQUE NOT NULL,
    players TEXT[] NOT NULL DEFAULT '{}',  -- ⚠️ DEPRECATED - Use anonymous_sessions table
    draft_complete BOOLEAN DEFAULT FALSE,
    results_finalized BOOLEAN DEFAULT FALSE,
    roster_lock_time TIMESTAMP WITH TIME ZONE,
    commissioner_password VARCHAR(255) DEFAULT 'kipchoge',
    active_race_id INTEGER REFERENCES races(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_games_game_id ON games(game_id);
CREATE INDEX idx_games_active_race_id ON games(active_race_id);

-- Player rankings table (replacing rankings.json)
-- ⚠️ DEPRECATED: This table is part of the legacy snake draft system.
-- In snake draft mode, players submit preference rankings for athletes before
-- the automated draft is executed. This table stores those preference rankings.
--
-- The modern salary cap draft mode does not use rankings - players directly
-- select their team within a budget constraint, stored in salary_cap_teams table.
--
-- This table is maintained only for backward compatibility with existing
-- season league games that use the ranking + snake draft workflow.
--
-- @deprecated Use salary_cap_teams table for new games
CREATE TABLE IF NOT EXISTS player_rankings (
    id SERIAL PRIMARY KEY,
    game_id VARCHAR(255) NOT NULL,
    player_code VARCHAR(255) NOT NULL,
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('men', 'women')),
    athlete_id INTEGER NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
    rank_order INTEGER NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(game_id, player_code, gender, rank_order),
    UNIQUE(game_id, player_code, gender, athlete_id)
);

CREATE INDEX idx_rankings_game_player ON player_rankings(game_id, player_code);
CREATE INDEX idx_rankings_game_id ON player_rankings(game_id);

-- Draft teams table (replacing teams.json)
-- ⚠️ DEPRECATED: This table is part of the legacy snake draft system.
-- After players submit preference rankings, the commissioner executes an automated
-- snake draft that assigns athletes to players. This table stores those assignments.
--
-- The modern salary cap draft mode eliminates this step - players directly select
-- their team, stored in salary_cap_teams table without automated assignment.
--
-- This table is maintained only for backward compatibility with existing
-- season league games that use the ranking + snake draft workflow.
--
-- @deprecated Use salary_cap_teams table for new games
CREATE TABLE IF NOT EXISTS draft_teams (
    id SERIAL PRIMARY KEY,
    game_id VARCHAR(255) NOT NULL,
    player_code VARCHAR(255) NOT NULL,
    athlete_id INTEGER NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
    drafted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(game_id, athlete_id),
    UNIQUE(game_id, player_code, athlete_id)
);

CREATE INDEX idx_teams_game_player ON draft_teams(game_id, player_code);
CREATE INDEX idx_teams_game_id ON draft_teams(game_id);

-- Race results table (replacing results.json)
CREATE TABLE IF NOT EXISTS race_results (
    id SERIAL PRIMARY KEY,
    game_id VARCHAR(255) NOT NULL,
    athlete_id INTEGER NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
    finish_time VARCHAR(13),
    finish_time_ms BIGINT,
    split_5k VARCHAR(13),
    split_10k VARCHAR(13),
    split_15k VARCHAR(13),
    split_20k VARCHAR(13),
    split_25k VARCHAR(13),
    split_half VARCHAR(13),
    split_30k VARCHAR(13),
    split_35k VARCHAR(13),
    split_40k VARCHAR(13),
    placement INTEGER,
    placement_points INTEGER,
    time_gap_seconds NUMERIC(10,3),
    time_gap_points INTEGER,
    performance_bonus_points INTEGER,
    record_bonus_points INTEGER,
    total_points INTEGER,
    points_version INTEGER,
    breakdown JSONB,
    record_type VARCHAR(20),
    record_status VARCHAR(20),
    is_world_record BOOLEAN DEFAULT FALSE,
    is_course_record BOOLEAN DEFAULT FALSE,
    is_final BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(game_id, athlete_id)
);

CREATE INDEX idx_results_game_id ON race_results(game_id);
CREATE INDEX IF NOT EXISTS idx_results_finish_time_ms ON race_results(game_id, finish_time_ms);
CREATE INDEX idx_results_athlete_id ON race_results(athlete_id);

-- Athlete progression table (year-by-year season's bests)
CREATE TABLE IF NOT EXISTS athlete_progression (
    id SERIAL PRIMARY KEY,
    athlete_id INTEGER NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
    discipline VARCHAR(100) NOT NULL,
    discipline_code VARCHAR(50),
    discipline_url_slug VARCHAR(100),
    event_type VARCHAR(50),
    season VARCHAR(10) NOT NULL,
    mark VARCHAR(20) NOT NULL,
    venue TEXT,
    competition_date VARCHAR(20),
    competition_name TEXT,
    competition_id VARCHAR(50),
    result_score INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(athlete_id, discipline, season)
);

CREATE INDEX idx_progression_athlete_id ON athlete_progression(athlete_id);
CREATE INDEX idx_progression_discipline ON athlete_progression(discipline);
CREATE INDEX idx_progression_season ON athlete_progression(season);

-- Athlete race results table (detailed race results by year)
CREATE TABLE IF NOT EXISTS athlete_race_results (
    id SERIAL PRIMARY KEY,
    athlete_id INTEGER NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
    year VARCHAR(10) NOT NULL,
    competition_date VARCHAR(20),
    competition_name TEXT,
    competition_id VARCHAR(50),
    venue TEXT,
    discipline VARCHAR(100),
    position VARCHAR(20),
    finish_time VARCHAR(20),
    race_points INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(athlete_id, year, competition_date, competition_name, discipline)
);

CREATE INDEX idx_race_results_athlete_id ON athlete_race_results(athlete_id);
CREATE INDEX idx_race_results_year ON athlete_race_results(year);
CREATE INDEX idx_race_results_discipline ON athlete_race_results(discipline);

-- User accounts table (for future authentication - not implemented yet)
-- Placeholder for future feature
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- User game associations table (for future feature)
CREATE TABLE IF NOT EXISTS user_games (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game_id VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('commissioner', 'player')),
    player_code VARCHAR(255),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, game_id)
);

CREATE INDEX idx_user_games_user_id ON user_games(user_id);
CREATE INDEX idx_user_games_game_id ON user_games(game_id);

-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_athletes_updated_at BEFORE UPDATE ON athletes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON games
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_results_updated_at BEFORE UPDATE ON race_results
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_athlete_progression_updated_at BEFORE UPDATE ON athlete_progression
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_athlete_race_results_updated_at BEFORE UPDATE ON athlete_race_results
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_races_updated_at BEFORE UPDATE ON races
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
