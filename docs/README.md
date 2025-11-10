# Documentation Index

Welcome to the Fantasy NY Marathon documentation! This guide helps you navigate our comprehensive documentation based on your role and needs.

## 📁 Documentation Organization

Our documentation is organized into **5 main categories** with **27 total documents**.

**Naming Convention:** All files are prefixed with their category for easy identification:
- `CORE_*.md` - Essential guides (6 docs)
- `TECH_*.md` - Technical reference (5 docs)
- `FEATURE_*.md` - Game features (6 docs)
- `PROCESS_*.md` - Project history (9 docs)
- `SETUP_*.md` - Configuration guides (1 doc)

---

## 🎯 Start Here (By Role)

### 👤 I'm a Player
**Start with:** [User Guide](CORE_USER_GUIDE.md)  
Learn how to join games, rank athletes, and follow live results.

### 🎮 I'm a Commissioner
**Read these in order:**
1. [User Guide](CORE_USER_GUIDE.md) - Game setup and management
2. [Game Modes Guide](FEATURE_GAME_MODES.md) - Choose your game format
3. [Points Scoring System](FEATURE_POINTS_SCORING_SYSTEM.md) - Understand how scoring works

### 🚀 I Want to Deploy My Own Instance
**Follow this path:**
1. [Deployment Guide](CORE_DEPLOYMENT.md) - Deploy to Vercel
2. [Neon Setup Guide](TECH_NEON_SETUP.md) - Configure database
3. [Authentication Setup](SETUP_AUTHENTICATION.md) - Email/SMS services

### 💻 I Want to Contribute Code
**Read these in order:**
1. [Development Guide](CORE_DEVELOPMENT.md) - Setup and coding standards
2. [Architecture Guide](CORE_ARCHITECTURE.md) - System design
3. [Game Modes Guide](FEATURE_GAME_MODES.md) - Understanding the codebase structure
4. [Database Guide](TECH_DATABASE.md) - Data models and queries

---

## 📚 Complete Documentation Catalog

### 1️⃣ Core Guides (Essential Reading)

| Document | Purpose | When to Read |
|----------|---------|--------------|
| **[CORE_USER_GUIDE.md](CORE_USER_GUIDE.md)** | Complete player and commissioner guide | First time using the app |
| **[CORE_ARCHITECTURE.md](CORE_ARCHITECTURE.md)** | Technical architecture and system design | Understanding the codebase |
| **[CORE_DEVELOPMENT.md](CORE_DEVELOPMENT.md)** | Local development setup and standards | Starting development work |
| **[CORE_DEPLOYMENT.md](CORE_DEPLOYMENT.md)** | Vercel deployment instructions | Deploying your own instance |
| **[CORE_CHANGELOG.md](CORE_CHANGELOG.md)** | Version history with technical notes | Tracking project evolution |

### 2️⃣ Technical Reference (Architecture & Data)

| Document | Purpose | When to Read |
|----------|---------|--------------|
| **[TECH_DATABASE.md](TECH_DATABASE.md)** | Schema, queries, developer reference | Working with database |
| **[TECH_NEON_SETUP.md](TECH_NEON_SETUP.md)** | Neon Postgres initial setup | First-time database setup |
| **[TECH_MIGRATION.md](TECH_MIGRATION.md)** | Database migration history | Understanding schema evolution |
| **[TECH_AUTHENTICATION_API.md](TECH_AUTHENTICATION_API.md)** | Auth API endpoints and examples | Implementing auth features |
| **[TECH_PERFORMANCE_OPTIMIZATION.md](TECH_PERFORMANCE_OPTIMIZATION.md)** | Performance tuning and optimization | Improving app performance |

### 3️⃣ Features (Game Mechanics & Functionality)

| Document | Purpose | When to Read |
|----------|---------|--------------|
| **[FEATURE_GAME_MODES.md](FEATURE_GAME_MODES.md)** | Season League vs Single Race modes | Understanding game structure |
| **[FEATURE_SALARY_CAP_DRAFT.md](FEATURE_SALARY_CAP_DRAFT.md)** | Daily fantasy-style team building | Working on draft features |
| **[FEATURE_POINTS_SCORING_SYSTEM.md](FEATURE_POINTS_SCORING_SYSTEM.md)** | Complete scoring documentation | Understanding/modifying scoring |
| **[FEATURE_ROSTER_LOCK_TIME.md](FEATURE_ROSTER_LOCK_TIME.md)** | Automatic roster locking feature | Working on roster lock logic |
| **[FEATURE_SYNC_TOP_100.md](FEATURE_SYNC_TOP_100.md)** | World Athletics athlete sync system | Maintaining athlete database |
| **[FEATURE_ACCOUNT_FREE_TEAMS.md](FEATURE_ACCOUNT_FREE_TEAMS.md)** | Anonymous team creation feature | Understanding session system |

