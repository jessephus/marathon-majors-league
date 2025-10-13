# Live Results Update Feature

## Overview
This feature allows the commissioner to update race results multiple times throughout the race (e.g., at 5K, 10K, half-marathon splits) before finalizing and crowning the winner.

## User Flow

### Commissioner Side

1. **Enter Commissioner Mode** - Click "Commissioner Mode" button and enter password
2. **Update Results Form** - After draft is complete, results form automatically appears
3. **Enter Split Times** - Enter athlete times (e.g., "0:15:30" for 5K split)
   - Times auto-save as you type them
   - Live standings update automatically
4. **Update Live Results** - Click "Update Live Results" button
   - This saves all results to database
   - Makes results visible to all players
   - Shows "Finalize Results & Crown Winner" button
5. **Continue Updating** - Commissioner can repeat steps 3-4 for each split
6. **Finalize Results** - When race is complete, click "Finalize Results & Crown Winner"
   - Declares official winner
   - Locks results (no more updates allowed)
   - Shows final standings

### Player Side

1. **View Teams** - After draft, players can click "View Teams" 
2. **See Live Updates** - When commissioner updates results:
   - Each athlete shows their current time
   - Teams show their current ranking (🥇🥈🥉 or #4, #5, etc.)
   - Teams show average finish time
   - Yellow notice appears: "⚡ Live Results in Progress - Refresh page to see latest updates"
3. **Refresh for Updates** - Players can refresh browser to see latest results
4. **Final Results** - When commissioner finalizes, rankings are locked

## Key Features

### Live Standings Display
- Shows current team rankings as results are entered
- Color-coded with medals (🥇🥈🥉) for top 3 teams
- Leader shown in bold red
- Updates in real-time in commissioner view

### Team Cards with Rankings
- Shows rank (#1, #2, etc.) for each team
- Displays medal emoji for top 3 teams
- Shows average finish time
- Leader highlighted in red

### Button State Management
- "Update Live Results" button active when results exist
- "Finalize Results" button appears after first update
- After finalization:
  - Update button disabled and shows "Results Finalized"
  - Finalize button hidden
  - Winner display shown

### Auto-Save
- Results auto-save to database as commissioner types
- Live standings update automatically
- Players see updates when they refresh

## Technical Changes

### Frontend (`app.js`)
- Added `resultsFinalized` to game state
- New functions:
  - `handleUpdateResults()` - Updates live results
  - `handleFinalizeResults()` - Finalizes and declares winner
  - `updateLiveStandings()` - Shows current rankings
- Enhanced `createTeamCard()` to show rankings with medals
- Enhanced `displayTeams()` to show live update notice
- Enhanced `handleCommissionerMode()` to manage button states

### Backend (`api/game-state.js`)
- Added `results_finalized` field to game state
- Updated GET endpoint to return `resultsFinalized`
- Updated POST/PUT endpoint to accept `resultsFinalized`

### Storage (`api/storage.js`)
- Updated `getDefaultGameState()` to include `results_finalized: false`

### UI (`index.html`)
- Changed "Calculate Winner" button to "Update Live Results"
- Added "Finalize Results & Crown Winner" button (initially hidden)
- Added `live-standings` div for showing current rankings

### Styles (`style.css`)
- Added `.btn-success` style for finalize button
- Added `.btn:disabled` styles
- Added hover prevention for disabled buttons

## Example Usage

1. Commissioner enters 5K split times → clicks "Update Live Results"
2. Players refresh and see: "🥇 Rank: #1 - Team RUNNER: 0:15:30 average"
3. Commissioner enters 10K split times → clicks "Update Live Results"  
4. Players refresh and see updated times and possibly new rankings
5. Continue for half-marathon, 30K, etc.
6. Commissioner enters final times → clicks "Finalize Results & Crown Winner"
7. Winner is declared with final standings locked