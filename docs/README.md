# Documentation Index

Welcome to the Fantasy NY Marathon documentation! This guide helps you navigate our comprehensive documentation based on your role and needs.

## � Documentation Organization

Our documentation is organized into **5 main categories** with **25 total documents**:

1. **Core Guides (6 docs)** - Essential reading for all users
2. **Technical Reference (5 docs)** - Architecture, database, and API documentation
3. **Features (6 docs)** - Game features and scoring system
4. **Process & Maintenance (5 docs)** - Project history and cleanup documentation
5. **Setup & Authentication (3 docs)** - Deployment and authentication configuration

---

## 🎯 Start Here (By Role)

### 👤 I'm a Player
**Start with:** [User Guide](USER_GUIDE.md)  
Learn how to join games, rank athletes, and follow live results.

### 🎮 I'm a Commissioner
**Read these in order:**
1. [User Guide](USER_GUIDE.md) - Game setup and management
2. [Game Modes Guide](GAME_MODES.md) - Choose your game format
3. [Points Scoring System](POINTS_SCORING_SYSTEM.md) - Understand how scoring works

### 🚀 I Want to Deploy My Own Instance
**Follow this path:**
1. [Deployment Guide](DEPLOYMENT.md) - Deploy to Vercel
2. [Neon Setup Guide](NEON_SETUP.md) - Configure database
3. [Authentication Setup](AUTHENTICATION_SETUP.md) - Email/SMS services
4. [Testing Guide](TESTING.md) - Verify everything works

### 💻 I Want to Contribute Code
**Read these in order:**
1. [Development Guide](DEVELOPMENT.md) - Setup and coding standards
2. [Architecture Guide](ARCHITECTURE.md) - System design
3. [Game Modes Guide](GAME_MODES.md) - Understanding the codebase structure
4. [Database Guide](DATABASE.md) - Data models and queries
5. [Testing Guide](TESTING.md) - Testing procedures

---

## 📚 Complete Documentation Catalog

### 1️⃣ Core Guides (Essential Reading)

| Document | Purpose | When to Read |
|----------|---------|--------------|
| **[USER_GUIDE.md](USER_GUIDE.md)** | Complete player and commissioner guide | First time using the app |
| **[ARCHITECTURE.md](ARCHITECTURE.md)** | Technical architecture and system design | Understanding the codebase |
| **[DEVELOPMENT.md](DEVELOPMENT.md)** | Local development setup and standards | Starting development work |
| **[DEPLOYMENT.md](DEPLOYMENT.md)** | Vercel deployment instructions | Deploying your own instance |
| **[TESTING.md](TESTING.md)** | Testing procedures and best practices | Writing or running tests |
| **[CHANGELOG.md](CHANGELOG.md)** | Version history with technical notes | Tracking project evolution |

### 2️⃣ Technical Reference (Architecture & Data)

| Document | Purpose | When to Read |
|----------|---------|--------------|
| **[DATABASE.md](DATABASE.md)** | Schema, queries, developer reference | Working with database |
| **[NEON_SETUP.md](NEON_SETUP.md)** | Neon Postgres initial setup | First-time database setup |
| **[MIGRATION.md](MIGRATION.md)** | Database migration history | Understanding schema evolution |
| **[AUTHENTICATION_API.md](AUTHENTICATION_API.md)** | Auth API endpoints and examples | Implementing auth features |
| **[PERFORMANCE_OPTIMIZATION.md](PERFORMANCE_OPTIMIZATION.md)** | Performance tuning and optimization | Improving app performance |

### 3️⃣ Features (Game Mechanics & Functionality)

| Document | Purpose | When to Read |
|----------|---------|--------------|
| **[GAME_MODES.md](GAME_MODES.md)** | Season League vs Single Race modes | Understanding game structure |
| **[SALARY_CAP_DRAFT.md](SALARY_CAP_DRAFT.md)** | Daily fantasy-style team building | Working on draft features |
| **[POINTS_SCORING_SYSTEM.md](POINTS_SCORING_SYSTEM.md)** | Complete scoring documentation | Understanding/modifying scoring |
| **[ROSTER_LOCK_TIME.md](ROSTER_LOCK_TIME.md)** | Automatic roster locking feature | Working on roster lock logic |
| **[SYNC_TOP_100.md](SYNC_TOP_100.md)** | World Athletics athlete sync system | Maintaining athlete database |
| **[ACCOUNT_FREE_TEAMS.md](ACCOUNT_FREE_TEAMS.md)** | Anonymous team creation feature | Understanding session system |