### 4️⃣ Process & Maintenance (Project History)

| Document | Purpose | When to Read |
|----------|---------|--------------|
| **[PROCESS_MONOLITH_AUDIT.md](PROCESS_MONOLITH_AUDIT.md)** | Monolith audit and modularization guide | Planning componentization |
| **[PROCESS_LANDING_PAGE_SSR_MIGRATION.md](PROCESS_LANDING_PAGE_SSR_MIGRATION.md)** | Landing page SSR migration guide | Implementing/understanding SSR |
| **[PROCESS_COMPLETE_CLEANUP_SUMMARY.md](PROCESS_COMPLETE_CLEANUP_SUMMARY.md)** | Full cleanup session summary | Understanding recent cleanup |
| **[PROCESS_CONSOLIDATION_RECOVERY.md](PROCESS_CONSOLIDATION_RECOVERY.md)** | Documentation consolidation process | Learning from past mistakes |
| **[PROCESS_CONSOLIDATION_PLAN.md](PROCESS_CONSOLIDATION_PLAN.md)** | Original consolidation strategy | Understanding doc organization |
| **[PROCESS_CLEANUP_SUMMARY.md](PROCESS_CLEANUP_SUMMARY.md)** | Code and scripts cleanup | Tracking deprecated code |
| **[PROCESS_EDITABLE_WA_ID_FEATURE.md](PROCESS_EDITABLE_WA_ID_FEATURE.md)** | World Athletics ID editing feature | Feature completion reference |
| **[PROCESS_AUTH_PHASE_2_SUMMARY.md](PROCESS_AUTH_PHASE_2_SUMMARY.md)** | Auth system implementation summary | Understanding auth architecture |
| **[PROCESS_DOCS_HEALTH_CHECK.md](PROCESS_DOCS_HEALTH_CHECK.md)** | Automated documentation health monitoring | Understanding CI/CD health checks |

### 5️⃣ Setup & Authentication

| Document | Purpose | When to Read |
|----------|---------|--------------|
| **[SETUP_AUTHENTICATION.md](SETUP_AUTHENTICATION.md)** | Email/SMS service configuration | Setting up authentication |

---

## 🔍 Quick Reference (Find What You Need)

### Common Tasks

| Task | Documentation |
|------|---------------|
| Set up local development | [CORE_DEVELOPMENT.md](CORE_DEVELOPMENT.md) → Quick Setup |
| Deploy to production | [CORE_DEPLOYMENT.md](CORE_DEPLOYMENT.md) → Manual Setup |
| Configure authentication | [SETUP_AUTHENTICATION.md](SETUP_AUTHENTICATION.md) |
| Understand scoring | [FEATURE_POINTS_SCORING_SYSTEM.md](FEATURE_POINTS_SCORING_SYSTEM.md) |
| Add new athletes | [FEATURE_SYNC_TOP_100.md](FEATURE_SYNC_TOP_100.md) → Manual Process |
| Run database migrations | [TECH_MIGRATION.md](TECH_MIGRATION.md) → Migration Guide |
| Debug database issues | [TECH_DATABASE.md](TECH_DATABASE.md) → Troubleshooting |

### Understanding Features

| Feature | Primary Doc | Related Docs |
|---------|-------------|--------------|
| Game Modes | [FEATURE_GAME_MODES.md](FEATURE_GAME_MODES.md) | CORE_USER_GUIDE.md, FEATURE_SALARY_CAP_DRAFT.md |
| Salary Cap Draft | [FEATURE_SALARY_CAP_DRAFT.md](FEATURE_SALARY_CAP_DRAFT.md) | FEATURE_GAME_MODES.md, FEATURE_POINTS_SCORING_SYSTEM.md |
| Points Scoring | [FEATURE_POINTS_SCORING_SYSTEM.md](FEATURE_POINTS_SCORING_SYSTEM.md) | CORE_DEPLOYMENT.md, CORE_CHANGELOG.md |
| Athlete Sync | [FEATURE_SYNC_TOP_100.md](FEATURE_SYNC_TOP_100.md) | CORE_ARCHITECTURE.md, PROCESS_EDITABLE_WA_ID_FEATURE.md |
| Authentication | [TECH_AUTHENTICATION_API.md](TECH_AUTHENTICATION_API.md) | SETUP_AUTHENTICATION.md, PROCESS_AUTH_PHASE_2_SUMMARY.md |
| Anonymous Teams | [FEATURE_ACCOUNT_FREE_TEAMS.md](FEATURE_ACCOUNT_FREE_TEAMS.md) | CORE_USER_GUIDE.md, CORE_ARCHITECTURE.md |

