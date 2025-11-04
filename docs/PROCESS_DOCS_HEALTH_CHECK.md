# Documentation Health Check System

## Overview

The Marathon Majors Fantasy League project includes an automated documentation health monitoring system that runs as part of the CI/CD pipeline. This ensures documentation stays organized, current, and maintainable as the project evolves.

## When It Runs

The health check runs automatically in these scenarios:

1. **On Pull Requests** - When documentation files are modified
2. **On Push to Main** - When changes are merged
3. **Weekly Schedule** - Every Monday at 9am UTC
4. **Manual Trigger** - Via GitHub Actions "Run workflow" button

## Health Checks Performed

### 1. File Count Check
**Target**: 20-30 documentation files

- **Warning**: If count exceeds 30 files (suggests over-documentation)
- **Notice**: If count falls below 15 files (suggests under-documentation)
- **Purpose**: Maintain optimal documentation size

### 2. Naming Convention Check
**Requirement**: All docs must use category prefixes

Valid prefixes:
- `CORE_*.md` - Essential guides (6 files)
- `TECH_*.md` - Technical reference (5 files)
- `FEATURE_*.md` - Feature documentation (6 files)
- `PROCESS_*.md` - Process history (6 files)
- `SETUP_*.md` - Configuration guides (1 file)

Exception: `README.md` (index file)

**Warning**: If any files lack category prefixes
**Purpose**: Maintain clear organization and findability

### 3. Duplicate Content Detection
**Check**: Identifies files with similar names

Examples of flagged patterns:
- `DEPLOYMENT.md` and `CORE_DEPLOYMENT.md`
- Multiple files containing "guide", "summary", or "overview"

**Warning**: If 3+ files share common keywords
**Purpose**: Prevent redundant documentation

### 4. Index Accuracy Check
**Verification**: Ensures `docs/README.md` is current

Checks:
- File count mentioned in README matches actual count
- All documentation files are referenced in README
- No orphaned files exist

**Warning**: If README is outdated or orphaned files exist
**Purpose**: Maintain accurate documentation index

### 5. Category Distribution Check
**Balance**: Monitors category sizes

- **Notice**: If PROCESS category exceeds 8 files (suggests cleanup needed)
- **Purpose**: Prevent accumulation of historical process docs

### 6. Temporary File Detection
**Pattern matching**: Identifies potential temporary files

Flagged patterns:
- `*test*.md`
- `*tmp*.md` or `*temp*.md`
- `*debug*.md`
- `*draft*.md`

**Notice**: If temporary files are detected
**Purpose**: Prevent accidental commits of work-in-progress files

## Output Examples

### ✅ Healthy Documentation
```
📚 Documentation Health Check Report

Total documentation files: 25
Category distribution: CORE: 6 | TECH: 5 | FEATURE: 6 | PROCESS: 6 | SETUP: 1

✅ All checks passed!

Documentation health: GOOD
```

### ⚠️ Issues Detected
```
📚 Documentation Health Check Report

Total documentation files: 32
Category distribution: CORE: 6 | TECH: 5 | FEATURE: 8 | PROCESS: 10 | SETUP: 2

Issues Detected:
- ⚠️ High file count: 32 documentation files detected (target: 20-30). Consider consolidation.
- ⚠️ Naming convention violation: 2 files without category prefix: DATABASE.md, CHANGELOG.md
- ⚠️ PROCESS category growing: 10 files in PROCESS category. Consider archiving completed processes.
- ⚠️ Orphaned files: 2 file(s) not referenced in docs/README.md: OLD_FEATURE.md, DEPRECATED.md

💡 Recommendation: Review the Documentation Standards for guidance.
```

## How to Respond to Warnings

### High File Count Warning
**Action**: Review documentation for consolidation opportunities
1. Look for overlapping content
2. Merge related documents
3. Archive completed process docs
4. See [Consolidation Guide](PROCESS_CONSOLIDATION_RECOVERY.md)

### Naming Convention Violation
**Action**: Rename files with appropriate category prefix
```bash
git mv DATABASE.md TECH_DATABASE.md
git mv CHANGELOG.md CORE_CHANGELOG.md
```