### 4️⃣ Process & Maintenance (Project History)

| Document | Purpose | When to Read |
|----------|---------|--------------|
| **[COMPLETE_CLEANUP_SUMMARY.md](COMPLETE_CLEANUP_SUMMARY.md)** | Full cleanup session summary | Understanding recent cleanup |
| **[CONSOLIDATION_RECOVERY.md](CONSOLIDATION_RECOVERY.md)** | Documentation consolidation process | Learning from past mistakes |
| **[CONSOLIDATION_PLAN.md](CONSOLIDATION_PLAN.md)** | Original consolidation strategy | Understanding doc organization |
| **[CLEANUP_SUMMARY.md](CLEANUP_SUMMARY.md)** | Code and scripts cleanup | Tracking deprecated code |
| **[EDITABLE_WA_ID_FEATURE.md](EDITABLE_WA_ID_FEATURE.md)** | World Athletics ID editing feature | Feature completion reference |

### 5️⃣ Setup & Authentication

| Document | Purpose | When to Read |
|----------|---------|--------------|
| **[AUTHENTICATION_SETUP.md](AUTHENTICATION_SETUP.md)** | Email/SMS service configuration | Setting up authentication |
| **[PHASE_2_SUMMARY.md](PHASE_2_SUMMARY.md)** | Auth system implementation summary | Understanding auth architecture |

---

## 🔍 Quick Reference (Find What You Need)

### Common Tasks

| Task | Documentation |
|------|---------------|
| Set up local development | [DEVELOPMENT.md](DEVELOPMENT.md) → Quick Setup |
| Deploy to production | [DEPLOYMENT.md](DEPLOYMENT.md) → Manual Setup |
| Configure authentication | [AUTHENTICATION_SETUP.md](AUTHENTICATION_SETUP.md) |
| Understand scoring | [POINTS_SCORING_SYSTEM.md](POINTS_SCORING_SYSTEM.md) |
| Add new athletes | [SYNC_TOP_100.md](SYNC_TOP_100.md) → Manual Process |
| Run database migrations | [MIGRATION.md](MIGRATION.md) → Migration Guide |
| Debug database issues | [DATABASE.md](DATABASE.md) → Troubleshooting |
| Test before deployment | [TESTING.md](TESTING.md) → Pre-Deployment Checklist |

### Understanding Features

| Feature | Primary Doc | Related Docs |
|---------|-------------|--------------|
| Game Modes | [GAME_MODES.md](GAME_MODES.md) | USER_GUIDE.md, SALARY_CAP_DRAFT.md |
| Salary Cap Draft | [SALARY_CAP_DRAFT.md](SALARY_CAP_DRAFT.md) | GAME_MODES.md, POINTS_SCORING_SYSTEM.md |
| Points Scoring | [POINTS_SCORING_SYSTEM.md](POINTS_SCORING_SYSTEM.md) | DEPLOYMENT.md, CHANGELOG.md |
| Athlete Sync | [SYNC_TOP_100.md](SYNC_TOP_100.md) | ARCHITECTURE.md, EDITABLE_WA_ID_FEATURE.md |
| Authentication | [AUTHENTICATION_API.md](AUTHENTICATION_API.md) | AUTHENTICATION_SETUP.md, PHASE_2_SUMMARY.md |
| Anonymous Teams | [ACCOUNT_FREE_TEAMS.md](ACCOUNT_FREE_TEAMS.md) | USER_GUIDE.md, ARCHITECTURE.md |

---

## 📖 Documentation Standards

### Document Types

Our documentation follows these categories:

1. **Guides** - Step-by-step instructions for accomplishing tasks
   - Examples: USER_GUIDE.md, DEVELOPMENT.md, DEPLOYMENT.md
   - Format: Task-oriented with clear sections and code examples

2. **Reference** - Technical specifications and API documentation
   - Examples: DATABASE.md, ARCHITECTURE.md, AUTHENTICATION_API.md
   - Format: Comprehensive technical details with tables and diagrams

