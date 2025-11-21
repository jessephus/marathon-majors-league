# UI/UX Audit and Interface Inventory

**Document Version:** 1.0  
**Last Updated:** November 20, 2025  
**Purpose:** Comprehensive audit of all current interfaces, pages, and UI elements for redesign planning (Issue #59)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Complete Interface Inventory](#complete-interface-inventory)
3. [User Flows and Journeys](#user-flows-and-journeys)
4. [Mobile vs Desktop Variants](#mobile-vs-desktop-variants)
5. [Deprecated and Legacy Elements](#deprecated-and-legacy-elements)
6. [Gap Analysis](#gap-analysis)
7. [Recommendations and Priorities](#recommendations-and-priorities)

---

## Executive Summary

### Current State
The Marathon Majors Fantasy League (MMFL) application currently consists of:
- **5 main pages** (SSR-enabled Next.js pages)
- **18 React components** (modular UI elements)
- **8 modal/overlay interfaces** (popups and interactive dialogs)
- **4 commissioner admin panels** (dynamically loaded management interfaces)
- **1 legacy application** (public/app.js - being phased out)

### Key Findings
- ✅ **Strengths:** Well-organized component structure, modern SSR implementation, mobile-first CSS
- ⚠️ **Challenges:** Mixed legacy/modern code, incomplete migration from app.js, inconsistent UI patterns
- 📊 **Coverage:** Core user flows are complete, but admin/commissioner tools need UX polish
- 🎯 **Priority Gaps:** Onboarding flow, help system, error states, accessibility improvements

---

## Complete Interface Inventory

### 1. Main Pages (5 Total)

#### 1.1 Landing/Home Page (`pages/index.js`)
**Route:** `/`  
**Purpose:** Entry point for all users - team creation, commissioner login, returning users  
**Authentication:** Public (no auth required)  
**SSR:** Yes (server-side session detection)

**Visual Elements:**
- App loading overlay (with spinner animation)
- Page header with gradient background (orange → blue)
- Welcome card with dynamic session-aware content
- Footer with session-aware action buttons

**Interactive Components:**
- **WelcomeCard** - Main hero section with CTAs
- **TeamCreationModal** - Popup for creating new teams
- **CommissionerTOTPModal** - 6-digit TOTP login dialog
- **Footer** - Session-aware navigation and actions

**User Actions:**
- Create new team
- Access commissioner mode (TOTP authentication)
- View existing team (if session exists)
- Navigate to leaderboard

**Mobile Considerations:**
- Single-column layout
- Touch-optimized buttons (min 44px height)
- Simplified header on small screens

---

#### 1.2 Team Session Page (`pages/team/[session].tsx`)
**Route:** `/team/[sessionToken]`  
**Purpose:** Salary cap draft interface and roster management  
**Authentication:** Session token required  
**SSR:** Yes (fetches athlete pool, roster, game state)

**Visual Elements:**
- Page header with gradient
- Team name display with avatar
- Budget tracker (live updating)
- 6 roster slots (3 men, 3 women)
- Athlete selection grid
- Lock time countdown (if applicable)
- Submission confirmation button

**Interactive Components:**
- **RosterSlots** - 6-slot roster display with athlete cards
- **BudgetTracker** - Real-time budget calculation ($30,000 cap)
- **AthleteSelectionModal** - Full-screen athlete browser with filters
- **AthleteModal** - Athlete detail overlay (bio, stats, news)
- **Footer** - Session-aware with delete team option

**User Actions:**
- Select/deselect athletes for roster slots
- View athlete details (modal)
- Save partial roster (auto-save)
- Submit complete roster (locks team)
- Edit roster (if not locked)
- Delete team session
- View leaderboard

**State Management:**
- Roster locked when race starts (rosterLockTime)
- Auto-save on athlete selection
- Real-time budget validation
- Session persistence (90-day token)

**Mobile Considerations:**
- Full-screen modals for athlete selection
- Swipeable athlete cards
- Sticky budget tracker at top
- Condensed roster slot cards

---

#### 1.3 Leaderboard Page (`pages/leaderboard.tsx`)
**Route:** `/leaderboard`  
**Purpose:** Live fantasy standings and race results  
**Authentication:** Public (enhanced for logged-in users)  
**SSR:** Yes (fetches standings, results, game state)

**Visual Elements:**
- Page header
- Tab navigation (Fantasy Standings | Race Results)
- Standings table with rankings
- Results table with scoring breakdown
- Auto-refresh indicator
- Last update timestamp

**Interactive Components:**
- **LeaderboardTable** - Ranked team standings with highlighting
- **ResultsTable** - Race results with athlete performance
- **AthleteModal** - Athlete detail with scoring breakdown
- **Footer** - Navigation actions

**User Actions:**
- Switch between fantasy/race tabs
- Click player to view team details (future)
- Click athlete to view performance breakdown
- Auto-refresh every 60 seconds (when tab focused)

**Data Features:**
- Current user's team highlighted (orange)
- Top 3 teams shown with medals (🥇🥈🥉)
- Real-time point calculations
- Projected vs actual standings
- Temporary scoring indicator

**Mobile Considerations:**
- Horizontal scrolling for wide tables
- Sticky table headers
- Condensed athlete info
- Touch-optimized rows

---

#### 1.4 Commissioner Dashboard (`pages/commissioner.tsx`)
**Route:** `/commissioner`  
**Purpose:** Game management and administration hub  
**Authentication:** TOTP required (server-side cookie check)  
**SSR:** Yes (authentication state passed to client)

**Visual Elements:**
- Page header
- TOTP login modal (if not authenticated)
- Dashboard overview with game statistics
- Navigation buttons to management panels
- Admin action buttons
- Logout button

**Interactive Components:**
- **CommissionerTOTPModal** - 6-digit login (if not authenticated)
- **ResultsManagementPanel** - Dynamic import, race result entry
- **AthleteManagementPanel** - Dynamic import, athlete CRUD
- **TeamsOverviewPanel** - Dynamic import, team list viewer
- **RaceManagementPanel** - Dynamic import, race CRUD
- **SkeletonLoader** - Loading state for dynamic panels
- **Footer** - Commissioner mode with game switcher

**Dashboard Panels (4 Total):**

##### 1.4.1 Results Management Panel
- Race result entry form (splits and finish times)
- Bulk import from CSV
- Live update to all players
- Finalize results button
- Reset results action

##### 1.4.2 Athlete Management Panel
- Add new athlete form
- Edit athlete details
- Toggle athlete confirmation (racing status)
- Sync with World Athletics API
- Athlete list with filters

##### 1.4.3 Teams Overview Panel
- List of all team sessions
- Team roster preview
- Team status (complete/incomplete)
- Delete/suspend team actions
- Export team data

##### 1.4.4 Race Management Panel
- Create new race
- Edit race details
- Set active race
- Manage confirmed athletes
- Race news feed management

**User Actions:**
- Log in with TOTP (6 digits)
- Navigate between dashboard panels
- Manage results, athletes, teams, races
- View game statistics
- Switch between games (multi-tenancy)
- Reset game (with confirmation)
- Load demo data
- View performance dashboard
- Log out

**Mobile Considerations:**
- Single-column dashboard on mobile
- Collapsible panels
- Full-screen modals for forms
- Simplified navigation

---

#### 1.5 Race Detail Page (`pages/race.tsx`)
**Route:** `/race?id=[raceId]`  
**Purpose:** Public race information and athlete roster  
**Authentication:** Public  
**SSR:** Yes (fetches race details and athletes)

**Visual Elements:**
- Page header
- Race title and metadata (location, date, distance)
- Active race badge (if applicable)
- Race description/news section
- Race details grid
- Confirmed athletes section (men/women)
- Call-to-action button (Create Team)

**Interactive Components:**
- **Footer** - Standard navigation
- Athlete cards with photos
- Link to home page

**User Actions:**
- View race information
- Browse confirmed athletes
- Navigate to team creation

**Mobile Considerations:**
- Single-column layout
- Stacked athlete cards
- Scrollable content

---

### 2. Modals and Overlays (8 Total)

#### 2.1 Team Creation Modal (`components/TeamCreationModal.tsx`)
**Trigger:** "Create Team" button on landing page  
**Purpose:** Create new fantasy team with unique session

**Form Fields:**
- Team name input (optional)
- Owner name input (optional)
- Game selection dropdown (default: "default")
- Submit button

**Features:**
- Generates unique session token
- Creates bookmarkable URL
- Auto-saves to localStorage
- 90-day session expiration

**Mobile:** Full-screen overlay on mobile

---

#### 2.2 Commissioner TOTP Modal (`components/CommissionerTOTPModal.tsx`)
**Trigger:** "Commissioner Mode" button OR unauthenticated access to /commissioner  
**Purpose:** 6-digit TOTP authentication for admin access

**Form Fields:**
- TOTP code input (6 digits, numeric only)
- Submit button
- Cancel button

**Features:**
- Input validation (digits only)
- Auto-focus on open
- Escape key to cancel
- Error message display

**Mobile:** Centered modal with large input field

---

#### 2.3 Athlete Selection Modal (`components/AthleteSelectionModal.tsx`)
**Trigger:** Click empty roster slot OR "Change" button on filled slot  
**Purpose:** Browse and select athletes for roster

**Layout:**
- Modal header with title and back button
- Sort/filter tabs (By Rank | By Price | By Name)
- Scrollable athlete list
- Add/Remove buttons per athlete

**Athlete Card Elements:**
- Headshot photo (with fallback avatar)
- Name, country flag
- Personal best time
- Marathon rank
- Salary price
- Add/Remove button (context-aware)

**Features:**
- Dynamic filtering by gender
- Sort by rank, price, or name
- Budget validation (can't exceed $30k)
- Duplicate prevention (can't select same athlete twice)
- Close on selection OR explicit back button

**Mobile:** Full-screen takeover, swipeable list

---

#### 2.4 Athlete Detail Modal (`components/AthleteModal.tsx`)
**Trigger:** Click athlete name/photo in roster, leaderboard, or results  
**Purpose:** Display comprehensive athlete information

**Content Sections:**
- **Header:** Photo, name, country, personal best
- **Bio:** Age, sponsor, marathon rank, road running rank
- **Performance:** Season best, splits (if racing)
- **Scoring:** Points breakdown (if race active)
  - Placement points
  - Time gap bonuses
  - Performance bonuses (negative split, etc.)
  - Record bonuses
- **News:** Recent race results, achievements

**Features:**
- Optional scoring mode (shows fantasy points)
- Responsive image loading
- Fallback for missing data
- Close button and overlay click

**Mobile:** Full-screen on mobile, scrollable content

---

#### 2.5 Points Breakdown Modal (`components/PointsModal.tsx`)
**Trigger:** "View Points" button on leaderboard results  
**Purpose:** Explain scoring calculation for specific athlete

**Content:**
- Athlete name and finish details
- Placement points breakdown
- Time gap bonus explanation
- Performance bonus details
- Record bonus (if applicable)
- Total points summary

**Mobile:** Centered modal with scrollable content

---

#### 2.6 Race Detail Modal (`components/RaceDetailModal.tsx`)
**Trigger:** Click race name in commissioner race management  
**Purpose:** Quick view of race details without navigation

**Content:**
- Race name, date, location
- Event type and distance
- Description
- World Athletics event ID
- Confirmed athlete count
- Edit button (navigates to full form)

**Mobile:** Full-screen modal

---

#### 2.7 App Loading Overlay (inline in index.js)
**Trigger:** Page load (automatic)  
**Purpose:** Show loading state during SSR hydration

**Visual:**
- Full-screen overlay (white background)
- App logo/title
- Loading spinner with text

**Behavior:**
- Auto-hides after React hydration (useEffect)
- 100ms fade-out transition

---

#### 2.8 Session Deletion Confirmation (browser native)
**Trigger:** "Delete My Team" button in footer  
**Purpose:** Confirm permanent team deletion

**Implementation:** `window.confirm()` native dialog  
**Actions:** Cancel or Delete (permanent)

**Note:** Could be upgraded to custom modal for better UX

---

### 3. Reusable Components (18 Total)

#### 3.1 Layout Components

##### Footer (`components/Footer.tsx`)
**Location:** All pages  
**Purpose:** Navigation and session management

**Modes:**
- `home` - Landing page actions
- `team` - Team page actions (with delete option)
- `leaderboard` - Leaderboard navigation
- `commissioner` - Admin actions with logout

**Features:**
- Session-aware button text
- Game switcher (commissioner only)
- Copyright notice
- Conditional rendering based on session state

---

##### WelcomeCard (`components/WelcomeCard.jsx`)
**Location:** Landing page  
**Purpose:** Hero section with dynamic CTAs

**Content Variants:**
- **No session:** "Create Team" + "Commissioner Mode"
- **Team session:** "View My Team" + "Commissioner Mode"
- **Commissioner session:** "Commissioner Dashboard" + team link

**Features:**
- Session type detection
- Dynamic button rendering
- Game feature highlights

---

#### 3.2 Team/Draft Components

##### RosterSlots (`components/RosterSlots.tsx`)
**Location:** Team session page  
**Purpose:** Display 6-slot roster with athlete cards

**Slot Types:**
- M1, M2, M3 (Men)
- W1, W2, W3 (Women)

**States:**
- Empty (clickable to add)
- Filled (shows athlete card with "Change" button)
- Locked (read-only, no changes allowed)

**Features:**
- Gender-grouped display
- Athlete headshot/avatar
- Name, country, PB, rank
- Salary display
- Click to view athlete details
- Change button (opens athlete selection modal)

---

##### BudgetTracker (`components/BudgetTracker.tsx`)
**Location:** Team session page (sticky at top)  
**Purpose:** Real-time budget calculation and validation

**Display Elements:**
- Total budget: $30,000
- Spent: $X,XXX (sum of athlete salaries)
- Remaining: $X,XXX (color-coded)
- Budget bar (visual progress)

**Color States:**
- Green: > $3,000 remaining
- Yellow: $0-$3,000 remaining
- Red: Over budget (negative)

**Features:**
- Live updates on athlete selection
- Budget validation
- Warning messages

---

#### 3.3 Leaderboard Components

##### LeaderboardTable (`components/LeaderboardTable.tsx`)
**Location:** Leaderboard page (Fantasy tab)  
**Purpose:** Display ranked team standings

**Columns:**
- Rank (#1, #2, #3, etc.)
- Team Name
- Total Points
- Average Time (if applicable)

**Features:**
- Current user highlighting (orange background)
- Medal icons for top 3 (🥇🥈🥉)
- Temporary scoring indicator
- Projected vs actual toggle
- Clickable rows (future: team detail modal)

**Mobile:** Horizontal scroll, sticky rank column

---

##### ResultsTable (`components/ResultsTable.tsx`)
**Location:** Leaderboard page (Race tab)  
**Purpose:** Display race results with scoring

**Columns:**
- Placement (1st, 2nd, 3rd, etc.)
- Athlete Name
- Country
- Finish Time
- Points Earned
- View Breakdown button

**Features:**
- Gender-grouped display (Men/Women)
- Clickable athlete rows (opens athlete modal)
- Points breakdown link
- DNF/DNS handling

**Mobile:** Horizontal scroll, condensed columns

---

#### 3.4 Commissioner Components

##### SkeletonLoader (`components/commissioner/SkeletonLoader.tsx`)
**Location:** Commissioner dashboard (during dynamic imports)  
**Purpose:** Loading placeholder for panels

**Visual:** Animated gray bars mimicking content layout

---

##### ResultsManagementPanel (`components/commissioner/ResultsManagementPanel.tsx`)
**Location:** Commissioner dashboard  
**Purpose:** Enter and manage race results

**Form Fields:**
- Athlete selection dropdown
- Split times (5K, 10K, Half, 30K, 35K, 40K)
- Finish time
- Placement
- Submit button

**Features:**
- Bulk CSV import
- Live update to all players
- Finalize results
- Reset results
- Athlete list with current times

**Mobile:** Vertical form layout, full-screen modal

---

##### AthleteManagementPanel (`components/commissioner/AthleteManagementPanel.tsx`)
**Location:** Commissioner dashboard  
**Purpose:** Manage athlete database

**Sections:**
- Add new athlete form
- Athlete list with edit/delete actions
- Confirmation toggle (racing status)
- Sync with World Athletics

**Features:**
- CRUD operations
- World Athletics API integration
- Athlete photo upload
- Filtering and search

**Mobile:** Single-column form, list view

---

##### TeamsOverviewPanel (`components/commissioner/TeamsOverviewPanel.tsx`)
**Location:** Commissioner dashboard  
**Purpose:** View and manage team sessions

**Display:**
- Team name, owner, session token
- Roster preview (6 athletes)
- Roster status (complete/incomplete)
- Actions (delete, suspend, export)

**Features:**
- Team list with filters
- Session management
- Bulk export

**Mobile:** Card-based layout, scrollable list

---

##### RaceManagementPanel (`components/commissioner/RaceManagementPanel.tsx`)
**Location:** Commissioner dashboard  
**Purpose:** Manage race events

**Features:**
- Create new race
- Edit race details
- Set active race
- Manage confirmed athletes
- Race news feed

**Mobile:** Full-screen forms, list view

---

#### 3.5 Utility Components

##### PerformanceDashboard (`components/PerformanceDashboard.tsx`)
**Location:** Available globally (dev mode)  
**Purpose:** Monitor dynamic import performance

**Metrics:**
- Chunk load times
- Cache hit/miss rates
- Bundle sizes
- Network requests

**Access:** Development mode only

---

### 4. Legacy Application (Deprecated)

#### app.js (public/app.js)
**Status:** ⚠️ Being phased out  
**Purpose:** Original vanilla JS application (pre-React migration)

**Remaining Functionality:**
- Some event handlers
- Legacy state management
- Fallback UI rendering

**Migration Status:**
- ✅ Landing page → React (index.js)
- ✅ Team page → React ([session].tsx)
- ✅ Leaderboard → React (leaderboard.tsx)
- ✅ Commissioner → React (commissioner.tsx)
- ⏳ Some utility functions still referenced

**Deprecation Plan:** Remove completely after Phase 5 migration (Q1 2026)

---

## User Flows and Journeys

### Flow 1: New Player Creating Team

```
Landing Page (/)
  ↓ Click "Create Team"
Team Creation Modal
  ↓ Enter name (optional) → Submit
Team Session Page (/team/[token])
  ↓ Select athletes (fill 6 slots)
Athlete Selection Modal (per slot)
  ↓ Browse, filter, select
Roster View (6/6 filled)
  ↓ Click "Submit Roster"
Confirmation Message
  ↓ Race starts...
Leaderboard Page (/leaderboard)
  ↓ Watch live standings
```

**Steps:** 7 screens, 2 modals, ~5-10 minutes  
**Friction Points:**
- No onboarding/tutorial
- Unclear budget constraints until you exceed
- No athlete comparison tool
- Can't preview team before final submission

---

### Flow 2: Returning Player

```
Landing Page (/)
  ↓ Session detected (localStorage)
WelcomeCard (with "View My Team" button)
  ↓ Click "View My Team"
Team Session Page (/team/[token])
  ↓ View roster (locked if race started)
  ↓ Navigate to leaderboard
Leaderboard Page
  ↓ View standings, results
```

**Steps:** 3 screens, 0 modals, ~30 seconds  
**Friction Points:**
- No indication of race status on landing page
- Can't edit team name after creation
- No team history or stats

---

### Flow 3: Commissioner Creating Game

```
Landing Page (/)
  ↓ Click "Commissioner Mode"
Commissioner TOTP Modal
  ↓ Enter 6-digit code → Submit
Commissioner Dashboard (/commissioner)
  ↓ View game stats
  ↓ Click "Manage Races"
Race Management Panel
  ↓ Create new race → Fill form
  ↓ Confirm athletes
Athlete Management Panel
  ↓ Toggle athlete confirmations
  ↓ Return to dashboard
Share game link with players
```

**Steps:** 6 screens, 1 modal, 3 panels, ~10-15 minutes  
**Friction Points:**
- No game setup wizard
- Unclear race configuration options
- Can't preview player experience
- No bulk athlete confirmation

---

### Flow 4: Commissioner Entering Results

```
Commissioner Dashboard
  ↓ Click "Manage Results"
Results Management Panel
  ↓ Enter results for each athlete
  ↓ Save intermediate results
  ↓ Click "Finalize Results"
Confirmation Dialog
  ↓ Confirm finalization
Results Locked
```

**Steps:** 4 screens, 1 confirmation, ~30-60 minutes  
**Friction Points:**
- Manual entry for each athlete
- No bulk import validation
- Can't preview leaderboard changes
- No undo after finalization

---

## Mobile vs Desktop Variants

### Responsive Breakpoints

```css
/* Mobile First (default) */
@media (min-width: 768px) { /* Tablet */ }
@media (min-width: 1024px) { /* Desktop */ }
```

### Component-Specific Adaptations

| Component | Mobile | Tablet | Desktop |
|-----------|--------|--------|---------|
| **Header** | Single-line, smaller font | Two-line with subtitle | Full header with branding |
| **WelcomeCard** | Vertical buttons, full-width | Side-by-side buttons | Card with max-width |
| **RosterSlots** | Stacked 1x6 | 2x3 grid | 3x2 grid |
| **BudgetTracker** | Sticky top, condensed | Inline, full details | Sidebar (future) |
| **AthleteSelectionModal** | Full-screen takeover | 80% width, centered | 60% width, centered |
| **LeaderboardTable** | Horizontal scroll, sticky columns | Full table, all columns | Full table with hover states |
| **Footer** | Stacked buttons, full-width | Inline buttons | Inline with copyright |
| **Commissioner Dashboard** | Single column, collapsible | 2-column layout | 3-column grid |

### Mobile-Specific Features

✅ **Implemented:**
- Touch-optimized button sizes (44px minimum)
- Swipeable athlete cards
- Full-screen modals
- Sticky headers
- Hamburger menu (footer simplified)
- Auto-hide navigation on scroll (future)

❌ **Missing:**
- Pull-to-refresh
- Gesture navigation (swipe to go back)
- Native app wrapper (PWA)
- Offline mode
- Push notifications (for race updates)

---

## Deprecated and Legacy Elements

### 1. Snake Draft System (DEPRECATED)
**Status:** ⚠️ Fully deprecated, not removed yet  
**Location:** Database tables + API endpoints

**Elements:**
- `player_rankings` table (player athlete preferences)
- `draft_teams` table (post-draft assignments)
- `/api/draft` endpoint (snake draft execution)
- `/api/rankings` endpoint (player ranking submission)

**Reason for Deprecation:** Replaced by salary cap draft system (daily fantasy style)

**Migration Path:** All new games use `salary_cap_teams` table and `/api/salary-cap-draft` endpoint

**Removal Plan:** Keep for backward compatibility with old games, remove in v3.0 (2026)

---

### 2. Legacy Authentication (player codes)
**Status:** ⚠️ Soft deprecated, still functional  
**Location:** Session system, game state

**Elements:**
- Simple player codes (RUNNER, SPRINTER, etc.)
- Commissioner password ("kipchoge")
- No user accounts

**Current System:** Session tokens (90-day expiration)

**Future System:** User accounts with TOTP, SMS, magic links (partially implemented)

**Migration Path:** Gradual rollout, maintain backward compatibility

---

### 3. Monolithic app.js
**Status:** ⚠️ Being phased out  
**Location:** `public/app.js` (5,000+ lines)

**Reason:** Migrating to React components for better maintainability

**Migration Status:**
- ✅ Phase 1: Utilities extracted
- ✅ Phase 3: State management (React Context)
- ✅ Phase 4: Component extraction (80% complete)
- ⏳ Phase 5: Final migration (Q1 2026)

---

### 4. Undocumented UI Fragments

**Found in CSS but not rendered:**
- `.snake-draft-container` - Old draft interface
- `.ranking-interface` - Old ranking submission UI
- `.player-code-entry` - Legacy login form

**Action:** Remove from style.css in next major version

---

## Gap Analysis

### 1. Critical Gaps (Fix Before Redesign)

#### 1.1 Onboarding and Help System
**Current State:** No tutorial, no help documentation, no tooltips  
**Impact:** High barrier to entry for new users  
**User Feedback:** "Didn't understand how salary cap works"

**Needed Elements:**
- [ ] Welcome tour (step-by-step walkthrough)
- [ ] Contextual help tooltips
- [ ] Help/FAQ page
- [ ] How-to video embed
- [ ] Example team showcase

---

#### 1.2 Error States and Validation
**Current State:** Minimal error messaging, mostly browser alerts  
**Impact:** Poor UX when things go wrong

**Missing States:**
- [ ] Network error (API failure)
- [ ] Session expired
- [ ] Budget exceeded warning
- [ ] Roster lock approaching notification
- [ ] Form validation errors (inline)
- [ ] 404 page (race not found, team not found)
- [ ] 500 error page (server error)

---

#### 1.3 Loading States
**Current State:** Basic spinner, no skeleton screens  
**Impact:** Perceived slowness, jarring transitions

**Needed:**
- [ ] Skeleton loaders for all data fetching
- [ ] Progressive image loading
- [ ] Optimistic UI updates
- [ ] Loading progress indicators

---

#### 1.4 Accessibility (A11y)
**Current State:** Partial ARIA labels, keyboard nav issues  
**Impact:** Excludes users with disabilities

**Issues:**
- [ ] Missing focus indicators
- [ ] Incomplete keyboard navigation
- [ ] No screen reader announcements
- [ ] Low color contrast in some areas
- [ ] Missing skip-to-content link

---

#### 1.5 Notifications System
**Current State:** No notification system  
**Impact:** Users miss important updates

**Needed:**
- [ ] Toast notifications (success, error, info)
- [ ] In-app notification center
- [ ] Email notifications (optional)
- [ ] SMS notifications (optional)
- [ ] Browser push notifications (PWA)

---

### 2. Important Gaps (High Priority)

#### 2.1 Athlete Comparison Tool
**Use Case:** Compare multiple athletes before selection  
**Current Workaround:** Open athlete modal repeatedly

**Needed Features:**
- Side-by-side athlete comparison (2-4 athletes)
- Stats comparison table
- Price vs value analysis
- "Add to roster" from comparison view

---

#### 2.2 Team Management Features
**Current State:** Limited team customization

**Missing Features:**
- [ ] Edit team name after creation
- [ ] Team logo/avatar customization
- [ ] Favorite athletes list
- [ ] Team history (past games)
- [ ] Performance analytics

---

#### 2.3 Social Features
**Current State:** No social interaction

**Potential Features:**
- [ ] Share team link (social media)
- [ ] Private league invitations
- [ ] Trash talk/chat (within league)
- [ ] Leaderboard sharing (screenshot)
- [ ] Team comparison (vs friends)

---

#### 2.4 Commissioner Workflow Improvements
**Current State:** Multi-step, manual processes

**Improvements Needed:**
- [ ] Game setup wizard (step-by-step)
- [ ] Result entry automation (API integration)
- [ ] Bulk athlete confirmation
- [ ] League templates (save settings)
- [ ] Commissioner analytics dashboard

---

#### 2.5 Search and Filtering
**Current State:** Basic sort in athlete selection

**Enhancements:**
- [ ] Global search (athletes, teams, races)
- [ ] Advanced filters (by country, rank, price range)
- [ ] Filter presets ("Best Value", "Top Performers")
- [ ] Search history
- [ ] Saved searches

---

### 3. Nice-to-Have Improvements (Lower Priority)

#### 3.1 Progressive Web App (PWA)
- [ ] Install prompt
- [ ] Offline mode (cached athletes)
- [ ] App icon on home screen
- [ ] Splash screen
- [ ] Push notifications

---

#### 3.2 Advanced Analytics
- [ ] Team performance dashboard
- [ ] Athlete trend analysis
- [ ] Salary cap optimization suggestions
- [ ] Historical data charts
- [ ] Projection accuracy tracking

---

#### 3.3 Gamification
- [ ] Achievements/badges
- [ ] Streak tracking (consecutive games)
- [ ] Leaderboard all-time rankings
- [ ] Experience points (XP)
- [ ] Profile levels

---

#### 3.4 Multi-Race Season League
**Current:** Single race focus  
**Future:** Track performance across multiple major marathons

Features:
- [ ] Season-long standings
- [ ] Multi-race roster management
- [ ] Cumulative scoring
- [ ] Season finale bonuses

---

#### 3.5 Enhanced Mobile Features
- [ ] Native app (iOS/Android)
- [ ] Apple Watch companion
- [ ] Live race tracking with GPS
- [ ] Augmented reality (AR) race viewer
- [ ] Mobile-specific gestures (swipe, pinch-to-zoom)

---

## Recommendations and Priorities

### Phase 1: Pre-Redesign Fixes (4-6 weeks)

**Priority:** Critical gaps that affect current user experience

1. **Onboarding Flow** (2 weeks)
   - Welcome tour (first-time users)
   - Help tooltips on key features
   - How-to-play page

2. **Error Handling** (1 week)
   - Comprehensive error messages
   - 404 and 500 pages
   - Form validation improvements

3. **Accessibility Audit** (1 week)
   - Keyboard navigation testing
   - Screen reader compatibility
   - Color contrast fixes

4. **Notification System** (2 weeks)
   - Toast notifications (react-hot-toast)
   - In-app notification center
   - Roster lock warnings

**Outcome:** Improved user experience, reduced support requests

---

### Phase 2: Redesign Foundation (6-8 weeks)

**Priority:** Establish new design system and component library

1. **Design System** (2 weeks)
   - Typography scale
   - Color palette refresh
   - Spacing system
   - Component variants

2. **Component Library Audit** (1 week)
   - Catalog all components
   - Identify inconsistencies
   - Plan for Storybook integration

3. **Mobile-First Redesign** (3 weeks)
   - Landing page refresh
   - Team page optimization
   - Leaderboard improvements

4. **Branding Update** (2 weeks)
   - Logo refresh (keep 🗽 concept)
   - Tagline evolution
   - Marketing materials

**Outcome:** Modern, cohesive design system

---

### Phase 3: Feature Enhancement (8-10 weeks)

**Priority:** High-value features from gap analysis

1. **Athlete Comparison Tool** (2 weeks)
   - Side-by-side comparison
   - Stats table
   - Quick add to roster

2. **Team Management** (2 weeks)
   - Edit team name
   - Avatar customization
   - Team history

3. **Commissioner Wizard** (2 weeks)
   - Step-by-step game setup
   - Result entry improvements
   - Analytics dashboard

4. **Search & Filter Enhancements** (2 weeks)
   - Global search
   - Advanced filters
   - Filter presets

5. **PWA Implementation** (2 weeks)
   - Service worker
   - Offline mode
   - Install prompt

**Outcome:** Feature-complete platform ready for growth

---

### Phase 4: Advanced Features (10-12 weeks)

**Priority:** Nice-to-have features for differentiation

1. **Social Features** (3 weeks)
   - Sharing capabilities
   - League chat
   - Team comparison

2. **Advanced Analytics** (3 weeks)
   - Performance dashboards
   - Trend analysis
   - Optimization suggestions

3. **Gamification** (2 weeks)
   - Achievements
   - Leaderboard rankings
   - Profile levels

4. **Multi-Race Season** (4 weeks)
   - Season standings
   - Multi-race roster
   - Cumulative scoring

**Outcome:** Premium fantasy sports experience

---

### Metrics for Success

**User Engagement:**
- ✅ Reduce onboarding drop-off by 40%
- ✅ Increase session duration by 30%
- ✅ Improve mobile conversion rate by 50%

**Performance:**
- ✅ Page load time < 2 seconds
- ✅ Time to interactive < 3 seconds
- ✅ Lighthouse score > 90

**Accessibility:**
- ✅ WCAG 2.1 AA compliance
- ✅ Keyboard navigation on all flows
- ✅ Screen reader compatibility

**Conversion:**
- ✅ 60% of visitors create a team
- ✅ 80% of teams complete roster
- ✅ 50% return for second race

---

## Appendix

### A. Component File Structure

```
components/
├── layout/
│   ├── Footer.tsx
│   └── WelcomeCard.jsx
├── team/
│   ├── RosterSlots.tsx
│   ├── BudgetTracker.tsx
│   └── AthleteSelectionModal.tsx
├── leaderboard/
│   ├── LeaderboardTable.tsx
│   └── ResultsTable.tsx
├── modals/
│   ├── TeamCreationModal.tsx
│   ├── CommissionerTOTPModal.tsx
│   ├── AthleteModal.tsx
│   ├── PointsModal.tsx
│   └── RaceDetailModal.tsx
├── commissioner/
│   ├── SkeletonLoader.tsx
│   ├── ResultsManagementPanel.tsx
│   ├── AthleteManagementPanel.tsx
│   ├── TeamsOverviewPanel.tsx
│   └── RaceManagementPanel.tsx
└── utility/
    └── PerformanceDashboard.tsx
```

### B. Page Route Map

```
/ (index.js)                          - Landing page
/team/[session] ([session].tsx)       - Team session page
/leaderboard (leaderboard.tsx)        - Leaderboard page
/commissioner (commissioner.tsx)      - Commissioner dashboard
/race?id=[id] (race.tsx)             - Race detail page
```

### C. API Endpoint Summary

**Public Endpoints:**
- GET `/api/athletes` - Fetch athlete database
- GET `/api/races` - List races
- GET `/api/race-news` - Race news feed
- GET `/api/standings` - Fetch leaderboard standings
- GET `/api/results` - Fetch race results

**Session Endpoints:**
- POST `/api/session/create` - Create new team session
- POST `/api/session/validate` - Validate session token
- POST `/api/session/extend` - Extend session expiration
- POST `/api/session/delete` - Suspend team (soft delete)
- POST `/api/session/hard-delete` - Permanently delete team

**Team Endpoints:**
- GET `/api/salary-cap-draft` - Fetch team roster
- POST `/api/salary-cap-draft` - Save roster
- POST `/api/teams/partial-save` - Auto-save partial roster

**Commissioner Endpoints:**
- POST `/api/auth/totp/verify` - TOTP authentication
- POST `/api/auth/totp/logout` - Log out commissioner
- POST `/api/results` - Update race results
- POST `/api/add-athlete` - Add new athlete
- POST `/api/update-athlete` - Edit athlete
- POST `/api/toggle-athlete-confirmation` - Toggle race confirmation
- POST `/api/reset-game` - Reset game state
- POST `/api/load-demo-data` - Load demo data

### D. Database Schema (Relevant Tables)

```sql
-- Active Tables
athletes              -- Elite runner profiles
races                 -- Marathon events
athlete_races         -- Athlete-race confirmations
games                 -- Game configuration
salary_cap_teams      -- Team rosters (salary cap)
sessions              -- User sessions (90-day tokens)
race_results          -- Race results and scoring

-- Deprecated Tables (keep for old games)
player_rankings       -- Snake draft preferences (⚠️ DEPRECATED)
draft_teams           -- Snake draft assignments (⚠️ DEPRECATED)
```

---

**Document Status:** ✅ Complete  
**Next Review:** January 2026 (after Phase 1 pre-redesign fixes)  
**Maintainer:** Project Team  
**Related Issues:** [#59 - UI Redesign Parent Issue]