### Orphaned Files
**Action**: Either reference in README or delete
1. Add entry to appropriate section in `docs/README.md`
2. Or delete if obsolete: `git rm docs/OBSOLETE_FILE.md`

### PROCESS Category Growing
**Action**: Archive or consolidate completed processes
1. Review PROCESS_* files
2. Merge similar process docs
3. Move summaries to CORE_CHANGELOG.md
4. Delete files for completed one-time processes

### Duplicate Content
**Action**: Review flagged files for redundancy
1. Read both files completely
2. Identify unique vs overlapping content
3. Merge unique content into primary doc
4. Delete redundant file

## Automation Features

### Pull Request Comments
When documentation changes trigger warnings, the workflow automatically:
- Posts a detailed health report as a PR comment
- Updates existing comment if already present
- Provides direct links to relevant files

### Weekly Issues
For scheduled checks that find problems:
- Creates a new issue with "documentation" and "health-check" labels
- Updates existing open issue if one exists
- Prevents spam by checking for existing issues first

### GitHub Actions Summary
Every run includes:
- Summary in GitHub Actions UI
- File count and distribution
- Pass/fail status
- Action recommendations

## Configuration

### Modify Thresholds
Edit `.github/workflows/docs-health-check.yml`:

```yaml
# File count thresholds
if [ "$TOTAL_DOCS" -gt 30 ]; then  # Change 30 to your max
if [ "$TOTAL_DOCS" -lt 15 ]; then  # Change 15 to your min

# PROCESS category threshold
if [ "$PROCESS_COUNT" -gt 8 ]; then  # Change 8 to your max
```

### Modify Schedule
Edit the cron expression:
```yaml
schedule:
  - cron: '0 9 * * 1'  # Every Monday at 9am UTC
  # Examples:
  # - cron: '0 0 * * 0'  # Every Sunday at midnight
  # - cron: '0 12 1 * *' # 1st of every month at noon
```

### Disable Specific Checks
Comment out sections in the workflow file:
```yaml
# Check 3: Detect potential duplicate/redundant filenames
# echo "🔍 Checking for potential duplicate content..."
# (comment out entire check section)
```

## Best Practices

### Regular Maintenance
1. **Review weekly reports** - Check Monday issues
2. **Act on PR warnings** - Fix before merging
3. **Quarterly deep dive** - Manual documentation audit
4. **Update targets** - Adjust thresholds as project grows

### Documentation Lifecycle
Follow the documented lifecycle:
```
Development → Feature Doc Created
     ↓
Completion → Summary added to CORE_CHANGELOG.md
     ↓
Maturity (3-6 months) → Consider merging into parent guide
     ↓
Deprecation → Remove doc, keep summary in CORE_CHANGELOG.md
```

### Prevention Over Reaction
- Use category prefixes from the start
- Update README when adding/removing files
- Consolidate before file count reaches 30
- Archive process docs after completion

## Troubleshooting

### False Positives
If a warning is incorrect:
- **Naming**: Some files may legitimately lack prefixes (e.g., LICENSE.md)
- **Duplicates**: Similar names don't always mean duplicate content
- **Review manually** before taking action

### Workflow Failures
Check:
1. Permissions are correct (`contents: read`, `pull-requests: write`, `issues: write`)
2. Scripts have proper shell escaping
3. GitHub token has necessary scopes

### Updating the Check
After modifying the workflow:
1. Test with `workflow_dispatch` trigger
2. Review GitHub Actions logs
3. Verify PR comments render correctly
4. Check issue creation (if scheduled)

## Future Enhancements

Potential additions:
- [ ] Broken link detection
- [ ] Markdown linting (formatting consistency)
- [ ] Documentation coverage (all features documented?)
- [ ] Image reference validation
- [ ] Code example validation (do examples run?)
- [ ] Readability scoring
- [ ] Documentation age tracking

## Related Documentation

- [Documentation Standards](README.md#-documentation-standards) - Organization rules
- [Consolidation Guide](PROCESS_CONSOLIDATION_RECOVERY.md) - How to merge docs
- [GitHub Actions Docs](https://docs.github.com/en/actions) - Workflow syntax

---

**Maintained by**: GitHub Actions workflow  
**Last Updated**: November 4, 2025  
**Status**: Active and monitoring
