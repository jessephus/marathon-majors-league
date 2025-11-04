# GitHub Copilot Repository Instructions

## Repository Overview

**Marathon Majors Fantasy League** (fka Fantasy NY Marathon, or Fantasy Chicago Marathon) is a web-based fantasy sports application that enables people to compete online by drafting elite marathon runners for Major Marathon. The application features real-time result tracking, automated snake draft mechanics, and a mobile-first responsive design.

## Critical Instructions for Copilot

### 🔥 ALWAYS READ DOCUMENTATION FIRST
**Before making ANY changes to this project:**
1. **ALWAYS read through ALL markdown documentation files** in the repository to understand the current project state
2. **Required reading includes**: `README.md`, `ARCHITECTURE.md`, `DEVELOPMENT.md`, `USER_GUIDE.md`, `DEPLOYMENT.md`, `LIVE_RESULTS_FEATURE.md`, `MIGRATION.md`, `CHANGELOG.md`, and any other `.md` files
3. **After making changes**: ALWAYS update the relevant documentation to reflect your modifications
4. **This ensures Copilot maintains accurate project understanding over time**

### 📖 Documentation Maintenance Protocol

**Golden Rule:** Documentation changes ALWAYS accompany code changes.

#### When Adding New Features
1. **During Development:**
   - Create feature-specific doc if major (e.g., `NEW_FEATURE.md`)
   - Update relevant existing docs (e.g., `ARCHITECTURE.md`, `USER_GUIDE.md`)
   - Add code examples and usage instructions

2. **Upon Completion:**
   - Add summary to `CHANGELOG.md`
   - Update main `README.md` if user-facing
   - Add entry to `docs/README.md` index
   - Cross-reference related documentation

3. **After Maturity (3+ months):**
   - Consider merging feature doc into parent guides
   - Consolidate if redundant with other docs
   - Keep only if feature is complex/standalone

