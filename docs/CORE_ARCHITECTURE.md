# Technical Architecture Documentation

## Overview

Fantasy NY Marathon is built as a serverless web application optimized for simplicity, scalability, and real-time collaboration. The architecture prioritizes ease of deployment and maintenance while providing a robust fantasy sports experience.

## System Architecture

### High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Static Files  │    │  Serverless API │    │ Neon Postgres   │
│                 │    │                 │    │                 │
│  • index.html   │◄──►│  • athletes     │◄──►│  • athletes     │
│  • app.js       │    │  • game-state   │    │  • games        │
│  • style.css    │    │  • rankings     │    │  • rankings     │
│  • athletes.json│    │  • draft        │    │  • teams        │
│                 │    │  • results      │    │  • results      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                        │                        │
        └────────────────────────┼────────────────────────┘
                                 │
                    ┌─────────────────┐
                    │ Vercel Platform │
                    │                 │
                    │ • Edge Network  │
                    │ • Auto-scaling  │
                    │ • Global CDN    │
                    └─────────────────┘
```

## Technology Stack

### Frontend Stack
- **HTML5**: Semantic markup with accessibility considerations
- **CSS3**: Mobile-first responsive design with CSS Grid and Flexbox
- **JavaScript ES6+**: Modern vanilla JavaScript (no frameworks)
- **Progressive Enhancement**: Works without JavaScript for basic functionality

### Backend Stack
- **Vercel Serverless Functions**: Node.js runtime with ES modules
- **Neon Postgres**: Serverless PostgreSQL database
- **RESTful API Design**: Simple HTTP endpoints with JSON responses

### Infrastructure
- **Vercel Edge Network**: Global CDN with automatic scaling
- **Environment Variables**: Secure configuration management
- **HTTPS**: SSL/TLS encryption by default

## Data Architecture

### Storage Strategy
The application uses Neon Postgres, a serverless PostgreSQL database, with a relational table structure:

```
Neon Postgres Database:
├── athletes          (elite runner profiles with extended data)
├── races             (marathon events and competitions)
├── athlete_races     (athlete-race confirmations)
├── games             (game configuration and state)
├── player_rankings   (player athlete preferences) ⚠️ DEPRECATED
├── draft_teams       (post-draft team assignments) ⚠️ DEPRECATED
├── salary_cap_teams  (salary cap draft teams) ✅ ACTIVE
├── race_results      (race results and live updates)
├── users             (future: user accounts)
└── user_games        (future: user-game associations)
```

### Data Models

#### Athletes Table
```sql
CREATE TABLE athletes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    country CHAR(3) NOT NULL,
    gender VARCHAR(10) NOT NULL,
    personal_best VARCHAR(10) NOT NULL,
    headshot_url TEXT,
    world_athletics_id VARCHAR(50),
    world_athletics_profile_url TEXT,
    marathon_rank INTEGER,
    road_running_rank INTEGER,
    overall_rank INTEGER,
    age INTEGER,
    date_of_birth DATE,
    sponsor VARCHAR(255),
    season_best VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Races Table
