# Data Persistence and Troubleshooting Guide

## Understanding Data Persistence

### Your Data is Safe! 🔒

The Neon Postgres database is **persistent** and **independent** from your Vercel deployments. This means:

✅ **Game data persists across deployments** - Your games, rankings, and results are never deleted when you push new code  
✅ **Athletes data persists** - Only seeded once, then stays in the database  
✅ **Schema persists** - Database tables are created once and remain  

### What Happens During Deployment

When you deploy new code to Vercel:

1. **Vercel builds your application** (new serverless functions)
2. **Initialization script runs** (`scripts/init-db.js`)
   - Checks if database tables exist
   - If NOT exist → Creates schema from `schema.sql`
   - If exist → Skips schema creation
   - Checks if athletes table is empty
   - If empty → Seeds athletes
   - If has data → Skips seeding
3. **Your Neon database stays untouched** - All existing data remains

**Important:** The database is a separate service from your application deployment. Deployments only update your code, not your database.

## Common Issues and Solutions

### Issue 1: "relation 'athletes' does not exist"

**Cause:** Database schema was never created

**Solution:**
```bash
# Option 1: Visit the init endpoint (will auto-create schema)
curl -X POST https://marathonmajorsfantasy.com/api/init-db

# Option 2: Access any page (auto-creates on first API call)
# Just visit your app URL in browser

# Option 3: Manually run schema (if above fails)
# In Neon console, execute schema.sql
```

**Why this happens:**
- The Neon integration creates an empty database
- Schema creation is automatic but may fail if:
  - DATABASE_URL isn't set correctly
  - Build script didn't run
  - File permissions issue

**Prevention:**
- Ensure DATABASE_URL is set in Vercel environment variables
- Check build logs for initialization success

### Issue 2: "Database resets on every deployment"

**This should NOT happen!** If you're experiencing this:

**Check these things:**

1. **Are you using the same Neon database?**
   ```bash
   # In Vercel dashboard → Settings → Environment Variables
   # Verify DATABASE_URL is the same for all environments
   ```

2. **Did you accidentally delete the database?**
   - Check Neon console at console.neon.tech
   - Verify your database exists and has data

3. **Are you creating a new database each time?**
   - The Neon integration should use ONE database
   - Don't create multiple databases

4. **Is there a script truncating data?**
   - Check for any DROP TABLE or TRUNCATE commands
   - The init script uses `CREATE TABLE IF NOT EXISTS` (safe)
   - Seeding uses `ON CONFLICT DO UPDATE` (safe)

**Verify data persistence:**
```sql
-- In Neon console, check data exists
SELECT COUNT(*) FROM athletes;
SELECT COUNT(*) FROM games;
```

### Issue 3: Athletes not loading in UI

**Symptoms:** 
- Error message in UI: "Unable to Load Athletes"
- 500 error from /api/athletes

**Solutions:**

**Step 1: Check database connection**
```bash
curl https://marathonmajorsfantasy.com/api/init-db
```

Expected response:
```json
{
  "message": "Neon Postgres database is ready",
  "status": "initialized",
  "athletesCount": 58
}
```

**Step 2: If schema doesn't exist**
The `/api/init-db` endpoint will automatically create it. If it fails:

1. Check Vercel environment variables include `DATABASE_URL`
2. Verify DATABASE_URL is valid (copy from Neon console)
3. Check build logs for errors

**Step 3: Manual schema creation** (last resort)
```sql
-- In Neon console (console.neon.tech)
-- Copy/paste contents of schema.sql and execute
```

### Issue 4: "Database empty and auto-seeding failed"

**Cause:** Athletes couldn't be seeded automatically

**Solutions:**

1. **Check athletes.json exists in your repo**
   ```bash
   ls -la athletes.json
   ```

2. **Manually seed via init endpoint**
   ```bash
   curl -X POST https://marathonmajorsfantasy.com/api/init-db
   ```

3. **Check for file system errors** in Vercel logs
   - Vercel functions have read access to project files
   - If athletes.json is missing, seeding will fail

### Issue 5: Environment variable issues

**Symptoms:**
- "DATABASE_URL not configured"
- "Make sure DATABASE_URL environment variable is set"

**Solutions:**

1. **Add DATABASE_URL in Vercel**
   - Go to project Settings → Environment Variables
   - Add `DATABASE_URL` with your Neon connection string
   - Apply to Production, Preview, and Development
   - **Redeploy** after adding

