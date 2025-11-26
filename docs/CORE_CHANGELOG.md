# Changelog

All notable changes to the Marathon Majors Fantasy League project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Athletes Page Infinite Scroll** (November 25, 2025)
  - Implemented client-side lazy loading on `/athletes` using IntersectionObserver
  - Initial render limits to 40 cards; loads +30 per scroll near bottom
  - Improves performance for long athlete lists on mobile and desktop
  - Automatically resets visible count when filters change (search, gender, country, confirmation status)
  - Shows "X of Y athletes" count and "All athletes loaded" message when fully scrolled
  - File: `pages/athletes/index.tsx`
- **Bulk Athlete Confirmation Tool** (November 24, 2025)
  - Commissioner script for bulk confirming athletes from CSV/JSON files
  - Intelligent name matching with fuzzy logic (Levenshtein distance algorithm)
  - Automatic creation of new athletes not found in database
  - World Athletics data enrichment for new athletes (profile, rankings, PB)
  - Support for both CSV and JSON input formats
  - Dry-run mode for previewing changes before committing
  - Comprehensive reporting (matched, created, ambiguous, failed athletes)
  - Example input files in `scripts/examples/`
  - Full documentation in `scripts/README.md`
  - Location: `scripts/bulk-confirm-athletes.js`

- **Race Management System** (November 20, 2025)
  - Complete CRUD operations for race events via `/api/races` endpoint
  - Race Management Panel in commissioner dashboard for managing races
  - Public race detail page (`/race?id=X`) to display race information
  - Race news feed system for curated news items
    - New `race_news` database table with headline, description, article URL, image URL
    - `/api/race-news` endpoint for managing news items (GET, POST, PUT, DELETE)
    - Support for display ordering and visibility control
    - Published date tracking for news chronology
  - Database helper functions in `db.js`:
    - `getAllRaces()`, `getActiveRaces()`, `getRaceById()`
    - `createRace()`, `updateRace()`, `deleteRace()`
    - `getRaceNews()`, `createRaceNews()`, `updateRaceNews()`, `deleteRaceNews()`
  - API client methods in `lib/api-client.ts`:
    - `apiClient.races.list/create/update/delete`
    - `apiClient.raceNews.list/get/create/update/delete`
  - Dynamic import for Race Management Panel with performance tracking
  - Migration script `012_add_race_news_table.sql` for news feed feature

### Changed
- **Documentation Organization** (November 19, 2025)
  - Cleaned up docs folder by removing 6 temporary PROCESS documents (1,717 lines)
  - Removed completed summaries: PROCESS_CLEANUP_SUMMARY, PROCESS_CONSOLIDATION_PLAN, PROCESS_DRAFT_FEATURE_EXTRACTION, PROCESS_EDITABLE_WA_ID_FEATURE, PROCESS_MONOLITH_CLEANUP_SUMMARY, PROCESS_UTILITY_EXTRACTION
  - Retained 8 important PROCESS docs: AUTH_PHASE_1_SUMMARY, AUTH_PHASE_2_SUMMARY, CONSOLIDATION_RECOVERY, DOCS_HEALTH_CHECK, MONOLITH_AUDIT, PHASE4_PERFORMANCE_REPORT, ROUTING_PHASE1, TECH_DEBT
  - Moved migrations/PHASE_1_SUMMARY.md to docs/PROCESS_AUTH_PHASE_1_SUMMARY.md
  - Updated docs/README.md with accurate category counts (34 total docs)
  - Updated .github/copilot-instructions.md with current documentation structure
  - Fixed all broken references to removed documents
  - Documentation now organized into 5 categories: CORE (5), TECH (10), FEATURE (9), PROCESS (8), SETUP (1)

