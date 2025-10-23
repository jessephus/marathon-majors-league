# Testing Guide for Neon Postgres Migration

This document provides testing procedures to verify the Neon Postgres migration is working correctly.

## Prerequisites

Before testing, ensure:
1. Neon Postgres database is created via Vercel integration
2. `DATABASE_URL` environment variable is set
3. Database schema has been initialized (run `schema.sql`)
4. Application is deployed to Vercel or running locally via `vercel dev`

## Test Suite

### 1. Database Connection & Initialization

**Test:** Verify database connection and athlete seeding

```bash
# Test database connection
curl https://marathonmajorsfantasy.com/api/init-db

# Expected response:
{
  "message": "Neon Postgres database is ready",
  "status": "initialized",
  "database": "Neon Postgres",
  "connectionTime": "2024-10-14T13:00:00.000Z",
  "athletesCount": 58
}
```

**Validation:**
- ✅ Status should be "initialized"
- ✅ Athletes count should be 58 (33 men + 25 women)
- ✅ Connection time should be recent

### 2. Athletes API Endpoint

**Test:** Verify athletes are loaded from database

```bash
# Get athletes
curl https://marathonmajorsfantasy.com/api/athletes

# Expected response structure:
{
  "men": [
    {
      "id": 1,
      "name": "Eliud Kipchoge",
      "country": "KEN",
      "pb": "2:01:09",
      "headshotUrl": "..."
    },
    // ... more athletes
  ],
  "women": [
    // ... women athletes
  ]
}
```

**Validation:**
- ✅ Response should have `men` and `women` arrays
- ✅ Each athlete should have id, name, country, pb, headshotUrl
- ✅ Athletes should be ordered by personal best time

### 3. Game State Management

**Test:** Create and retrieve game state

```bash
# Create a game with players
curl -X POST https://marathonmajorsfantasy.com/api/game-state?gameId=test-game \
  -H "Content-Type: application/json" \
  -d '{"players": ["PLAYER1", "PLAYER2", "PLAYER3"]}'

# Get game state
curl https://marathonmajorsfantasy.com/api/game-state?gameId=test-game

# Expected response:
{
  "players": ["PLAYER1", "PLAYER2", "PLAYER3"],
  "draftComplete": false,
  "resultsFinalized": false,
  "rankings": {},
  "teams": {},
  "results": {}
}
```

**Validation:**
- ✅ Players array matches input
- ✅ Draft and results flags are false initially
- ✅ Empty rankings, teams, and results

### 4. Player Rankings

**Test:** Save and retrieve player rankings

```bash
# Save rankings for PLAYER1
curl -X POST https://marathonmajorsfantasy.com/api/rankings?gameId=test-game \
  -H "Content-Type: application/json" \
  -d '{
    "playerCode": "PLAYER1",
    "men": [
      {"id": 1, "name": "Eliud Kipchoge", "country": "KEN", "pb": "2:01:09"},
      {"id": 2, "name": "Benson Kipruto", "country": "KEN", "pb": "2:02:16"}
    ],
    "women": [
      {"id": 101, "name": "Sifan Hassan", "country": "NED", "pb": "2:13:44"}
    ]
  }'

# Get rankings for specific player
curl https://marathonmajorsfantasy.com/api/rankings?gameId=test-game&playerCode=PLAYER1

# Get all rankings
curl https://marathonmajorsfantasy.com/api/rankings?gameId=test-game
```

**Validation:**
- ✅ Specific player rankings should return only that player's data
- ✅ All rankings should return object with player codes as keys
- ✅ Rankings should preserve athlete data structure

### 5. Draft Teams

**Test:** Save and retrieve draft results

```bash
# Save draft results
curl -X POST https://marathonmajorsfantasy.com/api/draft?gameId=test-game \
  -H "Content-Type: application/json" \
  -d '{
    "teams": {
      "PLAYER1": {
        "men": [
          {"id": 1, "name": "Eliud Kipchoge", "country": "KEN", "pb": "2:01:09"}
        ],
        "women": [
          {"id": 101, "name": "Sifan Hassan", "country": "NED", "pb": "2:13:44"}
        ]
      }
    }
  }'

# Get draft results
curl https://marathonmajorsfantasy.com/api/draft?gameId=test-game

# Verify game state updated
curl https://marathonmajorsfantasy.com/api/game-state?gameId=test-game
```

**Validation:**
- ✅ Teams should be returned exactly as saved
- ✅ Game state should show `draftComplete: true`
- ✅ Empty teams object should reset draft status

### 6. Race Results

**Test:** Save and retrieve race results