---

## 📖 Documentation Standards

### Document Types

Our documentation follows these categories:

1. **Guides** - Step-by-step instructions for accomplishing tasks
   - Examples: CORE_USER_GUIDE.md, CORE_DEVELOPMENT.md, CORE_DEPLOYMENT.md
   - Format: Task-oriented with clear sections and code examples
   - Naming: `CORE_*.md` prefix

2. **Reference** - Technical specifications and API documentation
   - Examples: TECH_DATABASE.md, CORE_ARCHITECTURE.md, TECH_AUTHENTICATION_API.md
   - Format: Comprehensive technical details with tables and diagrams
   - Naming: `TECH_*.md` prefix (or `CORE_*.md` if foundational)

3. **Features** - Individual feature documentation
   - Examples: FEATURE_SALARY_CAP_DRAFT.md, FEATURE_POINTS_SCORING_SYSTEM.md
   - Format: Problem statement, solution, implementation, usage
   - Naming: `FEATURE_*.md` prefix

4. **Process** - Project history and maintenance records
   - Examples: CORE_CHANGELOG.md, TECH_MIGRATION.md, PROCESS_CLEANUP_SUMMARY.md
   - Format: Chronological with decision rationale
   - Naming: `PROCESS_*.md` prefix (or `CORE_`/`TECH_` if ongoing)

### When Creating New Documentation

**✅ Create a new doc when:**
- Documenting a major new feature (e.g., FEATURE_SALARY_CAP_DRAFT.md)
- Creating a comprehensive technical reference (e.g., TECH_AUTHENTICATION_API.md)
- Recording a significant process or migration (e.g., PROCESS_CONSOLIDATION_RECOVERY.md)

**❌ Don't create a new doc when:**
- Documenting a small bug fix (add to CORE_CHANGELOG.md instead)
- Making minor feature updates (update existing feature doc)
- Recording implementation details (add to code comments or relevant doc)

### Documentation Lifecycle

1. **Feature Development** → Create feature doc (e.g., FEATURE_NEW_FEATURE.md)
2. **Feature Completion** → Update CORE_CHANGELOG.md with summary
3. **Feature Maturity** → Merge details into relevant guides
4. **Deprecation** → Move to CORE_CHANGELOG.md, delete feature doc

---

## 🤝 Contributing to Documentation

### Before Adding New Documentation

1. **Search existing docs** - Is this covered elsewhere?
2. **Check doc structure** - Which category does it belong to?
3. **Review standards** - Follow the appropriate doc type format
4. **Update this index** - Add your new doc to the catalog above

### Documentation Best Practices

✅ **Do:**
- Use category prefixes in filenames (FEATURE_NAME.md, CORE_NAME.md, etc.)
- Include a table of contents for docs > 200 lines
- Add code examples and screenshots where helpful
- Cross-reference related documentation
- Update CORE_CHANGELOG.md for major changes
- Keep technical details current with code

❌ **Don't:**
- Create redundant documentation
- Document implementation details better suited for code comments
- Write docs without examples
- Forget to update this README.md index
- Leave outdated documentation in place
- Use incorrect category prefixes

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
| Total Documents | 27 files | Well-organized with category prefixes |
| Orphaned Docs | 0 | All docs linked from index |
| Outdated Docs | 0 | Recently consolidated and renamed |
| Missing Docs | 0 | All features documented |
| Broken Links | 0 | Index verified |

**Last Major Cleanup:** November 2025 (42% reduction: 45 → 25 files)  
**Next Review:** February 2026

---

## 🆘 Need Help?

**Can't find what you need?**
1. Use your browser's search (Cmd/Ctrl + F) on this page
2. Check the "Quick Reference" section above
3. Review [CORE_ARCHITECTURE.md](CORE_ARCHITECTURE.md) for system overview
4. Open an issue on GitHub

**Found an error?**
- Submit a PR with corrections
- Follow the contribution guidelines above
- Update this index if you add/remove docs

---

**Last Updated:** November 4, 2025  
**Documentation Maintainer:** Project Contributors  
**Version:** 2.0 (Post-Consolidation)