### Deprecated
- **Snake Draft and Player Rankings System** (November 11, 2025)
  - Season League mode with ranking + snake draft is now deprecated
  - Added deprecation notices to all snake draft and player rankings code
  - Marked `player_rankings` and `draft_teams` database tables as deprecated
  - Updated documentation to reflect that Salary Cap Draft is now the primary mode
  - Legacy snake draft functionality maintained only for backward compatibility
  - All new games should use Single Race mode with Salary Cap Draft
  - Files affected:
    - `public/app.js` - Snake draft functions marked deprecated
    - `pages/api/rankings.js` - Rankings API marked deprecated
    - `pages/api/draft.js` - Draft API marked deprecated
    - `pages/api/db.js` - Database helper functions marked deprecated
    - `schema.sql` - Database tables marked deprecated
    - `pages/index.js` - UI elements marked deprecated
    - `docs/FEATURE_GAME_MODES.md` - Season League mode marked deprecated
    - `docs/CORE_ARCHITECTURE.md` - Database tables marked deprecated

### Added
- **Commissioner Dashboard Modularization**: Separated admin panel into dynamic, loadable components
  - Created three panel components: `ResultsManagementPanel`, `AthleteManagementPanel`, `TeamsOverviewPanel`
  - Implemented dynamic imports with `next/dynamic` for on-demand loading
  - Added skeleton loaders for loading states
  - Integrated state events system: `resultsUpdated`, `athleteUpdated`
  - Automatic cache invalidation when results are updated
  - All panels use centralized API client (no raw fetch calls)
  - Comprehensive test suite for admin flows and cache invalidation
  - Documentation: `docs/FEATURE_COMMISSIONER_PANELS.md`
  - Added `roster_lock_time` field to games table
  - Frontend checks lock time and prevents edits after deadline
  - UI displays lock time with countdown before deadline
  - Lock time set to 8:35 AM EST on November 2, 2025 for default game
  - Migration script `005_roster_lock_time.sql` to add field
  - Migration runner `run-roster-lock-migration.js` to apply changes
  - Documentation in `docs/ROSTER_LOCK_TIME.md`
- **Points-Based Scoring System (Version 2)**: Complete overhaul of scoring mechanics
  - Placement points for top 10 finishers (10 pts for 1st down to 1 pt for 10th)
  - Time gap bonuses (5 levels: +5 pts within 60s down to +1 pt within 10 min)
  - Performance bonuses: Negative Split (+2), Even Pace (+1), Fast Finish Kick (+1)
  - Record bonuses: World Record (+15), Course Record (+5)
  - Provisional record workflow with confirmation/rejection
  - Detailed points breakdown modal for each athlete
  - Points-based leaderboard with comprehensive team statistics
- Database schema enhancements for scoring
  - New `scoring_rules` table with versioned configuration
  - New `league_standings` table for cached leaderboard
  - New `records_audit` table for record status tracking
  - New `race_records` table for course and world records
  - Enhanced `race_results` with placement, points, splits, and breakdown data
- API endpoints for scoring system
  - `/api/scoring` for calculation and record management
  - `/api/standings` for leaderboard with caching
  - Auto-scoring on result entry
- Frontend UI enhancements
  - Points breakdown tooltips and modal displays
  - Record badges (WR/CR) with provisional indicators
  - Enhanced team cards showing total points and rankings
  - Responsive points leaderboard table
  - Fallback to legacy time-based display for compatibility
- Comprehensive documentation for points scoring system
- Migration script with utility functions and seeded records
- **Roster Lock Timer**: Automatic roster locking at race time
  - Added `roster_lock_time` field to games table
  - Frontend checks lock time and prevents edits after deadline
  - UI displays lock time with countdown before deadline
  - Lock time set to 8:35 AM EST on November 2, 2025 for default game
  - Migration script `005_roster_lock_time.sql` to add field
  - Migration runner `run-roster-lock-migration.js` to apply changes
  - Documentation in `docs/ROSTER_LOCK_TIME.md`

### Changed
- Game state API now includes `rosterLockTime` field
- Salary cap draft page checks roster lock time on load
- Results API now auto-triggers scoring calculation
- Team cards enhanced with points display alongside legacy time display
- Leaderboard prioritizes points-based standings with fallback

