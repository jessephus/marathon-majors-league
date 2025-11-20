# UI Inventory - Quick Reference Guide

**For:** Development team, designers, product managers  
**Purpose:** Quick lookup of all UI elements and their locations  
**Related:** See [PROCESS_UI_UX_AUDIT.md](PROCESS_UI_UX_AUDIT.md) for comprehensive details

---

## 📱 Pages (5)

| Page | Route | Purpose | Key Components |
|------|-------|---------|----------------|
| **Landing** | `/` | Entry point | WelcomeCard, TeamCreationModal, CommissionerTOTPModal |
| **Team Session** | `/team/[token]` | Draft & roster | RosterSlots, BudgetTracker, AthleteSelectionModal |
| **Leaderboard** | `/leaderboard` | Live standings | LeaderboardTable, ResultsTable, AthleteModal |
| **Commissioner** | `/commissioner` | Admin hub | 4 Dynamic Panels, CommissionerTOTPModal |
| **Race Detail** | `/race?id=[id]` | Race info | Athlete cards, race metadata |

---

## 🎨 Components (18)

### Layout (2)
- `Footer` - Session-aware navigation
- `WelcomeCard` - Hero with dynamic CTAs

### Team/Draft (3)
- `RosterSlots` - 6-slot roster display
- `BudgetTracker` - $30k cap tracker
- `AthleteSelectionModal` - Full-screen athlete browser

### Leaderboard (2)
- `LeaderboardTable` - Fantasy standings
- `ResultsTable` - Race results with scoring

### Modals (5)
- `TeamCreationModal` - Create new team
- `CommissionerTOTPModal` - Admin login
- `AthleteModal` - Athlete details + scoring
- `PointsModal` - Points breakdown explanation
- `RaceDetailModal` - Race quick view

### Commissioner (4)
- `ResultsManagementPanel` - Result entry
- `AthleteManagementPanel` - Athlete CRUD
- `TeamsOverviewPanel` - Team list viewer
- `RaceManagementPanel` - Race CRUD

### Utility (2)
- `SkeletonLoader` - Loading placeholder
- `PerformanceDashboard` - Dev metrics (dev mode only)

---

## 🔄 User Flows

### 1. New Player → Team Creation
```
Landing → Create Team Modal → Team Page → Athlete Selection → Submit Roster
```
**Time:** 5-10 minutes | **Friction:** No tutorial, unclear budget

### 2. Returning Player
```
Landing → View Team → Leaderboard
```
**Time:** 30 seconds | **Friction:** No race status indicator on landing

### 3. Commissioner → Game Setup
```
Landing → TOTP Login → Dashboard → Race Management → Athlete Management → Share Link
```
**Time:** 10-15 minutes | **Friction:** No setup wizard

### 4. Commissioner → Results Entry
```
Dashboard → Results Panel → Enter Results → Finalize
```
**Time:** 30-60 minutes | **Friction:** Manual entry, no bulk import validation

---

## 📊 Critical Gaps

### 🔴 High Priority (Fix Before Redesign)
1. **Onboarding Flow** - No tutorial or help system
2. **Error States** - Limited error messaging
3. **Accessibility** - Incomplete keyboard nav, missing ARIA
4. **Notifications** - No toast/alert system

### 🟡 Medium Priority (Feature Enhancement)
1. **Athlete Comparison** - Can't compare athletes side-by-side
2. **Team Management** - Can't edit team name after creation
3. **Commissioner Wizard** - Multi-step setup process
4. **Search & Filter** - Limited athlete filtering

### 🟢 Nice-to-Have
1. **PWA Features** - Offline mode, install prompt
2. **Analytics** - Performance dashboards
3. **Gamification** - Achievements, badges
4. **Social Features** - Sharing, league chat

---

## 📱 Mobile vs Desktop

| Element | Mobile | Desktop |
|---------|--------|---------|
| **Header** | Single-line, small | Full branding |
| **Roster** | Stacked 1x6 | 3x2 grid |
| **Budget Tracker** | Sticky top | Inline |
| **Athlete Modal** | Full-screen | 60% width |
| **Leaderboard** | Horizontal scroll | Full table |
| **Footer** | Stacked buttons | Inline |

**Breakpoints:** 768px (tablet), 1024px (desktop)

---

## ⚠️ Deprecated Elements

| Element | Status | Replacement | Timeline |
|---------|--------|-------------|----------|
| **Snake Draft** | ⚠️ Deprecated | Salary Cap Draft | Keep until v3.0 (2026) |
| **Player Codes** | ⚠️ Soft deprecated | Session Tokens | Gradual migration |
| **app.js** | ⚠️ Being phased out | React Components | Q1 2026 (Phase 5) |
| **Legacy Auth** | ⚠️ Soft deprecated | TOTP/Magic Links | Gradual rollout |

---

## 🎯 Recommended Roadmap

### Phase 1: Pre-Redesign Fixes (4-6 weeks)
- Onboarding flow + help tooltips
- Error handling improvements
- Accessibility audit
- Toast notification system

### Phase 2: Redesign Foundation (6-8 weeks)
- Design system refresh
- Component library audit
- Mobile-first redesign
- Branding update

### Phase 3: Feature Enhancement (8-10 weeks)
- Athlete comparison tool
- Team management features
- Commissioner wizard
- Search & filter enhancements
- PWA implementation

### Phase 4: Advanced Features (10-12 weeks)
- Social features
- Advanced analytics
- Gamification
- Multi-race season

**Total:** 30-40 weeks

---

## 📋 Checklists

### Before Starting Redesign
- [ ] Complete Phase 1 fixes
- [ ] Establish design system
- [ ] Create component library in Storybook
- [ ] Run accessibility audit
- [ ] User testing on current flows

### During Redesign
- [ ] Mobile-first approach
- [ ] Maintain feature parity
- [ ] A/B test major changes
- [ ] Document design decisions
- [ ] Update this inventory

### After Redesign
- [ ] User acceptance testing
- [ ] Performance benchmarks
- [ ] Accessibility validation
- [ ] Update all documentation
- [ ] Remove deprecated elements

---

## 🔗 Related Documentation

- **[PROCESS_UI_UX_AUDIT.md](PROCESS_UI_UX_AUDIT.md)** - Full detailed audit
- **[CORE_ARCHITECTURE.md](CORE_ARCHITECTURE.md)** - Technical architecture
- **[CORE_USER_GUIDE.md](CORE_USER_GUIDE.md)** - User-facing documentation
- **[FEATURE_GAME_MODES.md](FEATURE_GAME_MODES.md)** - Game mechanics
- **[PROCESS_TECH_DEBT.md](PROCESS_TECH_DEBT.md)** - Technical debt tracking

---

**Last Updated:** November 20, 2025  
**Maintainer:** Project Team  
**Related Issue:** [#59 - UI Redesign](https://github.com/jessephus/marathon-majors-league/issues/59)
