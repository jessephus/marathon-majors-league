# Scripts Directory

This directory contains automation and utility scripts for the Fantasy NY Marathon application.

## 🔄 Automated Sync

### sync_top_100.py
**Purpose**: Automatically sync top 100 marathon athletes from World Athletics

**Schedule**: Runs every 2 days at 2:00 AM UTC via GitHub Actions

**Usage**:
```bash
# Install dependencies
pip install -r requirements.txt

# Run sync
python sync_top_100.py

# Dry run (no DB writes)
python sync_top_100.py --dry-run

# Verbose logging
python sync_top_100.py --verbose
```

**Environment Variables**:
- `DATABASE_URL` - PostgreSQL connection string (required)
- `GITHUB_TOKEN` - GitHub PAT for issue creation (optional)
- `GITHUB_REPO` - Repository in format "owner/repo" (optional)

**Documentation**: See [docs/SYNC_TOP_100.md](../docs/SYNC_TOP_100.md)

## 🧪 Testing & Validation

### test_worldathletics.py
**Purpose**: Verify worldathletics package functionality before using in production

**Usage**:
```bash
pip install worldathletics
python test_worldathletics.py
```

Tests:
- Package import and initialization
- Marathon rankings fetch
- Individual athlete details fetch
- API method availability

### validate-schema.js
**Purpose**: Validate database schema consistency

**Usage**:
```bash
node validate-schema.js
```

## 📊 Data Enrichment (Legacy)

These scripts were used for the initial athlete data enrichment and are kept for reference:

### enrich-athletes.js
**Purpose**: Fetch World Athletics IDs and headshots for athletes

**Status**: Used for initial setup, now superseded by automated sync

**Usage**:
```bash
node enrich-athletes.js
```

### fetch-rankings.js
**Purpose**: Fetch World Athletics rankings from profile pages

**Status**: Used for initial setup, now superseded by automated sync

**Usage**:
```bash
node fetch-rankings.js
```

### manual-enrich.js
**Purpose**: Manual athlete data enrichment tool

**Status**: Used for one-off data corrections

## 🗄️ Database Management

### init-db.js
**Purpose**: Initialize database with schema and seed data

**Status**: Now handled by API endpoint `/api/init-db`

**Usage**:
```bash
node init-db.js
```

## 📦 Dependencies

### requirements.txt
Python dependencies for sync script:
- psycopg2-binary (PostgreSQL driver)
- worldathletics (World Athletics API wrapper)
- requests (HTTP library for GitHub API)

Install with:
```bash
pip install -r requirements.txt
```

## 📖 Documentation

Additional documentation in this directory:

- **ENRICHMENT_GUIDE.md** - Guide for enriching athlete data
- **ENRICHMENT_SUMMARY.md** - Summary of enrichment process
- **RESEED_DATABASE.md** - Instructions for database re-seeding
- **WORKING_SOLUTION.md** - Technical notes on working solutions
- **README.md** - This file

## 🔐 Security Notes

- Never commit `.env` files or secrets
- Use GitHub Secrets for sensitive data
- Database URLs should use environment variables
- API tokens should be properly scoped

## 🚀 Quick Start

To set up automated sync:

1. **Add DATABASE_URL to GitHub Secrets**:
   - Go to repository Settings → Secrets and variables → Actions
   - Add `DATABASE_URL` with your Neon Postgres connection string

2. **Enable GitHub Actions**:
   - Actions should be automatically enabled
   - Check `.github/workflows/sync-top-100.yml` is present

3. **Test manually**:
   - Go to Actions tab
   - Select "Sync World Athletics Top 100"
   - Click "Run workflow" with dry-run enabled

4. **Monitor execution**:
   - Check workflow runs in Actions tab
   - Download `sync_stats.json` artifact
   - Review any auto-created issues

## 📈 Monitoring

Check sync health:

```sql
-- Recent sync activity
SELECT 
  gender,
  COUNT(*) as total,
  MAX(last_fetched_at) as last_sync
FROM athletes
WHERE ranking_source = 'world_marathon'
GROUP BY gender;

-- Stale data (>7 days)
SELECT name, gender, last_fetched_at
FROM athletes
WHERE last_fetched_at < NOW() - INTERVAL '7 days'
  AND last_seen_at IS NOT NULL;
```

## 🐛 Troubleshooting

### Sync failures

1. Check GitHub Actions logs
2. Review auto-created issue
3. Test locally with `--dry-run --verbose`
4. Verify DATABASE_URL secret

### Database connection issues

1. Check Neon console for database status
2. Verify connection string format
3. Test connection locally: `psql $DATABASE_URL`

### worldathletics package errors

1. Check package version: `pip show worldathletics`
2. Update package: `pip install --upgrade worldathletics`
3. Run test script: `python test_worldathletics.py`
4. Check package docs: https://github.com/kaijchang/worldathletics

## 📝 Contributing

When adding new scripts:

1. Add clear docstring with purpose and usage
2. Include error handling and logging
3. Update this README
4. Add to `.gitignore` if script generates output files
5. Document environment variables needed

## 📄 License

All scripts in this directory are part of the Fantasy NY Marathon project and are covered by the MIT License - see [../LICENSE](../LICENSE) file for details.
