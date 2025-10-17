# Neon Postgres Quick Reference

A quick reference guide for developers working with the Neon Postgres database.

## Environment Setup

```bash
# Install dependencies
npm install

# Link to Vercel (one-time)
vercel link

# Pull DATABASE_URL
vercel env pull

# Start dev server
vercel dev
```

## Database Connection

```javascript
import { neon } from '@neondatabase/serverless';

// Get SQL client
const sql = neon(process.env.DATABASE_URL);

// Execute query
const results = await sql`SELECT * FROM athletes WHERE gender = ${gender}`;
```

## Common Database Operations

### Using Helper Functions (Recommended)

```javascript
import { 
  getAllAthletes, 
  getGameState, 
  updateGameState,
  getPlayerRankings,
  savePlayerRankings,
  getDraftTeams,
  saveDraftTeams,
  getRaceResults,
  saveRaceResults
} from './db.js';

// Get all athletes
const athletes = await getAllAthletes();
// Returns: { men: [...], women: [...] }

// Get/update game state
const game = await getGameState('game-id');
await updateGameState('game-id', { 
  players: ['PLAYER1', 'PLAYER2'],
  draft_complete: true 
});

// Player rankings
const rankings = await getPlayerRankings('game-id', 'PLAYER1');
await savePlayerRankings('game-id', 'PLAYER1', menArray, womenArray);

// Draft teams
const teams = await getDraftTeams('game-id');
await saveDraftTeams('game-id', teamsObject);

// Results
const results = await getRaceResults('game-id');
await saveRaceResults('game-id', { '1': '2:05:30', '101': '2:18:45' });
```

### Raw SQL (When Needed)

```javascript
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

// SELECT
const athletes = await sql`
  SELECT * FROM athletes 
  WHERE gender = ${gender} 
  ORDER BY personal_best
`;

// INSERT
await sql`
  INSERT INTO games (game_id, players)
  VALUES (${gameId}, ${players})
`;

// UPDATE
await sql`
  UPDATE games 
  SET draft_complete = ${true}
  WHERE game_id = ${gameId}
`;

// DELETE
await sql`
  DELETE FROM race_results 
  WHERE game_id = ${gameId}
`;

// JOIN
const teams = await sql`
  SELECT dt.player_code, a.name, a.country
  FROM draft_teams dt
  JOIN athletes a ON dt.athlete_id = a.id
  WHERE dt.game_id = ${gameId}
`;
```

## Database Schema Quick Ref

```sql
-- Athletes
athletes (id, name, country, gender, personal_best, headshot_url)

-- Games
games (id, game_id, players[], draft_complete, results_finalized)

-- Player Rankings
player_rankings (id, game_id, player_code, gender, athlete_id, rank_order)

-- Draft Teams
draft_teams (id, game_id, player_code, athlete_id)

-- Race Results
race_results (id, game_id, athlete_id, finish_time, is_final)

-- Future: User Accounts (not implemented)
users (id, email, username, password_hash, display_name)
user_games (id, user_id, game_id, role, player_code)
```

## API Endpoint Patterns

```javascript
export default async function handler(req, res) {
  // CORS headers (required)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const gameId = req.query.gameId || 'default';

  try {
    if (req.method === 'GET') {
      const data = await getDataFunction(gameId);
      res.status(200).json(data);
    } else if (req.method === 'POST') {
      await saveDataFunction(gameId, req.body);
      res.status(200).json({ message: 'Success' });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
}
```

## SQL Injection Prevention

✅ **ALWAYS use parameterized queries:**
```javascript
// SAFE - parameterized
const user = await sql`SELECT * FROM users WHERE id = ${userId}`;

// SAFE - template literal with neon
const results = await sql`
  SELECT * FROM athletes 
  WHERE name LIKE ${'%' + search + '%'}
`;
```

❌ **NEVER concatenate SQL strings:**
```javascript
// DANGEROUS - SQL injection risk!
const query = `SELECT * FROM users WHERE id = ${userId}`;
const results = await sql(query);
```

## Debugging Tips

### Check Database in Neon Console
1. Go to https://console.neon.tech
2. Select your database
3. Open SQL Editor
4. Run queries to inspect data

### View Function Logs
1. Go to Vercel dashboard
2. Select Deployments
3. Click on a deployment
4. View function logs

### Test API Endpoints Locally
```bash
# Test with curl
curl http://localhost:3000/api/athletes

# Test with query params
curl "http://localhost:3000/api/game-state?gameId=test"

# Test POST
curl -X POST http://localhost:3000/api/results?gameId=test \
  -H "Content-Type: application/json" \
  -d '{"results": {"1": "2:05:30"}}'
```

