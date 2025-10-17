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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_races_date ON races(date);
CREATE INDEX idx_races_is_active ON races(is_active);

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

-- Games table (replacing game-state.json)
CREATE TABLE IF NOT EXISTS games (
    id SERIAL PRIMARY KEY,
    game_id VARCHAR(255) UNIQUE NOT NULL,
    players TEXT[] NOT NULL DEFAULT '{}',
    draft_complete BOOLEAN DEFAULT FALSE,
    results_finalized BOOLEAN DEFAULT FALSE,
    commissioner_password VARCHAR(255) DEFAULT 'kipchoge',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_games_game_id ON games(game_id);

-- Player rankings table (replacing rankings.json)
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
    finish_time VARCHAR(10),
    split_5k VARCHAR(10),
    split_10k VARCHAR(10),
    split_half VARCHAR(10),
    split_30k VARCHAR(10),
    split_35k VARCHAR(10),
    split_40k VARCHAR(10),
    is_final BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(game_id, athlete_id)
);

CREATE INDEX idx_results_game_id ON race_results(game_id);
CREATE INDEX idx_results_athlete_id ON race_results(athlete_id);

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

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_races_updated_at BEFORE UPDATE ON races
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
