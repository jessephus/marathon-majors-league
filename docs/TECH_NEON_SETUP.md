# Neon Postgres Setup Guide

This document provides instructions for setting up a Neon Postgres database for the Fantasy NY Marathon application.

## Prerequisites

- A Vercel account with your project deployed
- Access to the Vercel Marketplace

## Quick Setup via Vercel Integration

### Step 1: Install Neon Integration

1. Go to your Vercel project dashboard
2. Navigate to the **Integrations** tab
3. Search for "Neon" in the marketplace
4. Click **Add Integration**
5. Follow the prompts to connect or create a Neon account
6. Select your Vercel project to link with Neon

The integration will automatically:
- Create a Neon Postgres database
- Set the `DATABASE_URL` environment variable in your Vercel project
- Configure the connection for all environments (development, preview, production)

### Step 2: Deploy Application

**The database schema is now created automatically!**

1. **Deploy your application** to Vercel
   ```bash
   git push origin main  # Triggers automatic deployment
   # OR
   vercel --prod
   ```

2. **Automatic initialization happens via:**
   - The `postbuild` script runs `node scripts/init-db.js`
   - This script automatically creates the database schema if it doesn't exist
   - Then it seeds the database with athletes from `athletes.json`
   - If build-time initialization fails, the `/api/athletes` endpoint will auto-create schema and seed on first request

3. **Verify the setup:**
   ```bash
   # Check database status
   curl https://marathonmajorsfantasy.com/api/init-db
   
   # Get athletes from API
   curl https://marathonmajorsfantasy.com/api/athletes
   ```

**Important Notes:**
- ✅ Schema is automatically created - no manual SQL execution needed
- ✅ Data persists across deployments - your games won't be lost
- ✅ Only athletes data is seeded automatically - game data is created as users play

## Local Development Setup

For local development with the Neon database:

```bash
# Install dependencies
npm install

# Link to your Vercel project (first time only)
vercel link

# Pull environment variables (includes DATABASE_URL)
vercel env pull

# Start development server
vercel dev
```

Your local environment will now connect to the same Neon database as your production environment.

## Manual Setup (Alternative)

If you prefer to set up Neon manually without the Vercel integration:

### Step 1: Create Neon Account

1. Go to [neon.tech](https://neon.tech)
2. Sign up for a free account
3. Create a new project

### Step 2: Get Connection String

1. In your Neon project dashboard, click **Connection Details**
2. Copy the connection string (it looks like: `postgres://username:password@host.neon.tech/dbname`)

### Step 3: Add to Vercel Environment Variables

1. Go to your Vercel project settings
2. Navigate to **Environment Variables**
3. Add a new variable:
   - Name: `DATABASE_URL`
   - Value: Your Neon connection string
   - Environments: Select Production, Preview, and Development

### Step 4: Initialize Schema

Follow the same schema initialization steps from Option A or B above.

## Database Schema

The database includes the following tables:

- **athletes** - Elite runner profiles (migrated from athletes.json)
- **games** - Game configuration and state
- **player_rankings** - Player athlete preferences
- **draft_teams** - Post-draft team assignments
- **race_results** - Race finish times and splits
- **users** - User accounts (planned for future, not currently used)
- **user_games** - User-game associations (planned for future)

## Troubleshooting

### Connection Errors

If you see connection errors:

1. Verify `DATABASE_URL` is set: `vercel env ls`
2. Check that your Neon database is active in the Neon console
3. Ensure your IP is allowed (Neon allows all IPs by default on free tier)

### Schema Errors

If tables are missing or incorrect:

1. Drop all tables and re-run `schema.sql`
2. Or run the schema SQL incrementally to see which statement fails

### Athletes Not Loading

If athletes don't load in the frontend:

1. Check `/api/init-db` returns a count > 0
2. Verify `/api/athletes` returns data
3. Check browser console for errors
4. Ensure athletes.json exists in project root for seeding

## Monitoring

You can monitor your database usage in:

- **Neon Console**: Database metrics, queries, storage
- **Vercel Dashboard**: Function execution logs and errors

## Backup and Recovery

Neon provides automatic backups. To export data:

```sql
-- Export games
COPY (SELECT * FROM games) TO STDOUT WITH CSV HEADER;

-- Export results
COPY (SELECT * FROM race_results) TO STDOUT WITH CSV HEADER;
```

## Cost and Limits

**Neon Free Tier:**
- 3 GB storage
- Unlimited queries
- Auto-suspend after 5 minutes of inactivity
- 1 project

**Vercel Hobby Plan:**
- Neon integration is included
- No additional cost for basic usage

For higher limits, consider upgrading to Neon Pro or Vercel Pro plans.

## Migration from Blob Storage

If you're migrating from the previous blob storage implementation:

1. Old blob data will not be automatically migrated
2. Users will need to re-create their games
3. The blob storage can be deleted from Vercel dashboard
4. Update any bookmarks to use the new deployment

## Support

- **Neon Documentation**: [neon.tech/docs](https://neon.tech/docs)
- **Vercel Support**: [vercel.com/support](https://vercel.com/support)
- **Project Issues**: [GitHub Issues](https://github.com/jessephus/marathon-majors-league/issues)
