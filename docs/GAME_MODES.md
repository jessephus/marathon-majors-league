# Game Modes Documentation

## Overview

The Fantasy Marathon application supports two distinct game modes, each with different team-building mechanics and workflows. This document clarifies the structure, boundaries, and components for each mode.

## Game Mode Comparison

| Feature | Season League Mode | Single Race Mode |
|---------|-------------------|------------------|
| **Team Building** | Ranking + Snake Draft | Salary Cap Draft |
| **Selection Method** | Players rank athletes, auto-draft assigns | Direct selection within budget |
| **Constraints** | Draft order (randomized) | $30,000 salary cap |
| **Player Control** | Indirect (via preference rankings) | Direct (pick specific athletes) |
| **Speed** | Instant (automated after all rankings submitted) | Manual (player-paced) |
| **Use Case** | Season-long leagues | Single event fantasy |
| **Commissioner Role** | Executes draft after rankings collected | Minimal (just result entry) |

## Mode 1: Season League (Ranking + Snake Draft)

### Description
Players submit preference rankings for athletes. Once all players have submitted their rankings, the commissioner executes a **snake draft** that automatically assigns athletes based on randomized draft order and player preferences.

### Workflow
1. Commissioner creates game with list of players
2. Each player submits athlete rankings (ordered preference list)
3. Commissioner executes snake draft when all rankings are in
4. Teams are automatically assigned based on draft order + preferences
5. Race results are entered and standings calculated

### Components

**API Endpoints:**
- `/api/game-state` - Game configuration and player list
- `/api/rankings` - Player preference rankings storage/retrieval
- `/api/draft` - Snake draft execution and team assignments
- `/api/results` - Race results entry
- `/api/standings` - Points-based standings calculation

**Database Tables:**
- `games` - Game configuration
- `player_rankings` - Each player's preference rankings
- `draft_teams` - Final team assignments after draft

**Frontend Code:**
- `public/app.js` - Contains ranking UI and draft results display
- Snake draft algorithm in `/api/draft.js`

### Key Concepts
- **Ranking**: Players order athletes by preference (1st choice, 2nd choice, etc.)
- **Snake Draft**: Draft order reverses each round (1-2-3-4, then 4-3-2-1)
- **Auto-Assignment**: System picks highest-ranked available athlete for each player

## Mode 2: Single Race (Salary Cap Draft)

### Description  
Players directly select their team of athletes within a fixed $30,000 budget. Elite athletes cost more, requiring strategic budget allocation. No rankings or automated draft - players have full control.

### Workflow
1. Player creates team (no registration required)
2. Player browses athletes and builds team within $30,000 cap
3. Player submits team (3 men + 3 women)
4. Race results are entered and standings calculated
5. Player views leaderboard and detailed scoring

### Components

**API Endpoints:**
- `/api/salary-cap-draft` - Team submission and retrieval
- `/api/athletes` - Athlete data with salary information
- `/api/results` - Race results entry
- `/api/standings` - Points-based standings calculation
- `/api/session/*` - Anonymous session management

**Database Tables:**
- `athletes` - Includes `salary` column for pricing
- `users` - Anonymous team sessions
- `user_games` - Team rosters with budget tracking

**Frontend Code:**
- `public/salary-cap-draft.js` - Complete salary cap draft UI
- `public/app.js` - Shared components (results, standings, leaderboard)

**Related Documentation:**
- `/docs/SALARY_CAP_DRAFT.md` - Complete guide
- `/docs/ACCOUNT_FREE_TEAMS.md` - Session management

### Key Concepts
- **Salary Cap**: $30,000 total budget per team
- **Direct Selection**: Players choose exact athletes (no auto-draft)
- **Budget Allocation**: Balance elite athletes with value picks
- **Pricing Algorithm**: Based on rankings, personal bests, and form

## Scoring System (Shared Between Modes)

Both game modes use the same **points-based scoring system**:

### Points Breakdown
- **Placement Points**: Top 10 finishers (10 pts for 1st down to 1 pt for 10th)
- **Time Gap Bonuses**: Based on distance from winner
- **Performance Bonuses**: Negative split, even pace, fast finish
- **Record Bonuses**: World record (+15), course record (+5)

**See:** `/docs/POINTS_SCORING_SYSTEM.md` for complete scoring details