### Removed
- **Deprecated `/landing` route** (November 9, 2025)
  - Removed experimental `pages/landing.tsx` stub page
  - Primary landing page is now `/` (pages/index.js) with full SSR support
  - Updated documentation in PROCESS_ROUTING_PHASE1.md to reflect current routes

### Technical
- Database helper functions updated for roster lock time
- Roster lock logic integrated with existing permanent lock mechanism
- Scoring engine module with modular calculation functions
- Database helper functions for scoring rules and standings
- Version 2 scoring rules with configurable parameters
- Tie handling using standard competition ranking
- Record detection and provisional workflow
- Breakdown JSON schema for transparent scoring

### Fixed
- `/api/results` now tolerates legacy payloads and stores expanded scoring data, and `race_results` schema is auto-migrated to include all scoring columns.
- Fixed a regression where fantasy standings and team detail cards always showed 0 pts by auto-triggering the points engine on results/standings fetches and enriching responses with athlete metadata so every recorded finisher appears in Race Results.
- **Infinite Refresh Loop with Feature Flag Toggle**: Fixed issue where toggling `NEXT_PUBLIC_USE_NEW_WELCOME_CARD` environment variable caused infinite page refresh with "Cannot read properties of null" error. Solution: Conditionally load `app.js` only when feature flag is OFF (legacy mode) since it expects specific DOM structure. Added guard clause in `app.js` for defense-in-depth protection. Files affected: `pages/index.js`, `public/app.js`.

### Technical Implementation Notes

#### Sub-Second Precision (Migration 007)
**Problem:** Two runners finishing within 30ms (e.g., 2:05:30.06 vs 2:05:30.09) were recorded as ties due to whole-second precision.

**Solution:** 
- Expanded all time columns from `VARCHAR(10)` to `VARCHAR(13)` in database
- Updated regex patterns to accept optional decimal seconds: `/^[0-9]{1,2}:[0-9]{2}:[0-9]{2}(\.[0-9]{1,3})?$/`
- Modified `timeToSeconds()` to use `parseFloat()` instead of `parseInt()` for seconds component
- Supports formats: `2:05:30` (backward compatible), `2:05:30.1`, `2:05:30.12`, `2:05:30.123`

**Files affected:** `migrations/007_add_subsecond_precision.sql`, `public/app.js` (lines ~1975, 2160, 3390, 3415, 3798, 3810), `schema.sql`

#### Session-Based Team Identification (Migration 010)
**Problem:** Teams were identified by `playerCode` (user-chosen string) which is not globally unique. The `unique_active_game_player` constraint only ensures uniqueness among ACTIVE teams per game. Multiple suspended teams could share the same `playerCode`, causing ambiguity in delete/suspend operations.

**Solution:**
- Added `session_id INTEGER` foreign key column to three team tables: `salary_cap_teams`, `draft_teams`, `player_rankings`
- All foreign keys reference `anonymous_sessions(id)` with `ON DELETE CASCADE`
- Created indexes `idx_*_session_id` on all three tables for performance
- Backfilled 192 existing rows by matching `(game_id, player_code)` composite
- Cleaned up 6 orphaned rows from deleted test game sessions

**API Changes:**
- `/api/session/delete` and `/api/session/hard-delete` now accept `sessionToken` (preferred) or `(gameId + playerCode)` (legacy backward compatibility)
- Both endpoints query by `sessionToken` when provided, fall back to `playerCode` composite
- Hard-delete simplified: only deletes from `anonymous_sessions`, CASCADE handles child table cleanup

**Frontend Changes:**
- `TeamsOverviewPanel.tsx` handlers updated to pass `sessionToken` instead of `playerCode`
- All team operations now use unique session identifier for reliable targeting

**Benefits:**
- Referential integrity: Deleting session automatically removes all related team data
- Unique identification: Each team has globally unique `session_id` and `session_token`
- Data cleanup: CASCADE prevents orphaned roster data
- Backward compatible: Legacy `playerCode` method still works during transition

**Files affected:** `migrations/010_add_session_id_foreign_keys.sql`, `pages/api/session/delete.js`, `pages/api/session/hard-delete.js`, `components/commissioner/TeamsOverviewPanel.tsx`

