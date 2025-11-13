## 📋 Technical Debt Audit _(Updated November 13, 2025 - Session 2)_

### Overview
This audit re-ran after the landing-page cleanup, duplicate footer removal, and performance test updates. The review covered the entire repository—Next.js pages, legacy public scripts, shared libraries, documentation, and automated tests.

### ✅ Completed Since Previous Audit

**Session 1 (Earlier today):**
- Removed all broken legacy function calls from `pages/index.js` and replaced the static footer markup with the shared `Footer` React component.
- Deleted the duplicate vanilla helper file (`lib/ui-helpers.js`) and the unused caching helper (`public/optimizations.js`).
- Updated `tests/performance-benchmarks.test.js` so it now inspects the real Next.js chunk outputs instead of the removed monolith bundles.
- Full test suite (`npm test`) passes: 8/8 suites, including performance, routing/SSR, salary-cap draft, API, and legacy regression checks.

**Session 2 (Just completed):**
- ✅ **Removed dead window.* bridge functions** - Deleted `window.openModal`, `window.closeModal`, and `window.showPage` from `pages/index.js` (lines 67-89 removed). These were defined but never called - modals are managed by React state.
- ✅ **Cleaned up inline script utilities** - Removed redundant `removeLoadingOverlay()` and `showPage()` function definitions from the inline `<Script>` tag. React useEffect already handles overlay removal (lines 56-65).
- ✅ **Simplified session restoration** - The `initSSRLandingPage()` function now focuses solely on URL-based session validation and storage, with cleaner comments explaining React component boundaries.

### 🔴 Critical / Blocking Issues
- **None discovered.** The application boots cleanly, regression suites pass, and no runtime errors surfaced during manual smoke checks. Continue to run the full test matrix after each major refactor.

### 🟠 High-Priority Debt (Next Up)
1. **Legacy Monolith Scripts (`public/app.js`, `public/salary-cap-draft.js`)**  
   • ~6.7k and ~1.7k lines respectively, loaded as plain scripts with their own global state.  
   • Duplicate utility implementations (`getRunnerSvg`, `createTeamAvatarSVG`, etc.) that now exist in `lib/ui-helpers.tsx`; the two worlds can drift out of sync.  
   • Guard clauses prevent crashes on new pages, but these files still drive the legacy experience and complicate TypeScript adoption.  
   **Recommendation:** Continue Issue #82 Phase 4/5 work—extract remaining functionality into typed modules and React components, then retire these scripts.

2. **React ⇄ Legacy Session State Bridging** _(Partially addressed - window functions removed)_  
   • ✅ **Completed**: Removed unused `window.openModal`/`window.closeModal`/`window.showPage` bridge functions  
   • ⏳ **Remaining**: `WelcomeCard` still reads session data from `window.anonymousSession`/`window.commissionerSession` globals  
   • ⏳ **Remaining**: Session events (`sessionsUpdated`) are actively used - `lib/session-manager.ts` dispatches, `WelcomeCard.jsx` and `Footer.tsx` listen  
   **Recommendation:** Move session state into React Context (enhance `lib/state-provider.tsx`) so `WelcomeCard` can use hooks instead of global objects. After migration, remove browser-level `sessionsUpdated` events.

3. **Duplicate Helpers Embedded in Monoliths**  
   • Even after extracting `lib/ui-helpers.tsx`, the monolith scripts still ship their own copies for compatibility.  
   **Recommendation:** Once the scripts are modularized, replace in-file duplicates with imports from the shared helpers to enforce a single source of truth.

### 🟡 Medium-Priority / Follow-Up Items
- **Global Stylesheet (`public/style.css`)** still contains selectors for legacy DOM nodes. As components migrate to React, audit and prune unused rules or convert critical sections to CSS Modules to prevent regressions.  
- **`public/demo.html`** remains a static utility for loading demo data via legacy endpoints. Confirm whether it is still part of the workflow; if so, consider porting it to a protected Next.js route to align with the main stack.  
- **Session Events Migration** _(Active usage confirmed)_ - `window.dispatchEvent(new CustomEvent('sessionsUpdated'))` is dispatched by `lib/session-manager.ts` (5 locations) and listened to by `WelcomeCard.jsx`, `Footer.tsx`, and `commissioner.tsx`. After centralizing session state in React, remove these browser-level events.

### 🔵 Documented / Monitored Legacy
- **Snake Draft System** (DB tables, API handlers, tests) remains intentionally deprecated but functional for historical leagues. No action required until the product formally drops support.

### ✅ Current Verification Status
- `npm test` (performance, API, routing, integration, legacy, salary-cap draft, DB connection): **PASS** on November 13, 2025 (Session 1).  
- `npm run dev` boots without warnings; manual smoke testing of the landing page, commissioner dashboard, and team flows matches expectations.
- **Next verification needed**: Run tests after window.* bridge removal to confirm no regressions.

### 📌 Recommendations
1. ✅ **Completed**: Remove unused window.* bridge functions from `pages/index.js`  
2. **Next**: Run full test suite to verify window.* bridge removal didn't break legacy compatibility  
3. **Then**: Move `window.anonymousSession`/`window.commissionerSession` into React Context (`lib/state-provider.tsx`)  
4. **After session migration**: Remove `sessionsUpdated` browser events and convert listeners to React state subscriptions  
5. **Finally**: Schedule the next modularization milestone to replace remaining monolith scripts with React/TypeScript (Issue #82)

