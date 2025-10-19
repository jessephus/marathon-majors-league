# Documentation Index

Welcome to the Fantasy NY Marathon documentation! This index helps you find the right documentation for your needs.

## 📚 Quick Start Guides

### For End Users
- **[User Guide](USER_GUIDE.md)** - Complete guide for players and commissioners
  - How to join a game
  - Ranking athletes
  - Viewing your team
  - Following live results

### For Developers
- **[Development Guide](DEVELOPMENT.md)** - Local development setup and coding standards
- **[Deployment Guide](DEPLOYMENT.md)** - How to deploy your own instance

## 🏗️ Architecture & Design

- **[Architecture Guide](ARCHITECTURE.md)** - Complete technical architecture and system design
  - Technology stack
  - Data models
  - API endpoints
  - Security architecture

- **[Database Guide](DATABASE.md)** - Database schema, initialization, and troubleshooting
  - Complete schema reference
  - Initialization process
  - Troubleshooting common issues
  - Migration guide

## 🔄 Automated Sync System

- **[Sync Top 100 Guide](SYNC_TOP_100.md)** - Automated World Athletics data sync
  - How the sync system works
  - Command-line usage
  - GitHub Actions automation
  - Performance optimization

- **[Dropped Athlete Sync](DROPPED_ATHLETE_SYNC.md)** - Keeping historical athletes updated
  - How dropped athletes are tracked
  - Performance impact
  - Usage examples

## 🎮 Features

- **[Live Results Feature](LIVE_RESULTS_FEATURE.md)** - Real-time race result updates
  - Commissioner workflow
  - Player experience
  - Split timing support

## 🗄️ Database & Setup

- **[Neon Setup Guide](NEON_SETUP.md)** - Initial Neon Postgres setup
- **[Postgres Reference](POSTGRES_REFERENCE.md)** - SQL queries and examples
- **[Migration Guide](MIGRATION.md)** - Database migration history
- **[Data Persistence Guide](DATA_PERSISTENCE.md)** - How data persists across deployments

## 🧪 Testing

- **[Testing Guide](TESTING.md)** - Testing procedures and best practices

## 📝 Project History

- **[Changelog](CHANGELOG.md)** - Version history and notable changes

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
3. [Data Persistence Guide](DATA_PERSISTENCE.md) - Understanding deployments

### I Want to Contribute Code
Read these in order:
1. [Development Guide](DEVELOPMENT.md) - Setup and standards
2. [Architecture Guide](ARCHITECTURE.md) - System design
3. [Database Guide](DATABASE.md) - Data models
4. [Testing Guide](TESTING.md) - Testing approach

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
| [CHANGELOG.md](CHANGELOG.md) | Version history and project evolution |
| [DATABASE.md](DATABASE.md) | Database schema, init, and troubleshooting |
| [DATA_PERSISTENCE.md](DATA_PERSISTENCE.md) | How data persists across deployments |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Vercel deployment instructions |
| [DEVELOPMENT.md](DEVELOPMENT.md) | Development environment and standards |
| [DROPPED_ATHLETE_SYNC.md](DROPPED_ATHLETE_SYNC.md) | Dropped athlete tracking feature |
| [LIVE_RESULTS_FEATURE.md](LIVE_RESULTS_FEATURE.md) | Live result update system |
| [MIGRATION.md](MIGRATION.md) | Database migration history |
| [NEON_SETUP.md](NEON_SETUP.md) | Neon Postgres setup guide |
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

**Note:** This documentation is actively maintained. Last major update: October 2025 (Dropped Athlete Sync feature)
