# UI Helper Duplication - Technical Debt Documentation

## Status: Documented (Not Yet Resolved)

This document tracks the intentional duplication of UI helper functions across the codebase and provides a plan for eventual consolidation.

## Problem Statement

Three UI helper functions are duplicated across multiple files:

1. **getRunnerSvg(gender)** - Returns default athlete avatar based on gender
2. **getTeamInitials(teamName)** - Generates 1-2 letter initials from team name
3. **createTeamAvatarSVG(teamName, size)** - Creates SVG avatar with initials

### Locations

| Function | File | Lines | Status |
|----------|------|-------|--------|
| All 3 | `lib/ui-helpers.tsx` | Various | ✅ **Source of Truth** (TypeScript, React + DOM versions) |
| All 3 | `lib/ui-helpers.js` | Various | ✅ **JS Bridge** (Vanilla JS compatible) |
| All 3 | `public/app.js` | ~100, ~3246, ~3264 | ⚠️ **Duplicate** (Marked with comments) |
| All 3 | `public/salary-cap-draft.js` | ~15, ~27, ~47 | ⚠️ **Duplicate** (Marked with comments) |

## Why Duplicates Exist

### Technical Constraints

1. **Module System Incompatibility**
   - `lib/ui-helpers.tsx` uses TypeScript and ES6 exports
   - `lib/ui-helpers.js` uses ES6 exports  
   - `public/app.js` and `public/salary-cap-draft.js` are loaded as plain `<script>` tags (not modules)
   - Cannot use `import` statements in non-module scripts

2. **Legacy Architecture**
   - `public/app.js` (6,581 lines) is a monolithic vanilla JS file
   - `public/salary-cap-draft.js` (1,691 lines) is a separate legacy file
   - Both rely on global variables and direct DOM manipulation
   - Not yet converted to React/TypeScript components

3. **Gradual Migration**
   - New components use TypeScript/React versions from `lib/ui-helpers.tsx`
   - Legacy files cannot be instantly converted without breaking production
   - Need incremental refactoring approach

## Impact

### Maintenance Burden

- **3 functions × 4 files = 12 copies** to maintain
- Bug fixes must be applied in multiple places
- Risk of inconsistency between implementations
- ~200 lines of duplicated code

### Current Mitigation

✅ **Documentation Added**
- All duplicate functions marked with `DUPLICATE: See lib/ui-helpers.js` comments
- File headers explain why duplicates exist
- Clear reference to source of truth

✅ **Source of Truth Established**
- `lib/ui-helpers.tsx` is the canonical implementation
- `lib/ui-helpers.js` is a bridge for vanilla JS compatibility
- All new code should import from these modules

## Resolution Plan

### Phase 1: Document (✅ Completed)

- [x] Mark all duplicate functions with comments
- [x] Create this documentation
- [x] Establish source of truth (`lib/ui-helpers.tsx`)
- [x] Create JS bridge module (`lib/ui-helpers.js`)

### Phase 2: Convert to ES6 Modules (Future)

**Option A: Make legacy files ES6 modules**
```html
<!-- In pages/index.js -->
<Script src="/app.js" type="module" strategy="afterInteractive" />
<Script src="/salary-cap-draft.js" type="module" strategy="afterInteractive" />
```

Then update files to use imports:
```javascript
// At top of public/app.js
import { getRunnerSvg, getTeamInitials, createTeamAvatarSVG } from '../lib/ui-helpers.js';

// Remove duplicate function definitions
```

**Risks:**
- May break other code that relies on global function access
- Need to test thoroughly in all browsers
- Potential scope issues with global variables

**Option B: Build step (webpack/rollup)**
- Bundle modules at build time
- Maintain compatibility while using imports
- More complex but safer

### Phase 3: Component Extraction (Preferred Long-term)

Convert legacy files to React components (aligns with PROCESS_MONOLITH_AUDIT.md Phase 4):

1. Extract `public/salary-cap-draft.js` → `src/features/draft/` components
2. Extract `public/app.js` functions → React components in `components/`
3. Delete legacy files once fully converted
4. All code naturally uses shared `lib/ui-helpers.tsx`

**Benefits:**
- Aligns with existing modularization roadmap
- No workarounds needed
- Clean architecture
- Full TypeScript support

## Related Work

### Completed

- ✅ Draft feature module created (`src/features/draft/`)
- ✅ Pure validation and state machine logic extracted
- ✅ 30 comprehensive tests (all passing)
- ✅ Modern components use shared modules (RosterSlots, AthleteSelectionModal, etc.)

### In Progress

- 🔄 Phase 4 component extraction (See PROCESS_MONOLITH_AUDIT.md)
- 🔄 Legacy code migration to React/TypeScript

### Blocked

- ⏳ Complete duplicate removal (blocked until legacy files converted)

## Decision

**We've chosen to document the duplication rather than force an immediate fix** because:

1. ✅ **Safety First**: Changing module loading could break production
2. ✅ **Aligns with Roadmap**: Phase 4 will naturally resolve this
3. ✅ **Clear Documentation**: Duplication is now explicit and tracked
4. ✅ **Source of Truth**: New code uses correct modules
5. ✅ **Temporary State**: This is a known, managed technical debt

## Usage Guidelines

### For New Code

✅ **DO**: Import from shared modules
```javascript
// In React/TypeScript components
import { getRunnerSvg, getTeamInitials, createTeamAvatarSVG } from '@/lib/ui-helpers';

// In vanilla JS (when converted to modules)
import { getRunnerSvg, getTeamInitials, createTeamAvatarSVG } from '../lib/ui-helpers.js';
```

❌ **DON'T**: Copy functions again
```javascript
// Bad - creates more duplicates
function getRunnerSvg(gender) { ... }
```

### For Bug Fixes

If a bug is found in these functions:

1. Fix in `lib/ui-helpers.tsx` (source of truth)
2. Copy fix to `lib/ui-helpers.js`
3. Copy fix to `public/app.js`
4. Copy fix to `public/salary-cap-draft.js`
5. Test all locations

### For Refactoring

When working in legacy files:
- Don't try to "fix" the duplication in isolation
- Wait for Phase 4 component extraction
- Focus on your actual feature/bug fix

## References

- [PROCESS_MONOLITH_AUDIT.md](../docs/PROCESS_MONOLITH_AUDIT.md) - Modularization plan
- [Issue #82](https://github.com/jessephus/marathon-majors-league/issues/82) - Componentization epic
- [PR #109](https://github.com/jessephus/marathon-majors-league/pull/109) - SSR team session (established lib/ui-helpers.tsx)
- `lib/ui-helpers.tsx` - Source of truth (TypeScript/React)
- `lib/ui-helpers.js` - Vanilla JS bridge
- `public/app.js` - Legacy monolith (6,581 lines)
- `public/salary-cap-draft.js` - Legacy draft UI (1,691 lines)

## Timeline

- **November 9, 2025**: lib/ui-helpers.tsx created (PR #109)
- **November 10, 2025**: Duplication documented, JS bridge created
- **Future**: Phase 4 component extraction will resolve naturally

---

**Last Updated**: November 10, 2025  
**Next Review**: After Phase 4 component extraction begins  
**Owner**: @jessephus
