# Technical Architecture Documentation

## Overview

Marathon Majors Fantasy League is built as a serverless web application optimized for simplicity, scalability, and real-time collaboration. The architecture prioritizes ease of deployment and maintenance while providing a robust fantasy sports experience.

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

## Game and Race State Management

### Conceptual Model

**Games** and **Races** are separate but related entities:

- **Race**: A physical marathon event (e.g., "2025 NYC Marathon", "2025 Valencia Marathon")
  - Stored in `races` table
  - Has a unique ID, date, location, and list of confirmed athletes
  - Exists independently of any fantasy game
  - Multiple races can exist simultaneously in the database

- **Game**: A fantasy league competition context
  - Stored in `games` table with unique `game_id` (e.g., "default", "valencia-2025")
  - Contains league configuration (players, draft status, results)
  - Has an `active_race_id` field pointing to which race the game is tracking
  - Multiple games can track the same race (e.g., different friend groups for NYC Marathon)

**Relationship**: Games reference Races via `active_race_id` foreign key. One race can have many games, but each game tracks only one active race at a time.

### State Management Architecture

#### 1. Server-Side State (Source of Truth)

**Games Table Schema:**
```sql
CREATE TABLE games (
    id SERIAL PRIMARY KEY,
    game_id VARCHAR(255) UNIQUE NOT NULL,
    active_race_id INTEGER REFERENCES races(id),  -- Which race this game is tracking
    players TEXT[] NOT NULL DEFAULT '{}',
    draft_complete BOOLEAN DEFAULT FALSE,
    results_finalized BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Key Points:**
- `active_race_id` determines which race the game is currently tracking
- Commissioner can switch `active_race_id` to track different races
- All game-specific data (teams, results) is isolated by `game_id`

#### 2. Cookie-Based Game Context

**Primary Cookie:** `current_game_id`
- **Purpose**: Persists which game the user is currently viewing
- **Scope**: Browser-wide, shared across all tabs
- **Set By**: Commissioner via game switcher in footer
- **Default**: Falls back to `DEFAULT_GAME_ID` constant if not set
- **Security**: HttpOnly=false (needs client-side access), SameSite=Lax

**Usage Pattern:**
```javascript
// Server-side (API routes, getServerSideProps)
const gameId = context.req.cookies.current_game_id || DEFAULT_GAME_ID;

// Client-side
const gameId = getCookie('current_game_id') || DEFAULT_GAME_ID;
```

#### 3. Server-Side Rendering (SSR) Strategy

**Problem Solved:** Eliminates client-side waterfall delays (e.g., 5-second "race not found" warnings)

**Implementation Pattern:**
```typescript
// Example: /pages/race.tsx
export async function getServerSideProps(context: GetServerSidePropsContext) {
  // 1. Read game context from cookie
  const gameId = context.req.cookies.current_game_id || DEFAULT_GAME_ID;
  
  // 2. Fetch game state server-side (includes active_race_id)
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const response = await fetch(`${baseUrl}/api/game-state?gameId=${gameId}`);
  const gameState = await response.json();
  
  // 3. Pass critical data as props (available immediately on mount)
  return {
    props: {
      initialGameId: gameId,
      initialActiveRaceId: gameState.activeRaceId || null,
      // ... other initial data
    },
  };
}
```

**Benefits:**
- ✅ No client-side API calls needed on mount
- ✅ Data available immediately (no loading delay)
- ✅ Eliminates race conditions and "waiting for state" issues
- ✅ Better perceived performance (~5 seconds faster)

**Pages Using SSR for Game State:**
- `/pages/race.tsx` - Fetches game state to get active_race_id
- `/pages/athletes/index.tsx` - Fetches game ID for athlete filtering
- Other pages should follow this pattern when depending on game context

#### 4. Client-Side State Management

**GameStateManager Context** (`lib/state-manager.ts`):
- Centralized React Context for managing game state
- Hydrated with SSR props on mount
- Provides `useGameState()` hook for components
- Handles state updates and persistence

**Usage:**
```typescript
// Component receives SSR props
export default function RacePage({ initialActiveRaceId }: RacePageProps) {
  const { gameState, setGameState } = useGameState();
  
  // Initialize state with SSR data (eliminates wait)
  useEffect(() => {
    if (initialActiveRaceId) {
      setGameState({ activeRaceId: initialActiveRaceId });
    }
  }, [initialActiveRaceId]);
  
  // Use SSR prop immediately (no client fetch needed)
  useEffect(() => {
    const activeRaceId = initialActiveRaceId || gameState.activeRaceId;
    if (activeRaceId) {
      loadRaceDetails(activeRaceId);
    }
  }, [initialActiveRaceId]);
}
```

### Commissioner vs Regular User Behavior

#### Commissioner Privileges
- **Can switch games** via game switcher dropdown in footer
- Switching games sets `current_game_id` cookie
- All subsequent page loads use the selected game context
- Commissioner can view/manage multiple games
- Access controlled by TOTP authentication

#### Regular Users (Non-Commissioners)
- **Cannot switch games** - game switcher not visible
- Always use `DEFAULT_GAME_ID` constant
- Cannot see or access other games
- Simple, focused experience for casual players

**Implementation:**
```javascript
// Footer.tsx - Game switcher visibility
const isCommissioner = /* TOTP authenticated check */;