```sql
CREATE TABLE races (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    location VARCHAR(255) NOT NULL,
    distance VARCHAR(50) DEFAULT 'Marathon (42.195 km)',
    event_type VARCHAR(100) DEFAULT 'Marathon Majors',
    world_athletics_event_id VARCHAR(50),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Athlete-Race Junction Table
```sql
CREATE TABLE athlete_races (
    id SERIAL PRIMARY KEY,
    athlete_id INTEGER NOT NULL REFERENCES athletes(id),
    race_id INTEGER NOT NULL REFERENCES races(id),
    bib_number VARCHAR(20),
    confirmed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(athlete_id, race_id)
);
```

#### Games Table
```sql
CREATE TABLE games (
    id SERIAL PRIMARY KEY,
    game_id VARCHAR(255) UNIQUE NOT NULL,
    players TEXT[] NOT NULL DEFAULT '{}',
    draft_complete BOOLEAN DEFAULT FALSE,
    results_finalized BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Player Rankings Table (DEPRECATED)
```sql
-- ⚠️ DEPRECATED: Part of legacy snake draft system
-- Use salary_cap_teams table for new games
CREATE TABLE player_rankings (
    id SERIAL PRIMARY KEY,
    game_id VARCHAR(255) NOT NULL,
    player_code VARCHAR(255) NOT NULL,
    gender VARCHAR(10) NOT NULL,
    athlete_id INTEGER NOT NULL REFERENCES athletes(id),
    rank_order INTEGER NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(game_id, player_code, gender, rank_order)
);
```

#### Draft Teams Table (DEPRECATED)
```sql
-- ⚠️ DEPRECATED: Part of legacy snake draft system
-- Use salary_cap_teams table for new games
CREATE TABLE draft_teams (
    id SERIAL PRIMARY KEY,
    game_id VARCHAR(255) NOT NULL,
    player_code VARCHAR(255) NOT NULL,
    athlete_id INTEGER NOT NULL REFERENCES athletes(id),
    drafted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(game_id, athlete_id)
);
```

#### Race Results Table
```sql
CREATE TABLE race_results (
    id SERIAL PRIMARY KEY,
    game_id VARCHAR(255) NOT NULL,
    athlete_id INTEGER NOT NULL REFERENCES athletes(id),
    finish_time VARCHAR(10),
    split_5k VARCHAR(10),
    split_10k VARCHAR(10),
    split_half VARCHAR(10),
    split_30k VARCHAR(10),
    split_35k VARCHAR(10),
    split_40k VARCHAR(10),
    is_final BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(game_id, athlete_id)
);
```

## API Architecture

### Endpoint Design
All API endpoints follow RESTful conventions with game isolation via query parameters:

| Endpoint | Methods | Purpose | Parameters |
|----------|---------|---------|------------|
| `/api/athletes` | GET | Retrieve elite athlete database with extended fields | None |
| `/api/races` | GET, POST | Race event management | `id`, `active`, `includeAthletes` |
| `/api/game-state` | GET, POST | Game configuration management | `gameId` |
| `/api/rankings` | GET, POST | Player rankings storage | `gameId`, `playerCode` |
| `/api/draft` | GET, POST | Snake draft execution | `gameId` |
| `/api/results` | GET, POST | Race results management | `gameId` |
| `/api/init-db` | GET, POST | Database initialization & seeding | None |
| `/api/session/delete` | POST | Suspend/reactivate team session | `sessionToken` (preferred) or `gameId` + `playerCode` (legacy) |
| `/api/session/hard-delete` | POST | Permanently delete team session | `sessionToken` (preferred) or `gameId` + `playerCode` (legacy) |

### Request/Response Patterns

#### Standard Success Response
```json
{
  "message": "Operation completed successfully",
  "data": { /* relevant data */ }
}
```

#### Error Response
```json
{
  "error": "Descriptive error message",
  "code": "ERROR_CODE",
  "details": { /* additional context */ }
}
```

### CORS Configuration
All endpoints include comprehensive CORS headers:
```javascript
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
```

### Session Management Endpoints

#### `/api/session/delete` - Suspend/Reactivate Team
Toggles a team's active status. Suspended teams remain in database but are hidden from UI.

**Request Parameters (choose one):**
- `sessionToken` (string, preferred) - Unique session token
- `gameId` + `playerCode` (strings, legacy) - Backward compatibility

**Request Example (sessionToken):**
```json
{
  "sessionToken": "5f8a9b2c-3d4e-5f6g-7h8i-9j0k1l2m3n4o"
}
```

**Request Example (legacy):**
```json
{
  "gameId": "default",
  "playerCode": "RUNNER"
}
```

**Response:**
```json
{
  "message": "Team suspended successfully",
  "sessionId": 42,
  "sessionToken": "5f8a9b2c-3d4e-5f6g-7h8i-9j0k1l2m3n4o",
  "playerCode": "RUNNER",
  "teamName": "Swift Runners",
  "isActive": false
}
```

#### `/api/session/hard-delete` - Permanently Delete Team
Permanently removes a team and all related data (CASCADE delete).

**Request Parameters (choose one):**
- `sessionToken` (string, preferred) - Unique session token
- `gameId` + `playerCode` (strings, legacy) - Backward compatibility

**Request Example:**
```json
{
  "sessionToken": "5f8a9b2c-3d4e-5f6g-7h8i-9j0k1l2m3n4o"
}
```

**Response:**
```json
{
  "message": "Team permanently deleted",
  "sessionId": 42,
  "playerCode": "RUNNER",
  "teamName": "Swift Runners",
  "deletedSessions": 1
}
```

**CASCADE Behavior:**
Deleting a session automatically removes related data from:
- `salary_cap_teams` (roster assignments)
- `draft_teams` (draft picks)
- `player_rankings` (preference rankings)

**Note:** Always prefer `sessionToken` over `playerCode` for team identification. The `sessionToken` is globally unique, while `playerCode` is user-chosen and only unique among active teams per game.

## Frontend Architecture

### Single Page Application Design
The frontend uses a page-based navigation system with JavaScript state management:

```javascript
// Core state object
let gameState = {
    athletes: { men: [], women: [] },
    players: [],
    currentPlayer: null,
    rankings: {},
    teams: {},
    results: {},
    draftComplete: false,
    resultsFinalized: false
};
```

### View Management
Page transitions are handled via the `showPage()` function:
```javascript
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => 
        page.classList.remove('active')
    );
    document.getElementById(pageId).classList.add('active');
}
```

### Event-Driven Architecture
The application uses event listeners for user interactions:
- Form submissions
- Drag and drop operations
- Real-time result updates
- Commissioner actions

## Security Architecture

### Authentication Model (Post-Migration 003)

The application supports both legacy and modern authentication:

#### Legacy System (Backward Compatible)
- **Team codes**: Simple code-based player identification
- **Commissioner password**: Single password ("kipchoge") for admin functions
- **Game isolation**: Separate data namespaces prevent cross-game access

#### Modern User Account System (New)
- **Multi-factor authentication**: TOTP, SMS OTP, and Magic Links
- **Email-based accounts**: Primary identifier with optional phone number
- **Session management**: Secure token-based authentication
- **Role-based access**: Commissioner, player, and spectator roles
- **Invite system**: Admin-controlled account creation for preview phase

### Authentication Methods

#### 1. TOTP (Time-Based One-Time Password)
- **Setup**: User scans QR code with Google Authenticator or similar app
- **Login**: User enters 6-digit code from authenticator app
- **Backup**: 5-10 recovery codes generated for lost access
- **Storage**: TOTP secrets encrypted at application layer
- **Standard**: RFC 6238 compliant

#### 2. SMS One-Time Password
- **Delivery**: 6-digit code sent via SMS (Twilio integration)
- **Expiration**: 5-minute validity window
- **Rate limiting**: Prevents abuse with attempt tracking
- **Fallback**: Available when TOTP is unavailable

#### 3. Magic Links (Email)
- **Delivery**: Secure token sent via email
- **Expiration**: 15-minute validity window
- **Purposes**: Login, email verification, TOTP reset, invitations
- **Security**: Cryptographically secure random tokens (256-bit)

### User Account Architecture

```
User Account Structure:
├── users (core account)
│   ├── email (primary identifier)
│   ├── phone_number (optional, for SMS OTP)
│   ├── totp_secret (encrypted)
│   ├── verification status
│   └── admin/staff flags
├── user_profiles (extended information)
│   ├── avatar, bio, location
│   ├── preferred auth method
│   └── notification preferences
├── Authentication Tokens
│   ├── one_time_passwords (SMS/email OTPs)
│   ├── magic_links (passwordless auth)
│   ├── totp_backup_codes (recovery)
│   └── user_sessions (active sessions)
└── League Associations
    └── user_games (membership, roles, teams)
```

### League Permission Model

#### Roles
1. **Commissioner**
   - Create and manage league
   - Invite players
   - Execute draft
   - Enter results
   - Finalize games

2. **Player**
   - Submit rankings
   - View team
   - Track results
   - Customize team name/sponsor

3. **Spectator**
   - View league standings
   - Follow live results
   - No team ownership

### Invite System (Preview Phase)

During initial rollout, new account creation requires an invite code:

```
Invite Flow:
1. Admin creates invite code
2. Code shared with prospective user
3. User registers with invite code
4. Code usage tracked and incremented
5. Account created with normal permissions
```

**Invite Code Types:**
- **Admin codes**: Created by super admin, single or multi-use
- **League codes**: Generated when creating a league (future)
- **Friend codes**: User-generated referral codes (future)

### Data Security

- **Encryption**: TOTP secrets encrypted at application layer (AES-256)
- **Hashing**: Backup codes hashed with bcrypt (cost factor 12)
- **Tokens**: Cryptographically secure random generation (crypto.randomBytes)
- **HTTPS**: All data in transit encrypted with TLS 1.3
- **SQL injection**: Prevented via parameterized queries
- **Session security**: Secure, httpOnly cookies with SameSite=Strict

### Audit and Compliance

#### Audit Logging
All authentication events are logged:
- Login attempts (success/failure)
- Token generation and usage
- Account modifications
- Permission changes
- Session creation/revocation

#### Stored Information
- User ID and action
- Resource type and ID
- IP address and user agent
- Timestamp and details (JSONB)

### Security Trade-offs

The application balances security with usability:

1. **No passwords**: Reduces attack surface (no password breaches)
2. **Multiple auth methods**: Accommodates different user preferences
3. **Soft deletes**: Preserves audit trail while removing access
4. **Session expiry**: 30-day default with activity tracking
5. **Rate limiting**: Application layer protection (not database)

## Performance Architecture

### Frontend Optimization
- **No build step**: Direct deployment of source files
- **Minimal dependencies**: Only @vercel/blob on backend
- **CSS custom properties**: Efficient theming system
- **Mobile-first design**: Optimized for primary use case

### Backend Optimization
- **Serverless functions**: Automatic scaling and cold start optimization
- **Edge deployment**: Global distribution via Vercel Edge Network
- **PostgreSQL indexing**: Optimized queries with strategic indexes
- **Connection pooling**: Efficient database connections via Neon
- **Stateless design**: Each function call is independent

### Caching Strategy
- **Static asset caching**: Automatic CDN caching for HTML/CSS/JS
- **API response caching**: Minimal caching due to real-time requirements
- **Browser caching**: Leverages standard HTTP caching headers

## Deployment Architecture

### Build Process
The application requires no build step:
1. **Static files**: Served directly from repository root
2. **Serverless functions**: Auto-deployed from `/api/` directory
3. **Environment variables**: Managed via Vercel dashboard
4. **Database provisioning**: Neon Postgres via Vercel integration
5. **Schema initialization**: Run `schema.sql` via Neon console or CLI

### Environment Configuration
- **Development**: `vercel dev` for local development
- **Preview**: Automatic preview deployments for pull requests
- **Production**: `vercel --prod` or GitHub integration

### Monitoring and Observability
- **Function logs**: Available in Vercel dashboard
- **Error tracking**: Console.error() outputs to Vercel logs
- **Performance metrics**: Built-in Vercel analytics
- **Database metrics**: Neon console for query performance and storage

## Scalability Considerations

### Current Limitations
- **Single game focus**: Designed for one active marathon event
- **Friend group size**: Optimized for 2-4 players
- **Concurrent games**: Limited by simple gameId system

### Scaling Strategies
If the application needs to scale:
1. **Multi-tenant architecture**: Enhanced gameId management with better indexing
2. **Database optimization**: Query optimization, materialized views for leaderboards
3. **Real-time updates**: WebSocket integration for live updates
4. **CDN optimization**: Asset optimization and compression
5. **Read replicas**: Neon read replicas for high-traffic scenarios

## Network Architecture

### Request Flow
```
Client Browser → Vercel Edge Network → Serverless Function → Blob Storage
     ↑                    ↓                      ↓              ↓
Static Files ←─── CDN ←──────────────────────────┘              ↓
     ↑                                                          ↓
JSON Response ←─────────────────────────────────────────────────┘
```

### Error Handling
- **Network failures**: Graceful degradation with user feedback
- **Storage errors**: Fallback to default states
- **Function timeouts**: 10-second default with retry logic
- **CORS issues**: Comprehensive header configuration

## Development Architecture

### Code Organization
```
Project Root
├── Frontend Assets
│   ├── index.html          # Main application entry
│   ├── app.js             # Core application logic (legacy)
│   ├── style.css          # Complete styling
│   └── athletes.json      # Athletes backup (seeded into DB)
├── API Functions
│   ├── db.js              # PostgreSQL database helpers
│   ├── athletes.js        # Athlete data endpoint
│   ├── game-state.js      # Game management
│   ├── rankings.js        # Player rankings
│   ├── draft.js          # Snake draft logic
│   ├── results.js        # Race results
│   └── init-db.js        # Database initialization
├── Shared Utilities (Phase 1 - Nov 2025)
│   ├── utils/
│   │   └── formatting.js  # Pure formatting functions (time, pace, ordinals, XSS)
│   ├── config/
│   │   └── constants.js   # Centralized configuration constants
│   └── lib/
│       ├── ui-helpers.tsx # UI utility functions (avatars, headshots, flags)
│       ├── budget-utils.js # Salary cap budget calculations
│       └── state-provider.tsx # Phase 3 state management
├── React Components (Phase 4)
│   └── components/
│       ├── Footer.tsx     # Shared footer with session-aware buttons
│       ├── AthleteModal.tsx # Athlete detail modal
│       ├── LeaderboardTable.tsx # Leaderboard display
│       └── ...           # Additional components
├── Feature Modules (Phase 1)
│   └── src/features/
│       └── draft/
│           ├── validation.js # Pure validation functions
│           └── state-machine.js # Draft state management
├── Configuration
│   ├── package.json       # Dependencies and scripts
│   ├── vercel.json       # Deployment configuration
│   ├── schema.sql        # Database schema
│   └── .vercelignore     # Deployment exclusions
├── Tests
│   ├── formatting-utils.test.js # Formatting utilities tests (81 tests)
│   ├── budget-utils.test.js    # Budget calculation tests
│   └── ...                     # Additional test files
└── Documentation
    ├── README.md          # Project overview
    ├── NEON_SETUP.md     # Database setup guide
    └── docs/             # Additional documentation
```

### Modularization Progress (Issue #82)

**Phase 1: Utilities & Constants** ✅ **COMPLETED (Nov 2025)**
- ✅ Extracted formatting utilities to `utils/formatting.js` (10 pure functions)
- ✅ Centralized constants in `config/constants.js` (session keys, TTLs, scoring config)
- ✅ Created unit tests with 100% coverage (81 tests, all passing)
- ✅ UI helpers already extracted to `lib/ui-helpers.tsx`
- ✅ Draft validation already in `src/features/draft/validation.js`

**Phase 3: State Management** ✅ **COMPLETED (Earlier)**
- ✅ Created `lib/state-provider.tsx` with React Context-based state management
- ✅ Replaced global `gameState` object with centralized state manager

**Phase 4: Component Extraction** 🚧 **IN PROGRESS**
- ✅ Footer component created in `components/Footer.tsx`
- ✅ Athlete modal, leaderboard table, budget tracker components created
- ⏳ Additional component extractions ongoing

**Remaining Work:**
- Update `app.js` to import from new utility modules (vanilla JS compatibility needed)
- Continue Phase 4 component extractions (commissioner dashboard, salary cap draft)
- Phase 5: Final migration and cleanup

### Testing Strategy
- **Manual testing**: Multi-browser, multi-device validation
- **Integration testing**: Complete game flow verification
- **Performance testing**: Mobile device and slow network testing
- **Security testing**: CORS and data isolation verification

This architecture provides a robust foundation for the Fantasy NY Marathon application while maintaining the simplicity and ease of deployment that are core to the project's design philosophy.