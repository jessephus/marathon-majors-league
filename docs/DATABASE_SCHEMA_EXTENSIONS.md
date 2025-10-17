# Database Schema Extensions

## Overview

This document describes the extended database schema to support richer athlete data and multi-race functionality.

## Changes Made

### 1. Extended Athletes Table

Added new fields to the `athletes` table to support comprehensive athlete data:

```sql
-- New fields added
overall_rank INTEGER         -- World Athletics overall ranking
age INTEGER                  -- Current age of athlete
date_of_birth DATE          -- Birth date for age calculation
sponsor VARCHAR(255)        -- Athlete's primary sponsor (to be populated)
season_best VARCHAR(10)     -- Best time in current season
```

**New Indexes:**
- `idx_athletes_marathon_rank` - For efficient ranking queries
- `idx_athletes_overall_rank` - For overall ranking queries

### 2. Races Table

New table to track different marathon events:

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

**Purpose:** Track multiple marathon events (current and future) for league expansion.

**Initial Data:** 2025 NYC Marathon is seeded automatically during database initialization.

### 3. Athlete-Race Junction Table

Links athletes to specific races they're confirmed to compete in:

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

**Purpose:** Track which athletes are competing in which races, supporting multi-race functionality.

**Initial Data:** All current athletes are automatically linked to the 2025 NYC Marathon during seeding.

## API Changes

### Extended Athletes API

The `/api/athletes` endpoint now returns extended fields:

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
      "overallRank": null,
      "age": null,
      "dateOfBirth": null,
      "sponsor": null,
      "seasonBest": null
    }
  ]
}
```

### New Races API

New endpoint: `/api/races`

**GET /api/races** - Get all races
```bash
curl https://your-app.vercel.app/api/races
```

**GET /api/races?active=true** - Get only active races
```bash
curl https://your-app.vercel.app/api/races?active=true
```

**GET /api/races?id=1** - Get specific race
```bash
curl https://your-app.vercel.app/api/races?id=1
```

**GET /api/races?id=1&includeAthletes=true** - Get race with athletes
```bash
curl https://your-app.vercel.app/api/races?id=1&includeAthletes=true
```

**POST /api/races** - Create new race
```bash
curl -X POST https://your-app.vercel.app/api/races \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Berlin Marathon",
    "date": "2025-09-28",
    "location": "Berlin, Germany"
  }'
```

## Database Helper Functions

### New Functions in `api/db.js`

#### Race Management
- `getAllRaces()` - Get all races ordered by date
- `getActiveRaces()` - Get only active races
- `getRaceById(id)` - Get specific race details
- `createRace(raceData)` - Create a new race
- `updateRace(id, updates)` - Update race information
- `seedNYMarathon2025()` - Initialize 2025 NYC Marathon

#### Athlete-Race Links
- `linkAthleteToRace(athleteId, raceId, bibNumber)` - Link athlete to race
- `unlinkAthleteFromRace(athleteId, raceId)` - Remove athlete from race
- `getAthletesForRace(raceId)` - Get all athletes competing in a race
- `getRacesForAthlete(athleteId)` - Get all races for an athlete

## Migration Strategy

### Existing Deployments

The `init-db.js` endpoint automatically handles schema migrations:

1. **Checks for existing tables** - No data loss for existing deployments
2. **Adds missing columns** - Uses `ALTER TABLE ADD COLUMN IF NOT EXISTS`
3. **Creates new tables** - Races and athlete_races tables created if missing
4. **Seeds initial data** - 2025 NYC Marathon race created automatically
5. **Links existing athletes** - All current athletes linked to NYC Marathon

### Running Migration

For existing deployments, simply trigger the init endpoint:

```bash
curl -X POST https://your-app.vercel.app/api/init-db
```

This will:
- ✅ Add new columns to existing athletes table
- ✅ Create races and athlete_races tables
- ✅ Seed the 2025 NYC Marathon
- ✅ Link all existing athletes to the marathon
- ✅ Preserve all existing game data

## Future Enhancements

The schema is now ready to support:

1. **Multiple Marathon Events** - Berlin, London, Tokyo, Boston, Chicago marathons
2. **Automated Data Updates** - Scripts can populate new fields from World Athletics
3. **Historical Race Data** - Track athlete performance across multiple events
4. **Rich Athlete Profiles** - Age, sponsor, season best, comprehensive rankings
5. **Race-Specific Teams** - Draft different teams for different races

## Testing

To verify the schema changes:

```bash
# Test athletes API returns new fields
curl https://your-app.vercel.app/api/athletes

# Test races API
curl https://your-app.vercel.app/api/races

# Test race with athletes
curl https://your-app.vercel.app/api/races?id=1&includeAthletes=true

# Trigger migration for existing deployment
curl -X POST https://your-app.vercel.app/api/init-db
```

## Schema Diagram

```
athletes                    races
├── id                     ├── id
├── name                   ├── name
├── country                ├── date
├── gender                 ├── location
├── personal_best          ├── distance
├── headshot_url          ├── event_type
├── world_athletics_id    ├── description
├── marathon_rank         ├── is_active
├── road_running_rank     └── timestamps
├── overall_rank (NEW)          ↑
├── age (NEW)                   │
├── date_of_birth (NEW)         │
├── sponsor (NEW)               │ race_id
├── season_best (NEW)           │
└── timestamps                  │
      ↓                         │
   athlete_id           athlete_races
      │                  ├── athlete_id
      └──────────────────├── race_id
                         ├── bib_number
                         └── confirmed_at
```

## Notes

- All new fields are nullable to support incremental data population
- Existing game functionality remains unchanged
- Foreign key constraints ensure data integrity
- Indexes optimized for common query patterns
- Schema supports both current single-race and future multi-race functionality
