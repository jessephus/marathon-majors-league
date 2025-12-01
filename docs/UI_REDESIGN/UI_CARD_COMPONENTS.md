# Card Components Documentation

**Version:** 1.1.0 (Phase 4 Complete)  
**Last Updated:** November 25, 2025  
**Status:** ✅ Complete - All Components Migrated  
**Related Issue:** [#123 - Phase 4: Card Components & Specialized Cards](https://github.com/jessephus/marathon-majors-league/issues/123)

---

## Table of Contents

1. [Overview](#overview)
2. [Card Component (Base)](#card-component-base)
3. [AthleteCard Component](#athletecard-component)
4. [TeamCard Component](#teamcard-component)
5. [RaceCard Component](#racecard-component)
6. [LeaderboardCard Component](#leaderboardcard-component)
7. [StatsCard Component](#statscard-component)
8. [Accessibility Guidelines](#accessibility-guidelines)
9. [Migration Guide](#migration-guide)
10. [Visual Reference](#visual-reference)

---

## Overview

The Marathon Majors Fantasy League card system provides a comprehensive set of accessible, consistent, and visually appealing card components built on Chakra UI v3. All cards follow the design system specified in `docs/CORE_DESIGN_GUIDELINES.md` and are WCAG 2.1 AA compliant.

### Key Features

- **6 Specialized Card Types:** Card, AthleteCard, TeamCard, RaceCard, LeaderboardCard, StatsCard
- **Multiple Variants:** Each card supports different display modes
- **Interactive States:** Hover, selected, disabled, loading
- **Touch-Friendly:** All interactive elements meet WCAG 2.5.5 (≥44px)
- **Responsive Design:** Mobile-first with breakpoint-aware layouts
- **Loading Skeletons:** Built-in loading states for all cards
- **Type-Safe:** Full TypeScript support with exported interfaces

### Component Inventory

| Component | Purpose | Variants | Use Cases |
|-----------|---------|----------|-----------|
| **Card** | Base card foundation | elevated, outline, filled, unstyled | Generic content containers |
| **AthleteCard** | Athlete display | compact, standard, detailed | Athlete browser, draft selection, roster |
| **TeamCard** | Team information | compact, standard, detailed | Leaderboards, team lists, dashboards |
| **RaceCard** | Race/event details | compact, standard, detailed | Race selection, event calendar |
| **LeaderboardCard** | Standings entry | single variant (optimized) | Leaderboard lists, rankings |
| **StatsCard** | Statistics display | single variant (sizes: sm, md, lg) | Dashboards, analytics, reports |

---

## Card Component (Base)

The foundation card component that provides structure for all specialized cards.

### Basic Usage

```tsx
import { Card, CardHeader, CardBody, CardFooter } from '@/components/chakra';

<Card variant="elevated" size="md">
  <CardHeader>
    <Heading as="h3" size="md">Card Title</Heading>
  </CardHeader>
  <CardBody>
    <Text>Card content goes here</Text>
  </CardBody>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### Props

```typescript
interface CardProps {
  children: ReactNode;
  variant?: 'elevated' | 'outline' | 'filled' | 'unstyled';
  size?: 'sm' | 'md' | 'lg';
  isHoverable?: boolean;
  isSelected?: boolean;
  isDisabled?: boolean;
  isLoading?: boolean;
  onClick?: () => void;
  [key: string]: any; // Additional Chakra Box props
}
```

### Variants

#### Elevated (Default)
```tsx
<Card variant="elevated">
  {/* White background with shadow elevation */}
</Card>
```
- **Usage:** Primary content cards, featured items
- **Style:** White background, drop shadow (sm → md on hover)
- **Best For:** Main content areas, important information

#### Outline
```tsx
<Card variant="outline">
  {/* White background with border, no shadow */}
</Card>
```
- **Usage:** Lists, grids, secondary content
- **Style:** White background, 1px gray border
- **Best For:** Collection items, selectable cards

#### Filled
```tsx
<Card variant="filled">
  {/* Gray background, no border or shadow */}
</Card>
```
- **Usage:** Background panels, subtle containers
- **Style:** Gray.50 background, no border
- **Best For:** Subtle emphasis, grouped content

#### Unstyled
```tsx
<Card variant="unstyled">
  {/* No default styling, full control */}
</Card>
```
- **Usage:** Custom implementations
- **Style:** Transparent background, no padding
- **Best For:** Building custom card variants

### Sizes

| Size | Padding | Border Radius | Use Case |
|------|---------|---------------|----------|
| `sm` | 16px (4) | 6px (md) | Compact lists, mobile views |
| `md` | 24px (6) | 8px (lg) | Standard content (default) |
| `lg` | 32px (8) | 12px (xl) | Hero cards, detailed views |

### Interactive States

```tsx
// Hoverable - shows elevation on hover
<Card isHoverable onClick={() => alert('Clicked!')}>
  <CardBody>Hover to see elevation effect</CardBody>
</Card>

// Selected - shows active selection state
<Card isSelected>
  <CardBody>Selected card with navy border</CardBody>
</Card>

// Disabled - reduced opacity, no interaction
<Card isDisabled>
  <CardBody>Disabled card (60% opacity)</CardBody>
</Card>

// Loading - shows skeleton placeholder
<Card isLoading size="md" />
```

### Subcomponents

#### CardHeader
```tsx
<CardHeader>
  <Heading as="h3" size="md">Title</Heading>
</CardHeader>
```
- Adds bottom border separator
- 16px bottom margin and padding
- Use for card titles and primary headings

#### CardBody
```tsx
<CardBody>
  <Text>Main content goes here</Text>
</CardBody>
```
- Main content container
- No default padding or styling
- Flexible for any content type

#### CardFooter
```tsx
<CardFooter>
  <Button>Cancel</Button>
  <Button colorPalette="primary">Save</Button>
</CardFooter>
```
- Top border separator
- 16px top margin and padding
- Right-aligned flex layout with 8px gap
- Use for action buttons

---

## AthleteCard Component

Specialized card for displaying athlete information with photo, stats, and salary.

### Basic Usage

```tsx
import { AthleteCard } from '@/components/chakra';

<AthleteCard
  athlete={{
    id: 1,
    name: 'Eliud Kipchoge',
    country: 'KEN',
    pb: '2:01:09',
    rank: 1,
    salary: 12500
  }}
  variant="standard"
  onSelect={(athlete) => console.log('Selected:', athlete)}
/>
```

### Props

```typescript
interface AthleteCardData {
  id: number;
  name: string;
  country: string;
  gender?: 'M' | 'F' | 'Men' | 'Women';
  pb?: string | null;
  seasonBest?: string | null;
  rank?: number | null;
  salary?: number | null;
  photoUrl?: string | null;
  iaafId?: number | null;
}

interface AthleteCardProps {
  athlete: AthleteCardData;
  variant?: 'compact' | 'standard' | 'detailed';
  isSelected?: boolean;
  isDisabled?: boolean;
  isLoading?: boolean;
  showPrice?: boolean;
  showStats?: boolean;
  onSelect?: (athlete: AthleteCardData) => void;
  onClick?: (athlete: AthleteCardData) => void;
}
```

### Variants

#### Compact
```tsx
<AthleteCard athlete={athleteData} variant="compact" />
```
- **Avatar Size:** 48x48px
- **Height:** ~72px
- **Layout:** Horizontal (avatar - name - price)
- **Stats:** PB only (inline)
- **Best For:** Dense lists, mobile views, quick selection

#### Standard (Default)
```tsx
<AthleteCard athlete={athleteData} variant="standard" />
```
- **Avatar Size:** 64x64px
- **Height:** ~96px
- **Layout:** Horizontal (avatar - details - price)
- **Stats:** PB and rank displayed
- **Best For:** Main athlete browser, draft interface

#### Detailed
```tsx
<AthleteCard athlete={athleteData} variant="detailed" />
```
- **Avatar Size:** 80x80px
- **Height:** ~200px
- **Layout:** Vertical with stats grid
- **Stats:** PB, season best, world rank
- **Best For:** Profile views, detailed modals

### Features

**Avatar Handling:**
- Shows photo if `photoUrl` provided
- Falls back to initial letter (first char of name)
- Circular shape with proper aspect ratio
- Navy.100 background for fallback

**Price Formatting:**
- Currency formatter: `$12,500`
- Can be hidden with `showPrice={false}`
- Gold.600 color for emphasis

**Country Display:**
- 3-letter country code in navy badge
- Could be enhanced with flag emoji in future

### Interactive States

```tsx
// Selected state (for draft mode)
<AthleteCard athlete={athleteData} isSelected />

// Disabled state (already drafted)
<AthleteCard athlete={athleteData} isDisabled />

// Loading state
<AthleteCard athlete={athleteData} isLoading />
```

### Usage Examples

```tsx
// Draft selection interface
<VStack align="stretch" gap={2}>
  {athletes.map((athlete) => (
    <AthleteCard
      key={athlete.id}
      athlete={athlete}
      variant="compact"
      isSelected={selectedAthletes.includes(athlete.id)}
      onSelect={(athlete) => handleSelect(athlete)}
    />
  ))}
</VStack>

// Athlete profile modal
<AthleteCard
  athlete={athleteData}
  variant="detailed"
  showPrice={false}
  onClick={(athlete) => openProfileModal(athlete)}
/>
```

---

## TeamCard Component

Specialized card for displaying team information with rankings, roster status, and points.

### Basic Usage

```tsx
import { TeamCard } from '@/components/chakra';

<TeamCard
  team={{
    id: 1,
    name: 'Speed Demons',
    ownerName: 'John Doe',
    points: 847,
    rank: 1,
    rosterComplete: true,
    athleteCount: 6
  }}
  variant="standard"
  onClick={(team) => console.log('Clicked:', team)}
/>
```

### Props

```typescript
interface TeamCardData {
  id: number;
  name: string;
  ownerName?: string;
  points?: number;
  rank?: number;
  rosterComplete?: boolean;
  athleteCount?: number;
  totalSalary?: number;
  gameId?: string;
}

interface TeamCardProps {
  team: TeamCardData;
  variant?: 'compact' | 'standard' | 'detailed';
  showRank?: boolean;
  showOwner?: boolean;
  showRoster?: boolean;
  isSelected?: boolean;
  isDisabled?: boolean;
  isLoading?: boolean;
  onClick?: (team: TeamCardData) => void;
}
```

### Variants

#### Compact
```tsx
<TeamCard team={teamData} variant="compact" />
```
- **Height:** ~64px
- **Layout:** Horizontal (rank - name - points)
- **Rank Display:** Icon or number in 40x40px square
- **Best For:** Dense lists, mobile leaderboards

#### Standard (Default)
```tsx
<TeamCard team={teamData} variant="standard" />
```
- **Height:** ~88px
- **Layout:** Horizontal (rank - details - points)
- **Rank Display:** Icon or number in 56x56px square
- **Roster Status:** Badge indicators
- **Best For:** Leaderboards, team selection

#### Detailed
```tsx
<TeamCard team={teamData} variant="detailed" />
```
- **Height:** ~200px
- **Layout:** Vertical with stats grid
- **Rank Display:** Large icon/number (72x72px)
- **Stats:** Roster count, total salary
- **Best For:** Team profiles, detailed views

### Medal Badges (Top 3)

```tsx
// Automatic medal display for top 3 ranks
<TeamCard team={{ ...teamData, rank: 1 }} /> // 🥇 Gold
<TeamCard team={{ ...teamData, rank: 2 }} /> // 🥈 Silver
<TeamCard team={{ ...teamData, rank: 3 }} /> // 🥉 Bronze
```

- **Rank 1:** Gold medal (🥇), gold.100 background
- **Rank 2:** Silver medal (🥈), secondary.100 background
- **Rank 3:** Bronze medal (🥉), warning.100 background
- **Rank 4+:** Number display, gray.100 background

### Features

**Points Formatting:**
- Thousands separator: `847` → `847`, `1234` → `1,234`
- Navy.700 color for emphasis
- Label: "Points" or "Pts" (compact)

**Roster Status:**
- Complete: ✓ badge (success.600)
- Incomplete: Count badge (warning.600) - e.g., "5/6"
- Shows athlete count when available

**Salary Display (Detailed):**
- Currency format: `$28,500`
- Trophy icon indicator
- Gold.500 icon color

### Usage Examples

```tsx
// Leaderboard list
<VStack align="stretch" gap={2}>
  {teams.map((team) => (
    <TeamCard
      key={team.id}
      team={team}
      variant="standard"
      onClick={(team) => viewTeamDetails(team)}
    />
  ))}
</VStack>

// Dashboard featured team
<TeamCard
  team={myTeam}
  variant="detailed"
  showRank={true}
  showRoster={true}
/>
```

---

## RaceCard Component

Specialized card for displaying race/event information with status, location, and athletes.

### Basic Usage

```tsx
import { RaceCard } from '@/components/chakra';

<RaceCard
  race={{
    id: 1,
    name: 'New York City Marathon',
    date: '2024-11-03',
    location: 'New York, USA',
    confirmedAthletes: 45,
    status: 'upcoming'
  }}
  variant="standard"
  onClick={(race) => console.log('Selected:', race)}
/>
```

### Props

```typescript
interface RaceCardData {
  id: number;
  name: string;
  date: string;
  location?: string;
  venue?: string;
  confirmedAthletes?: number;
  status?: 'upcoming' | 'live' | 'completed' | 'draft';
  distance?: string;
  description?: string;
}

interface RaceCardProps {
  race: RaceCardData;
  variant?: 'compact' | 'standard' | 'detailed';
  showStatus?: boolean;
  showAthleteCount?: boolean;
  isSelected?: boolean;
  isDisabled?: boolean;
  isLoading?: boolean;
  onClick?: (race: RaceCardData) => void;
}
```

### Variants

#### Compact
```tsx
<RaceCard race={raceData} variant="compact" />
```
- **Height:** ~88px
- **Layout:** Vertical (title + status, date + location)
- **Icons:** Calendar, map pin (14x14px)
- **Best For:** Race selection lists, mobile

#### Standard (Default)
```tsx
<RaceCard race={raceData} variant="standard" />
```
- **Height:** ~120px
- **Layout:** Vertical (title + status, info row)
- **Icons:** Calendar, map pin, users (16x16px)
- **Best For:** Race browser, event cards

#### Detailed
```tsx
<RaceCard race={raceData} variant="detailed" />
```
- **Height:** ~260px
- **Layout:** Vertical with info grid
- **Description:** Full text with line-height: tall
- **Stats Grid:** Date, location, athletes (3 columns)
- **Best For:** Race details modal, feature cards

### Status Indicators

```tsx
<RaceCard race={{ ...raceData, status: 'upcoming' }} />  // Blue badge
<RaceCard race={{ ...raceData, status: 'live' }} />      // Red badge with 🔴
<RaceCard race={{ ...raceData, status: 'completed' }} /> // Green badge
<RaceCard race={{ ...raceData, status: 'draft' }} />     // Yellow badge
```

| Status | Badge Color | Label | Icon |
|--------|-------------|-------|------|
| `upcoming` | Info (blue) | "Upcoming" | - |
| `live` | Error (red) | "🔴 Live" | Red dot |
| `completed` | Success (green) | "Completed" | - |
| `draft` | Warning (yellow) | "Draft Open" | - |

### Features

**Date Formatting:**
- Input: ISO date string (`2024-11-03`)
- Output: Localized format (`Sun, Nov 3, 2024`)
- Uses `Intl.DateTimeFormat` for proper localization

**Location Display:**
- Map pin icon (Heroicons)
- Truncates with lineClamp on long text
- Optional venue field for detailed view

**Athlete Count:**
- Users icon (Heroicons)
- Format: "45 athletes" (standard), "45 confirmed" (detailed)
- Can be hidden with `showAthleteCount={false}`

### Usage Examples

```tsx
// Race selection grid
<SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
  {races.map((race) => (
    <RaceCard
      key={race.id}
      race={race}
      variant="standard"
      onClick={(race) => selectRace(race)}
    />
  ))}
</SimpleGrid>

// Featured upcoming race
<RaceCard
  race={nextRace}
  variant="detailed"
  showStatus={true}
  showAthleteCount={true}
/>
```

---

## LeaderboardCard Component

Optimized compact card for displaying team standings in list format.

### Basic Usage

```tsx
import { LeaderboardCard } from '@/components/chakra';

<LeaderboardCard
  entry={{
    rank: 1,
    teamName: 'Speed Demons',
    ownerName: 'John Doe',
    points: 847,
    rosterComplete: true,
    athleteCount: 6,
    isCurrentUser: true
  }}
  onClick={(entry) => console.log('Clicked:', entry)}
/>
```

### Props

```typescript
interface LeaderboardEntry {
  rank: number;
  teamId?: number;
  teamName: string;
  ownerName?: string;
  points: number;
  rosterComplete?: boolean;
  athleteCount?: number;
  isCurrentUser?: boolean;
}

interface LeaderboardCardProps {
  entry: LeaderboardEntry;
  showOwner?: boolean;
  showRoster?: boolean;
  isCurrentUser?: boolean;
  isSelected?: boolean;
  isDisabled?: boolean;
  isLoading?: boolean;
  onClick?: (entry: LeaderboardEntry) => void;
}
```

### Features

**Single Optimized Variant:**
- Fixed layout optimized for list views
- Minimum height: 44px (touch target compliance)
- Compact horizontal layout
- Always visible rank, name, points

**Rank Display:**
- Top 3: Medal icons (🥇🥈🥉) in colored backgrounds
- Others: Rank number in gray background
- Size: 48x48px square

**Current User Highlighting:**
```tsx
<LeaderboardCard entry={entry} isCurrentUser={true} />
```
- Navy.50 filled background
- Navy.300 border
- Bold team name
- "You" badge indicator

**Roster Status Icons:**
- Complete: ✓ (CheckCircleIcon - success.600)
- Incomplete: ✗ (XCircleIcon - warning.600)
- Shows athlete count: "6/6" or "5/6"

**Points Display:**
- Right-aligned
- Large (xl) font size
- Navy.700 color
- Thousands separator

### Usage Example

```tsx
// Leaderboard list
<VStack align="stretch" gap={2}>
  {leaderboardData.map((entry) => (
    <LeaderboardCard
      key={entry.rank}
      entry={entry}
      isCurrentUser={entry.teamId === currentUserId}
      showOwner={true}
      showRoster={true}
      onClick={(entry) => viewTeamDetails(entry)}
    />
  ))}
</VStack>
```

---

## StatsCard Component

Generic statistics display card with multiple value types and trend indicators.

### Basic Usage

```tsx
import { StatsCard } from '@/components/chakra';

<StatsCard
  label="Total Points"
  value={847}
  type="number"
  icon={TrophyIcon}
  trend="up"
  comparison="+12%"
  colorPalette="navy"
/>
```

### Props

```typescript
interface StatsCardProps {
  label: string;
  value: number | string;
  type?: 'number' | 'currency' | 'percentage' | 'time' | 'custom';
  icon?: ComponentType<any>;
  iconColor?: string;
  trend?: 'up' | 'down' | 'neutral';
  comparison?: string;
  description?: string;
  colorPalette?: 'navy' | 'gold' | 'success' | 'warning' | 'error' | 'info' | 'gray';
  variant?: 'elevated' | 'outline' | 'filled';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}
```

### Value Types

#### Number
```tsx
<StatsCard label="Total Points" value={847} type="number" />
// Output: "847"
```
- Adds thousands separator
- Format: 1,234

#### Currency
```tsx
<StatsCard label="Total Salary" value={28500} type="currency" />
// Output: "$28,500"
```
- USD currency format
- No decimal places
- Format: $1,234

#### Percentage
```tsx
<StatsCard label="Win Rate" value={75} type="percentage" />
// Output: "75%"
```
- Appends % symbol
- No decimal places

#### Time
```tsx
<StatsCard label="Avg Finish" value={7842} type="time" />
// Output: "2:10:42"
```
- Input: seconds
- Format: HH:MM:SS (if hours) or MM:SS

#### Custom
```tsx
<StatsCard label="Custom Value" value="Any string" type="custom" />
```
- Displays value as-is
- No formatting applied

### Trend Indicators

```tsx
// Upward trend (positive - green)
<StatsCard 
  label="Points This Week" 
  value={247} 
  trend="up" 
  comparison="+12%" 
/>

// Downward trend (negative - red)
<StatsCard 
  label="Rank Change" 
  value={3} 
  trend="down" 
  comparison="-2" 
/>

// Neutral trend (gray)
<StatsCard 
  label="Average Pace" 
  value={4815} 
  trend="neutral" 
  comparison="±0" 
/>
```

**Trend Display:**
- Small badge with icon and comparison text
- Up: ↑ arrow (success.600)
- Down: ↓ arrow (error.600)
- Neutral: — dash (gray.500)

### Icon Support

```tsx
import { TrophyIcon } from '@heroicons/react/24/outline';

<StatsCard
  label="Total Points"
  value={847}
  icon={TrophyIcon}
  iconColor="var(--chakra-colors-gold-500)"
/>
```

- Icon displayed in colored square background
- Sizes: 32px (sm), 40px (md), 56px (lg)
- Background color matches colorPalette
- Icon color customizable or inherits from palette

### Sizes

| Size | Icon | Value | Label | Use Case |
|------|------|-------|-------|----------|
| `sm` | 32px | xl (20px) | xs (12px) | Dense dashboards, mobile |
| `md` | 40px | 2xl (24px) | sm (14px) | Standard dashboards (default) |
| `lg` | 56px | 4xl (36px) | md (16px) | Hero stats, featured metrics |

### Color Palettes

```tsx
<StatsCard colorPalette="navy" {...props} />    // Navy background
<StatsCard colorPalette="gold" {...props} />    // Gold background
<StatsCard colorPalette="success" {...props} /> // Green background
<StatsCard colorPalette="warning" {...props} /> // Yellow background
<StatsCard colorPalette="error" {...props} />   // Red background
<StatsCard colorPalette="info" {...props} />    // Blue background
<StatsCard colorPalette="gray" {...props} />    // Gray background (default)
```

### Preset Stats Cards

```tsx
import { PresetStatsCards } from '@/components/chakra';

// Quick preset configurations
<PresetStatsCards.Points value={847} />         // Navy, number type
<PresetStatsCards.Currency value={28500} />     // Gold, currency type
<PresetStatsCards.Athletes value={6} />         // Info, number type
<PresetStatsCards.Rank value={1} />             // Success, number type
```

### Usage Examples

```tsx
// Dashboard statistics grid
<SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={6}>
  <StatsCard
    label="Total Points"
    value={847}
    type="number"
    icon={TrophyIcon}
    trend="up"
    comparison="+12%"
    colorPalette="navy"
  />
  <StatsCard
    label="Current Rank"
    value={3}
    type="number"
    icon={UsersIcon}
    trend="down"
    comparison="-1"
    colorPalette="success"
  />
  <StatsCard
    label="Athletes"
    value={6}
    type="number"
    icon={UsersIcon}
    colorPalette="info"
    description="Roster complete"
  />
  <StatsCard
    label="Budget Used"
    value={93}
    type="percentage"
    icon={ClockIcon}
    colorPalette="warning"
  />
</SimpleGrid>

// Large featured stat
<StatsCard
  label="Championship Points"
  value={2547}
  type="number"
  size="lg"
  icon={TrophyIcon}
  trend="up"
  comparison="+247 this week"
  colorPalette="gold"
  description="All-time high for your team"
/>
```

---

## Accessibility Guidelines

All card components are WCAG 2.1 AA compliant and follow best practices.

### Touch Targets
- Minimum size: 44x44px (WCAG 2.5.5)
- All cards meet this when interactive
- LeaderboardCard: 44px minimum height
- All buttons/icons: 44x44px or larger

### Color Contrast
- All text combinations tested for 4.5:1 minimum
- Navy.900 on white: 15.99:1 ✅ AAA
- Navy.500 on white: 6.15:1 ✅ AAA
- Gold.600 on white: 4.9:1 ✅ AA
- Success.600 badges: 4.54:1 ✅ AA

### Keyboard Navigation
- All interactive cards focusable with Tab
- Enter/Space trigger onClick
- Focus indicators visible (navy.500 ring)
- Skip to content links when needed

### Screen Readers
- Semantic HTML structure
- Proper heading hierarchy
- ARIA labels on icon-only buttons
- Status badges have descriptive text

### Motion & Animation
- Respects `prefers-reduced-motion`
- Transitions: 200ms max
- No auto-playing animations
- Hover effects optional

### Testing Checklist
- [ ] All cards keyboard accessible
- [ ] Focus indicators visible
- [ ] Color contrast passes (4.5:1 text, 3:1 non-text)
- [ ] Touch targets ≥44x44px
- [ ] Screen reader announces content correctly
- [ ] Reduced motion respected

---

## Migration Guide

### Legacy to Chakra Card Migration

#### Before (Legacy CSS)
```html
<div class="athlete-card">
  <div class="athlete-photo">
    <img src="/athlete.jpg" alt="Athlete Name">
  </div>
  <div class="athlete-info">
    <h3>Eliud Kipchoge</h3>
    <span class="country-badge">KEN</span>
    <span class="stat">PB: 2:01:09</span>
  </div>
  <div class="athlete-price">$12,500</div>
</div>
```

#### After (Chakra AthleteCard)
```tsx
<AthleteCard
  athlete={{
    id: 1,
    name: 'Eliud Kipchoge',
    country: 'KEN',
    pb: '2:01:09',
    salary: 12500,
    photoUrl: '/athlete.jpg'
  }}
  variant="standard"
  onSelect={handleSelect}
/>
```

### Migration Steps

1. **Identify Card Type**
   - Athlete display → `AthleteCard`
   - Team/leaderboard → `TeamCard` or `LeaderboardCard`
   - Race/event → `RaceCard`
   - Stats/metrics → `StatsCard`
   - Generic content → Base `Card`

2. **Map Data Structure**
   ```typescript
   // Convert legacy data to card props
   const athleteData: AthleteCardData = {
     id: legacyAthlete.id,
     name: legacyAthlete.fullName,
     country: legacyAthlete.countryCode,
     pb: legacyAthlete.personalBest,
     rank: legacyAthlete.worldRank,
     salary: legacyAthlete.fantasyPrice
   };
   ```

3. **Replace Component**
   ```tsx
   // Import Chakra card
   import { AthleteCard } from '@/components/chakra';
   
   // Replace in JSX
   <AthleteCard athlete={athleteData} variant="standard" />
   ```

4. **Remove Legacy CSS**
   - Delete old `.athlete-card` styles from `style.css`
   - Remove custom card classes
   - Clean up unused CSS variables

5. **Test & Verify**
   - Visual regression testing
   - Accessibility audit
   - Responsive behavior
   - Interactive states

### Common Patterns

#### Card Grid Layout
```tsx
<SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
  {items.map((item) => (
    <Card key={item.id} variant="elevated">
      <CardBody>{item.content}</CardBody>
    </Card>
  ))}
</SimpleGrid>
```

#### Card List Layout
```tsx
<VStack align="stretch" gap={2}>
  {items.map((item) => (
    <LeaderboardCard key={item.id} entry={item} />
  ))}
</VStack>
```

#### Selectable Cards
```tsx
const [selected, setSelected] = useState<number | null>(null);

{items.map((item) => (
  <Card
    key={item.id}
    isHoverable
    isSelected={selected === item.id}
    onClick={() => setSelected(item.id)}
  >
    <CardBody>{item.content}</CardBody>
  </Card>
))}
```

---

## Visual Reference

### Test Page
View all card components live:
```
/test-card-components
```

### Screenshots
*(Screenshots to be added after testing)*

- Base card variants
- AthleteCard variants
- TeamCard with medals
- RaceCard status indicators
- LeaderboardCard list
- StatsCard with trends

---

## Related Documentation

- [Design Guidelines](../CORE_DESIGN_GUIDELINES.md) - Complete design system
- [Button Components](./UI_BUTTON_COMPONENTS.md) - Phase 4 buttons
- [UI Redesign Roadmap](../UI_REDESIGN_ROADMAP.md) - Migration plan
- [Accessibility Audit](./UI_PHASE3_NAVIGATION_ACCESSIBILITY_AUDIT.md) - A11y standards

---

**Document Status:** Living documentation - update as components evolve  
**Last Review:** November 23, 2025  
**Next Review:** After Phase 4 completion  
**Feedback:** Open a GitHub issue for suggestions or corrections
