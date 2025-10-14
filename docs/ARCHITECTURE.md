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
├── athletes          (elite runner profiles)
├── games            (game configuration and state)
├── player_rankings  (player athlete preferences)
├── draft_teams      (post-draft team assignments)
├── race_results     (race results and live updates)
├── users            (future: user accounts)
└── user_games       (future: user-game associations)
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

#### Player Rankings Table
```sql
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

#### Draft Teams Table
```sql
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
| `/api/athletes` | GET | Retrieve elite athlete database | None |
| `/api/game-state` | GET, POST | Game configuration management | `gameId` |
| `/api/rankings` | GET, POST | Player rankings storage | `gameId`, `playerCode` |
| `/api/draft` | GET, POST | Snake draft execution | `gameId` |
| `/api/results` | GET, POST | Race results management | `gameId` |
| `/api/init-db` | GET, POST | Database initialization & seeding | None |

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

### Authentication Model
- **No traditional user accounts**: Simplified player code system
- **Commissioner access**: Single password ("kipchoge") for admin functions
- **Game isolation**: Separate data namespaces prevent cross-game access

### Data Security
- **Public blob access**: Matches the casual, friend-to-friend use case
- **HTTPS encryption**: All data in transit is encrypted
- **No sensitive data**: Only fantasy sports information is stored

### Security Trade-offs
The application prioritizes simplicity over security for several reasons:
1. **Casual use case**: Friends playing together, not commercial application
2. **Non-sensitive data**: No personal information, payment data, or secrets
3. **Ease of use**: No registration barriers or complex authentication
4. **Rapid deployment**: Minimal configuration required

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
│   ├── app.js             # Core application logic
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
├── Configuration
│   ├── package.json       # Dependencies and scripts
│   ├── vercel.json       # Deployment configuration
│   ├── schema.sql        # Database schema
│   └── .vercelignore     # Deployment exclusions
└── Documentation
    ├── README.md          # Project overview
    ├── NEON_SETUP.md     # Database setup guide
    └── docs/             # Additional documentation
```

### Testing Strategy
- **Manual testing**: Multi-browser, multi-device validation
- **Integration testing**: Complete game flow verification
- **Performance testing**: Mobile device and slow network testing
- **Security testing**: CORS and data isolation verification

This architecture provides a robust foundation for the Fantasy NY Marathon application while maintaining the simplicity and ease of deployment that are core to the project's design philosophy.