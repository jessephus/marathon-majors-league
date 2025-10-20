# GitHub Copilot Repository Instructions

## Repository Overview

**Fantasy NY Marathon** is a web-based fantasy sports application that enables 2-4 friends to compete by drafting elite marathon runners for the New York City Marathon. The application features real-time result tracking, automated snake draft mechanics, and a mobile-first responsive design.

## Critical Instructions for Copilot

### 🔥 ALWAYS READ DOCUMENTATION FIRST
**Before making ANY changes to this project:**
1. **ALWAYS read through ALL markdown documentation files** in the repository to understand the current project state
2. **Required reading includes**: `README.md`, `ARCHITECTURE.md`, `DEVELOPMENT.md`, `USER_GUIDE.md`, `DEPLOYMENT.md`, `LIVE_RESULTS_FEATURE.md`, `MIGRATION.md`, `CHANGELOG.md`, and any other `.md` files
3. **After making changes**: ALWAYS update the relevant documentation to reflect your modifications
4. **This ensures Copilot maintains accurate project understanding over time**

### 📖 Documentation Maintenance Protocol
- When adding new features → Update `README.md` features section and add feature-specific documentation
- When modifying API endpoints → Update `ARCHITECTURE.md` technical documentation
- When changing deployment process → Update `DEPLOYMENT.md`
- When adding new functionality → Create specific documentation files (like `LIVE_RESULTS_FEATURE.md`)
- When making breaking changes → Update `MIGRATION.md` and `CHANGELOG.md`

## Required Documentation Reading

### 🔗 Key Documentation Files
Before making any changes, read these files to understand the project:

- **[ARCHITECTURE.md](../docs/ARCHITECTURE.md)** - Complete technical architecture and system design
- **[README.md](../README.md)** - Project overview, features, and quick start guide  
- **[DEVELOPMENT.md](../docs/DEVELOPMENT.md)** - Development environment, code standards, and workflows
- **[USER_GUIDE.md](../docs/USER_GUIDE.md)** - End-user documentation for players and commissioners
- **[DEPLOYMENT.md](../docs/DEPLOYMENT.md)** - Deployment instructions and configuration
- **[LIVE_RESULTS_FEATURE.md](../docs/LIVE_RESULTS_FEATURE.md)** - Live results system documentation
- **[MIGRATION.md](../docs/MIGRATION.md)** - Database migration history and decisions
- **[CHANGELOG.md](../docs/CHANGELOG.md)** - Project evolution and version history

## Project Overview

**Fantasy NY Marathon** is a serverless web application that enables 2-4 friends to compete by drafting elite marathon runners for the New York City Marathon. The application features real-time result tracking, automated snake draft mechanics, and mobile-first responsive design.

### Key Design Principles
- **No build step required** - Direct deployment of static files
- **Mobile-first responsive design** - Optimized for phone usage during race watching
- **Real-time updates** - Live result tracking throughout the marathon
- **Simple deployment** - One-click Vercel deployment with minimal configuration
- **Documentation-first** - Comprehensive docs that stay current with code changes
- `game-state.js` - Player management and game configuration
## Technical Architecture Reference

**⚠️ For detailed technical information, see [ARCHITECTURE.md](../docs/ARCHITECTURE.md)**

### Core Technologies
- **Frontend**: Vanilla HTML5, CSS3, JavaScript ES6+ (no build tools required)
- **Backend**: Vercel Serverless Functions (Node.js ES modules)
- **Database**: Vercel Blob Storage (JSON file-based)
- **Hosting**: Vercel Edge Network

### Key Files Structure
- `index.html` - Main application entry point with all UI sections
- `app.js` - Core frontend application logic (1000+ lines)
- `style.css` - Complete CSS styling with mobile-responsive design
- `athletes.json` - Elite runner database (33 men, 25 women)
- `package.json` - Dependencies (@vercel/blob only)
- `vercel.json` - Deployment configuration
- `game-state.js` - Player management and game configuration
- `rankings.js` - Player athlete preferences storage
- `draft.js` - Snake draft execution and team assignments
- `results.js` - Race result entry and retrieval
- `storage.js` - Centralized Blob storage helper functions
- `init-db.js` - Storage initialization (minimal setup required)

### Data Storage Pattern
Each game uses isolated JSON files in Blob storage:
```
fantasy-marathon/{gameId}/
├── game-state.json    (players, draft status, finalized status)
├── rankings.json      (player preferences by code)
├── teams.json         (post-draft team assignments)
└── results.json       (athlete finish times)
```

## Development Quick Reference

**⚠️ For complete development instructions, see [DEVELOPMENT.md](../docs/DEVELOPMENT.md)**

### Setup & Local Development
```bash
npm install                 # Install @vercel/blob dependency
vercel link                 # Link to Vercel project (one-time)
vercel env pull            # Pull environment variables
vercel dev                 # Start local development server
```

### Deployment
```bash
vercel --prod              # Deploy to production
# OR use GitHub integration for automatic deployment
```

### Required Environment Variables
- `BLOB_READ_WRITE_TOKEN` - Automatically configured by Vercel when Blob storage is added

## Development Standards & Patterns

**⚠️ For detailed standards and patterns, see [DEVELOPMENT.md](../docs/DEVELOPMENT.md)**

### Code Standards Summary
- **JavaScript**: ES6+ features, async/await, template literals
- **HTML/CSS**: Mobile-first responsive design, semantic elements, CSS custom properties
- **API Design**: RESTful endpoints, CORS headers, consistent JSON responses
- **UI/UX**: Do not use emoji for icons or visual elements - use text labels, SVG icons, or icon fonts instead

### Common Development Patterns
- Use `storage.js` helper functions: `getData()`, `saveData()`
- Update `gameState` object for local state and sync with backend
- Use `showPage(pageId)` for view transitions
- Handle errors with try/catch in async functions
- Test across mobile breakpoints: 320px, 768px, 1024px+

### Adding New Features
1. **Read all documentation first** to understand current architecture
2. Determine if changes require frontend, backend, or both
3. Update `app.js` for frontend logic
4. Create/modify API endpoints in `/api/` directory
5. Update `style.css` for UI changes
6. Test complete flow end-to-end
7. **Update all relevant documentation files**

---

## Final Reminder for Copilot

**🚨 CRITICAL**: Every time you work on this project:
1. **Start by reading all `.md` documentation files**
2. **Understand the current architecture before making changes**  
3. **After making any modifications, update the relevant documentation**
4. **This creates a positive feedback loop where documentation stays current and Copilot becomes more effective over time**

This documentation-first approach ensures the project remains maintainable and Copilot can provide consistently high-quality assistance.