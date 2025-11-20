# Initial Database Cleanup Plan

## Purpose

This document provides the plan for cleaning up EXISTING test data in the database that accumulated before the new TestContext system was implemented.

**IMPORTANT**: This is a ONE-TIME cleanup of historical test data. Future test data will be cleaned up automatically by the TestContext system.

## Step 1: Run Database Audit (DO NOT DELETE ANYTHING YET)

### Command
```bash
# Set up database connection if needed
vercel env pull  # OR create .env with DATABASE_URL

# Run audit script (READ ONLY - does not delete)
node scripts/audit-test-data.js
```

### What the Audit Does
- ✅ Scans all 11 database tables
- ✅ Identifies records with "test" in names
- ✅ Groups by pattern (test-%, e2e-%, Test Team%, etc.)
- ✅ Generates JSON report: `TEST_DATA_AUDIT_REPORT.json`
- ✅ Shows sample records for review
- ✅ Provides recommendations
- ✅ **DOES NOT DELETE ANYTHING**

### Tables Scanned
1. `games` - Game records
2. `anonymous_sessions` - User sessions
3. `salary_cap_teams` - Team rosters (modern)
4. `draft_teams` - Team rosters (deprecated)
5. `player_rankings` - Player preferences (deprecated)
6. `race_results` - Race finish times
7. `athlete_progression` - Athlete year-by-year stats
8. `athlete_race_results` - Athlete race history
9. `athletes` - Athlete profiles
10. `races` - Race events
11. `athlete_races` - Athlete-race associations

## Step 2: Review Audit Report

### Report Location
`TEST_DATA_AUDIT_REPORT.json` in project root

### What to Look For

1. **Total test records** - How much test data exists?
2. **Tables with test data** - Which tables are affected?
3. **Sample records** - Do they look like test data?
4. **Patterns** - Are there consistent naming patterns?

### Example Report Structure
```json
{
  "timestamp": "2025-11-20T...",
  "tables": {
    "games": {
      "totalTestRecords": 15,
      "patterns": {
        "test-%": 10,
        "e2e-%": 3,
        "contains \"test\"": 2
      },
      "sampleRecords": [...]
    },
    ...
  },
  "summary": {
    "totalTestRecords": 127,
    "tablesWithTestData": 8,
    "recommendations": [...]
  }
}
```

### Review Checklist
- [ ] Review total test record count
- [ ] Check each table's sample records
- [ ] Confirm records are actually test data
- [ ] Identify any production data accidentally matched
- [ ] Note any unusual patterns

## Step 3: Create Initial Cleanup Report (Manual Review)

Create a document listing exactly what will be deleted:

### Template: `INITIAL_CLEANUP_REPORT.md`

```markdown
# Initial Test Data Cleanup Report
Date: YYYY-MM-DD
Reviewed by: [Your Name]

## Summary
- Total test records to delete: XXX
- Tables affected: X
- Estimated cleanup time: X minutes

## Detailed Breakdown

### games table
- Records to delete: X
- Game IDs: 
  - test-game-1234567890-abc123
  - e2e-test-1234567891-def456
  - ...

### anonymous_sessions table
- Records to delete: X
- Session IDs:
  - 123, 456, 789
- Display names:
  - "Test Team Alpha"
  - "Test User 1"
  - ...

[Repeat for each table]

## Verification Steps
1. Confirmed all records are test data
2. No production data will be affected
3. Foreign key dependencies reviewed

## Approval
- [ ] Reviewed by: __________
- [ ] Date: __________
- [ ] Ready to proceed: YES / NO
```

## Step 4: Manual Cleanup (After Review & Approval)

**DO NOT PROCEED WITHOUT REVIEWING AUDIT REPORT**

### Cleanup Approach

**DO:**
- ✅ Delete by specific IDs only
- ✅ Respect foreign key order
- ✅ Keep a backup before cleanup
- ✅ Document what was deleted
- ✅ Test on staging environment first

**DON'T:**
- ❌ Use LIKE patterns for deletion
- ❌ Delete without reviewing sample records
- ❌ Skip the backup
- ❌ Delete from production without testing on staging

### Manual Cleanup Script Template

Create a custom cleanup script based on audit results:

```javascript
// cleanup-identified-test-data.js
import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL);

async function cleanupIdentifiedTestData() {
  console.log('Starting cleanup of identified test data...');
  
  // DELETE BY SPECIFIC IDS ONLY - NO PATTERNS
  
  // Example: Delete specific games
  const gameIdsToDelete = [
    'test-game-1234567890-abc123',
    'e2e-test-1234567891-def456',
    // ... ADD MORE FROM AUDIT REPORT
  ];
  
  for (const gameId of gameIdsToDelete) {
    console.log(`Deleting game: ${gameId}`);
    
    // Delete in foreign key dependency order
    await sql`DELETE FROM race_results WHERE game_id = ${gameId}`;
    await sql`DELETE FROM salary_cap_teams WHERE game_id = ${gameId}`;
    await sql`DELETE FROM draft_teams WHERE game_id = ${gameId}`;
    await sql`DELETE FROM player_rankings WHERE game_id = ${gameId}`;
    await sql`DELETE FROM anonymous_sessions WHERE game_id = ${gameId}`;
    await sql`DELETE FROM games WHERE game_id = ${gameId}`;
    
    console.log(`✅ Deleted game: ${gameId}`);
  }
  
  // Example: Delete specific athletes (created for testing)
  const athleteIdsToDelete = [
    123, 456, 789,
    // ... ADD MORE FROM AUDIT REPORT
  ];
  
  for (const athleteId of athleteIdsToDelete) {
    console.log(`Deleting athlete: ${athleteId}`);
    
    // Delete related data first
    await sql`DELETE FROM athlete_progression WHERE athlete_id = ${athleteId}`;
    await sql`DELETE FROM athlete_race_results WHERE athlete_id = ${athleteId}`;
    await sql`DELETE FROM athlete_races WHERE athlete_id = ${athleteId}`;
    await sql`DELETE FROM athletes WHERE id = ${athleteId}`;
    
    console.log(`✅ Deleted athlete: ${athleteId}`);
  }
  
  console.log('Cleanup complete!');
}

// Run cleanup
cleanupIdentifiedTestData()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Cleanup failed:', error);
    process.exit(1);
  });
```

