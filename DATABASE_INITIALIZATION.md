# Database Initialization Architecture

## Overview

The application uses a **three-tier initialization approach** to ensure the Neon Postgres database is always seeded with athlete data before the application is accessed by users.

## Why This Approach?

Previously, the app fell back to a static `athletes.json` file when the database was empty. This created issues:
- Database was not the single source of truth
- Inconsistent data sources
- Race conditions during initial deployment
- Poor user experience

The new approach ensures the database is initialized **early** in the deployment process, making it the authoritative data source.

## Three-Tier Initialization

### Tier 1: Build-Time Initialization (Primary)

**When:** During Vercel deployment, after dependencies are installed

**How:**
- `package.json` includes a `postbuild` script
- Runs `node scripts/init-db.js`
- Checks if database has athletes
- Seeds from `athletes.json` if empty

**Script Location:** `scripts/init-db.js`

**Benefits:**
- Runs automatically on every deployment
- Database is ready before app goes live
- No user interaction needed
- Fail-safe: exits with code 0 even if it fails

**Code:**
```json
// package.json
{
  "scripts": {
    "postbuild": "node scripts/init-db.js"
  }
}
```

### Tier 2: Runtime Auto-Seeding (Safety Net)

**When:** On the first API request to `/api/athletes`

**How:**
- API endpoint checks if database is empty
- If empty, loads `athletes.json` and seeds database
- Returns seeded data to the requester

**Benefits:**
- Catches cases where build-time init failed
- Self-healing if database gets corrupted
- No manual intervention needed

**Code:**
```javascript
// api/athletes.js
if (athletes.men.length === 0 && athletes.women.length === 0) {
  console.log('Auto-seeding database...');
  const athletesData = JSON.parse(readFileSync('athletes.json'));
  await seedAthletes(athletesData);
  athletes = await getAllAthletes();
}
```

### Tier 3: Manual Initialization (Last Resort)

**When:** User manually visits `/api/init-db` endpoint

**How:**
- Commissioner or admin visits the endpoint
- Checks database status
- Seeds if needed
- Returns initialization status

**Benefits:**
- Provides manual control
- Useful for troubleshooting
- Can be used to re-seed if needed

**Usage:**
```bash
curl -X POST https://your-app.vercel.app/api/init-db
```

## Initialization Flow

```
┌─────────────────────────────────────────┐
│     1. Vercel Deployment Starts         │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  2. Install Dependencies (npm install)  │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  3. Run Build (npm run build)           │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  4. Run Postbuild (scripts/init-db.js)  │
│     - Check DATABASE_URL exists         │
│     - Check if athletes table is empty  │
│     - Seed if needed                    │
│     - Log results                       │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  5. Deployment Complete                 │
│     Database is initialized ✅          │
└─────────────────────────────────────────┘

If postbuild fails:
                 │
                 ▼
┌─────────────────────────────────────────┐
│  6. User accesses app                   │
│     Frontend calls /api/athletes        │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  7. API detects empty database          │
│     Auto-seeds from athletes.json       │
│     Returns data to frontend            │
└─────────────────────────────────────────┘
```

## Error Handling

### Frontend Error Display

If all initialization tiers fail, the frontend shows a user-friendly error:

```
⚠️ Unable to Load Athletes

Error: No athletes data available - database may not be initialized

The database may not be initialized yet. Please try one of the following:
1. Wait a few moments and refresh the page
2. Contact the commissioner to initialize the database
3. Visit /api/init-db to manually initialize
```

### No Fallback to Static JSON

The application **does not** fall back to `athletes.json` in the frontend. This ensures:
- Database is always the source of truth
- No data inconsistencies
- Clear error states
- Proper initialization is enforced

## Benefits of This Architecture

1. **Automatic:** No manual initialization required
2. **Reliable:** Multiple fallback layers
3. **Fast:** Database ready before first user access
4. **Traceable:** Logs at each initialization step
5. **Self-healing:** Auto-recovers from failures
6. **Single source of truth:** Database only, no static file fallbacks

## Local Development

For local development:

```bash
# Pull environment variables
vercel env pull

# Seed database manually
npm run seed

# Or start dev server (will auto-seed on first access)
vercel dev
```

## Monitoring Initialization

### Check Build Logs

In Vercel dashboard:
1. Go to Deployments
2. Click on a deployment
3. View build logs
4. Look for initialization messages:
   - `🔄 Initializing database...`
   - `✅ Database already initialized with X athletes`
   - `📦 Database is empty, seeding athletes...`
   - `✅ Successfully seeded X athletes`

### Check Runtime Logs

For runtime auto-seeding:
1. Go to Vercel dashboard → Functions
2. Select `/api/athletes`
3. View invocation logs
4. Look for:
   - `Athletes table is empty, auto-seeding from athletes.json`
   - `Auto-seeding successful`

### Verify Database Status

```bash
# Check initialization status
curl https://your-app.vercel.app/api/init-db

# Response:
{
  "message": "Neon Postgres database is ready",
  "status": "initialized",
  "database": "Neon Postgres",
  "athletesCount": 58
}
```

## Troubleshooting

### Database Not Seeded After Deployment

1. **Check build logs** for initialization errors
2. **Verify DATABASE_URL** is set in Vercel environment variables
3. **Check schema** is initialized (run `schema.sql`)
4. **Manually seed** via `/api/init-db` endpoint

### Build-Time Init Fails

The app will still work! Runtime auto-seeding (Tier 2) will initialize on first access.

### All Tiers Fail

User will see error message with instructions. Check:
- Database connection (DATABASE_URL)
- Schema is initialized
- `athletes.json` file exists
- Network connectivity to Neon

## Future Enhancements

Potential improvements:
- Database migration system (e.g., Prisma Migrate)
- Idempotent initialization (transaction-based)
- Health check endpoint
- Automated testing of initialization flow
- Rollback mechanism for failed seeds