{isCommissioner && (
  <Select onChange={handleGameChange}>
    {availableGames.map(game => (
      <option value={game.id}>{game.name}</option>
    ))}
  </Select>
)}
```

### Race State Management

#### Active Race Concept
Each game has one "active race" at a time (via `games.active_race_id`):
- This is the race currently being tracked for fantasy scoring
- Commissioner sets this when creating/configuring the game
- All race-related pages (race details, results entry) use the active race
- Can be changed by commissioner to track different races over time

#### Race Discovery Pattern
```javascript
// Pages needing race data follow this pattern:
async function loadRaceData() {
  // 1. Get game context (from SSR prop or cookie)
  const gameId = initialGameId || getCookie('current_game_id') || DEFAULT_GAME_ID;
  
  // 2. Get game state (includes active_race_id)
  const gameState = await fetch(`/api/game-state?gameId=${gameId}`);
  const activeRaceId = gameState.activeRaceId;
  
  // 3. Fetch race details
  const race = await fetch(`/api/races?id=${activeRaceId}`);
}

// OPTIMIZED SSR VERSION (preferred):
export async function getServerSideProps(context) {
  // Fetch game state server-side, pass activeRaceId as prop
  // Component uses prop immediately (no client wait)
}
```

#### Deprecated: Race `is_active` Flag

**Status:** ⚠️ **DEPRECATED - DO NOT USE**

The `races.is_active` boolean flag is **deprecated and should not be used** for any logic:

**Why it's deprecated:**
- Originally intended to mark "current" race (conflated with game's active_race_id)
- Creates ambiguity: multiple games can track the same race
- The "active" race is game-specific, not a race property
- Led to bugs when multiple games existed
- No clear definition of when a race should be "active" vs "inactive"

**Current approach:**
- Use `games.active_race_id` to determine which race a game is tracking
- Races are simply marathon events in the database (no "active" status)
- If a race needs to be hidden, use soft delete or separate visibility flag

**Migration plan:**
- [ ] Remove `is_active` from all queries and logic
- [ ] Add `visible` or `archived` flag if needed for race visibility
- [ ] Update database schema to drop `is_active` column
- [ ] Document in TECH_MIGRATION.md

**Example of correct pattern:**
```javascript
// ❌ WRONG (deprecated):
const activeRace = await sql`SELECT * FROM races WHERE is_active = true`;

// ✅ CORRECT:
const gameState = await sql`SELECT * FROM games WHERE game_id = ${gameId}`;
const race = await sql`SELECT * FROM races WHERE id = ${gameState.active_race_id}`;
```

### Data Flow Examples

#### Example 1: User Loads Race Page

**Old Approach (Client-Side - Slow):**
```
1. Browser → GET /race (HTML)
2. JavaScript mounts component
3. Component → GET /api/game-state?gameId=default
4. Wait for response (2-3 seconds)
5. Component → GET /api/races?id=644
6. Wait for response (2-3 seconds)
7. Render race (total: 5+ seconds) ❌
```

**New Approach (SSR - Fast):**
```
1. Browser → GET /race (HTML)
2. Server (SSR):
   - Read current_game_id cookie → "default"
   - Fetch game state → active_race_id = 644
   - Pass as props to page
