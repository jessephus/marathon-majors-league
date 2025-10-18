# Database Guide

## Overview

The Fantasy NY Marathon application uses **Neon Postgres** (serverless PostgreSQL) as its database. This document covers the schema, initialization process, and troubleshooting.

## Database Schema

### Core Tables

#### Athletes Table
Stores elite marathon runner profiles with extended World Athletics data:

```sql
CREATE TABLE athletes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    country CHAR(3) NOT NULL,
    gender VARCHAR(10) NOT NULL,
    personal_best VARCHAR(10) NOT NULL,
    season_best VARCHAR(10),
    headshot_url TEXT,
    world_athletics_id VARCHAR(50) UNIQUE,
    world_athletics_profile_url TEXT,
    marathon_rank INTEGER,
    road_running_rank INTEGER,
    overall_rank INTEGER,
    age INTEGER,
    date_of_birth DATE,
    sponsor VARCHAR(255),
    
    -- Sync tracking fields
    world_athletics_marathon_ranking_score INTEGER,
    ranking_source VARCHAR(50) DEFAULT 'world_marathon',
    data_hash TEXT,
    last_fetched_at TIMESTAMP WITH TIME ZONE,
    last_seen_at TIMESTAMP WITH TIME ZONE,
    raw_json JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_athletes_world_athletics_id ON athletes(world_athletics_id);
CREATE INDEX idx_athletes_gender ON athletes(gender);
CREATE INDEX idx_athletes_marathon_rank ON athletes(marathon_rank);
CREATE INDEX idx_athletes_data_hash ON athletes(data_hash);
```

**Key Fields:**
- `world_athletics_marathon_ranking_score`: Rolling 18-month average for change detection
- `data_hash`: SHA256 hash for identifying changes
- `last_fetched_at`: Last profile fetch time
- `last_seen_at`: Last time athlete appeared in top 100

#### Races Table
Tracks marathon events:

```sql
CREATE TABLE races (
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
```

**Initial Data:** 2025 NYC Marathon is seeded automatically.

#### Athlete-Race Junction Table
Links athletes to specific races:

```sql
CREATE TABLE athlete_races (
    id SERIAL PRIMARY KEY,
    athlete_id INTEGER NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
    race_id INTEGER NOT NULL REFERENCES races(id) ON DELETE CASCADE,
    bib_number VARCHAR(20),
    confirmed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(athlete_id, race_id)
);
```

#### Games Table
Game configuration and state:

