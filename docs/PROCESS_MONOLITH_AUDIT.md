# Monolith Audit and Feature Mapping

**Purpose:** Comprehensive inventory and analysis of the monolithic application codebase to guide the modularization sequence for [Issue #82: Componentization](https://github.com/jessephus/marathon-majors-league/issues/82).

**Status:** In Progress - Phase 4 (Commissioner Dashboard Modularization)  
**Last Updated:** November 8, 2025  
**Related Issues:** [#82](https://github.com/jessephus/marathon-majors-league/issues/82) (Parent - Componentization)

---

## 🚨 Migration Plan Deviations

**November 8, 2025:** During **Phase 4: Commissioner Dashboard** modularization, added shared Footer component ahead of schedule.

**Original Plan:** Footer extraction was not explicitly documented. Phase 4 focused on extracting major components (Leaderboard, Salary Cap Draft, Commissioner Dashboard) but didn't mention shared UI components like footers.

**Actual Execution:** While modularizing the commissioner dashboard, discovered footer markup was duplicated across 5+ pages. Created `components/Footer.tsx` using the Phase 3 state manager to eliminate duplication and establish pattern for future component extractions.

**Rationale:** 
- **In context of Phase 4 work** - Already touching footer code while building commissioner components
- **Leverages Phase 3 state manager** - Uses `useGameState()` hook for centralized state management
- **Prevents future duplication** - As Phase 4 continues, new components can immediately use shared Footer
- **Low risk, high value** - Simple component that demonstrates Phase 3 state integration pattern
- **Aligns with DRY principles** - Core development standard from documentation

**Impact:** Positive acceleration of remaining Phase 4 work. Each future component extraction saves ~42 lines of footer code. Demonstrates how Phase 3 state manager integrates with Phase 4 component extraction. See detailed documentation in [Shared Footer Component (Phase 4)](#shared-footer-component-phase-4) section below.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Phase 0: Bridge Module (Pre-Modularization)](#phase-0-bridge-module-pre-modularization)
3. [Monolith Overview](#monolith-overview)
4. [Global State Architecture](#global-state-architecture)
5. [Feature Cluster Mapping](#feature-cluster-mapping)
6. [Data Flow Analysis](#data-flow-analysis)
7. [Coupling and Entanglement](#coupling-and-entanglement)
8. [Extraction Targets](#extraction-targets)
9. [Migration Strategy Recommendations](#migration-strategy-recommendations)
10. [Shared Footer Component (Phase 4)](#shared-footer-component-phase-4)
11. [Appendices](#appendices)

---

## Executive Summary

The Fantasy NY Marathon application consists of three primary monolithic files totaling **8,097+ lines of code**:

| File | Lines | Functions | Purpose |
|------|-------|-----------|---------|
| `public/app.js` | 6,465 | 130+ | Core application logic, state management, UI |
| `public/salary-cap-draft.js` | 1,652 | 36+ | Salary cap draft interface and team building |
| `pages/index.js` | 980 | N/A | Next.js wrapper with inline HTML structure |

### Key Characteristics

- **Highly stateful:** 3 global state objects accessed throughout the codebase
- **Tightly coupled:** 126+ direct references to `gameState`, 195 DOM queries
- **API-driven:** 41 fetch calls to backend endpoints
- **Event-heavy:** 87 event listener attachments
- **Multiple responsibilities:** Session management, UI rendering, data fetching, business logic all intermixed

### Critical Findings

1. **State Management is Centralized but Scattered:** Global `gameState` object is accessed and mutated across 126+ locations
2. **Code Duplication:** At least 3 utility functions duplicated between `app.js` and `salary-cap-draft.js`
3. **DOM Coupling:** 195 `getElementById` calls and 44 `querySelector` calls spread throughout
4. **Mixed Concerns:** Business logic, UI rendering, and API calls intermingled in most functions
5. **Page-Based Navigation:** 30+ calls to `showPage()` function for SPA-style routing

---

## Phase 0: Bridge Module (Pre-Modularization)

**Status:** ✅ Completed (November 2025)  
**Created:** PR #107 - Landing Page SSR Implementation  
**Purpose:** Minimal utility extraction to enable SSR landing page without loading full monolith

---

## Phase 0: Bridge Module (Pre-Modularization)

**Status:** ✅ Completed (November 2025)  
**Created:** PR #107 - Landing Page SSR Implementation  
**Purpose:** Minimal utility extraction to enable SSR landing page without loading full monolith

### Background

When implementing the SSR landing page (see `MIGRATION_LANDING_PAGE_SSR.md`), we encountered the **infinite refresh loop bug** that occurs when loading `app.js` in SSR mode. However, the new landing page still needs core utilities like:
- Page navigation (`showPage()`)
- Modal management (`openModal()`, `closeModal()`)
- Session creation and storage
- Loading overlay removal

**Problem:** Duplicating these utilities inline creates maintenance burden and violates DRY principle.

**Solution:** Create a minimal bridge module (`app-bridge.js`) that:
1. Extracts only the utilities needed for SSR landing page
2. Avoids loading the full monolith (prevents infinite refresh)
3. Eliminates code duplication
4. Serves as temporary bridge until Phase 1 modularization begins

### What Was Extracted

**File:** `public/app-bridge.js` (284 lines)

| Function | Purpose | Lines | Will Move To (Phase 1) |
|----------|---------|-------|-------------------------|
| `showPage(pageId)` | SPA page navigation | 33-55 | `utils/ui-helpers.js` |
| `closeModal(modalId)` | Hide modal and reset form | 63-75 | `utils/ui-helpers.js` |
| `openModal(modalId)` | Show modal and focus input | 77-88 | `utils/ui-helpers.js` |
| `setupModalCloseHandlers()` | Setup X/cancel/ESC handlers | 90-133 | `utils/ui-helpers.js` |
| `storeTeamSession()` | Save to localStorage | 135-147 | `utils/session.js` |
| `getTeamSession()` | Load from localStorage | 149-161 | `utils/session.js` |
| `clearTeamSession()` | Remove from localStorage | 163-175 | `utils/session.js` |
| `removeLoadingOverlay()` | Fade out loading screen | 177-197 | `utils/ui-helpers.js` |
| `handleTeamCreation()` | Create team via API | 199-256 | `components/TeamCreation.js` |

**Constants Extracted:**
```javascript
const API_BASE = window.location.origin;
const GAME_ID = 'default';
const TEAM_SESSION_KEY = 'marathon_fantasy_team';
const COMMISSIONER_SESSION_KEY = 'marathon_fantasy_commissioner';
```

### Integration Points

**SSR Landing Page (`pages/index.js`):**
```javascript
// Load bridge module with ES6 imports
<Script src="/app-bridge.js" type="module" strategy="afterInteractive">
  {`
    import { 
      showPage, 
      closeModal,
      openModal,
      setupModalCloseHandlers,
      removeLoadingOverlay,
      handleTeamCreation
    } from '/app-bridge.js';
    
    function initSSRLandingPage() {
      removeLoadingOverlay();
      setupModalCloseHandlers('team-creation-modal', ...);
      setupModalCloseHandlers('commissioner-totp-modal', ...);
      // ... event listeners
    }
  `}
</Script>
```

**Legacy Mode (`app.js`):**
- Bridge module NOT loaded in legacy mode (feature flag OFF)
- `app.js` continues to define these functions independently
- No breaking changes to existing code

### Benefits Achieved

✅ **Eliminated 110+ lines of inline script duplication**  
✅ **Maintained SSR compatibility** (no monolith loading)  
✅ **Preserved legacy mode** (backward compatible)  
✅ **DRY principle** (single source of truth for utilities)  
✅ **Type safety** (ES6 modules with proper imports)  
✅ **Testable** (functions can be unit tested independently)

### Phase 0 → Phase 1 Transition Plan

When Phase 1 modularization begins, the bridge module will be **absorbed** into the utility structure:

```
Current (Phase 0):
├── public/app-bridge.js (temporary bridge)
└── public/app.js (monolith with duplicated functions)

Future (Phase 1):
├── utils/
│   ├── ui-helpers.js (showPage, modal functions, overlay)
│   ├── session.js (session storage functions)
│   └── formatting.js (time, scoring, etc.)
├── components/
│   └── TeamCreation.js (handleTeamCreation logic)
└── public/app.js (importing from utils/)
```

**Migration checklist:**
1. Create `utils/ui-helpers.js` and move page/modal functions
2. Create `utils/session.js` and move session storage functions
3. Update `app.js` to import from `utils/` instead of defining internally
4. Update `pages/index.js` to import from `utils/` instead of `app-bridge.js`
5. Delete `public/app-bridge.js` (no longer needed)
6. Update this document to mark Phase 0 as absorbed

### Lessons Learned

1. **Pre-modularization extraction reduces tech debt:** Even minimal extraction (Phase 0) prevents code duplication during transition periods
2. **Bridge modules are temporary:** Don't over-engineer—Phase 0 is meant to be absorbed, not permanent
3. **ES6 modules work in browser:** Modern browsers support `type="module"` natively, no build step needed
4. **Backward compatibility matters:** Feature flag ensures legacy mode continues working unchanged

### Related Documentation

- **PR #107:** Landing Page SSR Implementation
- **MIGRATION_LANDING_PAGE_SSR.md:** Full SSR migration details
- **FEATURE_ACCOUNT_FREE_TEAMS.md:** Session management architecture
- **Issue #82:** Parent issue for componentization

---

## Monolith Overview

### File Statistics

```
┌─────────────────────────────────┬───────┬───────────┬───────────┬─────────────────┐
│ File                            │ Lines │ Functions │ API Calls │ Event Listeners │
├─────────────────────────────────┼───────┼───────────┼───────────┼─────────────────┤
│ public/app.js                   │ 6,465 │    130    │    41     │       87        │
│ public/salary-cap-draft.js      │ 1,652 │     36    │     6     │        8        │
│ public/app-bridge.js (Phase 0)  │   284 │      9    │     1     │        0        │
│ pages/index.js (Next.js wrapper)│   980 │     -     │     -     │        -        │
└─────────────────────────────────┴───────┴───────────┴───────────┴─────────────────┘
```

### Technology Stack Dependencies

**Frontend:**
- Vanilla JavaScript (ES6+)
- Direct DOM manipulation
- Chart.js for data visualization
- Tailwind CSS (via CDN)
- ES6 Modules (Phase 0 bridge only)
- No framework-specific state management

**Backend Integration:**
- RESTful API calls to Next.js serverless functions
- JSON data exchange
- Session-based authentication (localStorage)

---

## Global State Architecture

### Primary State Objects

#### 1. `gameState` (Lines 2-15, app.js)

**Purpose:** Central game data repository

```javascript
let gameState = {
    athletes: { men: [], women: [] },  // Athlete database
    players: [],                        // List of player codes
    currentPlayer: null,                // Active player identifier
    rankings: {},                       // Player ranking submissions
    teams: {},                          // Draft team assignments
    results: {},                        // Race results and scores
    draftComplete: false,               // Draft state flag
    resultsFinalized: false,            // Results finalization flag
    rosterLockTime: null,               // Roster lock timestamp
    resultsCache: null,                 // API response cache
    gameStateCache: null                // Game state cache
};
```

**Access Pattern:** Read/written in **126+ locations** throughout app.js

**Critical Dependencies:**
- Modified by: `loadGameState()`, `loadGameStateCached()`, `saveGameState()`
- Read by: Nearly all display and handler functions
- Cached: Has built-in caching mechanism with TTL

#### 2. `anonymousSession` (Lines 18-24, app.js)

**Purpose:** Team session authentication

```javascript
let anonymousSession = {
    token: null,        // Session authentication token
    teamName: null,     // User's team name
    playerCode: null,   // Unique player identifier
    ownerName: null,    // Optional owner name
    expiresAt: null     // Session expiration timestamp
};
```

**Access Pattern:** 6+ direct accesses

**Storage:** Persisted to `localStorage` under key `'marathon_fantasy_team'`

#### 3. `commissionerSession` (Lines 27-31, app.js)

**Purpose:** Commissioner authentication state

```javascript
let commissionerSession = {
    isCommissioner: false,  // Authentication flag
    loginTime: null,        // Login timestamp
    expiresAt: null         // Session expiration
};
```

**Access Pattern:** Commissioner-specific functions

**Storage:** Persisted to `localStorage` under key `'marathon_fantasy_commissioner'`

### Additional Global Variables

```javascript
// Configuration
const TEAM_SESSION_KEY = 'marathon_fantasy_team';
const COMMISSIONER_SESSION_KEY = 'marathon_fantasy_commissioner';
const COMMISSIONER_SESSION_TIMEOUT = 30 * 24 * 60 * 60 * 1000; // 30 days
const RESULTS_CACHE_TTL = 30000;      // 30 seconds
const GAME_STATE_CACHE_TTL = 60000;    // 60 seconds
const API_BASE = window.location.origin === 'null' ? '' : window.location.origin;
const IS_DEV = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Runtime State
let GAME_ID = localStorage.getItem('current_game_id') || 'default';
let rankingViewState = { currentGender: 'men' };
let leaderboardStickyCleanup = null;
let gameRecapEscapeHandler = null;
let athletesLoadPromise = null;  // Promise cache for preventing concurrent loads
let draggedTableRow = null;      // Drag-and-drop state
let touchStartY = 0;             // Touch gesture tracking
let touchCurrentY = 0;
let isDragging = false;
let leaderboardRefreshInterval = null;  // Auto-refresh timer
let progressionChart = null;     // Chart.js instance
let currentProgressionData = null;
```

---

## Feature Cluster Mapping

### 1. Session Management Cluster

**Scope:** User authentication and session persistence

**Key Functions:**
- `checkURLForSession()` - Parse session token from URL
- `verifyAndLoadSession(token)` - Validate session token via API
- `restoreSession()` - Restore session from localStorage
- `handleTeamCreation(e)` - Create new anonymous team session
- `handleCommissionerTOTPLogin(e)` - Commissioner TOTP authentication
- `handleLogout()` - Clear team session
- `handleCommissionerLogout()` - Clear commissioner session

**Global State Dependencies:**
- `anonymousSession` (primary)
- `commissionerSession` (commissioner mode)
- `localStorage` (persistence)

**DOM Dependencies:**
- `#team-creation-modal`
- `#commissioner-totp-modal`
- `#create-team-btn`
- Footer buttons for navigation

**API Endpoints:**
- `/api/session/create` - Create team session
- `/api/session/verify` - Verify session token
- `/api/auth/totp/verify` - Verify TOTP code

**Coupling Level:** 🔴 **High** - Tightly coupled with page navigation and UI state

---

### 2. Draft System Cluster

**Scope:** Salary cap team building and athlete selection

**Files Involved:**
- `public/salary-cap-draft.js` (primary draft UI)
- `public/app.js` (legacy snake draft logic - deprecated?)

**Key Functions (salary-cap-draft.js):**
- `setupSalaryCapDraft()` - Initialize draft interface
- `handleSlotClick(slotElement)` - Open athlete selection modal
- `selectAthleteForSlot(athlete)` - Add athlete to team
- `removeAthleteFromSlot(slotId)` - Remove athlete from slot
- `updateBudgetDisplay()` - Recalculate remaining budget
- `handleSubmitSalaryCapTeam()` - Submit final team roster
- `lockRoster()` / `unlockRoster()` - Roster lock management
- `showAthleteDetail(athlete)` - Detailed athlete modal

**Key Functions (app.js - legacy):**
- `handleRunDraft()` - Execute snake draft (deprecated?)
- `snakeDraft(draftOrder, gender, perPlayer)` - Snake draft algorithm
- `displayDraftResults()` - Show draft results

**Global State Dependencies:**
- `gameState.athletes` - Available athlete pool
- `gameState.teams` - Current team rosters
- `gameState.rosterLockTime` - Lock timestamp
- `anonymousSession` - Current player identification

**DOM Dependencies:**
- `#salary-cap-draft-page` - Main container
- `.roster-slot` (6 slots: M1, M2, M3, W1, W2, W3)
- `#athlete-selection-modal`
- `#athlete-detail-modal`
- `#budget-remaining` - Budget tracker

**API Endpoints:**
- `/api/salary-cap-draft` - Submit team roster
- `/api/athletes` - Load athlete database

**Shared Code:** 
- `getRunnerSvg()`, `getTeamInitials()`, `createTeamAvatarSVG()` - **Duplicated** in both files

**Coupling Level:** 🟡 **Medium-High** - Moderately self-contained but shares state and utilities

---

### 3. Results & Leaderboard Cluster

**Scope:** Live race results, scoring, and standings

**Key Functions:**
- `displayLeaderboard()` - Fantasy standings view
- `displayRaceResultsLeaderboard()` - Actual race results view
- `setupLeaderboardAutoRefresh()` - Auto-refresh timer
- `initLeaderboardStickyBehavior()` - Sticky header behavior
- `createLeaderboardRow(standing, isCurrentPlayer)` - Row rendering
- `renderFilteredRaceResults(gender, splitType)` - Filter results by criteria
- `fetchResultsCached()` - Cached results fetching
- `invalidateResultsCache()` - Clear results cache
- `displayPointsStandings(standings, display)` - Points breakdown
- `showPointsBreakdownModal(athleteName, result)` - Detailed scoring modal

**Global State Dependencies:**
- `gameState.results` - Race results data
- `gameState.teams` - Team rosters for scoring
- `gameState.resultsFinalized` - Finalization flag
- `gameState.resultsCache` - API response cache
- `leaderboardRefreshInterval` - Auto-refresh timer

**DOM Dependencies:**
- `#leaderboard-page`
- `#fantasy-leaderboard` - Fantasy standings container
- `#race-results-leaderboard` - Actual results container
- `.leaderboard-tab` - Tab switchers
- `#points-breakdown-modal`

**API Endpoints:**
- `/api/results?gameId=...` - Fetch race results
- `/api/scoring?gameId=...` - Fetch scoring details

**Caching Strategy:**
- 30-second TTL for results cache
- Auto-refresh every 60 seconds when on leaderboard page
- Manual invalidation when commissioner updates results

**Coupling Level:** 🟡 **Medium** - Well-defined inputs (results data) but extensive UI rendering logic

---

### 4. Commissioner Tools Cluster

**Scope:** Game administration and result management

**Key Functions:**
- `handleCommissionerMode()` - Enter commissioner view
- `showCommissionerTOTPModal()` - TOTP authentication
- `handleCommissionerTOTPLogin(e)` - Process TOTP login
- `displayResultsManagement()` - Result entry interface
- `handleAddResult(e)` - Add single athlete result
- `handleUpdateResults()` - Batch update results
- `handleFinalizeResults()` - Lock final results
- `handleResetResults()` - Clear all results
- `handleResetGame()` - Full game reset
- `displayPlayerCodes()` - View player list
- `displayTeamsTable()` - View all teams

**Athlete Management:**
- `setupAthleteManagement()` - Athlete admin interface
- `handleAddAthlete(e)` - Add new athlete
- `handleToggleAthleteConfirmation(athleteId)` - Confirm race participation
- `handleSaveWorldAthleticsId(event)` - Update WA ID

**Global State Dependencies:**
- `commissionerSession` - Authentication state
- `gameState.results` - Result data management
- `gameState.resultsFinalized` - Lock flag
- `gameState.teams` - View team rosters
- `gameState.athletes` - Athlete database

**DOM Dependencies:**
- `#commissioner-page` - Main dashboard
- `#results-management-page` - Result entry form
- `#athlete-management-page` - Athlete admin
- `#manage-teams-page` - Team viewer
- Multiple form inputs for result entry

**API Endpoints:**
- `/api/results` - POST/GET results
- `/api/add-athlete` - Add athlete
- `/api/update-athlete` - Update athlete data
- `/api/toggle-athlete-confirmation` - Confirm participation
- `/api/reset-game` - Reset game state
- `/api/load-demo-data` - Load demo data

**Coupling Level:** 🔴 **High** - Tightly integrated with game state and multiple pages

---

### 5. Athlete Modal Cluster

**Scope:** Detailed athlete information display

**Key Functions:**
- `openAthleteModal(athleteIdOrData)` - Standard athlete detail view
- `openAthleteScoringModal(athleteIdOrData)` - Athlete with scoring info
- `loadAthleteDetailedData(athleteId)` - Fetch extended athlete data
- `loadAthleteScoringData(athleteId, athleteData)` - Fetch scoring data
- `closeAthleteModal()` - Close modal
- `switchModalTab(tabName)` - Tab navigation
- `setupAthleteModal()` - Initialize modal listeners

**Tab Sections:**
- **Bio** - Personal info, rankings, stats
- **Race Log** - Historical race results
- **Progression** - Performance chart over time
- **News** - Recent athlete news (placeholder)

**Global State Dependencies:**
- `gameState.athletes` - Athlete database
- `gameState.results` - Current race results
- `progressionChart` - Chart.js instance

**DOM Dependencies:**
- `#athlete-detail-modal`
- `.modal-tab` - Tab buttons
- `.tab-content` - Tab panels
- `#progression-chart` - Chart.js canvas

**API Endpoints:**
- `/api/athletes` - Get athlete data
- `/api/results` - Get scoring info

**Coupling Level:** 🟢 **Low-Medium** - Relatively isolated, clear inputs/outputs

---

### 6. Utility Functions Cluster

**Scope:** Shared formatting and helper functions

**Duplicated Functions (app.js + salary-cap-draft.js):**
- `getRunnerSvg(gender)` - Default athlete avatar
- `getTeamInitials(teamName)` - Team name initials
- `createTeamAvatarSVG(teamName, size)` - SVG avatar generation

**Formatting Functions (app.js only):**
- `formatSplitLabel(splitName)` - Convert split keys to display labels
- `formatTimeGap(gapSeconds)` - Format time difference (e.g., "+2:34")
- `formatTimeFromMs(ms)` - Convert milliseconds to time string
- `formatPacePerMile(msPerMeter)` - Calculate and format pace
- `timeStringToSeconds(timeStr)` - Parse time to seconds
- `roundTimeToSecond(timeStr)` - Round time to nearest second
- `getOrdinal(n)` - Get ordinal suffix (1st, 2nd, 3rd...)
- `getRecordBadge(recordType, recordStatus)` - Record badge HTML
- `getCountryFlag(countryCode)` - Country flag emoji
- `formatAthleteDetails(athlete, includePersonalBest)` - Format athlete info

**State Helpers:**
- `getCurrentGameId()` - Get active game ID
- `switchGame(gameId)` - Switch between games
- `devLog(...args)` - Development-only console logging
- `escapeHtml(text)` - XSS prevention

**UI Helpers:**
- `showPage(pageId)` - SPA page navigation
- `showWelcomeCard()` / `hideWelcomeCard()` - Landing page card
- `updateFooterButtons()` - Conditional footer button display
- `enrichAthleteData(athlete, gender)` - Add computed athlete properties
- `createHeadshotElement(athlete, className)` - Athlete image with fallback

**Coupling Level:** �� **Low** - Good candidates for extraction to shared utility modules

---

### 7. Drag-and-Drop Ranking Cluster

**Scope:** Interactive athlete ranking interface (legacy feature?)

**Key Functions:**
- `handleTableRowDragStart(e)` - Start drag operation
- `handleTableRowDragOver(e)` - Drag over validation
- `handleTableRowDrop(e)` - Drop and reorder
- `handleTableRowDragEnd(e)` - Clean up drag state
- `handleTableRowTouchStart(e)` - Touch gesture start
- `handleTableRowTouchMove(e)` - Touch gesture move
- `handleTableRowTouchEnd(e)` - Touch gesture end
- `handleTableRankChange(gender, athleteId, newRank)` - Process rank change
- `setupDragAndDrop(gender)` - Initialize drag listeners

**Global State Dependencies:**
- `rankingViewState` - Current gender tab
- `draggedTableRow` - Active drag element
- `touchStartY`, `touchCurrentY`, `isDragging` - Touch state

**DOM Dependencies:**
- `#ranking-page`
- `.athlete-table` - Draggable table rows
- `.tab` - Gender tabs

**Usage:** Appears to be **legacy code** - salary cap draft replaced traditional ranking

**Coupling Level:** 🟡 **Medium** - Self-contained but may be deprecated

---

## Data Flow Analysis

### API Interaction Patterns

#### Outbound API Calls (app.js)

```
/api/athletes              → loadAthletes() → gameState.athletes
/api/game-state            → loadGameState() → gameState.*
/api/session/create        → handleTeamCreation() → anonymousSession
/api/session/verify        → verifyAndLoadSession() → anonymousSession
/api/auth/totp/verify      → handleCommissionerTOTPLogin() → commissionerSession
/api/rankings              → handleSubmitRankings() → (POST)
/api/results               → fetchResultsCached() → gameState.results
/api/results               → handleUpdateResults() → (POST)
/api/scoring               → fetchScoringDetails() → scoring details
/api/add-athlete           → handleAddAthlete() → (POST)
/api/update-athlete        → handleSaveWorldAthleticsId() → (POST)
/api/toggle-athlete-confirmation → handleToggleAthleteConfirmation() → (POST)
/api/reset-game            → handleResetGame() → (POST)
/api/load-demo-data        → handleLoadDemoData() → (POST)
```

#### Outbound API Calls (salary-cap-draft.js)

```
/api/athletes              → setupSalaryCapDraft() → athlete pool
/api/salary-cap-draft      → handleSubmitSalaryCapTeam() → team roster
/api/athletes              → loadDetailAthleteData() → detailed athlete data
```

### State Mutation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     State Mutation Pattern                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User Action → Event Handler → API Call → Update gameState     │
│                                         ↓                       │
│                                    localStorage                 │
│                                         ↓                       │
│                                   Trigger Re-render             │
│                                         ↓                       │
│                                 DOM Update (manual)             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Example Flow: Submitting Team Roster**

1. User clicks "Submit Team" button
2. `handleSubmitSalaryCapTeam()` validates team
3. POST to `/api/salary-cap-draft` with team data
4. API saves to database
5. Update `gameState.teams` with new roster
6. Save `anonymousSession` to localStorage
7. Call `showPage('leaderboard-page')`
8. `displayLeaderboard()` manually renders DOM

**Pain Points:**
- No centralized state management (e.g., Redux, Context API)
- Manual DOM updates scattered throughout
- Difficult to track state changes
- No state diffing or optimization

---

### localStorage Usage Patterns

**Keys Used:**
1. `current_game_id` - Active game selection
2. `marathon_fantasy_team` - Team session data
3. `marathon_fantasy_commissioner` - Commissioner session data
4. `gameRecap_{GAME_ID}_{playerCode}` - Track if recap modal shown

**Access Frequency:** 19+ direct `localStorage` accesses

**Session Flow:**
```
Initial Load → Check URL for token → Check localStorage for session
                                              ↓
                                    Restore session if valid
                                              ↓
                                    Verify with API if expired
                                              ↓
                                    Update UI based on session state
```

---

## Coupling and Entanglement

### Tight Coupling Indicators

#### 1. Global State Access

**Severity:** 🔴 **Critical**

- **126+ direct `gameState` accesses** throughout app.js
- State mutations scattered across dozens of functions
- No single source of truth for state updates
- Hard to track where and why state changes

**Example Problem:**
```javascript
// Function A
gameState.draftComplete = true;

// Function B (elsewhere)
if (gameState.draftComplete) {
    // Business logic
}
```

**Risk:** Changes in one function can unexpectedly affect others

---

#### 2. DOM ID Dependencies

**Severity:** 🔴 **Critical**

- **195 `getElementById` calls**
- **44 `querySelector/querySelectorAll` calls**
- Hard-coded element IDs throughout JavaScript
- Brittle HTML/JS coupling

**Example Problem:**
```javascript
document.getElementById('submit-rankings').addEventListener('click', handleSubmitRankings);
```

If the HTML ID changes, the JavaScript breaks silently.

**Risk:** HTML refactoring breaks JavaScript unexpectedly

---

#### 3. Function Interdependencies

**Severity:** 🟡 **Moderate**

- Many functions call other functions directly
- No dependency injection
- Difficult to test in isolation

**Example Chain:**
```
init() → restoreSession() → verifyAndLoadSession() → updateFooterButtons() → showPage()
```

**Risk:** Changes cascade through call stack

---

#### 4. Code Duplication

**Severity:** 🟡 **Moderate**

**Duplicated Functions:**

| Function | Location 1 | Location 2 | Purpose |
|----------|-----------|-----------|---------|
| `getRunnerSvg()` | app.js:93 | salary-cap-draft.js:9 | Default avatar |
| `getTeamInitials()` | app.js:3135 | salary-cap-draft.js:20 | Team initials |
| `createTeamAvatarSVG()` | app.js:3153 | salary-cap-draft.js:40 | SVG avatar |

**Risk:** Bug fixes must be applied twice, inconsistency likely

---

#### 5. Mixed Concerns

**Severity:** 🔴 **Critical**

Most functions mix multiple responsibilities:
- **Data fetching** + **DOM manipulation**
- **Business logic** + **UI rendering**
- **State management** + **Event handling**

**Example:**
```javascript
async function handleSubmitRankings() {
    // Validation (business logic)
    const menRanked = getAthleteCount('men');
    
    // API call (data layer)
    await fetch('/api/rankings', { method: 'POST', ... });
    
    // State update (state management)
    gameState.rankings[playerCode] = rankings;
    
    // UI update (view layer)
    alert('Rankings submitted!');
    showPage('teams-page');
}
```

**Risk:** Difficult to test, refactor, or reuse

---

### Entangled Areas

#### Area 1: Session Management + Page Navigation

**Problem:** Session state directly controls page visibility

```javascript
if (anonymousSession.token) {
    showPage('salary-cap-draft-page');
} else if (commissionerSession.isCommissioner) {
    showPage('commissioner-page');
} else {
    showPage('landing-page');
}
```

**Impact:** Can't change session logic without affecting routing

---

#### Area 2: Results Management + Leaderboard Display

**Problem:** Results entry and display tightly coupled

- Commissioner updates results → invalidates cache → leaderboard auto-refreshes
- Manual DOM manipulation in both functions
- Shared state dependencies

**Impact:** Changes to result entry can break leaderboard display

---

#### Area 3: Athlete Data + Multiple Views

**Problem:** Athlete data accessed in many contexts

- Draft selection modal
- Leaderboard athlete rows
- Commissioner athlete management
- Athlete detail modal
- Team roster display

**Impact:** Changes to athlete data structure ripple across entire app

---

## Extraction Targets

### Priority 1: High-Value, Low-Risk Extractions

#### 1.1 Utility Functions Module

**Target:** `utils/formatting.js`

**Functions to Extract:**
- `formatTimeGap()`
- `formatTimeFromMs()`
- `formatPacePerMile()`
- `timeStringToSeconds()`
- `roundTimeToSecond()`
- `formatSplitLabel()`
- `getOrdinal()`
- `escapeHtml()`

**Benefits:**
- ✅ Pure functions, no side effects
- ✅ Easy to test
- ✅ Reusable across components
- ✅ No breaking changes

**Effort:** 🟢 **Low** (1-2 hours)

---

#### 1.2 UI Utility Functions Module

**Status:** ✅ **COMPLETED** (November 9-10, 2025)

**Target:** `lib/ui-helpers.tsx` (262 lines)

**Functions Extracted:**
- ✅ `getRunnerSvg()` - Default athlete avatar URLs
- ✅ `getTeamInitials()` - Extract 1-2 letter team initials
- ✅ `createTeamAvatarSVG()` - React JSX version for components
- ✅ `createTeamAvatarSVGElement()` - DOM version for vanilla JS
- ✅ `getCountryFlag()` - ISO 3166-1 alpha-3 to emoji conversion
- ✅ `createHeadshotElement()` - Athlete image with error handling
- ✅ `enrichAthleteData()` - Merge saved data with current database

**Implementation Details:**
- Created `lib/ui-helpers.tsx` with TypeScript + JSDoc
- Created `lib/ui-helpers.js` as vanilla JS bridge for legacy files
- Provides both React (JSX) and DOM versions for different contexts
- Eliminated code duplication from 3 locations:
  - ✅ `pages/team/[session].tsx` - Migrated (74 lines eliminated)
  - ⚠️ `public/app.js` - **Documented duplicates** (lines ~100, ~3246, ~3264)
  - ⚠️ `public/salary-cap-draft.js` - **Documented duplicates** (lines ~15, ~27, ~47)

**Benefits Achieved:**
- ✅ Single source of truth for UI utilities
- ✅ TypeScript type safety
- ✅ Eliminates React component duplication
- ✅ Testable pure functions
- ⚠️ Vanilla JS files (app.js, salary-cap-draft.js) still have duplicates due to ES6 module limitation

**Technical Debt:**
- Legacy files loaded as plain `<script>` tags, not ES6 modules
- Cannot use `import` statements without refactoring
- Duplicates **documented with comments** referencing source of truth
- See: `docs/TECH_UI_HELPER_DUPLICATION.md` for full analysis and resolution plan

**Vanilla JS Migration Strategy:**
- **Decision:** Keep documented duplicates in app.js/salary-cap-draft.js for now
- **Rationale:** Files aren't ES6 modules, can't use import statements safely
- **Future Plan:** Address during Phase 4 when converting to React components
- **Options:** (1) Convert to modules, (2) Convert files to React, (3) Build step

**Effort:** 🟢 **Low** (4 hours actual - including documentation)

**Related Work:**
- See "Shared Footer Component" section below for Phase 3 → Phase 4 integration pattern
- See `docs/TECH_UI_HELPER_DUPLICATION.md` for duplication analysis

---

#### 1.3 Draft Validation Module

**Status:** ✅ **COMPLETED** (November 10, 2025)

**Target:** `src/features/draft/validation.js` (Pure validation functions)

**Functions Extracted:**
- ✅ `validateAllSlotsFilled()` - Check all 6 slots filled
- ✅ `validateMenSlots()` - Validate 3 men's slots (3M requirement)
- ✅ `validateWomenSlots()` - Validate 3 women's slots (3W requirement)
- ✅ `calculateTotalSpent()` - Sum athlete salaries
- ✅ `validateBudget()` - Check $30,000 cap constraint
- ✅ `validateNoDuplicates()` - No duplicate athletes
- ✅ `validateSlotGenders()` - Gender matches slot type
- ✅ `validateRoster()` - Comprehensive validation
- ✅ `canAddAthleteToSlot()` - Check if athlete can be added

**State Machine:** `src/features/draft/state-machine.js`
- ✅ `createInitialState()` - Initialize draft state
- ✅ `addAthleteToSlot()` - Add athlete to roster
- ✅ `removeAthleteFromSlot()` - Remove athlete from roster
- ✅ `canEditRoster()` / `canSubmitRoster()` - State checks
- ✅ `getRosterSummary()` - Current status summary

**Testing:**
- ✅ 30 pure unit tests (all passing)
- ✅ No DOM coupling
- ✅ Independent test execution

**Test Coverage:**
- ✅ Empty roster validation
- ✅ 3M+3W requirement validation
- ✅ Budget calculation ($30,000 cap)
- ✅ Over budget detection
- ✅ Duplicate athlete detection
- ✅ Gender slot validation
- ✅ Edge cases (default salaries, custom budgets)

**Benefits:**
- ✅ Pure functions, no side effects
- ✅ Easy to test (30 tests, 100% passing)
- ✅ Reusable in React, API routes, or vanilla JS
- ✅ No breaking changes
- ✅ Clean separation from UI
- ✅ No direct references to legacy draft JS

**Integration:**
- Can be imported by React components, API endpoints, or future modules
- Complements existing `lib/budget-utils.js`
- Ready for Phase 4 component extraction

**Documentation:**
- `src/features/draft/README.md` - Full API reference
- Tests demonstrate all use cases

**Effort:** 🟢 **Low** (4 hours actual)

---

#### 1.4 API Client Module

**Target:** `lib/api-client.js`

**Proposed Structure:**
```javascript
export const api = {
    athletes: {
        list: () => fetch('/api/athletes'),
        add: (data) => fetch('/api/add-athlete', { method: 'POST', ... }),
        update: (id, data) => fetch('/api/update-athlete', { ... })
    },
    gameState: {
        load: (gameId) => fetch(`/api/game-state?gameId=${gameId}`),
        save: (gameId, data) => fetch(`/api/game-state?gameId=${gameId}`, ...)
    },
    results: {
        fetch: (gameId) => fetch(`/api/results?gameId=${gameId}`),
        update: (gameId, data) => fetch(`/api/results?gameId=${gameId}`, ...)
    },
    // ... etc
};
```

**Benefits:**
- ✅ Centralizes API calls
- ✅ Easier to mock for testing
- ✅ Consistent error handling
- ✅ Type safety potential (TypeScript)

**Effort:** 🟡 **Medium** (4-6 hours)

---

### Priority 2: Medium-Value, Medium-Risk Extractions

#### 2.1 State Management Module

**Target:** `lib/state-manager.js` or Context API

**Proposed Approach:**
```javascript
// Option A: Custom state manager
export class GameStateManager {
    constructor(initialState) { ... }
    subscribe(listener) { ... }
    getState() { ... }
    setState(updates) { ... }
    // Specific methods
    loadFromAPI(gameId) { ... }
    saveToAPI(gameId) { ... }
}

// Option B: React Context (if migrating to React components)
export const GameStateContext = createContext();
export const useGameState = () => useContext(GameStateContext);
```

**Benefits:**
- ✅ Centralized state management
- ✅ Easier to debug state changes
- ✅ Supports React migration
- ⚠️ Requires refactoring many functions

**Effort:** 🟡 **Medium-High** (8-12 hours)

**Risk:** 🟡 **Medium** - Touches many parts of codebase

---

#### 2.2 Session Management Module

**Target:** `lib/session-manager.js`

**Functions to Extract:**
- `checkURLForSession()`
- `verifyAndLoadSession()`
- `restoreSession()`
- `handleLogout()`
- `handleCommissionerLogout()`
- All localStorage session operations

**Benefits:**
- ✅ Isolates authentication logic
- ✅ Easier to test auth flows
- ✅ Cleaner separation of concerns

**Effort:** 🟡 **Medium** (6-8 hours)

**Risk:** 🟡 **Medium** - Critical path, must maintain backward compatibility

---

#### 2.3 Leaderboard Component

**Target:** `components/Leaderboard.jsx` (React) or `/pages/leaderboard.tsx`

**Scope:**
- All leaderboard display logic
- Auto-refresh mechanism
- Tab switching (fantasy vs actual)
- Points breakdown modal

**Benefits:**
- ✅ Clear component boundary
- ✅ Reusable across pages
- ✅ Easier to optimize rendering

**Effort:** 🔴 **High** (12-16 hours)

**Risk:** 🟡 **Medium** - Complex DOM manipulation to convert

---

### Priority 3: High-Value, High-Risk Extractions

#### 3.1 Salary Cap Draft Component

**Target:** `/pages/team/[session].tsx` or `components/SalaryCapDraft.jsx`

**Scope:**
- Entire `salary-cap-draft.js` file
- Slot-based selection UI
- Budget tracking
- Roster lock logic
- Athlete selection modal
- Athlete detail modal

**Benefits:**
- ✅ Largest single-purpose module
- ✅ Already somewhat isolated
- ✅ Clear user flow

**Effort:** 🔴 **High** (16-24 hours)

**Risk:** 🔴 **High** - Complex interactions, many edge cases

---

#### 3.2 Commissioner Dashboard

**Target:** `/pages/commissioner.tsx` or `components/CommissionerDashboard.jsx`

**Scope:**
- Commissioner page
- Results management page
- Athlete management page
- Team management view
- All admin modals and forms

**Benefits:**
- ✅ Isolated by role
- ✅ Heavy lifting for modularization
- ✅ Enables better access control

**Effort:** 🔴 **Very High** (24-40 hours)

**Risk:** 🔴 **High** - Many interconnected features

---

#### 3.3 Athlete Modal System

**Target:** `components/AthleteModal.jsx`

**Scope:**
- `openAthleteModal()`
- `openAthleteScoringModal()`
- All tab logic (Bio, Race Log, Progression, News)
- Chart.js integration
- Data fetching for modal content

**Benefits:**
- ✅ Reusable across app
- ✅ Improves performance (lazy load)
- ✅ Better UX (dedicated route?)

**Effort:** 🟡 **Medium-High** (10-14 hours)

**Risk:** 🟡 **Medium** - Used in many contexts

---

## Migration Strategy Recommendations

### Phase 1: Foundation (Weeks 1-2)

**Goal:** Establish extraction patterns and tooling without breaking existing functionality

**Tasks:**
1. ✅ **Complete this audit** (current document)
2. Create shared utility modules
   - Extract formatting functions → `utils/formatting.js`
   - Extract UI helpers → `utils/ui-helpers.js`
   - Merge duplicated functions from app.js and salary-cap-draft.js
3. Set up module imports in Next.js
4. Write unit tests for extracted utilities
5. Update documentation with new module structure

**Deliverables:**
- `utils/formatting.js`
- `utils/ui-helpers.js`
- Test files for utilities
- Updated `CORE_ARCHITECTURE.md`

**Success Criteria:**
- All utility functions extracted
- Zero breaking changes
- 100% test coverage on utilities
- Documentation updated

---

### Phase 2: API Layer (Weeks 3-4)

**Goal:** Centralize API communication

**Tasks:**
1. Create `lib/api-client.js` with organized endpoint methods
2. Replace direct `fetch()` calls with API client methods
3. Add request/response interceptors for common patterns
4. Implement consistent error handling
5. Add TypeScript types for API responses (optional but recommended)

**Deliverables:**
- `lib/api-client.js`
- API client tests
- Migrated API calls in app.js and salary-cap-draft.js

**Success Criteria:**
- All API calls go through centralized client
- Consistent error handling
- Easier to mock for testing

---

### Phase 3: State Management (Weeks 5-7)

**Goal:** Centralize state management and prepare for React migration

**Option A: Custom State Manager (if staying vanilla JS)**
- Create `GameStateManager` class
- Implement pub/sub pattern
- Migrate `gameState` object

**Option B: React Context (if migrating to React)**
- Create `GameStateContext`
- Wrap app in provider
- Convert functions to use `useGameState()` hook

**Tasks:**
1. Choose state management approach based on migration path
2. Implement state manager
3. Migrate critical state dependencies
4. Add state persistence layer (localStorage)
5. Test state synchronization

**Deliverables:**
- State management module
- Migration guide
- State management tests

**Success Criteria:**
- Centralized state mutations
- Clear state update patterns
- Debugging tools (state logging)

---

### Phase 4: Component Extraction (Weeks 8-14)

**Goal:** Extract major features into Next.js pages/components

**Priority Order:**
1. **Leaderboard** → `/pages/leaderboard.tsx`
2. **Salary Cap Draft** → `/pages/team/[session].tsx`
3. **Commissioner Dashboard** → `/pages/commissioner.tsx`
4. **Athlete Modal** → `components/AthleteModal.jsx`

**For Each Component:**
1. Create new Next.js page/component
2. Extract relevant functions
3. Convert to React component patterns
4. Implement server-side rendering (SSR) where beneficial
5. Add component-specific tests
6. Remove old code from monolith
7. Update routing

**Deliverables:**
- 4 new Next.js pages/components
- Component tests
- Routing updates
- Reduced app.js size by ~60-70%

**Success Criteria:**
- Each component works in isolation
- SSR improves initial page load
- Monolith size reduced significantly
- No regression in functionality

---

## Shared Footer Component (Phase 4)

**Status:** ✅ **COMPLETED with Session-Aware Enhancements** (November 8-9, 2025)  
**Phase Context:** Created during Phase 4 Commissioner Dashboard modularization  
**Purpose:** Eliminate footer duplication and demonstrate Phase 3 state manager integration

### Background

**Discovery:** While modularizing the commissioner dashboard (Phase 4 work), we discovered footer markup was **duplicated across 5+ pages**:
- `pages/index.js` (2 instances - SSR and legacy)
- `pages/commissioner.tsx`
- `pages/team/[session].tsx`
- `pages/leaderboard.tsx`
- `pages/test-athlete-modal.tsx`

**Why During Phase 4:**
1. **Active context** - Already touching footer code during commissioner dashboard work
2. **Architecture alignment** - Demonstrates how Phase 3 state manager enables Phase 4 components
3. **Low risk, high value** - Clear boundaries, eliminates 110+ lines of duplication
4. **Pattern establishment** - Shows proper integration of Phase 3 foundations
5. **DRY principle** - Aligns with core development standards

### Architecture: Phase 3 → Phase 4 Integration

**Phase 3 Foundation (lib/state-provider.tsx):**
- React Context-based state management
- Provides `useGameState()`, `useCommissionerState()`, `useSessionState()` hooks
- Centralized state updates via `setGameState()`
- Replaces legacy global `gameState` object

**Phase 4 Component (components/Footer.tsx):**
- Consumes Phase 3 state manager via hooks
- Self-contained state management (no state props needed)
- Demonstrates proper layered architecture
- **Session-aware features** added November 9, 2025

**Integration Pattern:**
```typescript
// Phase 3: State Provider
export function GameStateProvider({ children }) {
  const [gameState, setGameState] = useState({...});
  return (
    <GameStateContext.Provider value={{ gameState, setGameState }}>
      {children}
    </GameStateContext.Provider>
  );
}

// Phase 4: Footer Component (with session-aware features)
import { useGameState, useSessionState, useCommissionerState } from '@/lib/state-provider';

export default function Footer({ mode, showGameSwitcher, onLogout }) {
  const { gameState, setGameState } = useGameState();
  const { sessionState } = useSessionState();
  const { commissionerState } = useCommissionerState();
  
  const handleGameChange = (newGameId: string) => {
    localStorage.setItem('current_game_id', newGameId);
    setGameState({ gameId: newGameId });
    window.location.reload();
  };
  
  const handleCopyURL = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Team URL copied! Bookmark this link to return to your team.');
  };
  
  return (
    <footer>
      {/* Session-aware button rendering */}
      <button onClick={() => router.push('/')}>Home</button>
      
      {/* Copy URL - only when in team session */}
      {sessionState.token && mode === 'team' && (
        <button onClick={handleCopyURL}>📋 Copy URL</button>
      )}
      
      {/* Commissioner Mode - only when NOT logged in */}
      {!commissionerState.isCommissioner && !sessionState.token && (
        <button onClick={() => router.push('/commissioner')}>Commissioner Mode</button>
      )}
      
      {/* Game switcher - when commissioner OR explicitly requested */}
      {(showGameSwitcher || commissionerState.isCommissioner) && (
        <select 
          value={gameState.gameId || 'default'}
          onChange={(e) => handleGameChange(e.target.value)}
        >
          {/* game options */}
        </select>
      )}
      
      {/* Logout - when commissioner OR in team session */}
      {(commissionerState.isCommissioner || sessionState.token) && (
        <button onClick={onLogout}>Logout</button>
      )}
    </footer>
  );
}
```

### What Was Created

**File:** `components/Footer.tsx` (238 lines)

**Props Interface (Simplified via Phase 3):**
```typescript
interface FooterProps {
  mode?: 'home' | 'commissioner' | 'team' | 'leaderboard' | 'minimal';
  showGameSwitcher?: boolean;
  onLogout?: () => void;           // Callback only
  showCopyright?: boolean;
  className?: string;
  // Removed: currentGameId, onGameChange (Phase 3 handles internally)
}
```

**Key Features:**
- ✅ Consumes Phase 3 state manager (`useGameState()`, `useSessionState()`, `useCommissionerState()` hooks)
- ✅ Self-contained state management (no external state props)
- ✅ **Session-aware buttons** - Shows/hides based on authentication state
- ✅ **Copy URL button** - Appears in team sessions for bookmarking
- ✅ **Conditional Commissioner Mode** - Hidden when already logged in
- ✅ **Smart Game Selector** - Auto-shows for commissioners
- ✅ **Context-aware Logout** - Handles both commissioner and team sessions
- ✅ TypeScript type safety
- ✅ Consistent styling and behavior

**Supported Modes:**
| Mode | Buttons | Use Case |
|------|---------|----------|
| `home` | Home, Commissioner Mode (if not logged in) | Landing page |
| `commissioner` | Home, Logout + Game Switcher | Commissioner dashboard |
| `team` | Home, Copy URL, Logout | Team session page |
| `leaderboard` | Back | Leaderboard page |
| `minimal` | None | Custom footer needs |

### Session-Aware Features (Added November 9, 2025)

**Enhancement:** Footer now responds to user authentication state

**Copy URL Button:**
- Shows when: `sessionState.token` exists AND `mode === 'team'`
- Purpose: Allow team members to bookmark their unique session URL
- Behavior: Copies current URL to clipboard with helpful alert

**Commissioner Mode Button:**
- Shows when: `!commissionerState.isCommissioner` AND `!sessionState.token`
- Purpose: Only visible to anonymous users
- Behavior: Navigates to `/commissioner` for login

**Game Selector:**
- Shows when: `commissionerState.isCommissioner` OR `showGameSwitcher === true`
- Purpose: Automatically visible for commissioners
- Behavior: Switch games with confirmation dialog

**Logout Button:**
- Shows when: `commissionerState.isCommissioner` OR `sessionState.token` exists
- Purpose: Universal logout for any authenticated user
- Behavior: 
  - Commissioner: Clears localStorage, navigates to home
  - Team session: Confirmation dialog, clears sessionStorage, navigates to home

### Pages Updated with Simplified API

**Phase 4 Migrations (November 8, 2025):**
1. ✅ `pages/commissioner.tsx` - Commissioner dashboard
2. ✅ `pages/team/[session].tsx` - Team session page
3. ✅ `pages/leaderboard.tsx` - Leaderboard page

**Pending (During Continued Phase 4):**
4. ⏳ `pages/index.js` - Landing page (SSR and legacy)
5. ⏳ `pages/test-athlete-modal.tsx` - Test page

### Before/After Comparison

**Before Phase 3 + Phase 4 (pages/commissioner.tsx - 42 lines):**
```tsx
<footer>
  <div className="footer-actions">
    <button onClick={() => router.push('/')}>Home</button>
    <button onClick={handleLogout}>Logout</button>
    <div className="game-switcher">
      <select value={gameState.gameId || 'default'} onChange={(e) => {
        const newGameId = e.target.value;
        if (newGameId !== gameState.gameId && confirm('Switch game?')) {
          localStorage.setItem('current_game_id', newGameId);
          setGameState({ gameId: newGameId });
          window.location.reload();
        }
      }}>
        <option value="default">Default</option>
        <option value="NY2025">NY 2025</option>
      </select>
    </div>
  </div>
  <p>© 2025</p>
</footer>
```

**After Phase 3 + Phase 4 (pages/commissioner.tsx - 4 lines):**
```tsx
<Footer 
  mode="commissioner"
  showGameSwitcher
  onLogout={handleLogout}
/>
```

**Benefits:**
- 📉 **90% code reduction** (42 lines → 4 lines)
- 🏗️ **Architectural clarity** - Phase 3 state → Phase 4 component
- 🔒 **State encapsulation** - Footer manages its own state via hooks
- ♻️ **Reusability** - Same pattern for all Phase 4 components
- 📝 **API simplicity** - Only pass callbacks, not state

### Impact on Migration Phases

**Phase 3 (State Management) Validation:**
- ✅ Proves state manager enables component extraction
- ✅ Demonstrates hook-based consumption pattern
- ✅ Shows centralized state updates work correctly

**Phase 4 (Component Extraction) Acceleration:**
- ✅ Footer already modular for remaining extractions
- ✅ Pattern established: consume Phase 3, emit callbacks
- ✅ Reduces migration work per component (~40 lines saved)
- ✅ New pages immediately use shared Footer

**Phase 5 (Final Migration):**
- ✅ Footer extracted and tested
- ✅ Pattern repeatable for remaining components
- ✅ Demonstrates proper layered architecture

### Lessons Learned

**Architecture:**
1. **Phase sequencing matters** - Phase 3 state manager must exist before Phase 4 components
2. **Hooks enable extraction** - `useGameState()` pattern makes components self-contained
3. **Layered architecture works** - Clear separation: Phase 3 (state) → Phase 4 (components)
4. **State props are anti-pattern** - When using Context, don't pass state as props

**Process:**
1. **Opportunistic extraction** - Active context (commissioner work) made extraction natural
2. **Visual duplication signal** - Seeing repeated code revealed architectural debt
3. **Small wins compound** - Footer seems small, but 5× duplication = significant burden
4. **Document deviations** - Recording keeps migration organized despite opportunism

**Technical:**
1. **TypeScript helps** - Props interface enforces correct usage
2. **Single responsibility** - Footer handles its own state, emits callbacks only
3. **Testing is easier** - Mocking state provider simpler than managing props
4. **API simplicity scales** - Fewer props = easier to use and maintain

### Pattern for Future Phase 4 Components

```typescript
// 1. Import Phase 3 state manager
import { useGameState } from '@/lib/state-provider';

// 2. Define props (callbacks only, no state)
interface MyComponentProps {
  onAction?: () => void;  // Callbacks OK
  config?: any;            // Configuration OK
  // DON'T: currentState, onStateChange (use hooks instead)
}

// 3. Consume state via hooks
export default function MyComponent({ onAction, config }: MyComponentProps) {
  const { gameState, setGameState } = useGameState(); // Phase 3
  
  // 4. Read from state, update via setState
  const value = gameState.someValue;
  const handleUpdate = () => setGameState({ someValue: newValue });
  
  // 5. Emit callbacks for external coordination
  const handleAction = () => {
    // Internal state updates
    setGameState({ ... });
    
    // External notification
    onAction?.();
  };
  
  return <div>{/* component */}</div>;
}
```

### Future Enhancements

**Footer Improvements:**
- [ ] Add loading state during game switching
- [ ] Persist confirmation preference (localStorage)
- [ ] Add "Settings" button for user preferences
- [ ] Support custom button sets via children prop
- [ ] Add animation for button state changes

**Pattern Improvements:**
- [ ] Create component extraction checklist
- [ ] Document state manager integration patterns
- [ ] Add testing examples for hooked components
- [ ] Create generator for Phase 4 component boilerplate

### Related Documentation

- **lib/state-provider.tsx** - Phase 3 state manager implementation
- **CORE_ARCHITECTURE.md** - Component architecture patterns
- **CORE_DEVELOPMENT.md** - DRY principle and code standards
- **Issue #82** - Parent componentization epic

---

### Phase 5: Final Migration (Weeks 15-16)

**Goal:** Complete the migration and clean up

**Tasks:**
1. Migrate remaining small features
2. Remove deprecated code (e.g., snake draft)
3. Consolidate routing in Next.js
4. Performance audit and optimization
5. Update all documentation
6. Final testing

**Deliverables:**
- Fully modularized application
- Updated architecture documentation
- Performance comparison report
- Migration retrospective

**Success Criteria:**
- Zero monolith files remaining
- All features working
- Performance improved
- Documentation complete

---

### Risk Mitigation Strategies

#### 1. Feature Flags

Use feature flags to enable new components gradually:

```javascript
const USE_NEW_LEADERBOARD = process.env.NEXT_PUBLIC_NEW_LEADERBOARD === 'true';

if (USE_NEW_LEADERBOARD) {
    return <NewLeaderboard />;
} else {
    // Old monolith logic
}
```

#### 2. Parallel Implementation

Run old and new implementations side-by-side during migration:
- Old code stays functional
- New code can be tested in production
- Rollback is easy

#### 3. Incremental Testing

After each extraction:
- Run full regression test suite
- Manual QA on all user flows
- Performance benchmarks

#### 4. Versioned State

If changing state structure:
- Version the state object
- Implement migration functions
- Support backward compatibility

---

## Recent Completions Summary (November 2025)

### Priority 1.2: UI Utility Functions Module ✅

**Completed:** November 9, 2025  
**Status:** Partially migrated (React components complete, vanilla JS pending)

**Achievements:**
- ✅ Created `lib/ui-helpers.tsx` (262 lines)
- ✅ Migrated `pages/team/[session].tsx` (eliminated 74 duplicate lines)
- ✅ Provides both React (JSX) and DOM versions for flexibility
- ✅ TypeScript types and JSDoc documentation
- ⏳ `public/app.js` and `public/salary-cap-draft.js` still have duplicates (ES6 module limitation)

**Impact:**
- Single source of truth for UI utilities
- Eliminated React component duplication
- Foundation for future vanilla JS migration

**Next Steps:**
- Address vanilla JS integration during Phase 4 component migration
- Options: Compile to JS, convert to modules, or hybrid window globals approach

### Shared Footer Component with Session Awareness ✅

**Completed:** November 8-9, 2025  
**Status:** Fully implemented with session-aware features

**Achievements:**
- ✅ Created `components/Footer.tsx` (238 lines)
- ✅ Integrated Phase 3 state manager (useGameState, useSessionState, useCommissionerState)
- ✅ Session-aware buttons (Copy URL, Conditional Commissioner Mode, Smart Logout)
- ✅ Eliminated 110+ lines of duplication across 3 pages
- ✅ Demonstrates proper Phase 3 → Phase 4 integration pattern

**Impact:**
- DRY principle applied to footer across application
- Session-aware UX improvements
- Foundation for remaining Phase 4 component extractions
- Pattern established for future component migrations

**Next Steps:**
- Migrate remaining pages (`pages/index.js`, `pages/test-athlete-modal.tsx`)
- Continue Phase 4 component extractions following this pattern

---

## Appendices

### Appendix A: Duplicated Code Summary

**Functions duplicated between app.js and salary-cap-draft.js:**

1. **getRunnerSvg(gender)** - Lines: app.js:93, salary-cap-draft.js:9
2. **getTeamInitials(teamName)** - Lines: app.js:3135, salary-cap-draft.js:20
3. **createTeamAvatarSVG(teamName, size)** - Lines: app.js:3153, salary-cap-draft.js:40

**Status:** ✅ Extracted to `lib/ui-helpers.tsx` (React components migrated)  
**Remaining:** Vanilla JS files (app.js, salary-cap-draft.js) still have duplicates

---

### Appendix B: API Endpoint Inventory

| Endpoint | Method | Used By | Purpose |
|----------|--------|---------|---------|
| `/api/athletes` | GET | Multiple | Load athlete database |
| `/api/game-state` | GET | `loadGameState()` | Load game configuration |
| `/api/game-state` | POST | `saveGameState()` | Save game state |
| `/api/session/create` | POST | `handleTeamCreation()` | Create team session |
| `/api/session/verify` | POST | `verifyAndLoadSession()` | Verify session token |
| `/api/auth/totp/verify` | POST | `handleCommissionerTOTPLogin()` | Verify TOTP code |
| `/api/rankings` | GET | `hasPlayerSubmittedRankings()` | Check rankings |
| `/api/rankings` | POST | `handleSubmitRankings()` | Submit rankings |
| `/api/salary-cap-draft` | POST | `handleSubmitSalaryCapTeam()` | Submit roster |
| `/api/results` | GET | `fetchResultsCached()` | Fetch race results |
| `/api/results` | POST | `handleUpdateResults()` | Update results |
| `/api/scoring` | GET | `fetchScoringDetails()` | Fetch scoring data |
| `/api/add-athlete` | POST | `handleAddAthlete()` | Add new athlete |
| `/api/update-athlete` | POST | `handleSaveWorldAthleticsId()` | Update athlete |
| `/api/toggle-athlete-confirmation` | POST | `handleToggleAthleteConfirmation()` | Toggle confirmation |
| `/api/reset-game` | POST | `handleResetGame()` | Reset game state |
| `/api/load-demo-data` | POST | `handleLoadDemoData()` | Load demo data |

---

### Appendix C: Recommended Reading

**Related Documentation:**
- [CORE_ARCHITECTURE.md](CORE_ARCHITECTURE.md) - Current architecture overview
- [Issue #82](https://github.com/jessephus/marathon-majors-league/issues/82) - Parent componentization issue
- [CORE_DEVELOPMENT.md](CORE_DEVELOPMENT.md) - Development standards

**External Resources:**
- [Next.js Documentation](https://nextjs.org/docs) - Framework reference
- [React Patterns](https://reactpatterns.com/) - Component design patterns
- [Refactoring Guru](https://refactoring.guru/) - Refactoring techniques

---

## Conclusion

This audit reveals a **classic monolithic JavaScript application** with clear opportunities for modularization. The codebase is functional and well-structured for a SPA, but lacks the componentization needed for modern React/Next.js development.

### Key Takeaways

1. **State management is the biggest challenge** - 126+ global state accesses need refactoring
2. **Utility functions are quick wins** - Can be extracted immediately with low risk
3. **Component boundaries exist** - Draft, leaderboard, and commissioner features are natural components
4. **Incremental migration is essential** - Can't rewrite everything at once
5. **Testing is critical** - Need comprehensive tests before major refactoring

### Next Steps

1. Share this audit with the team for review
2. Prioritize extraction targets based on team capacity
3. Begin Phase 1 (utility extraction) immediately
4. Set up feature flags for gradual rollout
5. Create detailed technical specs for each component migration

---

**Document Version:** 1.0  
**Author:** GitHub Copilot  
**Review Status:** Pending team review  
**Next Review:** After Phase 1 completion
