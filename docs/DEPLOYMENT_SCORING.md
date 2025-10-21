# Deployment Guide: Points-Based Scoring System

## Overview

This guide covers deploying the Version 2 Points-Based Scoring System to your Fantasy NY Marathon application.

## Prerequisites

- Access to your Neon Postgres database
- Vercel deployment access
- Git access to the repository

## Deployment Steps

### Step 1: Database Migration

The scoring system requires new database tables and columns. Apply the migration:

#### Option A: Via Neon Console (Recommended)

1. Log in to [console.neon.tech](https://console.neon.tech)
2. Select your project and database
3. Navigate to **SQL Editor**
4. Copy the contents of `migrations/002_points_scoring_system.sql`
5. Paste into the SQL Editor
6. Click **Run** to execute the migration
7. Verify no errors in the output

#### Option B: Via psql CLI

```bash
# Set your DATABASE_URL
export DATABASE_URL="postgresql://username:password@host.neon.tech/dbname"

# Run the migration
psql $DATABASE_URL -f migrations/002_points_scoring_system.sql

# Verify tables were created
psql $DATABASE_URL -c "SELECT version FROM scoring_rules ORDER BY version DESC"
```

#### Option C: Automatic on First Run

The system will attempt to apply migrations automatically on first access. However, manual application is recommended for production.

### Step 2: Verify Migration

Check that all tables were created successfully:

```sql
-- Check new tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('scoring_rules', 'league_standings', 'records_audit', 'race_records');

-- Verify scoring rules are loaded
SELECT version, description FROM scoring_rules ORDER BY version;

-- Check race_results columns
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'race_results' 
  AND column_name LIKE '%points%';
```

Expected output:
- `scoring_rules` table with versions 1 and 2
- `league_standings`, `records_audit`, `race_records` tables exist
- `race_results` has new columns: `placement_points`, `time_gap_points`, etc.

### Step 3: Deploy Application Code

#### Automatic Deployment (GitHub Integration)

If Vercel is connected to your GitHub repository:

1. Push your code to the main branch
2. Vercel will automatically deploy
3. Monitor deployment in Vercel dashboard

```bash
git push origin main
```

#### Manual Deployment (Vercel CLI)

```bash
# Install Vercel CLI if needed
npm install -g vercel

# Deploy to production
vercel --prod

# Wait for deployment to complete
# Note the deployment URL
```

### Step 4: Verify Deployment

1. **Check API Endpoints**

```bash
# Test scoring rules endpoint
curl https://your-app.vercel.app/api/scoring?gameId=default

# Test standings endpoint
curl https://your-app.vercel.app/api/standings?gameId=default
```

2. **Test Frontend**

- Open your application in a browser
- Navigate to Commissioner Dashboard
- Enter some test finish times
- Verify points are calculated and displayed
- Check that leaderboard shows points columns
- Click on athlete points to view breakdown modal

3. **Verify Auto-Scoring**

- Enter results via Commissioner Dashboard
- Click "Update Live Results"
- Verify standings update with points
- Check that total points are displayed correctly

### Step 5: Initial Data Setup (Optional)

If you want to pre-populate with specific course or world records:

```sql
-- Add custom course records
INSERT INTO race_records (race_id, gender, record_type, time_ms, athlete_name, set_date, verified)
VALUES 
  (1, 'men', 'COURSE', 7500000, 'Custom Runner', '2024-01-01', true),
  (1, 'women', 'COURSE', 8400000, 'Custom Runner', '2024-01-01', true);

-- Verify records
SELECT * FROM race_records WHERE verified = true;
```

### Step 6: Test Scoring Workflow

Complete end-to-end test:

1. **Create Test Game**
   - Generate player codes
   - Have players submit rankings
   - Run snake draft

2. **Enter Test Results**
   - Enter finish times for all athletes
   - Include some split times for performance bonuses
   - Click "Update Live Results"

3. **Verify Scoring**
   - Check that placements are assigned correctly
   - Verify points calculations in breakdown
   - Confirm leaderboard displays correctly
   - Test clicking points for breakdown modal

4. **Test Record Workflow** (Optional)
   - Manually insert a provisional record in database
   - Use API to confirm/reject record
   - Verify points update correctly

### Step 7: Monitor for Issues

After deployment, monitor:

1. **Vercel Function Logs**
   - Check for errors in `/api/scoring`
   - Monitor `/api/standings` calls
   - Watch for database connection issues

2. **Database Performance**
   - Monitor query times in Neon console
   - Check for slow queries
   - Verify indexes are being used

3. **User Feedback**
   - Check that UI displays correctly on mobile
   - Verify breakdown modals work
   - Ensure no JavaScript errors in console

## Rollback Plan

If issues occur, you can rollback:

### Rollback Code

```bash
# Revert to previous deployment
vercel rollback

# Or deploy previous Git commit
git revert HEAD
git push origin main
```

### Rollback Database (Not Recommended)

The migration is designed to be additive and shouldn't break existing functionality. However, if needed:

```sql
-- Drop new tables (lose new data)
DROP TABLE IF EXISTS records_audit CASCADE;
DROP TABLE IF EXISTS race_records CASCADE;
DROP TABLE IF EXISTS league_standings CASCADE;
DROP TABLE IF EXISTS scoring_rules CASCADE;

-- Remove new columns (keep old data)
ALTER TABLE race_results 
  DROP COLUMN IF EXISTS placement,
  DROP COLUMN IF EXISTS placement_points,
  -- ... etc
```

**Warning**: Rolling back the database will lose all scoring data. The frontend will automatically fall back to legacy time-based scoring if scoring data is unavailable.

## Troubleshooting

### Issue: Scoring Not Calculating

**Symptoms**: Results entered but no points showing

**Solutions**:
1. Check that migration was applied: `SELECT * FROM scoring_rules`
2. Manually trigger scoring: `POST /api/scoring?action=calculate`
3. Check function logs for errors
4. Verify DATABASE_URL is set correctly

### Issue: Leaderboard Not Updating

**Symptoms**: Standings show old data or not updating

**Solutions**:
1. Force recalculation: `POST /api/standings?gameId=default`
2. Clear standings cache: `DELETE FROM league_standings WHERE game_id = 'default'`
3. Check for database connection errors in logs

### Issue: Points Breakdown Not Showing

**Symptoms**: Can't see detailed breakdown

**Solutions**:
1. Verify breakdown JSON exists in database: `SELECT breakdown FROM race_results LIMIT 1`
2. Check browser console for JavaScript errors
3. Ensure `fetchScoringDetails()` is working
4. Clear browser cache

### Issue: Migration Failed

**Symptoms**: Error messages during migration

**Solutions**:
1. Check error message for specific issue
2. Ensure DATABASE_URL has correct permissions
3. Try running migration statements one at a time
4. Check for naming conflicts with existing tables

## Performance Optimization

After deployment, consider these optimizations:

1. **Enable Standings Caching**
   ```javascript
   // Use cached=true in API calls
   fetch('/api/standings?gameId=default&cached=true')
   ```

2. **Index Tuning**
   ```sql
   -- Add additional indexes if queries are slow
   CREATE INDEX idx_race_results_game_points 
     ON race_results(game_id, total_points DESC, placement);
   ```

3. **Connection Pooling**
   - Neon automatically handles connection pooling
   - Monitor connection count in Neon dashboard
   - Adjust if hitting limits

## Security Notes

- All API endpoints validate gameId parameter
- SQL queries use parameterized statements
- Record confirmation requires explicit API calls
- No sensitive data in breakdown JSON
- CORS configured for application domain

## Support

If you encounter issues:

1. Check application logs in Vercel dashboard
2. Review database query logs in Neon console
3. Consult POINTS_SCORING_SYSTEM.md documentation
4. Check CHANGELOG.md for known issues
5. Review test scenarios in tests/scoring-tests.js

## Post-Deployment Checklist

- [ ] Database migration applied successfully
- [ ] All new tables created and seeded
- [ ] Application deployed to production
- [ ] API endpoints responding correctly
- [ ] Frontend UI displays points correctly
- [ ] Breakdown modals working
- [ ] Leaderboard showing points columns
- [ ] Auto-scoring working on result entry
- [ ] No errors in Vercel function logs
- [ ] No errors in browser console
- [ ] Mobile UI tested and working
- [ ] Performance acceptable (< 2s response times)
- [ ] Monitoring set up for errors
- [ ] Team notified of new features

---

**Deployment Complete!** Your Fantasy NY Marathon application now features the advanced Version 2 Points-Based Scoring System. 🎉🏃‍♂️