```sql
CREATE TABLE games (
    id SERIAL PRIMARY KEY,
    game_id VARCHAR(255) UNIQUE NOT NULL,
    players TEXT[] NOT NULL DEFAULT '{}',
    draft_complete BOOLEAN DEFAULT FALSE,
    results_finalized BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Player Rankings Table
Stores player athlete preferences:

```sql
CREATE TABLE player_rankings (
    id SERIAL PRIMARY KEY,
    game_id VARCHAR(255) NOT NULL,
    player_code VARCHAR(255) NOT NULL,
    gender VARCHAR(10) NOT NULL,
    athlete_id INTEGER NOT NULL REFERENCES athletes(id),
    rank_order INTEGER NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(game_id, player_code, gender, rank_order)
);
```

#### Draft Teams Table
Post-draft team assignments:

```sql
CREATE TABLE draft_teams (
    id SERIAL PRIMARY KEY,
    game_id VARCHAR(255) NOT NULL,
    player_code VARCHAR(255) NOT NULL,
    athlete_id INTEGER NOT NULL REFERENCES athletes(id),
    drafted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(game_id, athlete_id)
);
```

#### Race Results Table
Live and final race results with split times:

```sql
CREATE TABLE race_results (
    id SERIAL PRIMARY KEY,
    game_id VARCHAR(255) NOT NULL,
    athlete_id INTEGER NOT NULL REFERENCES athletes(id),
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
```

### Future Tables (Schema Ready)

#### Users Table
User account support (not yet implemented):

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Database Initialization

### Three-Tier Initialization Approach

The application uses multiple fallback mechanisms to ensure the database is always initialized:

#### Tier 1: Build-Time Initialization (Primary)

**When:** During Vercel deployment, after dependencies are installed

**How:**
- `package.json` includes a `postbuild` script
- Runs `node scripts/init-db.js`
- Creates schema if needed
- Seeds athletes from `athletes.json` if database is empty

**Benefits:**
- Automatic on every deployment
- Database ready before app goes live
- No user interaction needed

```json
// package.json
{
  "scripts": {
    "postbuild": "node scripts/init-db.js"
  }
}
```

#### Tier 2: Runtime Auto-Seeding (Safety Net)

**When:** On first API request to `/api/athletes`

**How:**
- Checks if database is empty
- Auto-seeds from `athletes.json` if needed
- Returns seeded data

**Benefits:**
- Catches cases where build-time init failed
- Self-healing mechanism
- No manual intervention needed

#### Tier 3: Manual Initialization (Last Resort)

**When:** User manually visits `/api/init-db` endpoint

**Usage:**
```bash
curl -X POST https://your-app.vercel.app/api/init-db
```

**Response:**
```json
{
  "message": "Neon Postgres database is ready",
  "status": "initialized",
  "database": "Neon Postgres",
  "athletesCount": 58
}
```

### Initialization Flow

```
┌─────────────────────────────────────────┐
│     1. Vercel Deployment Starts         │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  2. Build: Run `postbuild` Script      │
│     → node scripts/init-db.js           │
│     → Create schema if missing          │
│     → Seed athletes if empty            │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  3. Deployment Complete                 │
│     Database is initialized             │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  4. First User Request                  │
│     → GET /api/athletes                 │
│     → Check if DB has data              │
│     → Auto-seed if empty (Tier 2)       │
└─────────────────────────────────────────┘
```

## Data Persistence

### Your Data is Safe! 🔒

The Neon Postgres database is **persistent** and **independent** from Vercel deployments:

✅ **Game data persists across deployments** - Never deleted when you push new code  
✅ **Athletes data persists** - Only seeded once initially
✅ **Schema persists** - Tables created once and remain  

### What Happens During Deployment

When you deploy new code:

1. Vercel builds your application (new serverless functions)
2. Initialization script runs (`scripts/init-db.js`)
   - Checks if tables exist → If not, creates schema
   - Checks if athletes exist → If not, seeds from JSON
   - If data exists → Skips everything
3. Your Neon database stays untouched - All existing data remains

**Important:** The database is a separate service from your application deployment.

## API Endpoints

### /api/athletes
Returns all athletes with extended fields:

```json
{
  "men": [
    {
      "id": 1,
      "name": "Eliud Kipchoge",
      "country": "KEN",
      "pb": "2:01:09",
      "headshotUrl": "...",
      "worldAthleticsId": "14208194",
      "marathonRank": 61,
      "roadRunningRank": 45,
      "overallRank": 12,
      "age": 39,
      "dateOfBirth": "1984-11-05",
      "sponsor": "Nike",
      "seasonBest": "2:04:15"
    }
  ],
  "women": [...]
}
```

### /api/races
Manages marathon events:

```javascript
// GET all races
GET /api/races

// GET specific race
GET /api/races?id=1

// GET active races with athletes
GET /api/races?active=true&includeAthletes=true
```

### /api/init-db
Database initialization and health check:

```javascript
// Check status
GET /api/init-db

// Force re-initialization
POST /api/init-db
```

## Troubleshooting

### Issue: "relation 'athletes' does not exist"

**Cause:** Database schema was never created

**Solution:**
```bash
# Visit the init endpoint (auto-creates schema)
curl -X POST https://your-app.vercel.app/api/init-db

# Or manually run schema.sql in Neon console
```

### Issue: Database Not Seeded After Deployment

1. Check build logs for initialization errors
2. Verify `DATABASE_URL` is set in Vercel environment variables
3. Check schema is initialized (run `schema.sql` in Neon console)
4. Manually seed via `/api/init-db` endpoint

### Issue: Athletes API Returns Empty Array

The app will auto-seed on first access (Tier 2). If it persists:

1. Check database connection (`DATABASE_URL` correct?)
2. Check `athletes.json` file exists in repository
3. Check Neon console for errors
4. Visit `/api/init-db` to force initialization

### Checking Initialization Logs

**Build-Time Logs:**
1. Go to Vercel dashboard → Deployments
2. Click on the deployment
3. View build logs
4. Look for:
   - `📦 Database is empty, seeding athletes...`
   - `✅ Successfully seeded X athletes`

**Runtime Logs:**
1. Go to Vercel dashboard → Functions
2. Select `/api/athletes`
3. View invocation logs
4. Look for auto-seeding messages

### Verify Database Status

```bash
# Check initialization status
curl https://your-app.vercel.app/api/init-db

# Check athletes count
curl https://your-app.vercel.app/api/athletes | jq '.men | length, .women | length'
```

## Migrations

Database migrations are managed via SQL files in the `migrations/` directory:

### add_sync_tracking_fields.sql
Adds fields for World Athletics sync system:
- `world_athletics_marathon_ranking_score`
- `ranking_source`
- `data_hash`
- `last_fetched_at`
- `last_seen_at`
- `raw_json`

**Run migration:**
```bash
# Automatic: GitHub Actions runs it before sync
# Manual: Execute SQL in Neon console
```

See [MIGRATION.md](MIGRATION.md) for migration history and decisions.

## Best Practices

### Development
1. Use `.env` file with `DATABASE_URL` for local development
2. Test migrations in Neon console before committing
3. Use transactions for multi-statement operations
4. Index frequently queried columns

### Production
1. Let build-time initialization handle seeding
2. Monitor Neon console for slow queries
3. Use connection pooling (built into Neon)
4. Set up automated backups in Neon dashboard

### Data Management
1. Never manually delete core athletes data
2. Use game_id isolation for multi-game support
3. Soft-delete via `is_active` flags where possible
4. Keep historical data (don't delete old games)

## Related Documentation

- [NEON_SETUP.md](NEON_SETUP.md) - Initial database setup instructions
- [POSTGRES_REFERENCE.md](POSTGRES_REFERENCE.md) - SQL queries and examples
- [MIGRATION.md](MIGRATION.md) - Migration history and rationale
- [ARCHITECTURE.md](ARCHITECTURE.md) - Overall system architecture
- [SYNC_TOP_100.md](SYNC_TOP_100.md) - Automated athlete data sync

## Future Enhancements

Potential improvements:
- [ ] Prisma or similar ORM for type-safe queries
- [ ] Automated migration system
- [ ] Read replicas for high-traffic scenarios
- [ ] Query performance monitoring
- [ ] Automated database backups to external storage
- [ ] User authentication implementation
- [ ] Historical game tracking and analytics
