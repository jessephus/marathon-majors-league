# Technical Architecture Documentation

## Overview

Fantasy NY Marathon is built as a serverless web application optimized for simplicity, scalability, and real-time collaboration. The architecture prioritizes ease of deployment and maintenance while providing a robust fantasy sports experience.

## System Architecture

### High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Static Files  │    │  Serverless API │    │  Blob Storage   │
│                 │    │                 │    │                 │
│  • index.html   │◄──►│  • game-state   │◄──►│  • JSON Files   │
│  • app.js       │    │  • rankings     │    │  • Game Data    │
│  • style.css    │    │  • draft        │    │  • Results      │
│  • athletes.json│    │  • results      │    │                 │
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
- **Vercel Blob Storage**: JSON file-based data persistence
- **RESTful API Design**: Simple HTTP endpoints with JSON responses

### Infrastructure
- **Vercel Edge Network**: Global CDN with automatic scaling
- **Environment Variables**: Secure configuration management
- **HTTPS**: SSL/TLS encryption by default

## Data Architecture

### Storage Strategy
The application uses Vercel Blob Storage with a file-per-game-type pattern:

```
Blob Storage Structure:
fantasy-marathon/
└── {gameId}/
    ├── game-state.json     # Game configuration and player list
    ├── rankings.json       # Player athlete preferences
    ├── teams.json         # Post-draft team assignments
    └── results.json       # Race results and live updates
```

### Data Models

#### Game State (`game-state.json`)
```json
{
  "players": ["RUNNER", "SPRINTER", "PACER"],
  "draft_complete": false,
  "results_finalized": false,
  "created_at": "2025-10-13T10:00:00Z",
  "updated_at": "2025-10-13T10:30:00Z"
}
```

#### Rankings (`rankings.json`)
```json
{
  "RUNNER": {
    "men": [
      {"id": 1, "name": "Eliud Kipchoge", "country": "KEN", "pb": "2:01:09"},
      // ... up to 10 athletes
    ],
    "women": [
      {"id": 101, "name": "Sifan Hassan", "country": "NED", "pb": "2:13:44"},
      // ... up to 10 athletes
    ],
    "submitted_at": "2025-10-13T10:15:00Z"
  }
}
```

#### Teams (`teams.json`)
```json
{
  "RUNNER": {
    "men": [
      {"id": 1, "name": "Eliud Kipchoge", "country": "KEN", "pb": "2:01:09"},
      // ... 3 total
    ],
    "women": [
      {"id": 101, "name": "Sifan Hassan", "country": "NED", "pb": "2:13:44"},
      // ... 3 total
    ]
  }
}
```

#### Results (`results.json`)
```json
{
  "1": "2:05:30",      // Athlete ID -> Finish Time (HH:MM:SS)
  "101": "2:18:45",
  // ... all athlete results
}
```

## API Architecture

### Endpoint Design
All API endpoints follow RESTful conventions with game isolation via query parameters:

| Endpoint | Methods | Purpose | Parameters |
|----------|---------|---------|------------|
| `/api/game-state` | GET, POST | Game configuration management | `gameId` |
| `/api/rankings` | GET, POST | Player rankings storage | `gameId`, `playerCode` |
| `/api/draft` | GET, POST | Snake draft execution | `gameId` |
| `/api/results` | GET, POST | Race results management | `gameId` |
| `/api/init-db` | GET | Storage health check | None |

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
- **JSON storage**: Simple read/write operations without query overhead
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
4. **Storage provisioning**: Blob storage created through Vercel UI

### Environment Configuration
- **Development**: `vercel dev` for local development
- **Preview**: Automatic preview deployments for pull requests
- **Production**: `vercel --prod` or GitHub integration

### Monitoring and Observability
- **Function logs**: Available in Vercel dashboard
- **Error tracking**: Console.error() outputs to Vercel logs
- **Performance metrics**: Built-in Vercel analytics
- **Storage metrics**: Blob storage usage tracking

## Scalability Considerations

### Current Limitations
- **Single game focus**: Designed for one active marathon event
- **Friend group size**: Optimized for 2-4 players
- **Concurrent games**: Limited by simple gameId system

### Scaling Strategies
If the application needs to scale:
1. **Multi-tenant architecture**: Enhanced gameId management
2. **Database migration**: Move to Vercel Postgres for complex queries
3. **Real-time updates**: WebSocket integration for live updates
4. **CDN optimization**: Asset optimization and compression

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
│   └── athletes.json      # Static athlete database
├── API Functions
│   ├── storage.js         # Centralized storage helpers
│   ├── game-state.js      # Game management
│   ├── rankings.js        # Player rankings
│   ├── draft.js          # Snake draft logic
│   ├── results.js        # Race results
│   └── init-db.js        # Health check endpoint
└── Configuration
    ├── package.json       # Dependencies and scripts
    ├── vercel.json       # Deployment configuration
    └── .vercelignore     # Deployment exclusions
```

### Testing Strategy
- **Manual testing**: Multi-browser, multi-device validation
- **Integration testing**: Complete game flow verification
- **Performance testing**: Mobile device and slow network testing
- **Security testing**: CORS and data isolation verification

This architecture provides a robust foundation for the Fantasy NY Marathon application while maintaining the simplicity and ease of deployment that are core to the project's design philosophy.