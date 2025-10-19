# Athlete Card Modal Feature - Redesigned

## Overview

The athlete card modal is a modern, engaging interface inspired by the issue mockup that displays comprehensive athlete information including:
- Dynamic masthead with country flag gradient backgrounds
- Basic profile data (name, country, age, photo)
- Performance statistics (PB, season best, rankings)
- Year-by-year progression data
- 2025 race results
- Link to full World Athletics profile

## Design Philosophy

The redesigned modal follows modern design principles:
- **Visual Hierarchy**: Clear masthead section draws attention to athlete identity
- **Layout & Spacing**: Structured sections with breathing room
- **Color Theory**: Dynamic gradients based on country flag colors
- **Typography**: Distinct styles for headings, subheadings, and body text
- **Interactive Navigation**: Tabbed interface for organized content
- **Modern Aesthetics**: Clean, polished card-based design

## Key Features

### Masthead Section
- **Dynamic gradient background** using country flag colors (40+ countries supported)
- **Left side**: Circular athlete headshot with country flag overlay
- **Right side**: Name, gender, age, marathon rank, and personal best
- **Responsive layout**: Stacks vertically on mobile devices

### Tabbed Interface
- **Overview**: Key statistics and profile information
- **Race Log**: 2025 race results with competition details
- **Progression**: Year-by-year season's best progression
- **News**: Placeholder for future news feed integration

## Usage

### Opening the Modal

The modal can be opened programmatically from JavaScript:

```javascript
// Open with athlete ID
openAthleteModal(123);

// Open with full athlete object
openAthleteModal(athleteObject);
```

### Current Integration Points

1. **Commissioner's Athlete Management View**
   - Click on any athlete name in the table to view their detailed card
   - Athlete names are styled as blue clickable links

### Future Integration Points (Planned)

2. **Player Ranking View**
   - Click on athlete cards to see details before ranking
   
3. **Team View**
   - Click on team members to see their progression
   
4. **Results View**
   - Click on athletes to see their race history

## Data Fetched

The modal fetches data from the `/api/athletes` endpoint with query parameters:

```
GET /api/athletes?id=123&include=progression,results&year=2025
```

