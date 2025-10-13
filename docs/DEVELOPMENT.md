# Development Guide

## Development Environment Setup

### Prerequisites
- **Node.js** 18+ (for Vercel CLI and dependencies)
- **Git** for version control
- **Vercel Account** for deployment and storage
- **Code Editor** (VS Code recommended)

### Quick Setup
```bash
# Clone the repository
git clone https://github.com/jessephus/marathon-majors-league.git
cd marathon-majors-league

# Install dependencies
npm install

# Install Vercel CLI globally
npm install -g vercel

# Link to Vercel project (first time only)
vercel link

# Pull environment variables
vercel env pull

# Start development server
vercel dev
```

### Environment Variables
Required for local development:
- `BLOB_READ_WRITE_TOKEN` - Automatically set when linking Vercel project

## Project Architecture

### File Structure
```
marathon-majors-league/
├── Frontend (Static Files)
│   ├── index.html              # Main application entry point
│   ├── app.js                  # Core application logic (~1000 lines)
│   ├── style.css              # Complete responsive styling
│   └── athletes.json          # Elite athlete database
├── Backend (API Functions)
│   ├── api/
│   │   ├── storage.js         # Centralized Blob storage helpers
│   │   ├── game-state.js      # Game configuration management
│   │   ├── rankings.js        # Player rankings storage
│   │   ├── draft.js          # Snake draft execution
│   │   ├── results.js        # Race results management
│   │   └── init-db.js        # Storage health check
├── Configuration
│   ├── package.json          # Dependencies and scripts
│   ├── vercel.json          # Deployment configuration
│   └── .vercelignore        # Deployment exclusions
└── Documentation
    ├── README.md             # Project overview and features
    ├── ARCHITECTURE.md       # Technical architecture details
    ├── DEPLOYMENT.md         # Deployment instructions
    ├── USER_GUIDE.md        # End-user documentation
    ├── DEVELOPMENT.md       # This file
    ├── LIVE_RESULTS_FEATURE.md  # Live results system docs
    └── MIGRATION.md         # Database migration history
```

### Technology Stack
- **Frontend**: Vanilla HTML5, CSS3, JavaScript ES6+ (no frameworks)
- **Backend**: Vercel Serverless Functions (Node.js ES modules)
- **Storage**: Vercel Blob Storage (JSON files)
- **Deployment**: Vercel Edge Network

## Development Workflow

### Local Development
```bash
# Start development server
vercel dev

# Access application
open http://localhost:3000

# View function logs
# Logs appear in terminal running vercel dev
```

### Testing Multi-Player Scenarios
1. **Open multiple browser windows/tabs**
2. **Use different player codes** in each window
3. **Test commissioner functions** in one window
4. **Simulate player actions** in other windows

### Common Development Tasks

#### Adding New Features
1. **Read documentation**: Always check `ARCHITECTURE.md` and existing docs
2. **Plan changes**: Determine frontend/backend modifications needed
3. **Update frontend**: Modify `app.js`, `index.html`, or `style.css`
4. **Update backend**: Add/modify API functions in `/api/` directory
5. **Test locally**: Use `vercel dev` for testing
6. **Update documentation**: Reflect changes in relevant docs

#### Modifying API Endpoints
1. **Check existing patterns**: Follow conventions in `api/storage.js`
2. **Handle CORS**: Include proper headers in all endpoints
3. **Error handling**: Use try/catch and return appropriate HTTP codes
4. **Use storage helpers**: Leverage `getData()` and `saveData()` functions

#### Frontend State Management
```javascript
// Access global game state
gameState.currentPlayer
gameState.rankings
gameState.teams
gameState.results

// Update UI
showPage('page-id')
updateRankingDisplay('men')
displayTeams()
```

## Code Standards

### JavaScript Conventions
```javascript
// Use modern ES6+ features
const players = [...gameState.players];
const { men, women } = rankings;

// Async/await for API calls
async function loadGameState() {
    try {
        const response = await fetch(`${API_BASE}/api/game-state`);
        const data = await response.json();
        // Handle data
    } catch (error) {
        console.error('Error:', error);
    }
}

// Template literals for strings
const message = `Player ${playerCode} has ${rankings.length} rankings`;
```

### CSS Conventions
```css
/* Use CSS custom properties */
:root {
    --primary-orange: #ff6900;
    --primary-blue: #2C39A2;
}

/* Mobile-first responsive design */
.container {
    /* Mobile styles first */
}

@media (min-width: 768px) {
    .container {
        /* Tablet and desktop styles */
    }
}

/* BEM-like naming for components */
.athlete-card__name { }
.athlete-card__country { }
.athlete-card--selected { }
```

### API Function Template
```javascript
import { getData, saveData, getDefault } from './storage.js';

export default async function handler(req, res) {
    // CORS headers (required for all endpoints)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const gameId = req.query.gameId || 'default';

    try {
        if (req.method === 'GET') {
            // Handle GET request
            const data = await getData(gameId, 'type') || getDefault();
            res.status(200).json(data);
        } else if (req.method === 'POST') {
            // Handle POST request
            const { body } = req;
            await saveData(gameId, 'type', body);
            res.status(200).json({ message: 'Success' });
        } else {
            res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: error.message });
    }
}
```

## Testing Guidelines

### Manual Testing Checklist
- [ ] **Multi-player flow**: Test with 2-4 players
- [ ] **Commissioner actions**: Code generation, draft, results
- [ ] **Player actions**: Joining, ranking, viewing teams
- [ ] **Mobile responsiveness**: Test on phone and tablet
- [ ] **Error handling**: Test invalid inputs and network issues
- [ ] **Live results**: Test update and finalize workflow