### Common Issues

**Connection Error:**
```bash
# Check DATABASE_URL is set
echo $DATABASE_URL

# Re-pull env vars
vercel env pull
```

**Schema Error:**
```sql
-- Drop and recreate tables
DROP TABLE IF EXISTS race_results CASCADE;
DROP TABLE IF EXISTS draft_teams CASCADE;
DROP TABLE IF EXISTS player_rankings CASCADE;
DROP TABLE IF EXISTS games CASCADE;
DROP TABLE IF EXISTS athletes CASCADE;

-- Then run schema.sql
```

**Seed Error:**
```bash
# Re-seed athletes
curl -X POST http://localhost:3000/api/init-db
```

## Performance Tips

### Use Indexes (Already in Schema)
```sql
-- Existing indexes
CREATE INDEX idx_athletes_gender ON athletes(gender);
CREATE INDEX idx_games_game_id ON games(game_id);
CREATE INDEX idx_rankings_game_player ON player_rankings(game_id, player_code);
CREATE INDEX idx_teams_game_player ON draft_teams(game_id, player_code);
CREATE INDEX idx_results_game_id ON race_results(game_id);
```

### Optimize Queries
```javascript
// BAD - N+1 queries
for (const player of players) {
  const rankings = await sql`SELECT * FROM player_rankings WHERE player_code = ${player}`;
}

// GOOD - Single query with WHERE IN
const rankings = await sql`
  SELECT * FROM player_rankings 
  WHERE player_code = ANY(${players})
`;
```

### Use JOINs
```javascript
// BAD - Multiple queries
const teams = await sql`SELECT * FROM draft_teams WHERE game_id = ${gameId}`;
for (const team of teams) {
  const athlete = await sql`SELECT * FROM athletes WHERE id = ${team.athlete_id}`;
}

// GOOD - Single JOIN query
const teams = await sql`
  SELECT dt.*, a.name, a.country, a.personal_best
  FROM draft_teams dt
  JOIN athletes a ON dt.athlete_id = a.id
  WHERE dt.game_id = ${gameId}
`;
```

## Data Migration

### Export Data
```sql
-- CSV export
COPY (SELECT * FROM games) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM race_results) TO STDOUT WITH CSV HEADER;

-- JSON export (in Neon SQL Editor)
SELECT json_agg(row_to_json(t)) FROM (
  SELECT * FROM games WHERE game_id = 'your-game'
) t;
```

### Import Data
```javascript
// From JSON
const data = require('./backup.json');
for (const row of data) {
  await sql`
    INSERT INTO games (game_id, players, draft_complete)
    VALUES (${row.game_id}, ${row.players}, ${row.draft_complete})
  `;
}
```

## Useful SQL Queries

```sql
-- List all games
SELECT game_id, array_length(players, 1) as player_count, 
       draft_complete, results_finalized 
FROM games;

-- Get game with most players
SELECT game_id, array_length(players, 1) as player_count
FROM games 
ORDER BY player_count DESC 
LIMIT 1;

-- Find athletes not yet drafted in a game
SELECT a.* FROM athletes a
WHERE a.id NOT IN (
  SELECT athlete_id FROM draft_teams WHERE game_id = 'game-1'
);

-- Get leaderboard for a game
SELECT 
  dt.player_code,
  COUNT(dt.athlete_id) as athletes,
  SUM(CASE WHEN rr.finish_time IS NOT NULL THEN 1 ELSE 0 END) as finished
FROM draft_teams dt
LEFT JOIN race_results rr ON dt.athlete_id = rr.athlete_id 
  AND dt.game_id = rr.game_id
WHERE dt.game_id = 'game-1'
GROUP BY dt.player_code;

-- Find games with incomplete results
SELECT g.game_id, 
       (SELECT COUNT(*) FROM draft_teams WHERE game_id = g.game_id) as total_athletes,
       (SELECT COUNT(*) FROM race_results WHERE game_id = g.game_id) as completed
FROM games g
WHERE draft_complete = true AND results_finalized = false;
```

## Resources

- **Neon Docs**: https://neon.tech/docs
- **@neondatabase/serverless**: https://www.npmjs.com/package/@neondatabase/serverless
- **Setup Guide**: [NEON_SETUP.md](NEON_SETUP.md)
- **Testing Guide**: [TESTING.md](TESTING.md)
- **Migration History**: [docs/MIGRATION.md](docs/MIGRATION.md)