3. JavaScript mounts component with activeRaceId prop
4. Component → GET /api/races?id=644 (immediately)
5. Wait for response (2-3 seconds)
6. Render race (total: 2-3 seconds) ✅ 50% faster
```

#### Example 2: Commissioner Switches Game

**Flow:**
```
1. Commissioner authenticated with TOTP
2. Footer shows game switcher dropdown
3. Commissioner selects "valencia-2025" game
4. Footer.tsx calls setCookie('current_game_id', 'valencia-2025')
5. Page reloads with new cookie
6. SSR reads cookie → gameId = "valencia-2025"
7. Fetches game state for valencia-2025 → active_race_id = 645
8. All pages now show Valencia race data
9. Commissioner can enter results for Valencia race
```

### Best Practices

#### For New Pages
1. **Always use SSR** for game/race context:
   ```typescript
   export async function getServerSideProps(context) {
     const gameId = context.req.cookies.current_game_id || DEFAULT_GAME_ID;
     const gameState = await fetchGameState(gameId);
     return { props: { initialGameId: gameId, initialActiveRaceId: gameState.activeRaceId } };
   }
   ```

2. **Accept SSR props in component**:
   ```typescript
   export default function MyPage({ initialActiveRaceId }: PageProps) {
     // Use prop immediately (no wait)
   }
   ```

3. **Initialize state from SSR props**:
   ```typescript
   useEffect(() => {
     if (initialActiveRaceId) {
       setGameState({ activeRaceId: initialActiveRaceId });
     }
   }, [initialActiveRaceId]);
   ```

4. **Use props for immediate data needs**:
   ```typescript
   useEffect(() => {
     // Prefer SSR prop over client state
     const activeRaceId = initialActiveRaceId || gameState.activeRaceId;
     if (activeRaceId) loadData(activeRaceId);
   }, [initialActiveRaceId]);
   ```

#### For API Endpoints
1. **Accept gameId as query parameter**:
   ```javascript
   const gameId = req.query.gameId || DEFAULT_GAME_ID;
   ```

2. **Never use race `is_active` flag** - use `games.active_race_id` instead

3. **Return consistent JSON**:
   ```javascript
   res.json({ activeRaceId, players, draftComplete, resultsFinalized });
   ```

#### For State Updates
1. **Update cookies** when game context changes (commissioner only)
2. **Reload page** after cookie update to trigger SSR with new context
3. **Use optimistic UI** for immediate feedback before API response

### Troubleshooting

**Problem:** "Race not found" error on page load
- **Cause:** Component trying to load race before game state available
- **Solution:** Use SSR to pass `initialActiveRaceId` as prop

**Problem:** Commissioner game switching doesn't work
- **Cause:** Cookie not being set or SSR not reading cookie
- **Solution:** Check cookie setting logic, verify SSR reads `context.req.cookies`

**Problem:** Multiple tabs showing different games
- **Cause:** Expected behavior - each tab has independent cookie state
- **Solution:** Reload all tabs after switching games, or implement cross-tab sync

**Problem:** `is_active` flag causing confusion
- **Cause:** Deprecated field still in use
- **Solution:** Remove all references, use `games.active_race_id` instead

## API Architecture

### Endpoint Design
All API endpoints follow RESTful conventions with game isolation via query parameters:

| Endpoint | Methods | Purpose | Parameters |
|----------|---------|---------|------------|
| `/api/athletes` | GET | Retrieve elite athlete database with extended fields | None |
| `/api/races` | GET, POST, PUT, DELETE | Race event management | `id`, `active`, `includeAthletes` |
| `/api/race-news` | GET, POST, PUT, DELETE | Race news feed management | `id`, `raceId`, `includeHidden` |
| `/api/athlete-races` | GET, POST, DELETE | Athlete race confirmations | `athleteId`, `raceId`, `bibNumber` |
| `/api/game-state` | GET, POST | Game configuration management | `gameId` |
| `/api/rankings` | GET, POST | Player rankings storage (⚠️ DEPRECATED) | `gameId`, `playerCode` |
| `/api/draft` | GET, POST | Snake draft execution (⚠️ DEPRECATED) | `gameId` |
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

This architecture provides a robust foundation for the Marathon Majors Fantasy League application while maintaining the simplicity and ease of deployment that are core to the project's design philosophy.