This returns:
- Base athlete information
- Progression data (year-by-year season's bests)
- Race results for 2025

## Modal Sections

### 1. Masthead
- **Background**: Dynamic gradient based on athlete's country flag colors
- **Photo**: Circular headshot with country flag badge overlay
- **Info**: Name, gender, age displayed with icons
- **Stats**: Marathon rank and personal best in card format
- **Responsive**: Switches to vertical layout on mobile

### 2. Tab Navigation
- **Overview**: Default tab showing comprehensive statistics
- **Race Log**: 2025 race results
- **Progression**: Historical season's best progression
- **News**: Placeholder for future features

### 3. Overview Tab
- **Key Statistics Grid**: PB, Season Best, Marathon Rank, Overall Rank in card format
- **Profile Information**: Date of birth, World Athletics ID, Road Running Rank, Sponsor
- **World Athletics Link**: Direct link to full athlete profile

### 4. Race Log Tab
- **2025 Results**: Competition name, position, time, venue, date
- **Card Layout**: Each result in a bordered card with hover effects
- **Sorted**: Most recent races first

### 5. Progression Tab
- **Year-by-year**: Season's best performances by year
- **Details**: Mark, venue, discipline for each year
- **Badges**: "SB" (Season Best) or "PB" (Personal Best) indicators
- **Sorted**: Most recent years first

### 6. News Tab
- **Placeholder**: Future integration point for athlete news and updates

## Styling Classes

### Main Classes
- `.modal` - Modal container
- `.modal-overlay` - Background overlay with blur effect
- `.athlete-card-container` - Main card container
- `.card-masthead` - Gradient header section
- `.masthead-photo-wrapper` - Photo container with flag overlay
- `.masthead-bio-section` - Biographical data section
- `.tabs-container` - Tab navigation wrapper
- `.tab-button` - Individual tab buttons
- `.tab-content-container` - Scrollable content area
- `.tab-panel` - Individual tab content panels

### State Classes
- `.active` - For active modal, tabs, and panels
- `.country-gradient` - Applied via inline style for dynamic gradients

### Component Classes
- `.stat-card` - Statistic display cards with hover effects
- `.profile-row` - Profile information rows
- `.progression-item` - Progression list items
- `.result-item` - Race result items
- `.empty-state` - Empty state displays
- `.loading-indicator` - Loading animations

## JavaScript API

### Core Functions

```javascript
// Open the modal
openAthleteModal(athleteIdOrData)

// Close the modal
closeAthleteModal()

// Switch tabs
switchModalTab(tabName) // 'overview', 'results', 'progression', or 'news'

// Get country gradient
getCountryGradient(countryCode) // Returns CSS gradient string

// Load detailed data
loadAthleteDetailedData(athleteId)

// Display progression
displayProgression(progressionArray)

// Display race results
displayRaceResults(resultsArray)

// Populate basic info with dynamic gradient
populateAthleteBasicInfo(athlete)
```

### Country Gradient Colors

The modal supports dynamic gradients for 40+ countries including:
- **KEN** (Kenya): Red, Green, Black
- **ETH** (Ethiopia): Green, Yellow, Red
- **USA**: Red, White, Blue
- **GBR** (UK): Blue, White, Red
- **JPN** (Japan): Red, White
- And many more...

### Event Listeners

The modal responds to:
- **Close button click**
- **Overlay click** (click outside to close)
- **ESC key** (keyboard close)
- **Tab clicks** (switch between sections)

## Customization

### Colors
The modal uses CSS custom properties from the main theme:
- `--primary-orange` - Accent color
- `--primary-blue` - Headers and links
- `--light-gray` - Backgrounds
- `--dark-gray` - Secondary text

### Layout
Responsive breakpoints:
- **Desktop**: Full-width modal (max 640px) with side padding
- **Tablet** (≤768px): Adjusted spacing, smaller photos, optimized grid layouts
- **Mobile** (≤480px): Full-screen modal, vertical masthead layout, single-column grids, compact typography

## Data Requirements

For optimal display, athlete objects should include:
- `id` - Athlete database ID
- `name` - Full name
- `country` - 3-letter country code
- `gender` - 'men' or 'women'
- `pb` - Personal best time
- `headshotUrl` - Photo URL
- `worldAthleticsId` - WA athlete ID
- `worldAthleticsProfileUrl` - WA profile URL
- `marathonRank` - Marathon ranking
- `overallRank` - Overall ranking
- `age` - Age in years
- `dateOfBirth` - ISO date string
- `sponsor` - Sponsor name (optional)
- `seasonBest` - Current season best
- `roadRunningRank` - Road running ranking

## Example Usage

```javascript
// In the athlete management view
document.querySelectorAll('.athlete-name-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const athleteId = parseInt(e.target.dataset.athleteId, 10);
        const athlete = allAthletes.find(a => a.id === athleteId);
        if (athlete) {
            openAthleteModal(athlete);
        }
    });
});
```

## Performance Considerations

- **Lazy loading**: Progression and results data is only fetched when modal opens
- **Caching**: Data is fetched fresh each time (could be cached in future)
- **Loading states**: Shows loading spinners while fetching data
- **Empty states**: Gracefully handles missing data

## Accessibility

- **Keyboard navigation**: ESC to close
- **ARIA labels**: Close button has aria-label
- **Focus management**: Modal takes focus when opened
- **Screen reader friendly**: Semantic HTML structure

## Recent Updates (2025)

### Redesign Highlights
- ✅ **Dynamic masthead** with country flag color gradients
- ✅ **Improved visual hierarchy** with clear section separation
- ✅ **Modern tabbed interface** (Overview, Race Log, Progression, News)
- ✅ **Enhanced typography** with distinct heading styles
- ✅ **Card-based layout** with proper spacing and hover effects
- ✅ **Mobile-first responsive design** with optimized breakpoints
- ✅ **Tailwind CSS integration** via CDN for utility classes
- ✅ **40+ country flag gradients** for personalized backgrounds

## Future Enhancements

- [ ] Implement News tab with actual news feed
- [ ] Add charts/graphs for progression visualization
- [ ] Cache fetched data to reduce API calls
- [ ] Add comparison mode (compare two athletes)
- [ ] Add social sharing buttons
- [ ] Add favorite/bookmark functionality
- [ ] Show more detailed statistics
- [ ] Add historical race results (multiple years)
- [ ] Animate stat changes and transitions