#### When Modifying Code
- **API endpoints** → Update `CORE_ARCHITECTURE.md` and `TECH_AUTHENTICATION_API.md`
- **Database schema** → Update `TECH_DATABASE.md` and `TECH_MIGRATION.md`
- **Deployment process** → Update `CORE_DEPLOYMENT.md`
- **UI/UX changes** → Update `CORE_USER_GUIDE.md` with screenshots
- **Breaking changes** → Update `TECH_MIGRATION.md` and `CORE_CHANGELOG.md`
- **Bug fixes** → Add to `CORE_CHANGELOG.md` (don't create new docs)

#### Documentation Organization Rules

**The /docs folder has 5 categories** (see `docs/README.md`):

1. **Core Guides (6 docs)** - CORE_USER_GUIDE, CORE_ARCHITECTURE, CORE_DEVELOPMENT, CORE_DEPLOYMENT, CORE_TESTING, CORE_CHANGELOG
   - These are permanent and should grow with the project
   - Never delete these without team discussion
   - Naming: `CORE_*.md` prefix

2. **Technical Reference (5 docs)** - TECH_DATABASE, TECH_NEON_SETUP, TECH_MIGRATION, TECH_AUTHENTICATION_API, TECH_PERFORMANCE_OPTIMIZATION
   - Keep these current with code changes
   - Add sections, don't create new docs for minor updates
   - Naming: `TECH_*.md` prefix

3. **Features (6 docs)** - FEATURE_GAME_MODES, FEATURE_SALARY_CAP_DRAFT, FEATURE_POINTS_SCORING_SYSTEM, etc.
   - Create new docs for major features only
   - Merge into Core Guides after 6+ months if appropriate
   - Naming: `FEATURE_*.md` prefix

4. **Process & Maintenance (7 docs)** - PROCESS_CLEANUP_SUMMARY, PROCESS_CONSOLIDATION_RECOVERY, PROCESS_PHASE_2_SUMMARY, PROCESS_DOCS_HEALTH_CHECK, etc.
   - These document project history and decisions
   - Don't delete if they involve ongoing projects or migrations
   - Naming: `PROCESS_*.md` prefix

5. **Setup & Authentication (1 doc)** - SETUP_AUTHENTICATION
   - Configuration and setup guides
   - Update when external services change
   - Naming: `SETUP_*.md` prefix

#### Before Creating New Documentation

**Ask these questions:**
1. ✅ Is this a major feature worth standalone documentation? (If < 200 lines, probably no)
2. ✅ Does this information already exist elsewhere? (Search existing docs first)
3. ✅ Will this doc still be relevant in 6 months? (If no, add to CHANGELOG instead)
4. ✅ Can this be a section in an existing doc? (Prefer enhancing over creating)

**Create new doc only if all answers are YES**

#### Documentation Lifecycle

```
Development → Feature Doc Created (e.g., FEATURE_NEW_FEATURE.md)
     ↓
Completion → Summary added to CORE_CHANGELOG.md
     ↓
Maturity (3-6 months) → Consider merging into parent guide
     ↓
Deprecation → Remove doc, keep summary in CORE_CHANGELOG.md
```

#### Quarterly Documentation Review Checklist

Run this checklist every 3 months (or before major releases):

- [ ] **Audit for redundancy** - Are any docs covering the same topics?
- [ ] **Check for outdated content** - Do examples match current code?
- [ ] **Verify all links work** - No broken internal references
- [ ] **Update version references** - Remove outdated version numbers
- [ ] **Remove obsolete docs** - Delete docs for removed features
- [ ] **Merge mature feature docs** - Consolidate into parent guides
- [ ] **Update docs/README.md** - Ensure all docs are indexed
- [ ] **Check CORE_CHANGELOG.md** - Is it current with recent changes?

#### Documentation Health Metrics

Target state (check monthly):
- **Total docs:** 20-30 files (current: 26 ✅)
- **Orphaned docs:** 0 (not linked from docs/README.md)
- **Outdated examples:** 0 (code examples match current API)
- **Broken links:** 0 (all cross-references work)
- **Redundant docs:** 0 (no duplicate content)

**Automated monitoring:** GitHub Actions runs [docs-health-check.yml](../.github/workflows/docs-health-check.yml) on every docs change and weekly. See [PROCESS_DOCS_HEALTH_CHECK.md](../docs/PROCESS_DOCS_HEALTH_CHECK.md) for details.

#### What NOT to Document

❌ **Don't create docs for:**
- Small bug fixes (add to CORE_CHANGELOG.md instead)
- UI tweaks (update CORE_USER_GUIDE.md)
- Minor refactors (use git commit messages)
- Implementation details (use code comments)
- Temporary workarounds (add inline code comments)

✅ **Do create docs for:**
- Major new features (e.g., FEATURE_SALARY_CAP_DRAFT.md)
- API changes (update TECH_AUTHENTICATION_API.md)
- Architecture decisions (update CORE_ARCHITECTURE.md)
- Migration guides (e.g., TECH_MIGRATION.md)
- Complex workflows (e.g., FEATURE_SYNC_TOP_100.md)

## Required Documentation Reading

### 🔗 Key Documentation Files
Before making any changes, read these files to understand the project:

**Essential Reading (Read First):**
- **[docs/README.md](../docs/README.md)** - **START HERE** - Complete documentation index and navigation guide
- **[README.md](../README.md)** - Project overview, features, and quick start guide
- **[CORE_ARCHITECTURE.md](../docs/CORE_ARCHITECTURE.md)** - Complete technical architecture and system design
- **[CORE_CHANGELOG.md](../docs/CORE_CHANGELOG.md)** - Version history with technical implementation notes

**Core Development Docs:**
- **[CORE_DEVELOPMENT.md](../docs/CORE_DEVELOPMENT.md)** - Development environment, code standards, and workflows
- **[TECH_DATABASE.md](../docs/TECH_DATABASE.md)** - Schema reference, queries, and troubleshooting
- **[CORE_DEPLOYMENT.md](../docs/CORE_DEPLOYMENT.md)** - Deployment instructions and configuration

**User-Facing Documentation:**
- **[CORE_USER_GUIDE.md](../docs/CORE_USER_GUIDE.md)** - End-user documentation for players and commissioners
- **[FEATURE_GAME_MODES.md](../docs/FEATURE_GAME_MODES.md)** - Season League vs Single Race modes

**Process Documentation:**
- **[TECH_MIGRATION.md](../docs/TECH_MIGRATION.md)** - Database migration history and decisions
- **[PROCESS_CONSOLIDATION_RECOVERY.md](../docs/PROCESS_CONSOLIDATION_RECOVERY.md)** - Lessons from documentation cleanup

**💡 Pro Tip:** Use `docs/README.md` as your documentation navigation hub. It's organized by role and includes quick reference tables.

## Project Overview

**Marathon Majors Fantasy League** (fka Fantasy NY Marathon, or Fantasy Chicago Marathon) is a serverless web application that enables people to compete online by drafting elite marathon runners for Major Marathons. The application features real-time result tracking, salary cap draft mechanics, and a mobile-first responsive design.

### Key Design Principles
- **Next.js framework** - Modern React-based architecture with serverless API routes
- **Mobile-first responsive design** - Optimized for phone usage during race watching
- **Real-time updates** - Live result tracking throughout the marathon
- **Simple deployment** - One-click Vercel deployment with Neon Postgres
- **Documentation-first** - Comprehensive docs that stay current with code changes

## Technical Architecture Reference

**⚠️ For detailed technical information, see [CORE_ARCHITECTURE.md](../docs/CORE_ARCHITECTURE.md)**

### Core Technologies
- **Frontend**: Next.js 15.5.6 (React framework with vanilla JS components)
- **Backend**: Vercel Serverless Functions (Node.js API routes)
- **Database**: Neon Postgres (serverless PostgreSQL)
- **Hosting**: Vercel Edge Network

### Key Files Structure
- `pages/index.js` - Main application entry point (Next.js SSR wrapper)
- `public/app.js` - Core frontend application logic (vanilla JavaScript)
- `public/salary-cap-draft.js` - Salary cap draft UI
- `public/style.css` - Complete CSS styling with mobile-responsive design
- `pages/api/` - Serverless API endpoints directory
- `package.json` - Dependencies (@neondatabase/serverless, Next.js, React)
- `vercel.json` - Deployment configuration
- `schema.sql` - Database schema definition

### Database Architecture
Neon Postgres with relational tables:
```
Database Tables:
├── athletes           (elite runner profiles with extended data)
├── races              (marathon events and competitions)
├── athlete_races      (athlete-race confirmations)
├── games              (game configuration and state)
├── player_rankings    (player athlete preferences)
├── draft_teams        (post-draft team assignments)
└── race_results       (race results and live updates)
```

## Development Quick Reference

**⚠️ For complete development instructions, see [CORE_DEVELOPMENT.md](../docs/CORE_DEVELOPMENT.md)**

### Setup & Local Development
```bash
npm install                 # Install dependencies
vercel link                 # Link to Vercel project (one-time)
vercel env pull            # Pull environment variables (including DATABASE_URL)
vercel dev                 # Start local development server
```

### Deployment
```bash
vercel --prod              # Deploy to production
# OR use GitHub integration for automatic deployment
```

### Required Environment Variables
- `DATABASE_URL` - Neon Postgres connection string (automatically configured via Vercel integration)

## Development Standards & Patterns

**⚠️ For detailed standards and patterns, see [CORE_DEVELOPMENT.md](../docs/CORE_DEVELOPMENT.md)**

### Code Standards Summary
- **JavaScript**: ES6+ features, async/await, template literals
- **HTML/CSS**: Mobile-first responsive design, semantic elements, CSS custom properties
- **API Design**: RESTful endpoints, CORS headers, consistent JSON responses
- **UI/UX**: Do not use emoji for icons or visual elements - use text labels, SVG icons, or icon fonts instead

### Common Development Patterns
- Use database helpers in `pages/api/db.js` for all database operations
- Update `gameState` object for local state and sync with backend
- Use `showPage(pageId)` for view transitions
- Handle errors with try/catch in async functions
- Test across mobile breakpoints: 320px, 768px, 1024px+

### Adding New Features
1. **Read all documentation first** to understand current architecture
2. Determine if changes require frontend, backend, or both
3. Update `app.js` for frontend logic
4. Create/modify API endpoints in `/pages/api/` directory
5. Update `style.css` for UI changes
6. Update database schema in `schema.sql` if needed
7. Test complete flow end-to-end
8. **Update all relevant documentation files**

---

## Final Reminder for Copilot

**🚨 CRITICAL**: Every time you work on this project:
1. **Start by reading all `.md` documentation files**
2. **Understand the current architecture before making changes**  
3. **After making any modifications, update the relevant documentation**
4. **This creates a positive feedback loop where documentation stays current and Copilot becomes more effective over time**

This documentation-first approach ensures the project remains maintainable and Copilot can provide consistently high-quality assistance.