3. **Features** - Individual feature documentation
   - Examples: SALARY_CAP_DRAFT.md, POINTS_SCORING_SYSTEM.md
   - Format: Problem statement, solution, implementation, usage

4. **Process** - Project history and maintenance records
   - Examples: CHANGELOG.md, MIGRATION.md, CLEANUP_SUMMARY.md
   - Format: Chronological with decision rationale

### When Creating New Documentation

**✅ Create a new doc when:**
- Documenting a major new feature (e.g., SALARY_CAP_DRAFT.md)
- Creating a comprehensive technical reference (e.g., AUTHENTICATION_API.md)
- Recording a significant process or migration (e.g., CONSOLIDATION_RECOVERY.md)

**❌ Don't create a new doc when:**
- Documenting a small bug fix (add to CHANGELOG.md instead)
- Making minor feature updates (update existing feature doc)
- Recording implementation details (add to code comments or relevant doc)

### Documentation Lifecycle

1. **Feature Development** → Create feature doc (e.g., NEW_FEATURE.md)
2. **Feature Completion** → Update CHANGELOG.md with summary
3. **Feature Maturity** → Merge details into relevant guides
4. **Deprecation** → Move to CHANGELOG.md, delete feature doc

---

## 🤝 Contributing to Documentation

### Before Adding New Documentation

1. **Search existing docs** - Is this covered elsewhere?
2. **Check doc structure** - Which category does it belong to?
3. **Review standards** - Follow the appropriate doc type format
4. **Update this index** - Add your new doc to the catalog above

### Documentation Best Practices

✅ **Do:**
- Use clear, descriptive filenames (FEATURE_NAME.md)
- Include a table of contents for docs > 200 lines
- Add code examples and screenshots where helpful
- Cross-reference related documentation
- Update CHANGELOG.md for major changes
- Keep technical details current with code

❌ **Don't:**
- Create redundant documentation
- Document implementation details better suited for code comments
- Write docs without examples
- Forget to update this README.md index
- Leave outdated documentation in place

### Regular Maintenance

**Quarterly Review Checklist:**
- [ ] Remove obsolete documentation
- [ ] Merge redundant content
- [ ] Update outdated examples
- [ ] Fix broken links
- [ ] Verify all docs are indexed
- [ ] Update version references

---

## 📊 Documentation Health

**Current Status:** ✅ Healthy (November 2025)

| Metric | Status | Notes |
|--------|--------|-------|
| Total Documents | 25 files | Well-organized after cleanup |
| Orphaned Docs | 0 | All docs linked from index |
| Outdated Docs | 0 | Recently consolidated |
| Missing Docs | 0 | All features documented |
| Broken Links | 0 | Index verified |

**Last Major Cleanup:** November 2025 (49% reduction: 45 → 23 files)  
**Next Review:** February 2026

---

## 🆘 Need Help?

**Can't find what you need?**
1. Use your browser's search (Cmd/Ctrl + F) on this page
2. Check the "Quick Reference" section above
3. Review [ARCHITECTURE.md](ARCHITECTURE.md) for system overview
4. Open an issue on GitHub

**Found an error?**
- Submit a PR with corrections
- Follow the contribution guidelines above
- Update this index if you add/remove docs

---

**Last Updated:** November 4, 2025  
**Documentation Maintainer:** Project Contributors  
**Version:** 2.0 (Post-Consolidation)

## 📖 Documentation by Role

### I'm a Player
Start here:
1. [User Guide](USER_GUIDE.md) - Everything you need to play

### I'm a Commissioner
Read these:
1. [User Guide](USER_GUIDE.md) - Setup and management
2. [Live Results Feature](LIVE_RESULTS_FEATURE.md) - Entering results

### I Want to Deploy My Own Instance
Follow this path:
1. [Deployment Guide](DEPLOYMENT.md) - Deploy to Vercel
2. [Neon Setup Guide](NEON_SETUP.md) - Configure database
3. [Authentication Setup Guide](AUTHENTICATION_SETUP.md) - Configure email/SMS services (NEW)
4. [Data Persistence Guide](DATA_PERSISTENCE.md) - Understanding deployments

