# Cleanup Plan - Obsolete Files After Next.js Migration

## Files to DELETE (Obsolete Migration Scripts)

These were one-time migration scripts that are no longer needed:

- `run-migration.js` - Original migration script
- `run-migration-v2.js` - Second attempt
- `run-migration-tryagain.js` - Third attempt  
- `run-migration-final.js` - Final migration
- `check-migration-status.js` - Migration status checker

All migrations are complete and tracked in `migrations/` folder.

## Files to KEEP

### Setup & Utility Scripts
- `setup-commissioner-totp.js` - Might need for new commissioner setup
- `test-commissioner-totp.js` - Useful for testing TOTP

### Database
- `schema.sql` - Needed for fresh deployments
- `migrations/` - Migration history (documentation)

### Scripts Folder
- Keep entire `scripts/` folder - contains data sync utilities
- `requirements.txt` (root) - For Python scripts in scripts/
- `scripts/requirements.txt` - Python dependencies

### Tests
- Keep entire `tests/` folder - test suite

### Documentation
- Keep entire `docs/` folder

### Next.js Project Files
- `pages/` - Next.js pages and API routes
- `public/` - Static assets
- `next.config.js` - Next.js configuration
- `vercel.json` - Deployment configuration
- `package.json` - Dependencies

