# Changelog

All notable changes to the Fantasy NY Marathon project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
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

### Changed
- Results API now auto-triggers scoring calculation
- Team cards enhanced with points display alongside legacy time display
- Leaderboard prioritizes points-based standings with fallback

### Technical
- Scoring engine module with modular calculation functions
- Database helper functions for scoring rules and standings
- Version 2 scoring rules with configurable parameters
- Tie handling using standard competition ranking
- Record detection and provisional workflow
- Breakdown JSON schema for transparent scoring

### Fixed
- `/api/results` now tolerates legacy payloads and stores expanded scoring data, and `race_results` schema is auto-migrated to include all scoring columns.
- Fixed a regression where fantasy standings and team detail cards always showed 0 pts by auto-triggering the points engine on results/standings fetches and enriching responses with athlete metadata so every recorded finisher appears in Race Results.

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
The Fantasy NY Marathon project evolved from a simple proof-of-concept to a fully-featured fantasy sports application:

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

We welcome contributions to the Fantasy NY Marathon project! Please see our [Development Guide](DEVELOPMENT.md) for detailed information on:

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

*This changelog is maintained to help users understand the evolution of the Fantasy NY Marathon project and to assist developers in understanding the codebase history.*