### Execution Steps

1. **Create backup** (on Neon dashboard or via pg_dump)
   ```bash
   pg_dump $DATABASE_URL > backup_before_cleanup.sql
   ```

2. **Test on staging** (if available)
   ```bash
   DATABASE_URL=$STAGING_DATABASE_URL node cleanup-identified-test-data.js
   ```

3. **Review results** - Verify expected data was deleted

4. **Run on production**
   ```bash
   node cleanup-identified-test-data.js
   ```

5. **Verify** - Check tables to confirm cleanup
   ```bash
   node scripts/audit-test-data.js  # Should show much fewer records
   ```

6. **Document** - Update cleanup report with results

## Step 5: Verify Cleanup

### Verification Queries

```sql
-- Check for remaining test games
SELECT COUNT(*) FROM games WHERE game_id LIKE '%test%';

-- Check for remaining test sessions
SELECT COUNT(*) FROM anonymous_sessions WHERE display_name LIKE '%Test%';

-- Check for remaining test athletes
SELECT COUNT(*) FROM athletes WHERE name LIKE '%Test%';

-- Check for remaining test races
SELECT COUNT(*) FROM races WHERE name LIKE '%Test%';
```

### Expected Results
- Zero or near-zero test records remaining
- Only legitimate production data in database
- All test data successfully removed

## Step 6: Document Results

Create final summary document:

### Template: `INITIAL_CLEANUP_RESULTS.md`

```markdown
# Initial Test Data Cleanup Results
Date: YYYY-MM-DD
Executed by: [Your Name]

## Before Cleanup
- Total test records: XXX
- Tables affected: X

## After Cleanup
- Test records remaining: X
- Successfully deleted: XXX records

## Tables Cleaned
- games: X records deleted
- anonymous_sessions: X records deleted
- athletes: X records deleted
[... continue for each table]

## Issues Encountered
[List any problems and how they were resolved]

## Verification
- [x] Audit script run after cleanup
- [x] Remaining records reviewed
- [x] All test data removed
- [x] Production data intact

## Conclusion
Initial cleanup complete. All future test data will be automatically
cleaned up by TestContext system.
```

## Safety Checklist

Before running ANY deletion:

- [ ] Database backup created
- [ ] Audit report reviewed
- [ ] Sample records confirmed as test data
- [ ] Cleanup plan approved
- [ ] Tested on staging environment
- [ ] Foreign key dependencies understood
- [ ] Rollback plan in place
- [ ] Production access confirmed
- [ ] Off-peak hours scheduled (if applicable)

## Emergency Rollback

If something goes wrong:

```bash
# Restore from backup
psql $DATABASE_URL < backup_before_cleanup.sql
```

Or use Neon's point-in-time restore feature.

## Future Prevention

After initial cleanup:

1. ✅ All new tests use TestContext
2. ✅ No pattern-matching cleanup
3. ✅ Tests clean up on every run
4. ✅ Regular audits (monthly) to catch any leaks
5. ✅ Pre-commit hooks to enforce TestContext usage

## Timeline

### Week 1 (Current)
- [x] Create audit script
- [x] Create TestContext system
- [x] Create documentation
- [ ] Run initial audit
- [ ] Review audit results

### Week 2
- [ ] Create cleanup script with specific IDs
- [ ] Get approval for cleanup
- [ ] Execute cleanup on staging
- [ ] Verify staging results

### Week 3
- [ ] Execute cleanup on production
- [ ] Verify production results
- [ ] Document results
- [ ] Begin test migration

### Week 4
- [ ] Complete test migration
- [ ] Final audit to verify cleanliness
- [ ] Remove deprecated functions

## Questions & Answers

**Q: What if I'm not sure if a record is test data?**
A: Don't delete it. Better to leave it than accidentally delete production data.

**Q: Can I use the old cleanup-test-data.js script?**
A: Only for reference. Create a new script with SPECIFIC IDs from the audit report.

**Q: What if cleanup fails?**
A: Stop immediately, restore from backup, investigate the issue, and try again with fixes.

**Q: How often should I run the audit?**
A: After initial cleanup, monthly audits should show zero or near-zero test data (assuming all tests use TestContext).

## Conclusion

This initial cleanup is a ONE-TIME operation to remove historical test data. Once complete and all tests are migrated to TestContext, test data will be automatically cleaned up after every test run.

**Remember**: Review before you delete. When in doubt, don't delete.
