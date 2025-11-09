# games.players[] Array Deprecation

## Summary

The `games.players[]` PostgreSQL array column is **DEPRECATED** for salary cap draft games. It is no longer the source of truth for team data and is only maintained for legacy snake draft compatibility.

## Background

### Original Purpose
The `players` array in the `games` table was originally used as a simple list to track which player codes had joined a game:

```sql
CREATE TABLE games (
    game_id VARCHAR(255),
    players TEXT[],  -- e.g., ['RUNNER', 'SPRINTER', 'PACER']
    ...
);
```

This made sense when:
- Snake draft was the only game mode
- Players submitted rankings, draft assigned teams
- Simple array was sufficient for tracking participants

### Why It's Now Deprecated

With the introduction of **salary cap draft mode** and **anonymous sessions**, teams are now tracked in their own dedicated tables:

```
Source of Truth (Modern):
├── anonymous_sessions table
│   ├── session_token (UUID)
│   ├── player_code
│   ├── display_name
│   ├── is_active (soft delete flag)
│   └── game_id
└── salary_cap_teams table
    ├── player_code
    ├── athlete_id
    ├── total_spent
    └── submitted_at
```

The `games.players[]` array became:
- ❌ **Redundant** - Duplicates data in `anonymous_sessions`
- ❌ **Stale** - Not updated when teams are created/deleted
- ❌ **Unmaintainable** - Requires manual sync across multiple places
- ❌ **Wrong abstraction** - Array doesn't support soft deletes or metadata

## Current State

### What Still Uses `games.players[]` (Legacy)

**Files that READ the array:**
- `public/app.js` (legacy site)
  - `loadGameState()` - Line ~110
  - `displayTeamsTable()` - Line ~1710
- `/api/game-state.js` - Returns it to legacy site

**Files that WRITE to the array:**
- `public/app.js` - Line ~679 (team creation)
- `/api/teams/delete.js` - Line ~67 (team deletion)

### What DOESN'T Use `games.players[]` (Modern)

**New implementation:**
- `components/commissioner/TeamsOverviewPanel.tsx` - Queries `anonymous_sessions`
- `/api/salary-cap-draft.js` - Returns teams from database tables
- `/api/session/delete.js` - Soft deletes, doesn't touch array

## Migration Strategy

### Phase 1: Documentation (COMPLETE) ✅

Added deprecation warnings to:
- [x] `schema.sql` - Table definition
- [x] `pages/api/db.js` - `getGameState()`, `createGame()`
- [x] `pages/api/game-state.js` - API endpoint
- [x] `pages/api/teams/delete.js` - Legacy delete endpoint
- [x] `pages/api/session/delete.js` - Modern delete endpoint
- [x] `public/app.js` - `loadGameState()`, team creation, `displayTeamsTable()`

### Phase 2: Stop Maintaining (Current Approach)

**Decision:** Do NOT sync `games.players[]` for new salary cap teams.

**Impact:**
- ✅ Modern site works perfectly (uses `anonymous_sessions`)
- ⚠️ Legacy site shows stale data (acceptable trade-off)
- ✅ No dual maintenance burden
- ✅ Clean separation of concerns

### Phase 3: Update Legacy Site (Future)

**Option A: Minimal Change** (Recommended)
Update `displayTeamsTable()` in `public/app.js` to query `/api/salary-cap-draft`:

```javascript
async function displayTeamsTable() {
    // NEW: Query actual teams from database
    const response = await fetch(`${API_BASE}/api/salary-cap-draft?gameId=${GAME_ID}`);
    const data = await response.json();
    
    // Loop through actual teams
    Object.entries(data.teamDetails || {}).forEach(([playerCode, team]) => {
        // Build table row...
    });
}
```

**Option B: Complete Replacement**
Redirect legacy commissioner view to modern TeamsOverviewPanel.

### Phase 4: Remove Column (Future)

Once legacy site is updated:
1. Run migration to drop `players` column
2. Remove all references in code
3. Update documentation

```sql
ALTER TABLE games DROP COLUMN players;
```

## Developer Guide

### ❌ DON'T: Use games.players[] for new features

```javascript
// BAD - Don't do this for salary cap teams
gameState.players.push(playerCode);
await saveGameState();

// BAD - Don't query this
const players = await sql`SELECT players FROM games WHERE game_id = ${gameId}`;
```

### ✅ DO: Query anonymous_sessions table

```javascript
// GOOD - Query the source of truth
const teams = await sql`
  SELECT player_code, display_name, created_at
  FROM anonymous_sessions
  WHERE game_id = ${gameId}
    AND session_type = 'player'
    AND is_active = true
`;
```

### ✅ DO: Use existing APIs

```javascript
// GOOD - Use modern endpoints
const response = await fetch('/api/salary-cap-draft?gameId=NY2025');
const { teamDetails } = await response.json();
```

### ✅ DO: Reference TeamsOverviewPanel

See `components/commissioner/TeamsOverviewPanel.tsx` for the canonical implementation of:
- Querying teams from database
- Displaying team list
- Managing team lifecycle (create/delete)

## FAQs

### Q: Why not just update games.players[] when teams are created?

**A:** This creates a dual maintenance burden where we have to keep two sources of truth in sync. It's error-prone and adds complexity. Better to have one authoritative source (`anonymous_sessions`) and deprecate the old one.

### Q: What happens to existing data in games.players[]?

**A:** It remains in the database for backward compatibility with legacy snake draft games. We just don't update it for new salary cap teams.

### Q: Will the legacy site stop working?

**A:** It will show stale data for teams created after the deprecation, but won't crash. This is acceptable during the transition period. The modern TeamsOverviewPanel works perfectly.

### Q: When will the column be removed?

**A:** Only after the legacy site is fully migrated or deprecated. No timeline yet. The column is harmless to keep for now.

### Q: What about snake draft mode?

**A:** Snake draft games still use `games.players[]` and will continue to work. The deprecation only affects salary cap draft.

## Related Documentation

- **[FEATURE_GAME_MODES.md](FEATURE_GAME_MODES.md)** - Explains snake draft vs salary cap draft
- **[FEATURE_SALARY_CAP_DRAFT.md](FEATURE_SALARY_CAP_DRAFT.md)** - Salary cap implementation
- **[TECH_DATABASE.md](TECH_DATABASE.md)** - Database schema reference
- **[CORE_ARCHITECTURE.md](CORE_ARCHITECTURE.md)** - System architecture overview

## Code References

### Deprecated Code (Do Not Use as Examples)

| File | Lines | What It Does | Status |
|------|-------|--------------|--------|
| `public/app.js` | 110-128 | `loadGameState()` - Loads `games.players[]` | ⚠️ Legacy |
| `public/app.js` | 676-684 | Team creation - Adds to `games.players[]` | ⚠️ Legacy |
| `public/app.js` | 1710-1750 | `displayTeamsTable()` - Loops through array | ⚠️ Legacy |
| `/api/teams/delete.js` | 67-78 | Removes from `games.players[]` | ⚠️ Legacy |

### Modern Code (Use These as Examples)

| File | Lines | What It Does | Status |
|------|-------|--------------|--------|
| `TeamsOverviewPanel.tsx` | 78-110 | Queries `anonymous_sessions` | ✅ Modern |
| `/api/salary-cap-draft.js` | 50-100 | Returns teams from database | ✅ Modern |
| `/api/session/delete.js` | 30-58 | Soft delete without array sync | ✅ Modern |

---

**Last Updated:** November 9, 2025  
**Status:** Deprecated (maintained for legacy compatibility only)  
**Replacement:** Query `anonymous_sessions` table directly
