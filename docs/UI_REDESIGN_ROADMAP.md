# Redesign Roadmap - Chakra UI Migration

**Document Version:** 2.0  
**Last Updated:** November 21, 2025  
**Purpose:** Phased migration plan from vanilla JS/CSS to modern Chakra UI system  
**GitHub Issue:** [#59 - Redesign UI with Modern Mobile-First Look](https://github.com/jessephus/marathon-majors-league/issues/59)

---

## Executive Summary

This roadmap outlines the complete transformation of Marathon Majors Fantasy League from a vanilla JavaScript/CSS application to a modern, component-based design system built on **Chakra UI v2+**. The redesign introduces:

- **Navy & Gold Brand Palette** (replacing orange/blue)
- **Mobile-First Sticky Navigation** (header + bottom toolbar)
- **Chakra UI Component Library** (consistent, accessible, maintainable)
- **Premium Sports League Aesthetic** (modern, professional, competitive)

**Timeline:** 30-40 weeks (7-10 months)  
**Approach:** Incremental migration with zero downtime  
**Framework:** Next.js 15 + Chakra UI v2 + TypeScript

---

## Table of Contents

1. [Migration Strategy](#migration-strategy)
2. [Phase 1: Foundation & Setup](#phase-1-foundation--setup-4-weeks)
3. [Phase 2: Design System & Tokens](#phase-2-design-system--tokens-6-weeks)
4. [Phase 3: Core Navigation](#phase-3-core-navigation-4-weeks)
5. [Phase 4: Component Migration](#phase-4-component-migration-12-weeks)
6. [Phase 5: Feature Pages](#phase-5-feature-pages-8-weeks)
7. [Phase 6: Polish & Optimization](#phase-6-polish--optimization-4-weeks)
8. [Phase 7: Testing & Launch](#phase-7-testing--launch-2-weeks)
9. [Success Metrics](#success-metrics)
10. [Risk Mitigation](#risk-mitigation)

---

## Migration Strategy

### Core Principles

1. **Zero Downtime:** Users never see broken UI during migration
2. **Progressive Enhancement:** New features work alongside old code
3. **Component-First:** Build reusable Chakra components, not pages
4. **Mobile-First:** Every component starts at 320px width
5. **Accessibility:** WCAG 2.1 AA compliance from day one

### Technical Approach

#### Coexistence Strategy
```
Current State:
├── /public/app.js          (Vanilla JS - 3,000+ lines)
├── /public/style.css       (Vanilla CSS - 2,000+ lines)
└── /components/            (Some React components exist)

Target State:
├── /components/chakra/     (New Chakra components)
├── /theme/                 (Chakra theme config)
├── /public/app-legacy.js   (Renamed, gradually deprecated)
└── /public/style-legacy.css (Renamed, gradually deprecated)
```

#### Gradual Migration Path
1. **Install Chakra:** Add to project without breaking existing code
2. **Create Theme:** Define navy/gold colors, fonts, spacing
3. **Build New Components:** Start with small, isolated components
4. **Replace Old Components:** Swap one at a time, testing between each
5. **Remove Legacy Code:** Clean up after all components migrated

#### Feature Flag System
```typescript
// Already exists in codebase
import { getFeatureFlag } from '@/lib/feature-flags';

// Use to toggle between old and new UI
const useChakraNavigation = getFeatureFlag('chakra_navigation');
```

---

## Phase 1: Foundation & Setup (4 weeks) ✅

**Goal:** Install Chakra UI, configure theme, establish development patterns

**Status:** ✅ Complete  
**Completion Date:** November 21, 2025

### Week 1-2: Chakra Installation & Configuration ✅

#### Tasks
- [x] Install Chakra UI and dependencies
  ```bash
  npm install @chakra-ui/react @chakra-ui/next-js @emotion/react @emotion/styled framer-motion
  ```
- [x] Create Chakra theme configuration (`/theme/index.ts`)
  - Define navy color scale (50-900)
  - Define gold color scale (50-900)
  - Configure fonts (Inter for headings, Roboto for body)
  - Set spacing scale (4px base unit)
  - Define breakpoints
- [x] Wrap app with `ChakraProvider` in `_app.tsx`
- [x] Add Google Fonts (Inter, Roboto)
- [x] Test Chakra components render alongside existing code
- [x] Create demo page (`/chakra-demo`) validating Chakra + legacy coexistence
- [x] Document color contrast and accessibility requirements

#### Deliverables
- ✅ Chakra UI v3 installed and functional
- ✅ Theme file with navy/gold palette (`/theme/`)
- ✅ Fonts loaded and applied globally
- ✅ Demo page showing Chakra + legacy coexistence (`/chakra-demo`)
- ✅ WCAG 2.1 AA accessibility compliance validated
- ✅ Build verification (no breaking changes)

**Documentation Created:**
- `/theme/index.ts` - Main theme system configuration (Chakra UI v3)
- `/theme/colors.ts` - Navy/gold color scales with WCAG validation
- `/theme/typography.ts` - Font system (Inter/Roboto)
- `/theme/components.ts` - Component style overrides
- `pages/chakra-demo.tsx` - Comprehensive validation demo page
- `docs/UI_PHASE1_IMPLEMENTATION.md` - Complete implementation documentation

**GitHub Sub-Issue:** [#119 - Install Chakra UI](https://github.com/jessephus/marathon-majors-league/issues/119)

### Week 3-4: Component Library Audit & Planning ✅

#### Tasks
- [x] Audit existing UI components (see `docs/UI_INVENTORY_QUICK_REFERENCE.md`)
- [x] Map components to Chakra equivalents
  - Buttons → `<Button>`
  - Cards → `<Card>` + `<CardBody>`
  - Modals → `<Modal>`
  - Forms → `<Input>`, `<Select>`, `<FormControl>`
- [x] Create migration priority list (small → large)
- [x] Document component patterns in `/components/chakra/README.md`
- [x] Document navigation specifications for Phase 3 implementation
- [ ] Set up Storybook (optional) for component development

#### Deliverables
- ✅ Component mapping document: `docs/PHASE2_COMPONENT_MAPPING.md`
- ✅ Migration priority matrix (P0/P1/P2 with time estimates)
- ✅ Navigation specifications: `docs/PHASE2_NAVIGATION_SPEC.md`
- ✅ Component pattern documentation: `/components/chakra/README.md`
- ✅ Complete Chakra UI component mapping (26 component types)
- ✅ Implementation guidelines and coexistence strategy
- ⏳ First proof-of-concept Chakra component (Week 1-2 of Phase 1 implementation)

**Completion Date:** November 21, 2025  
**GitHub Sub-Issue:** [#120 - Component Audit](https://github.com/jessephus/marathon-majors-league/issues/120)

**Documentation Created:**
- `docs/PHASE2_COMPONENT_MAPPING.md` - Complete component audit with Chakra mappings
- `docs/PHASE2_NAVIGATION_SPEC.md` - Navigation system specifications (header + bottom toolbar)
- `components/chakra/README.md` - Component patterns and best practices

---

## Phase 2: Design System & Tokens (6 weeks)

**Goal:** Implement complete design system from CORE_DESIGN_GUIDELINES.md

### Week 5-6: Color System

#### Tasks
- [ ] Implement navy color palette in theme
  ```typescript
  colors: {
    navy: {
      50: '#F5F7FA',
      // ... full scale
      900: '#161C4F',
    },
  }
  ```
- [ ] Implement gold color palette
- [ ] Define semantic colors (success, warning, error, info)
- [ ] Test contrast ratios (WCAG AA compliance)
- [ ] Create color usage documentation

#### Deliverables
- ✅ Complete color system in theme config
- ✅ Color contrast validation report
- ✅ Color usage guidelines document

**GitHub Sub-Issue:** [#121 - Design Tokens: Colors](https://github.com/jessephus/marathon-majors-league/issues/121)

### Week 7-8: Typography System

#### Tasks
- [ ] Configure font families (Inter, Roboto)
- [ ] Define type scale (xs → 5xl)
- [ ] Set font weights (normal, medium, semibold, bold)
- [ ] Configure line heights and letter spacing
- [ ] Create heading component variants (H1-H6)
- [ ] Test typography on mobile (readability)

#### Deliverables
- ✅ Typography theme configuration
- ✅ Heading component library
- ✅ Typography usage examples

**GitHub Sub-Issue:** [#121 - Design Tokens: Typography](https://github.com/jessephus/marathon-majors-league/issues/121)

### Week 9-10: Spacing & Layout System

#### Tasks
- [ ] Define spacing scale (4px base unit)
- [ ] Configure container max-widths
- [ ] Set up responsive breakpoints
- [ ] Create layout components
  - `<Container>`
  - `<Stack>` / `<HStack>` / `<VStack>`
  - `<Grid>` / `<SimpleGrid>`
- [ ] Test responsive layouts on all breakpoints

#### Deliverables
- ✅ Spacing system in theme config
- ✅ Layout component library
- ✅ Responsive demo pages

**GitHub Sub-Issue:** [#121 - Design Tokens: Spacing](https://github.com/jessephus/marathon-majors-league/issues/121)

---

## Phase 3: Core Navigation (4 weeks)

**Goal:** Replace existing navigation with sticky header + bottom toolbar

### Week 11-12: Mobile Bottom Toolbar

#### Tasks
- [ ] Design bottom toolbar component (`<BottomNav>`)
  - 4-5 primary navigation items
  - Icon + label format
  - Active state styling (navy)
  - Smooth transitions
- [ ] Implement toolbar visibility logic
  - Fixed position at bottom
  - Hide on desktop (≥768px)
  - Show on mobile (<768px)
- [ ] Add route detection (highlight active page)
- [ ] Test touch targets (44x44px minimum)
- [ ] Add feature flag for gradual rollout

#### Deliverables
- ✅ `<BottomNav>` component
- ✅ Route-aware active states
- ✅ Mobile-only visibility working
- ✅ Feature flag: `chakra_bottom_nav`

**GitHub Sub-Issue:** [#122 - Mobile Bottom Toolbar](https://github.com/jessephus/marathon-majors-league/issues/122)

### Week 13-14: Sticky Header

#### Tasks
- [ ] Design header component (`<StickyHeader>`)
  - Navy background (#161C4F)
  - Logo + wordmark on left
  - Desktop nav links in center
  - User actions on right
- [ ] Implement sticky positioning
  - `position: sticky` + `top: 0`
  - z-index management
  - Shadow on scroll
- [ ] Add responsive behavior
  - Full nav on desktop
  - Logo + hamburger on mobile
- [ ] Test header/footer spacing (no content overlap)

#### Deliverables
- ✅ `<StickyHeader>` component
- ✅ Responsive desktop/mobile layouts
- ✅ Proper z-index layering
- ✅ Feature flag: `chakra_header`

**GitHub Sub-Issue:** [#122 - Sticky Header](https://github.com/jessephus/marathon-majors-league/issues/122)

---

## Phase 4: Component Migration (12 weeks)

**Goal:** Migrate all UI components from vanilla CSS to Chakra

### Week 15-16: Button Components

#### Priority List
1. Primary button (navy solid)
2. Secondary button (navy outline)
3. Gold accent button
4. Ghost button
5. Icon button
6. Loading button states

#### Tasks
- [ ] Create `<Button>` variants in theme
  ```typescript
  Button: {
    variants: {
      primary: { bg: 'navy.500', color: 'white', ... },
      secondary: { variant: 'outline', colorScheme: 'navy' },
      gold: { bg: 'gold.500', color: 'navy.900', ... },
    },
  }
  ```
- [ ] Replace all `<button>` elements in codebase
- [ ] Add hover/active/focus states
- [ ] Test keyboard navigation
- [ ] Update button documentation

#### Deliverables
- ✅ Button component library (6 variants)
- ✅ All legacy buttons replaced
- ✅ Accessibility tested
- ✅ Component documentation

**GitHub Sub-Issue:** [#123 - Component: Buttons](https://github.com/jessephus/marathon-majors-league/issues/123)

### Week 17-19: Card Components

#### Priority List
1. Athlete card (most common)
2. Team card
3. Race card
4. Leaderboard card
5. Stats card

#### Tasks
- [ ] Create base `<Card>` component
  ```tsx
  <Card variant="elevated" size="md">
    <CardHeader>Title</CardHeader>
    <CardBody>Content</CardBody>
    <CardFooter>Actions</CardFooter>
  </Card>
  ```
- [ ] Build specialized cards
  - `<AthleteCard>` (photo, name, country, stats)
  - `<TeamCard>` (roster, points, ranking)
  - `<RaceCard>` (race info, confirmed athletes)
- [ ] Add interactive states (hover, selected)
- [ ] Implement loading skeletons
- [ ] Replace all existing card implementations

#### Deliverables
- ✅ Base `<Card>` component
- ✅ 5 specialized card components
- ✅ All legacy cards replaced
- ✅ Loading skeleton states

**GitHub Sub-Issue:** [#123 - Component: Cards](https://github.com/jessephus/marathon-majors-league/issues/123)

### Week 20-21: Form Components

#### Priority List
1. Text input
2. Select dropdown
3. Form labels
4. Error messages
5. Form layouts

#### Tasks
- [ ] Create form components
  ```tsx
  <FormControl isInvalid={!!error}>
    <FormLabel>Team Name</FormLabel>
    <Input placeholder="Enter name" />
    <FormErrorMessage>{error}</FormErrorMessage>
    <FormHelperText>Helpful tip</FormHelperText>
  </FormControl>
  ```
- [ ] Implement validation states
- [ ] Add focus styling (gold outline)
- [ ] Test accessibility (labels, errors)
- [ ] Replace all form elements

#### Deliverables
- ✅ Form component library
- ✅ Validation state handling
- ✅ All legacy forms replaced
- ✅ Accessibility validated

**GitHub Sub-Issue:** [#123 - Component: Forms](https://github.com/jessephus/marathon-majors-league/issues/123)

### Week 22-24: Modal & Overlay Components

#### Priority List
1. Athlete detail modal (most complex)
2. Team creation modal
3. Confirmation dialogs
4. Loading overlays
5. Toast notifications

#### Tasks
- [ ] Create modal components
  ```tsx
  <Modal isOpen={isOpen} onClose={onClose} size="xl">
    <ModalOverlay />
    <ModalContent>
      <ModalHeader>Title</ModalHeader>
      <ModalCloseButton />
      <ModalBody>Content</ModalBody>
      <ModalFooter>Actions</ModalFooter>
    </ModalContent>
  </Modal>
  ```
- [ ] Implement focus management
- [ ] Add entrance/exit animations
- [ ] Create toast notification system
- [ ] Replace all existing modals

#### Deliverables
- ✅ Modal component library
- ✅ Toast notification system
- ✅ All legacy modals replaced
- ✅ Focus management working

**GitHub Sub-Issue:** [#124 - Component: Modals](https://github.com/jessephus/marathon-majors-league/issues/124)

### Week 25-26: Data Display Components

#### Priority List
1. Table (leaderboard, results)
2. Badge & Tag
3. Avatar
4. Stat display
5. Progress indicators

#### Tasks
- [ ] Create responsive table component
  ```tsx
  <TableContainer>
    <Table variant="striped" colorScheme="navy">
      <Thead>
        <Tr>
          <Th>Rank</Th>
          <Th>Team</Th>
          <Th isNumeric>Points</Th>
        </Tr>
      </Thead>
      <Tbody>{/* Data rows */}</Tbody>
    </Table>
  </TableContainer>
  ```
- [ ] Implement mobile table design (card fallback)
- [ ] Create badge/tag components
- [ ] Add avatar component (athlete photos)
- [ ] Build stat display components
- [ ] Replace all data display elements

#### Deliverables
- ✅ Responsive table component
- ✅ Badge/tag library
- ✅ Avatar component
- ✅ All data displays replaced

**GitHub Sub-Issue:** [#125 - Component: Data Display](https://github.com/jessephus/marathon-majors-league/issues/125)

---

## Phase 5: Feature Pages (8 weeks)

**Goal:** Migrate major feature pages to Chakra layout system

### Week 27-28: Home / Welcome Page

#### Tasks
- [ ] Design new landing page layout
  - Hero section with logo
  - "Create Team" CTA (gold button)
  - Feature highlights
  - Recent race results
- [ ] Implement with Chakra components
- [ ] Add animations (fade-in, slide-up)
- [ ] Test mobile responsiveness
- [ ] A/B test new vs old design

#### Deliverables
- ✅ New home page with Chakra
- ✅ Feature flag: `chakra_home_page`
- ✅ A/B test results

**GitHub Sub-Issue:** [#126 - Page: Home](https://github.com/jessephus/marathon-majors-league/issues/126)

### Week 29-30: Salary Cap Draft Page

#### Tasks
- [ ] Redesign draft interface
  - Athlete browser (left panel)
  - Budget tracker (top sticky)
  - Selected roster (right panel)
  - Mobile: stack vertically
- [ ] Replace budget tracker with Chakra
- [ ] Replace athlete selection cards
- [ ] Implement drag-and-drop (optional)
- [ ] Test on mobile (thumb-zone optimization)

#### Deliverables
- ✅ Redesigned draft page
- ✅ Feature flag: `chakra_draft_page`
- ✅ Mobile optimization complete

**GitHub Sub-Issue:** [#126 - Page: Draft](https://github.com/jessephus/marathon-majors-league/issues/126)

### Week 31-32: Leaderboard / Standings Page

#### Tasks
- [ ] Redesign leaderboard layout
  - Top 3 podium view (visual)
  - Sortable table for all teams
  - Expandable team details
  - Live update indicator
- [ ] Add real-time updates (optimistic UI)
- [ ] Implement medal indicators (gold/silver/bronze)
- [ ] Add team detail expansion panels
- [ ] Test table responsiveness

#### Deliverables
- ✅ Redesigned leaderboard page
- ✅ Real-time updates working
- ✅ Feature flag: `chakra_leaderboard`

### Week 33-34: Athlete Browser Page

#### Tasks
- [ ] Design athlete listing page
  - Filters (gender, country, price range)
  - Sort options (rank, price, name)
  - Grid/list view toggle
  - Search functionality
- [ ] Implement athlete cards (Chakra)
- [ ] Add filter panel
- [ ] Optimize for large datasets (virtualization)
- [ ] Test search performance

#### Deliverables
- ✅ Redesigned athlete browser
- ✅ Filter/search working
- ✅ Feature flag: `chakra_athletes`

---

## Phase 6: Polish & Optimization (4 weeks)

**Goal:** Fine-tune performance, accessibility, and user experience

### Week 35: Performance Optimization

#### Tasks
- [ ] Audit bundle size (Chakra adds ~50KB)
  - Use tree-shaking
  - Lazy-load modals
  - Code-split routes
- [ ] Optimize images (athlete headshots)
  - Use Next.js `<Image>` component
  - Add blur placeholders
  - Implement lazy loading
- [ ] Reduce JavaScript execution time
  - Remove unused Chakra components
  - Minimize re-renders (React.memo)
- [ ] Test Core Web Vitals
  - LCP < 2.5s
  - FID < 100ms
  - CLS < 0.1

#### Deliverables
- ✅ Bundle size report
- ✅ Web Vitals passing targets
- ✅ Performance optimization complete

### Week 36: Accessibility Audit

#### Tasks
- [ ] Run automated accessibility tests
  - Axe DevTools
  - Lighthouse accessibility score
  - WAVE browser extension
- [ ] Manual keyboard navigation testing
  - Tab order logical
  - Focus indicators visible
  - No keyboard traps
- [ ] Screen reader testing
  - NVDA (Windows)
  - JAWS (Windows)
  - VoiceOver (macOS/iOS)
- [ ] Fix all WCAG AA violations

#### Deliverables
- ✅ Accessibility audit report
- ✅ All AA violations fixed
- ✅ Lighthouse score >95

### Week 37: Mobile Device Testing

#### Tasks
- [ ] Test on physical devices
  - iPhone SE (small screen)
  - iPhone 14 Pro (notch)
  - Samsung Galaxy S21 (Android)
  - iPad (tablet)
- [ ] Test touch interactions
  - Tap targets adequate
  - Swipe gestures work
  - No accidental taps
- [ ] Test performance on low-end devices
  - Older iPhones (6s, 7)
  - Budget Android phones
- [ ] Fix mobile-specific bugs

#### Deliverables
- ✅ Mobile testing report
- ✅ All device issues resolved
- ✅ Touch interaction validated

### Week 38: Dark Mode (Optional)

#### Tasks
- [ ] Define dark mode color palette
  - Navy → Lighter navy
  - Gold → Softer gold
  - Backgrounds → Dark gray
- [ ] Implement Chakra color mode
  ```tsx
  const { colorMode, toggleColorMode } = useColorMode();
  ```
- [ ] Test all components in dark mode
- [ ] Add toggle in user settings
- [ ] Respect system preference

#### Deliverables
- ✅ Dark mode theme
- ✅ All components support dark mode
- ✅ System preference detection

---

## Phase 7: Testing & Launch (2 weeks)

**Goal:** Final testing, gradual rollout, legacy code removal

### Week 39: Beta Testing

#### Tasks
- [ ] Deploy to staging environment
- [ ] Invite beta testers (10-20 users)
- [ ] Collect feedback
  - Usability issues
  - Visual bugs
  - Performance problems
- [ ] Create feedback form (Google Forms / Typeform)
- [ ] Triage and fix critical issues

#### Deliverables
- ✅ Beta testing complete
- ✅ Feedback collected and analyzed
- ✅ Critical bugs fixed

### Week 40: Production Launch

#### Tasks
- [ ] Gradual feature flag rollout
  - Week 1: 10% of users
  - Week 2: 25% of users
  - Week 3: 50% of users
  - Week 4: 100% of users
- [ ] Monitor error rates (Sentry, Vercel Analytics)
- [ ] Track user engagement metrics
  - Bounce rate
  - Session duration
  - Conversion rate (team creation)
- [ ] Remove legacy code
  - Delete `/public/app.js`
  - Delete `/public/style.css`
  - Remove feature flags
- [ ] Update documentation

#### Deliverables
- ✅ 100% rollout complete
- ✅ Legacy code removed
- ✅ Documentation updated

---

## Success Metrics

### Quantitative Metrics

**Performance:**
- [ ] Lighthouse Performance Score: >90 (currently ~75)
- [ ] First Contentful Paint: <1.5s (currently ~2.2s)
- [ ] Largest Contentful Paint: <2.5s (currently ~3.1s)
- [ ] Cumulative Layout Shift: <0.1 (currently ~0.25)
- [ ] Bundle Size: <150KB gzipped (currently ~120KB)

**Accessibility:**
- [ ] Lighthouse Accessibility Score: >95 (currently ~85)
- [ ] WCAG 2.1 AA Compliance: 100% (currently ~80%)
- [ ] Keyboard Navigation: All interactions accessible

**User Engagement:**
- [ ] Mobile Bounce Rate: <30% (currently ~40%)
- [ ] Team Creation Rate: >60% (currently ~45%)
- [ ] Session Duration: >5 minutes (currently ~3.5 min)
- [ ] Return Visitor Rate: >40% (currently ~30%)

### Qualitative Metrics

**User Feedback:**
- [ ] Net Promoter Score (NPS): >50 (baseline TBD)
- [ ] Usability Testing: 8/10 average rating
- [ ] Beta Tester Satisfaction: >90% positive

**Developer Experience:**
- [ ] Code Maintainability: Reduced component complexity
- [ ] Development Speed: 50% faster for new features
- [ ] Bug Fix Time: 30% reduction

---

## Risk Mitigation

### Technical Risks

#### Risk: Chakra adds too much bundle size
**Mitigation:**
- Use tree-shaking and selective imports
- Lazy-load large components (modals, tables)
- Consider Chakra CLI for extracting only used components
- Benchmark before/after bundle sizes

#### Risk: Breaking existing functionality during migration
**Mitigation:**
- Feature flag every change
- A/B test new vs old components
- Maintain comprehensive test suite
- Roll out gradually (10% → 100%)

#### Risk: Performance regression on mobile
**Mitigation:**
- Test on low-end devices continuously
- Use React DevTools Profiler
- Implement code-splitting aggressively
- Monitor Core Web Vitals in production

### Project Risks

#### Risk: Timeline slippage (40 weeks is ambitious)
**Mitigation:**
- Build buffer into each phase (2 extra weeks)
- Prioritize ruthlessly (MVP components first)
- Skip optional features (dark mode, animations)
- Extend deadline if quality suffers

#### Risk: Stakeholder dissatisfaction with new design
**Mitigation:**
- Share mockups early (Figma prototypes)
- Conduct usability testing before full build
- Allow for design iteration phase
- Collect continuous user feedback

#### Risk: Loss of unique branding during "modernization"
**Mitigation:**
- Navy/gold palette maintains brand identity
- Logo remains central to design
- Preserve competitive, energetic tone
- Don't blindly follow Chakra defaults - customize

---

## Post-Launch Roadmap

### Immediate (Weeks 41-44)
- [ ] Monitor production metrics daily
- [ ] Fix urgent bugs within 24 hours
- [ ] Collect user feedback via in-app survey
- [ ] Optimize slow pages based on analytics

### Short-Term (Months 2-3)
- [ ] Implement dark mode (if skipped)
- [ ] Add advanced animations (loading, transitions)
- [ ] Build component Storybook for documentation
- [ ] Create design system npm package (for reuse)

### Long-Term (Months 4-6)
- [ ] Redesign commissioner dashboard with Chakra
- [ ] Add PWA features (offline support, push notifications)
- [ ] Implement advanced data visualizations (charts)
- [ ] Expand to other marathons (Boston, Chicago, etc.)

---

## Dependencies & Prerequisites

### Technical Dependencies
- Next.js 15+ (already installed ✅)
- React 18+ (already installed ✅)
- TypeScript 5+ (already configured ✅)
- Chakra UI v2+ (install in Phase 1)

### Team Requirements
- 1 Frontend Developer (full-time)
- 1 Designer (part-time, Phases 2-3)
- 1 QA Tester (part-time, Phases 6-7)
- Stakeholder availability for reviews (weekly)

### Budget Considerations
- **Chakra UI:** Free (MIT license)
- **Google Fonts:** Free
- **Vercel Hosting:** $20/month (Pro plan for staging)
- **Monitoring Tools:** $25/month (Sentry, analytics)
- **Total:** ~$45/month additional cost

---

## Conclusion

This roadmap provides a comprehensive, phased approach to migrating Marathon Majors Fantasy League to a modern Chakra UI design system. By following these phases methodically, we will:

1. **Improve User Experience:** Mobile-first, accessible, fast
2. **Strengthen Brand Identity:** Navy/gold premium aesthetic
3. **Increase Maintainability:** Component-based, well-documented
4. **Enhance Performance:** Optimized bundles, lazy loading
5. **Enable Future Growth:** Scalable design system for new features

**Next Steps:**
1. Stakeholder approval of roadmap
2. Allocate development resources
3. Set up project tracking (GitHub Projects)
4. Begin Phase 1: Foundation & Setup

---

**Document Status:** Active roadmap - update after each phase completion  
**Last Review:** November 21, 2025  
**Next Review:** After Phase 1 completion (Week 4)  
**GitHub Project:** [MMFL Redesign](https://github.com/jessephus/marathon-majors-league/projects)