2. **Get DATABASE_URL from Neon**
   - Go to console.neon.tech
   - Select your database
   - Click "Connection Details"
   - Copy the connection string

3. **For local development**
   ```bash
   vercel env pull
   # This downloads DATABASE_URL to .env.local
   ```

## Data Backup and Recovery

### Backup Your Database

**Option 1: Neon Console Export**
1. Go to console.neon.tech
2. Select your database
3. Use SQL Editor to export:
   ```sql
   -- Export games
   COPY (SELECT * FROM games) TO STDOUT WITH CSV HEADER;
   
   -- Export results
   COPY (SELECT * FROM race_results) TO STDOUT WITH CSV HEADER;
   ```

**Option 2: API Export** (for game data)
```bash
# Export game state
curl https://marathonmajorsfantasy.com/api/game-state?gameId=your-game-id

# Export rankings
curl https://marathonmajorsfantasy.com/api/rankings?gameId=your-game-id
```

### Restore Data

If you lose data (which shouldn't happen), you can:

1. **Re-seed athletes** (if lost)
   ```bash
   curl -X POST https://marathonmajorsfantasy.com/api/init-db
   ```

2. **Restore from backup** (manual)
   - Use Neon SQL Editor
   - Run INSERT statements from your backup

## Monitoring Database Health

### Check Database Status

```bash
# Full status check
curl https://marathonmajorsfantasy.com/api/init-db

# Just get athletes (lighter check)
curl https://marathonmajorsfantasy.com/api/athletes
```

### Verify Data Counts

In Neon console:
```sql
-- Should be 58 (33 men + 25 women)
SELECT COUNT(*) as athlete_count FROM athletes;

-- Number of active games
SELECT COUNT(*) as game_count FROM games;

-- Total player rankings
SELECT COUNT(*) as ranking_count FROM player_rankings;

-- Total draft picks
SELECT COUNT(*) as draft_count FROM draft_teams;

-- Total results entered
SELECT COUNT(*) as result_count FROM race_results;
```

### Check Recent Activity

```sql
-- Recent games created
SELECT game_id, players, created_at 
FROM games 
ORDER BY created_at DESC 
LIMIT 5;

-- Recent results entered
SELECT game_id, athlete_id, finish_time, updated_at
FROM race_results
ORDER BY updated_at DESC
LIMIT 10;
```

## Best Practices

### DO ✅

- **Use ONE Neon database** for your project
- **Keep DATABASE_URL consistent** across all environments
- **Check build logs** after deployment
- **Verify initialization** with `/api/init-db` after first deploy
- **Monitor database** in Neon console periodically

### DON'T ❌

- **Don't create multiple databases** for the same project
- **Don't manually truncate tables** unless you want to delete data
- **Don't delete and recreate the database** on each deployment
- **Don't modify schema directly** without updating schema.sql
- **Don't share DATABASE_URL publicly** (contains credentials)

## Getting Help

If you're still experiencing issues:

1. **Check Vercel build logs**
   - Go to Deployments → Click deployment → View logs
   - Look for initialization messages

2. **Check Vercel function logs**
   - Go to Functions → Select function → View logs
   - Look for database errors

3. **Check Neon console**
   - Verify database exists
   - Check connection details
   - View query logs

4. **Common log messages:**
   - ✅ "Database already initialized with X athletes" = Good!
   - ✅ "Database schema created successfully" = Good!
   - ❌ "relation does not exist" = Schema not created
   - ❌ "DATABASE_URL not configured" = Missing env variable

## FAQ

**Q: Will my games be deleted when I deploy new code?**  
A: No! Game data is stored in Neon Postgres, which is separate from your code deployments.

**Q: Do I need to re-seed athletes on every deployment?**  
A: No! Athletes are seeded once and persist. The init script checks if data exists before seeding.

**Q: Can I have multiple databases for different environments?**  
A: Yes, but make sure each environment (dev, preview, prod) has its own DATABASE_URL configured.

**Q: What if I want to reset everything?**  
A: You can drop and recreate tables in Neon console, or delete and recreate the entire database. But this will delete ALL data including games.

**Q: How do I update athletes data?**  
A: Update athletes.json and manually run the seed with `ON CONFLICT DO UPDATE` - or update directly in Neon console.

**Q: Is the free tier sufficient?**  
A: Yes! Neon free tier provides 3GB storage, which is more than enough for many games.
