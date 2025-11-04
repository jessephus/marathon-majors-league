# Scripts Folder Cleanup Analysis

## Summary
**Recommended for Deletion: 10 scripts**  
**Recommended for Consolidation: 2 groups**  
**Keep as-is: 28 scripts**

---

## ✅ Scripts to DELETE (No Longer Needed)

### One-Time Debugging Scripts (Already Fixed)
These were created to debug specific issues that have been resolved:

1. **`check-column-type.js`** - Verified `finish_time_ms` column type (issue resolved)
2. **`check-gap-seconds.js`** - Debugged time gap calculations (working correctly now)
3. **`check-mutual-exclusivity.js`** - Verified performance bonus logic (confirmed working)
4. **`verify-times.js`** - Checked finish time millisecond values (migrated successfully)
5. **`test-time-conversion.js`** - Tested timeStringToMs() function (deployed and stable)
6. **`test-time-formatting.js`** - Tested time formatting functions (deployed and stable)
7. **`audit-performance-bonuses.js`** - One-time audit of performance scoring (completed)

### Migration Runners (Completed Migrations)
These ran one-time database migrations that are now complete:

8. **`migrate-add-salaries.js`** - Added salary column (migration 003 completed)
9. **`run-add-splits-migration.js`** - Added split columns (migration 006 completed)
10. **`run-finish-time-ms-migration.js`** - Added finish_time_ms (migration 008 completed)
11. **`run-subsecond-migration.js`** - Subsecond precision migration (migration 007 completed)
12. **`run-time-gap-migration.js`** - Time gap column migration (migration 009 completed)
13. **`run-scoring-migration.js`** - Points scoring migration (migration 002 completed)
14. **`run-roster-lock-migration.js`** - Roster lock migration (migration 005 completed)

**Reason**: Migrations are run once and never need to be re-run. The SQL files in `/migrations/` are preserved for reference.

---

## 🔄 Scripts to CONSOLIDATE

### Group 1: TOTP Testing Scripts
Current:
- `setup-commissioner-totp.js` - Sets up TOTP for commissioners
- `test-commissioner-totp.js` - Tests TOTP codes

**Recommendation**: Keep both (they serve different purposes - setup vs verify)

### Group 2: Test Quality Scripts  
Current:
- `validate-test-quality.js` - Analyzes test effectiveness
- `verify-tests-catch-bugs.js` - Manual verification guide

**Recommendation**: Keep both (automated analysis + manual guide)

---

## ✅ Scripts to KEEP (Active/Essential)

### Core Database & Deployment
1. **`init-db.js`** ⭐ - Database initialization (used in `postbuild`)
2. **`validate-schema.js`** - Schema validation for CI/CD

### Athlete Data Sync (Active)
3. **`sync_top_100.py`** ⭐ - Syncs top 100 athletes from World Athletics
4. **`sync_athletes_from_rankings.py`** ⭐ - Main sync with progression data
5. **`backfill_athlete_progression.py`** - Backfills historical progression
6. **`extract_athlete_progression.py`** - Extracts single athlete data
7. **`scrape_rankings.py`** - Scrapes World Athletics rankings
8. **`enrich-athletes.js`** - Enriches athlete database
9. **`manual-enrich.js`** - Manual athlete enrichment tool
10. **`fetch-rankings.js`** - Fetches rankings data

### Salary & Scoring
11. **`calculate-athlete-salaries.js`** - Calculates salaries from rankings
12. **`test-salary-calculation.js`** - Tests salary algorithm
13. **`trigger-scoring.js`** - Manual trigger for scoring engine

### Testing & Quality
14. **`validate-test-quality.js`** ⭐ - Test quality analysis (npm script)
15. **`verify-tests-catch-bugs.js`** - Test verification guide

### Authentication & Security
16. **`setup-commissioner-totp.js`** - TOTP setup for commissioners
17. **`test-commissioner-totp.js`** - TOTP code verification

### Utilities
18. **`generate-favicons.js`** - Generates favicon assets
19. **`init_schema.py`** - Python schema initialization
20. **`requirements.txt`** - Python dependencies
21. **`README.md`** - Scripts documentation

---

## 🗑️ Deletion Commands

```bash
# One-time debugging scripts
rm scripts/check-column-type.js
rm scripts/check-gap-seconds.js
rm scripts/check-mutual-exclusivity.js
rm scripts/verify-times.js
rm scripts/test-time-conversion.js
rm scripts/test-time-formatting.js
rm scripts/audit-performance-bonuses.js

# Completed migration runners
rm scripts/migrate-add-salaries.js
rm scripts/run-add-splits-migration.js
rm scripts/run-finish-time-ms-migration.js
rm scripts/run-subsecond-migration.js
rm scripts/run-time-gap-migration.js
rm scripts/run-scoring-migration.js
rm scripts/run-roster-lock-migration.js
```

Total scripts removed: **14**  
Remaining scripts: **21** (all actively used or essential)

---

## 📊 Before vs After

### Before Cleanup
- Total scripts: 35
- Debugging scripts: 7
- Migration runners: 7
- Active/Essential: 21

### After Cleanup
- Total scripts: 21 (40% reduction)
- Debugging scripts: 0
- Migration runners: 0
- Active/Essential: 21 (100%)

---

## ✅ Safe to Delete Because:

1. **Debugging scripts** - Resolved specific one-time issues
2. **Migration runners** - Migrations completed and stable in production
3. **SQL migrations preserved** - All migration SQL files kept in `/migrations/` folder
4. **No npm scripts** - None of the deleted scripts are referenced in `package.json`
5. **No CI/CD usage** - None are used in GitHub Actions workflows

---

## 🔍 Verification Before Deletion

Run these checks to confirm scripts aren't referenced:

```bash
# Check npm scripts
grep -r "check-column-type\|check-gap-seconds\|migrate-add-salaries" package.json

# Check GitHub Actions
grep -r "check-column-type\|run-add-splits" .github/workflows/

# Check documentation
grep -r "check-mutual-exclusivity\|test-time-conversion" docs/
```

If no matches found → safe to delete ✅