#### World Athletics Scraping Limitations (Playwright)
**Findings from automation attempts:**

**What works:**
- ✅ Progression data (all years) extracted in 1 HTTP request without browser automation
- ✅ Current year race results with Playwright (single page load)

**What doesn't work:**
- ❌ Multi-year race results navigation (World Athletics actively blocks automation)
- ❌ Symptoms: `ERR_ABORTED`, "Target page closed", cross-session tracking
- ❌ Detection methods: Post-load detection, IP-based tracking, rate limiting

**Technical details:**
- Correct URL format: `https://worldathletics.org/athletes/{country}/{firstname}-{lastname}-{id}`
- Uses stealth settings: `--disable-blink-features=AutomationControlled`, custom user agent, navigator.webdriver override
- Key limitation: Year selection is client-side only, no URL parameters available
- Site closes page after detecting automation, even in fresh browser contexts

**Recommendation:** Accept current limitation - extract progression data (all years) and current year race results only. Historical race results require manual collection.

## [Previous Releases]

### Added
- Comprehensive documentation overhaul with dedicated architecture documentation
- GitHub Copilot repository instructions for enhanced AI assistance
- User guide with detailed player and commissioner instructions
- Development guide for contributors and maintainers
- Changelog for tracking project evolution

### Changed
- Restructured technical documentation into dedicated ARCHITECTURE.md
- Updated README.md to be more user-focused and engaging
- Enhanced copilot instructions to reference external documentation

## [2.0.0] - 2025-01-XX (Database Migration Release)

### Added
- Live results update system with real-time standings
- Split timing support (5K, 10K, half-marathon, etc.)
- Auto-save functionality for commissioner result entry
- Medal emoji system for team rankings (🥇🥈🥉)
- Results finalization with winner declaration
- Live standings display with average finish times
- Reset results functionality while preserving teams

### Changed
- **BREAKING**: Migrated from Vercel Postgres to Vercel Blob Storage
- Simplified storage architecture with JSON file-based system
- Enhanced team cards with live ranking display
- Improved button state management for commissioner controls
- Updated API endpoints to use centralized storage helpers

### Technical Changes
- Added `resultsFinalized` flag to game state
- New `storage.js` module for centralized Blob operations
- Enhanced error handling across all API endpoints
- Simplified deployment process (no database initialization required)

### Removed
- Postgres database dependency and related SQL queries
- Complex database schema and table management
- `@vercel/postgres` dependency

## [1.0.0] - 2024-XX-XX (Initial Release)

### Added
- Core fantasy marathon game functionality
- Player code-based authentication system
- Commissioner dashboard for game management
- Snake draft algorithm for fair team distribution
- Drag-and-drop athlete ranking interface
- Mobile-first responsive design
- Real-time game state synchronization
- Elite athlete database (33 men, 25 women)
- Multi-player support (2-4 players)

### Features
- **Game Setup**: Commissioner can generate player codes and manage games
- **Player Rankings**: Drag-and-drop interface for ranking top 10 athletes per gender
- **Snake Draft**: Automated fair draft system resulting in 3 men + 3 women per team
- **Results Entry**: Commissioner interface for entering race results
- **Winner Calculation**: Automatic determination of winning team based on combined finish times
- **Mobile Optimization**: Fully responsive design optimized for phone usage during race watching

### Technical Implementation
- **Frontend**: Vanilla HTML, CSS, JavaScript (no build step)
- **Backend**: Vercel Serverless Functions with Node.js
- **Database**: Vercel Postgres with JSONB fields
- **Hosting**: Vercel Edge Network with global CDN
- **Authentication**: Simple player code system

### Security Features
- Commissioner password protection ("kipchoge")
- Game isolation through unique game IDs
- CORS-enabled API endpoints
- Public blob access for simplicity

### Performance Features
- Single-page application with view switching
- Minimal external dependencies
- CSS custom properties for efficient theming
- Serverless auto-scaling backend