### Browser Testing
- **Chrome** (primary development browser)
- **Firefox** (ensure compatibility)
- **Safari** (especially on mobile)
- **Edge** (Windows compatibility)

### Performance Testing
- **Slow 3G simulation**: Test on poor connections
- **Large datasets**: Test with maximum players and athletes
- **Memory usage**: Check for memory leaks during long sessions

## Debugging

### Frontend Debugging
```javascript
// Enable verbose logging
console.log('Game state:', gameState);
console.log('Current player:', gameState.currentPlayer);

// Debug API calls
async function debugApiCall(url, options) {
    console.log('API Call:', url, options);
    const response = await fetch(url, options);
    const data = await response.json();
    console.log('API Response:', data);
    return data;
}
```

### Backend Debugging
```javascript
// Add logging to serverless functions
console.log('Request:', req.method, req.url);
console.log('Body:', req.body);
console.log('Query:', req.query);

// Check storage operations
const data = await getData(gameId, type);
console.log('Retrieved data:', data);
```

### Common Issues and Solutions

#### Storage Connection Problems
```bash
# Check environment variables
vercel env pull
cat .env.local

# Test storage endpoint
curl http://localhost:3000/api/init-db
```

#### CORS Issues
```javascript
// Ensure all API functions include CORS headers
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
```

#### Mobile Touch Issues
```css
/* Ensure touch targets are large enough */
.athlete-card {
    min-height: 44px; /* iOS minimum touch target */
    padding: 12px;
}

/* Handle touch interactions */
.draggable {
    touch-action: none; /* Prevent scrolling during drag */
}
```

## Deployment

### Development Deployment
```bash
# Deploy to preview environment
vercel

# Deploy to production
vercel --prod
```

### Environment Management
```bash
# View current environment variables
vercel env ls

# Add new environment variable
vercel env add VARIABLE_NAME

# Pull latest environment variables
vercel env pull
```

### Database Management
```bash
# Check storage health
curl https://your-app.vercel.app/api/init-db

# View storage in Vercel dashboard
# Go to project -> Storage tab -> Browse files
```

## Contributing

### Pull Request Process
1. **Create feature branch**: `git checkout -b feature/new-feature`
2. **Make changes**: Follow code standards and test thoroughly
3. **Update documentation**: Reflect changes in relevant docs
4. **Test deployment**: Ensure changes work in production environment
5. **Submit PR**: Include description of changes and testing performed

### Code Review Checklist
- [ ] **Follows code standards**: JavaScript, CSS, and API conventions
- [ ] **Documentation updated**: Relevant docs reflect changes
- [ ] **CORS headers**: All new API endpoints include CORS
- [ ] **Error handling**: Proper try/catch and error responses
- [ ] **Mobile compatibility**: Changes work on mobile devices
- [ ] **Testing performed**: Manual testing completed

### Release Process
1. **Merge to main branch**
2. **Automatic deployment** via Vercel GitHub integration
3. **Verify production**: Test critical functionality
4. **Update changelog**: Document notable changes
5. **Tag release**: Create Git tag for version tracking

## Advanced Development

### Custom Game Logic
To modify game rules or add features:

```javascript
// Example: Change team size from 3 to 4 athletes per gender
function snakeDraft(draftOrder, gender, perPlayer) {
    const numRounds = 4; // Changed from 3
    // ... rest of logic
}
```

### Adding New Athlete Data
```javascript
// Update athletes.json structure
{
    "id": 999,
    "name": "New Runner",
    "country": "USA",
    "pb": "2:10:00",
    "headshotUrl": "https://example.com/image.jpg",
    "age": 28,           // Optional new field
    "sponsor": "Nike",   // Optional new field
    "worldRanking": 15   // Optional new field
}
```

### Performance Optimization
```javascript
// Debounce user input for better performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Use for search or filter functions
const debouncedSearch = debounce(searchAthletes, 300);
```

## Security Considerations

### Current Security Model
- **Public data access**: Blob storage is public (acceptable for this use case)
- **Simple authentication**: Player codes and commissioner password
- **HTTPS encryption**: All data transmission encrypted
- **No sensitive data**: Only fantasy sports information stored

### Security Best Practices
- **Input validation**: Sanitize all user inputs
- **XSS prevention**: Use textContent instead of innerHTML when possible
- **CSRF protection**: Not needed due to stateless API design
- **Rate limiting**: Consider if scaling beyond friend groups

## Monitoring and Analytics

### Built-in Monitoring
- **Vercel Analytics**: Automatic performance and usage tracking
- **Function Logs**: Available in Vercel dashboard
- **Error Tracking**: Console errors logged to Vercel

### Custom Monitoring
```javascript
// Add custom analytics events
function trackEvent(action, details) {
    console.log('Analytics:', { action, details, timestamp: new Date() });
    // Could integrate with analytics service
}

// Usage
trackEvent('draft_completed', { playerCount: 3, gameId: 'default' });
```

## Future Enhancements

### Potential Features
- **WebSocket integration**: Real-time updates without refresh
- **Push notifications**: Alert players when results update
- **Historical data**: Track performance across multiple marathons
- **Social features**: Comments, reactions, trash talk
- **Advanced analytics**: Detailed performance breakdowns

### Scalability Improvements
- **Database optimization**: Move to Postgres for complex queries
- **Caching layer**: Redis for frequently accessed data
- **CDN optimization**: Image optimization and compression
- **Multi-region deployment**: Global performance optimization

This development guide provides comprehensive information for maintaining and enhancing the Fantasy NY Marathon application while preserving its core simplicity and ease of use.