# Database Migration Summary

## Overview
This document summarizes the migration from Vercel Postgres to Vercel Blob Storage for the Fantasy Chicago Marathon application.

## Changes Summary
- **10 files modified**
- **175 lines added, 236 lines removed** (net reduction of 61 lines)
- **Code is simpler and more maintainable**

## Files Modified

### Core Changes
1. **api/storage.js** (NEW) - Centralized storage helper module
2. **api/game-state.js** - Migrated to Blob storage
3. **api/rankings.js** - Migrated to Blob storage
4. **api/draft.js** - Migrated to Blob storage
5. **api/results.js** - Migrated to Blob storage
6. **api/init-db.js** - Simplified (no table creation needed)

### Configuration
7. **package.json** - Updated dependency (@vercel/blob)
8. **vercel.json** - Removed Postgres env references

### Documentation
9. **README.md** - Updated storage instructions
10. **DEPLOYMENT.md** - Updated deployment guide

## Why Blob Storage Was Chosen

### Option 1: Edge Config ❌
**Not Selected** due to:
- **8KB size limit** on Hobby plan (too restrictive)
- Designed for feature flags and configuration, not transactional data
- Read-optimized for ultra-low latency, but we don't need <1ms reads
- Would require complex data splitting to fit within limits

### Option 2: Blob Storage ✅
**Selected** because:
- **No practical size limits** for our dataset
- **Perfect for JSON files** - natural fit for our data structure
- **Simple key-value access** matches our usage pattern
- **Easy to manage** - just store JSON files by gameId/type
- **Cost effective** - included in Vercel Hobby plan
- **No complex queries needed** - just get/save operations

## Technical Details

### Data Storage Pattern
Before (Postgres):
```
Tables: game_state, player_rankings, draft_results, race_results
Queries: SQL with JOINs, UPSERT, JSON fields (JSONB)
```

After (Blob Storage):
```
Files: game-state.json, rankings.json, teams.json, results.json
Access: Direct fetch by path (fantasy-marathon/{gameId}/{type}.json)
```

### Benefits
1. **Simpler code** - No SQL queries, just JSON get/save
2. **Easier debugging** - Can view JSON files directly in dashboard
3. **Better fit** - Data was already JSON in Postgres (JSONB fields)
4. **No migration needed** - New installs work immediately
5. **Portable** - JSON files are human-readable and portable

## Data Structure

Each game has its own namespace:
```
fantasy-marathon/
  default/
    game-state.json    (players list, draft status)
    rankings.json      (player rankings by code)
    teams.json         (drafted teams by code)
    results.json       (race results by athlete ID)
```

## Deployment Instructions

### For New Deployments
1. Create Vercel Blob storage in dashboard
2. Deploy - that's it! No init-db needed

### For Existing Deployments
1. Create Vercel Blob storage
2. Data will be empty (users need to re-enter)
3. Old Postgres database can be deleted

## Security Note
Blob access is set to 'public' which is consistent with the app's existing security model where player codes provide access control, not storage-level permissions. The app doesn't have traditional authentication, so this matches the current design.