```bash
# Save race results
curl -X POST https://marathonmajorsfantasy.com/api/results?gameId=test-game \
  -H "Content-Type: application/json" \
  -d '{
    "results": {
      "1": "2:05:30",
      "101": "2:18:45"
    }
  }'

# Get results
curl https://marathonmajorsfantasy.com/api/results?gameId=test-game

# Expected response:
{
  "1": "2:05:30",
  "101": "2:18:45"
}
```

**Validation:**
- ✅ Results should be returned as athlete ID to time mapping
- ✅ Updating existing results should merge with previous data
- ✅ Results should persist across requests

### 7. Game Isolation

**Test:** Verify different games are isolated

```bash
# Create game 1
curl -X POST https://marathonmajorsfantasy.com/api/game-state?gameId=game-1 \
  -H "Content-Type: application/json" \
  -d '{"players": ["A", "B"]}'

# Create game 2
curl -X POST https://marathonmajorsfantasy.com/api/game-state?gameId=game-2 \
  -H "Content-Type: application/json" \
  -d '{"players": ["C", "D"]}'

# Verify isolation
curl https://marathonmajorsfantasy.com/api/game-state?gameId=game-1
curl https://marathonmajorsfantasy.com/api/game-state?gameId=game-2
```

**Validation:**
- ✅ Game 1 should only show players A and B
- ✅ Game 2 should only show players C and D
- ✅ No data cross-contamination between games

### 8. Frontend Integration

**Test:** Verify frontend loads data correctly

1. **Open application in browser**
   - Visit https://marathonmajorsfantasy.com

2. **Check browser console**
   - No errors should be present
   - Athletes should be loaded from `/api/athletes`

3. **Test commissioner flow:**
   - Enter Commissioner Mode
   - Generate player codes
   - Verify codes are created

4. **Test player flow:**
   - Enter with a player code
   - Verify athletes are displayed for ranking
   - Rank athletes and submit
   - Verify submission success

5. **Test draft:**
   - As commissioner, run snake draft
   - Verify teams are displayed
   - Check that draft results persist on page reload

6. **Test results:**
   - Enter race results
   - Verify results display correctly
   - Check leaderboard calculations

**Validation:**
- ✅ All UI elements load without errors
- ✅ Data persists across page reloads
- ✅ Multi-player scenarios work correctly

### 9. Error Handling

**Test:** Verify graceful error handling

```bash
# Test missing game
curl https://marathonmajorsfantasy.com/api/game-state?gameId=nonexistent

# Test invalid player code
curl https://marathonmajorsfantasy.com/api/rankings?gameId=test&playerCode=invalid

# Test malformed request
curl -X POST https://marathonmajorsfantasy.com/api/results?gameId=test \
  -H "Content-Type: application/json" \
  -d '{"invalid": "data"}'
```

**Validation:**
- ✅ Missing game should return empty/default state
- ✅ Invalid player code should return 404
- ✅ Malformed requests should return 400 with error message

### 10. Performance Testing

**Test:** Verify acceptable response times

```bash
# Test response time
time curl https://marathonmajorsfantasy.com/api/athletes
time curl https://marathonmajorsfantasy.com/api/game-state?gameId=test
```

**Validation:**
- ✅ API responses should be under 500ms for most requests
- ✅ Database queries should be under 100ms (check Neon console)
- ✅ No timeout errors under normal load

## Database Verification

### Direct Database Checks

Connect to your Neon database and run these queries:

```sql
-- Verify athletes table
SELECT COUNT(*) FROM athletes;
-- Should return 58

-- Check game isolation
SELECT game_id, players FROM games;
-- Should show distinct games

-- Verify foreign key constraints
SELECT 
  tc.constraint_name, 
  tc.table_name, 
  kcu.column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY';
-- Should show relationships between tables

-- Check indexes
SELECT 
  tablename, 
  indexname, 
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
-- Should show all indexes from schema.sql
```

## Rollback Plan

If issues are found:

1. **Revert to previous version:**
   ```bash
   git revert <commit-hash>
   vercel --prod
   ```

2. **Switch back to blob storage:**
   - Restore `@vercel/blob` dependency
   - Restore `api/storage.js` from git history
   - Restore previous API endpoint code

3. **Contact support:**
   - Check Neon console for database issues
   - Review Vercel function logs
   - Create GitHub issue with error details

## Success Criteria

Migration is successful when:
- ✅ All API endpoints return expected data
- ✅ Frontend loads and functions correctly
- ✅ No console errors in browser or function logs
- ✅ Data persists correctly across requests
- ✅ Multiple games are properly isolated
- ✅ Performance is acceptable (< 500ms responses)
- ✅ Error handling is graceful
- ✅ Documentation is accurate and complete

## Next Steps After Validation

1. **Update production deployment**
2. **Monitor error logs** for first 24-48 hours
3. **Communicate migration** to existing users
4. **Archive old blob storage** data if needed
5. **Consider implementing** user account features using existing schema
