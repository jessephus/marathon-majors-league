# Athlete Card Modal Feature

## Overview

The athlete card modal is an engaging, digital trading card-style interface that displays comprehensive athlete information including:
- Basic profile data (name, country, age, photo)
- Performance statistics (PB, season best, rankings)
- Year-by-year progression data
- 2025 race results
- Link to full World Athletics profile

## Design

The modal is designed to look like a premium digital sports trading card with:
- **Gradient header** with athlete photo
- **Stats grid** highlighting key performance metrics
- **Tabbed interface** for different data sections
- **Responsive design** that works on mobile and desktop
- **Smooth animations** for a polished feel

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

### 1. Header
- Athlete photo with country badge
- Name, gender, and age
- Gradient background

### 2. Stats Grid
- **Personal Best** (highlighted)
- Season Best
- Marathon Rank
- Overall Rank

### 3. Sponsor Badge
- Displayed if athlete has a sponsor

### 4. Progression Tab (📈)
- Year-by-year season's best performances
- Shows discipline, mark, and venue
- Sorted by most recent first
- Groups multiple disciplines by season

### 5. 2025 Results Tab (🏆)
- All race results from 2025
- Shows competition name, position, time, venue, and date
- Sorted by most recent first

### 6. Profile Tab (👤)
- Date of birth
- World Athletics ID
- Road running rank

### 7. Footer
- Button linking to full World Athletics profile

## Styling Classes

### Main Classes
- `.modal` - Modal container
- `.modal-overlay` - Background overlay
- `.athlete-card` - Card container
- `.card-header` - Top section with photo
- `.card-stats` - Statistics grid
- `.card-tabs` - Tab navigation
- `.card-content` - Tab content area

### State Classes
- `.active` - For active modal, tabs, and panels
- `.selected` - For selected items
- `.disabled` - For disabled states

## JavaScript API

### Core Functions

```javascript
// Open the modal
openAthleteModal(athleteIdOrData)

// Close the modal
closeAthleteModal()

// Switch tabs
switchModalTab(tabName) // 'progression', 'results', or 'profile'

// Load detailed data
loadAthleteDetailedData(athleteId)

// Display progression
displayProgression(progressionArray)

// Display race results
displayRaceResults(resultsArray)
```

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
- **Desktop**: Full-width modal (max 600px)
- **Tablet** (≤768px): Adjusted padding and font sizes
- **Mobile** (≤480px): Compact layout with smaller photos

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

## Future Enhancements

- [ ] Add charts/graphs for progression visualization
- [ ] Cache fetched data to reduce API calls
- [ ] Add comparison mode (compare two athletes)
- [ ] Add social sharing buttons
- [ ] Add favorite/bookmark functionality
- [ ] Show more detailed statistics
- [ ] Add historical race results (multiple years)
- [ ] Animate stat changes
- [ ] Add athlete news/updates feed