### Legacy Time-Based Scoring (Deprecated)
The original scoring system used **average finish time** (lower = better). This has been fully replaced by points-based scoring.

**Status:** Deprecated but retained as fallback for error handling only.

**Legacy Functions in `public/app.js`:**
- `calculateAverageTime()` - Computes team average time
- `calculateTeamScore()` - Sums athlete times  
- `displayLegacyScore()` - Fallback display (if points fail)
- `displayLegacyStandings()` - **DEAD CODE** (never called)

## Component Boundaries

### Shared Components (Both Modes)
- Results entry interface
- Standings/leaderboard display
- Points calculation engine
- Athlete database and sync
- Race results storage

### Season League Only
- Player rankings interface
- Snake draft algorithm
- Draft results display
- Player code system (legacy auth)

### Single Race Only
- Salary cap draft interface
- Budget tracker UI
- Athlete browser with filters
- Team composition validator
- Anonymous session system

## Migration Notes

### Next.js Architecture
The application uses Next.js with:
- `/pages/index.js` - Main entry point (SSR wrapper)
- `/public/app.js` - Core frontend logic (vanilla JS)
- `/public/salary-cap-draft.js` - Salary cap-specific UI
- `/pages/api/*` - Serverless API routes

**Why vanilla JS in Next.js?**
The app was migrated from pure vanilla JS to Next.js primarily to reduce serverless function count (Vercel limits). The frontend remains vanilla JS for simplicity and maintains backward compatibility.

### Data Storage Evolution
1. **Original**: Vercel Blob Storage (JSON files)
2. **Current**: Neon Postgres (relational database)

**See:** `/docs/MIGRATION.md` for complete migration history

## Naming Conventions

### Clear Naming
- **Rankings** = Player preference lists (Season League mode)
- **Draft** = Snake draft execution (Season League mode)
- **Salary Cap Draft** = Direct team selection (Single Race mode)
- **Teams** = Final athlete assignments (both modes)

### Avoid Confusion
- Don't call salary cap draft a "draft" without "salary cap" qualifier
- Don't use "rankings" for salary cap mode (use "team selection")
- Distinguish between "game mode" and "game instance"

## For New Contributors

### I want to work on Season League mode
**Key files:**
- `/pages/api/rankings.js`
- `/pages/api/draft.js`
- Snake draft UI in `/public/app.js` (search for "ranking")
- `/docs/USER_GUIDE.md` (snake draft section)

### I want to work on Single Race mode
**Key files:**
- `/pages/api/salary-cap-draft.js`
- `/public/salary-cap-draft.js`
- `/docs/SALARY_CAP_DRAFT.md`
- `/docs/ACCOUNT_FREE_TEAMS.md`

### I want to work on scoring
**Key files:**
- `/pages/api/scoring-engine.js`
- `/pages/api/standings.js`
- `/docs/POINTS_SCORING_SYSTEM.md`

### I want to understand the architecture
**Read in order:**
1. `/docs/README.md` - Documentation index
2. `/docs/ARCHITECTURE.md` - Technical overview
3. `/docs/NEXTJS_MIGRATION.md` - Current framework
4. This document - Game modes

## Future Enhancements

### Potential Season League Improvements
- Multiple draft rounds per position
- Keeper leagues (retain athletes across seasons)
- Waiver wire for athlete swaps
- Trade system between players

### Potential Single Race Improvements
- Auction draft (bidding instead of fixed prices)
- Dynamic pricing based on popularity
- Salary floor (minimum spending requirement)
- Multiple entry option (create multiple teams)

## Testing

### Season League Tests
- Game flow test: `/tests/game-flow.test.js`
- Rankings submission and retrieval
- Snake draft algorithm
- Team assignments

### Single Race Tests  
- Salary cap test: `/tests/salary-cap-draft.test.js`
- Team creation flow
- Budget validation
- Athlete selection
- Session management

### Shared Tests
- Results entry: `/tests/api-endpoints.test.js`
- Standings calculation
- Points scoring validation

## Summary

Both game modes share the same results entry, points scoring, and leaderboard systems, but differ fundamentally in team-building mechanics:

- **Season League** = Preference-based automated assignment
- **Single Race** = Budget-constrained direct selection

Understanding this distinction is crucial for maintaining, extending, or debugging the application. When documenting or coding, always be clear which mode you're referring to.