### I Want to Contribute Code
Read these in order:
1. [Development Guide](DEVELOPMENT.md) - Setup and standards
2. [Architecture Guide](ARCHITECTURE.md) - System design
3. [Game Modes Guide](GAME_MODES.md) - Understanding the two game modes
4. [Testing Guide](TESTING.md) - Test procedures
5. [Legacy Cleanup](LEGACY_CLEANUP.md) - What's deprecated/removed
3. [Database Guide](DATABASE.md) - Data models
4. [Authentication API Reference](AUTHENTICATION_API.md) - Authentication endpoints (NEW)
5. [Testing Guide](TESTING.md) - Testing approach

### I Want to Understand the Sync System
Explore these:
1. [Sync Top 100 Guide](SYNC_TOP_100.md) - Main sync documentation
2. [Dropped Athlete Sync](DROPPED_ATHLETE_SYNC.md) - Advanced feature
3. [Architecture Guide](ARCHITECTURE.md) - How it fits together

## 🔍 Finding What You Need

### Common Questions

**"How do I set up a game?"**
→ [User Guide - For Commissioners](USER_GUIDE.md#for-commissioners)

**"How do I join a game?"**
→ [User Guide - For Players](USER_GUIDE.md#for-players)

**"How do I deploy my own instance?"**
→ [Deployment Guide](DEPLOYMENT.md)

**"How do I set up authentication?"** (NEW)
→ [Authentication Setup Guide](AUTHENTICATION_SETUP.md)

**"How do authentication APIs work?"** (NEW)
→ [Authentication API Reference](AUTHENTICATION_API.md)

**"How does the automated athlete sync work?"**
→ [Sync Top 100 Guide](SYNC_TOP_100.md)

**"My database isn't initializing!"**
→ [Database Guide - Troubleshooting](DATABASE.md#troubleshooting)

**"How do I enter live results?"**
→ [Live Results Feature](LIVE_RESULTS_FEATURE.md)

**"What's the database schema?"**
→ [Database Guide](DATABASE.md#database-schema)

**"How do I run this locally?"**
→ [Development Guide - Quick Setup](DEVELOPMENT.md#quick-setup)

**"What changed in the latest version?"**
→ [Changelog](CHANGELOG.md)

## 📋 Complete File List

| File | Purpose |
|------|---------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Technical architecture and design decisions |
| [AUTHENTICATION_API.md](AUTHENTICATION_API.md) | **NEW:** Complete authentication API documentation |
| [AUTHENTICATION_SETUP.md](AUTHENTICATION_SETUP.md) | **NEW:** Email/SMS service setup for authentication |
| [CHANGELOG.md](CHANGELOG.md) | Version history and project evolution |
| [DATABASE.md](DATABASE.md) | Database schema, init, and troubleshooting |
| [DATA_PERSISTENCE.md](DATA_PERSISTENCE.md) | How data persists across deployments |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Vercel deployment instructions |
| [DEVELOPMENT.md](DEVELOPMENT.md) | Development environment and standards |
| [DROPPED_ATHLETE_SYNC.md](DROPPED_ATHLETE_SYNC.md) | Dropped athlete tracking feature |
| [LIVE_RESULTS_FEATURE.md](LIVE_RESULTS_FEATURE.md) | Live result update system |
| [MIGRATION.md](MIGRATION.md) | Database migration history |
| [NEON_SETUP.md](NEON_SETUP.md) | Neon Postgres setup guide |
| [PHASE_2_SUMMARY.md](PHASE_2_SUMMARY.md) | **NEW:** Authentication system implementation summary |
| [POSTGRES_REFERENCE.md](POSTGRES_REFERENCE.md) | SQL query examples |
| [SYNC_TOP_100.md](SYNC_TOP_100.md) | Automated athlete sync system |
| [TESTING.md](TESTING.md) | Testing procedures |
| [USER_GUIDE.md](USER_GUIDE.md) | Player and commissioner guide |

## 🤝 Contributing

Found a documentation error or want to improve something? Please:

1. Check existing docs to avoid duplication
2. Follow the style of existing documentation
3. Update this index if you add new files
4. Submit a pull request with your changes

## 📞 Support

For questions not covered in the documentation:
- Open an issue on GitHub
- Check existing issues for solutions
- Review the [Architecture Guide](ARCHITECTURE.md) for technical details

---

**Note:** This documentation is actively maintained. Last major update: October 2025 (Authentication System - Phase 2)