## Migration Notes

### From v1.0 to v2.0 (Database Migration)
This major version introduced significant changes to the data storage system:

**Before (Postgres)**:
- Complex SQL queries and table relationships
- JSONB fields for storing rankings and team data
- Required database initialization and schema management

**After (Blob Storage)**:
- Simple JSON file storage with direct fetch operations
- Namespace isolation using gameId prefixes
- No database initialization required

**Data Migration**:
- Existing deployments will start with empty data after upgrade
- No automatic migration path due to storage architecture changes
- Users need to re-enter game data after upgrading

**Breaking Changes**:
- API response formats remain the same (backward compatible frontend)
- Environment variable changes (POSTGRES_URL → BLOB_READ_WRITE_TOKEN)
- Deployment process simplified (no database provisioning step)

### Benefits of Migration
1. **Simplified Development**: No SQL complexity, just JSON operations
2. **Easier Debugging**: Direct file access in Vercel dashboard
3. **Reduced Dependencies**: Removed @vercel/postgres dependency
4. **Better Fit**: Data was already JSON in Postgres JSONB fields
5. **Cost Effective**: Blob storage included in Vercel Hobby plan
6. **No Setup Required**: Automatic storage provisioning

## Development History

### Project Evolution
The Marathon Majors Fantasy League project evolved from a simple proof-of-concept to a fully-featured fantasy sports application:

1. **Initial Concept**: Basic athlete selection and team formation
2. **Draft System**: Implementation of fair snake draft algorithm
3. **Real-time Features**: Live result tracking and standings
4. **Mobile Optimization**: Touch-friendly interface for race day usage
5. **Documentation**: Comprehensive guides for users and developers

### Architecture Decisions

#### Storage Evolution
- **v1.0**: Chose Postgres for structured data and ACID compliance
- **v2.0**: Migrated to Blob Storage for simplicity and better fit with JSON data model

#### Frontend Simplicity
- **Decision**: No build tools or frameworks
- **Rationale**: Simplicity, fast deployment, minimal dependencies
- **Result**: Direct file deployment with excellent performance

#### Authentication Model
- **Decision**: Player codes instead of user accounts
- **Rationale**: Casual friend-to-friend use case doesn't need complex auth
- **Result**: Zero-friction user experience with adequate security

#### Mobile-First Design
- **Decision**: Optimize for phone usage during marathon watching
- **Rationale**: Primary use case is following race on mobile device
- **Result**: Excellent mobile experience with responsive design

### Future Roadmap

#### Short Term (Next Release)
- [ ] WebSocket integration for real-time updates without refresh
- [ ] Enhanced error handling and offline support
- [ ] Performance optimizations for mobile devices
- [ ] Additional athlete data fields (age, sponsor, world ranking)

#### Medium Term
- [ ] Multi-marathon support with historical data
- [ ] Advanced analytics and performance tracking
- [ ] Social features (comments, reactions)
- [ ] Push notification system

#### Long Term
- [ ] Mobile app versions (iOS/Android)
- [ ] Integration with official race timing systems
- [ ] Spectator features for following runners on course
- [ ] Tournament system for multiple events

## Contributing

We welcome contributions to the Marathon Majors Fantasy League project! Please see our [Development Guide](DEVELOPMENT.md) for detailed information on:

- Development environment setup
- Code standards and conventions
- Testing procedures
- Pull request process

### Contributor Recognition

Special thanks to all contributors who have helped shape this project:
- Initial development and architecture design
- Database migration and performance improvements
- Documentation and user experience enhancements
- Testing and quality assurance

## Support

For questions, issues, or suggestions:
- Check the [User Guide](USER_GUIDE.md) for usage questions
- Review [Deployment Guide](DEPLOYMENT.md) for setup issues
- Consult [Development Guide](DEVELOPMENT.md) for technical questions
- Open an issue on GitHub for bug reports or feature requests

---

*This changelog is maintained to help users understand the evolution of the Marathon Majors Fantasy League project and to assist developers in understanding the codebase history.*