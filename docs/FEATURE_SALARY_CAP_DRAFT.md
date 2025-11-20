# Salary Cap Draft System

## Overview

The **Salary Cap Draft** is a daily fantasy-style team building system where players directly select their team of athletes within a fixed budget constraint. This provides a different strategic experience compared to the traditional snake draft.

## How It Works

### Basic Rules

- **Salary Cap**: Each team has a **$30,000** budget
- **Team Size**: Must draft exactly **6 athletes** (3 men + 3 women)
- **Direct Selection**: Players choose athletes directly (no ranking/auto-draft)
- **Budget Constraint**: Total team cost must not exceed $30,000

### Athlete Pricing

Athletes are assigned salaries based on a comprehensive algorithm that considers:

1. **Personal Best Time (40% weight)**
   - Athletes closer to world record times cost more
   - Elite PBs (within 3% of WR): Premium pricing
   - Good PBs (3-6% off WR): Mid-tier pricing
   - Decent PBs (6-10% off WR): Value pricing

2. **Marathon World Ranking (30% weight)**
   - Top 10: Premium
   - 11-25: High tier
   - 26-50: Mid tier
   - 51-100: Value tier
   - 100+: Budget tier

3. **Road Running Ranking (15% weight)**
   - Broader track record consideration

4. **Overall World Athletics Ranking (10% weight)**
   - General athletic performance indicator

5. **Season Form (5% weight)**
   - Recent performance vs. personal best
   - Athletes in good form get slight boost

### Pricing Examples

**Elite Athletes ($7k-$14k)**
- Top 10 world-ranked marathoners
- Sub-2:03 men, Sub-2:15 women
- Recent major marathon winners

**Mid-Tier Athletes ($3k-$7k)**
- Ranked 11-50 globally
- Proven performers with good PBs
- Consistent top-20 finishers

**Value Athletes ($1.5k-$3k)**
- Ranked 50+
- Debut marathoners with potential
- Lower-tier elite runners

## User Interface

### Budget Tracker

At the top of the screen, a prominent budget display shows:
- **Total Cap**: $30,000
- **Spent**: Current team cost
- **Remaining**: Available budget

Visual feedback:
- 🟢 Green: Plenty of budget remaining
- 🟡 Yellow: Low budget (<$5,000)
- 🔴 Red (pulsing): Over budget

### Selected Team Display

Shows your current roster split by gender:
- **Men (X/3)**: List of selected male athletes
- **Women (X/3)**: List of selected female athletes

Each athlete card shows:
- Name
- Country flag
- World ranking
- Personal best
- Salary

Quick remove button (×) to drop athletes from team.

### Athlete Browser

Browse and search all available athletes:

**Filters**:
- Gender: All / Men / Women
- (Future: Country, ranking range, price range)

**Sort Options**:
- Price (High to Low) - default
- Price (Low to High)
- Ranking (Best to Worst)
- Name (A-Z)

**Search**:
- Search by athlete name or country

**Athlete Cards** display:
- Name and salary (prominent)
- Country and gender
- World ranking badge
- Personal best badge
- "Add to Team" button (disabled if over budget or roster full)

### Strategic Indicators

- Athletes you can't afford show "Over Budget"
- Position limits enforced (3 men, 3 women max)
- Budget violations prevent team submission
- Progress bar shows team completion (X/6 athletes)

## Team Building Strategy

### Sample Team Configurations

**Elite Heavy Team** (~$51k - **IMPOSSIBLE BY DESIGN**)
- Top 3 men + Top 3 women
- Demonstrates that you cannot afford all the best athletes
- Forces strategic compromises and balanced team building

**Balanced Team** (~$29k - IDEAL)
- 1-2 elite athletes ($10k+)
- 2-3 mid-tier athletes ($4-7k)
- 1-2 value picks ($1.5-3k)
- Leaves small buffer for adjustments

**Value Team** (~$17k)
- Focus on lower-tier athletes
- Leaves significant budget unused
- Less competitive but within cap

**Optimal Strategy**:
1. Pick 1-2 elite "anchor" athletes
2. Fill remaining slots with value picks
3. Leave small budget buffer ($500-$1,000)
4. Balance men and women strategically

## Implementation Details

### Database Schema

```sql
-- Salary column added to athletes table
ALTER TABLE athletes 
ADD COLUMN salary INTEGER DEFAULT 5000;

-- New table for salary cap teams
CREATE TABLE salary_cap_teams (
  id SERIAL PRIMARY KEY,
  game_id VARCHAR(255) NOT NULL,
  player_code VARCHAR(255) NOT NULL,
  athlete_id INTEGER REFERENCES athletes(id),
  gender VARCHAR(10) NOT NULL,
  total_spent INTEGER NOT NULL,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### API Endpoints

**GET /api/salary-cap-draft?gameId={id}**
- Retrieves submitted salary cap teams for a game
- Returns team composition and spending for each player

**POST /api/salary-cap-draft**
- Submits a salary cap team
- Validates:
  - Team composition (3 men, 3 women)
  - Salary cap compliance
  - Athlete IDs validity
- Returns confirmation and spending summary

### Salary Calculation

Salary calculation script: `scripts/calculate-athlete-salaries.js`

```bash
# Calculate and update all athlete salaries
node scripts/calculate-athlete-salaries.js

# Or using database migration
node scripts/migrate-add-salaries.js
```

Formula:
```javascript
score = (PB_score * 0.4) + 
        (marathon_rank_score * 0.3) + 
        (road_rank_score * 0.15) + 
        (overall_rank_score * 0.1) + 
        (season_form_score * 0.05)

salary = MIN_SALARY + 
         (MAX_SALARY - MIN_SALARY) * 
         (score / 100) ** 1.2

// Round to nearest $100
salary = round(salary / 100) * 100
```

**Configuration**:
- MIN_SALARY: $1,500
- MAX_SALARY: $14,000
- Exponent: 1.2 (creates separation between tiers)

### Client-Side Validation

Real-time checks as users build teams:
- ✅ Budget tracking updates on every add/remove
- ✅ Disable "Add" buttons when over budget
- ✅ Disable "Add" buttons when position full
- ✅ Visual feedback for budget status
- ✅ "Submit" button only enabled when valid

### Server-Side Validation

Final validation before saving:
- ✅ Verify exactly 3 men and 3 women
- ✅ Recalculate total from database salaries
- ✅ Confirm total ≤ $30,000
- ✅ Verify all athlete IDs exist
- ✅ Prevent duplicate athletes

## Differences from Snake Draft

| Feature | Snake Draft | Salary Cap Draft |
|---------|-------------|------------------|
| **Selection Method** | Auto-draft from rankings | Direct selection |
| **Constraints** | Draft order, availability | Budget cap |
| **Strategy** | Ranking preference order | Budget allocation |
| **Control** | Indirect (via rankings) | Direct (pick any athlete) |
| **Fairness** | Snake order randomized | Budget constraint equalizes |
| **Speed** | Instant (automated) | Manual (player-paced) |

## Future Enhancements

Potential improvements:
1. **Dynamic Pricing**: Adjust salaries based on draft popularity
2. **Auction Draft**: Bidding system instead of fixed prices
3. **Salary Floor**: Require minimum spending (e.g., $25k)
4. **Position Scarcity**: Adjust pricing based on depth at position
5. **Injury Updates**: Reduce price for injured/scratched athletes
6. **Historical Performance**: Factor in past NYC Marathon results
7. **Form Trends**: Recent race results affect pricing
8. **Country Limits**: Optional constraint on athletes per country

## Testing

Manual test checklist:
- [ ] Create team and navigate to salary cap draft
- [ ] Add athletes to team
- [ ] Verify budget updates correctly
- [ ] Try to exceed budget (should prevent)
- [ ] Try to add 4th male athlete (should prevent)
- [ ] Remove athletes and verify budget updates
- [ ] Search for athletes
- [ ] Filter by gender
- [ ] Sort by different criteria
- [ ] Submit complete team
- [ ] Verify server validates team
- [ ] Check team appears in database
- [ ] Reload page and verify team persists

## Troubleshooting

**"Salary column not found"**
- Run migration script to add column and populate values:
  ```bash
  node scripts/migrate-add-salaries.js
  ```
- This script both adds the column AND calculates salaries

**"All athletes show $5,000"**
- Salaries not calculated yet (only default value set)
- The migration script above should fix this
- Alternatively, run standalone calculation:
  ```bash
  node scripts/calculate-athlete-salaries.js
  ```
- Note: `migrate-add-salaries.js` is recommended as it handles both tasks

**"Can't submit team"**
- Verify exactly 3 men and 3 women selected
- Check total cost ≤ $30,000
- Ensure all athletes have valid IDs

**"Athletes don't load"**
- Check database connection
- Verify athletes table has data
- Check browser console for API errors

---

## Auto-Save Feature

### Overview

The auto-save feature automatically saves partial team rosters to prevent data loss when users navigate away before completing their team selection.

### User Experience

#### For New Teams (No Complete Roster Submitted)

When a user is building their team for the first time:

1. **Automatic Saving**: Every time they select or remove an athlete, the roster auto-saves to the database after a 1-second delay
2. **Seamless Experience**: No visible indicators - happens silently in the background
3. **Data Persistence**: If the user closes their browser or navigates away, their partial selections are preserved
4. **Return Visit**: When they return using their session URL, their partial roster loads automatically

#### For Editing Submitted Teams

When a user has already submitted a complete team and returns to edit:

1. **No Auto-Save**: Changes are NOT automatically saved
2. **Explicit Submit**: User must click "Submit Team" to save any modifications
3. **Safety**: Prevents accidental overwrites of carefully constructed rosters

#### For Locked Rosters

After the race starts (roster lock time):

1. **Read-Only**: Auto-save is disabled (roster cannot be modified)
2. **View Only**: Users can view their team but cannot make changes

### Technical Implementation

#### Database Schema

Added `is_complete` column to `salary_cap_teams` table:

```sql
ALTER TABLE salary_cap_teams 
ADD COLUMN is_complete BOOLEAN DEFAULT FALSE;
```

- `is_complete = FALSE`: Auto-saved partial roster (in progress)
- `is_complete = TRUE`: Fully submitted complete roster (3 men + 3 women)

#### API Endpoints

**POST `/api/teams/partial-save`**

Auto-saves partial rosters without marking them as complete.

Request:
```json
{
  "roster": [
    { "slotId": "M1", "athleteId": 123, "salary": 5000 },
    { "slotId": "M2", "athleteId": null, "salary": null },
    ...
  ]
}
```

Response:
```json
{
  "message": "Partial roster auto-saved",
  "athleteCount": 2,
  "totalSpent": 11000,
  "autoSaveEnabled": true
}
```

Behavior:
- Accepts incomplete rosters (any number of athletes)
- Sets `is_complete = FALSE` in database
- Rejects if roster already marked as complete (returns `autoSaveEnabled: false`)
- Requires valid session token for authentication

#### Frontend Implementation

**Component: `pages/team/[session].tsx`**

Auto-save logic with 1-second debounce:
- Triggers after every roster change
- Skips if team already submitted or roster is locked
- Silent failure handling (console error only, no user interruption)
- Uses `useRef` to prevent auto-save on initial page load

### Migration

Migration script: `migrations/011_add_is_complete_to_salary_cap_teams.sql`

Marks all existing rosters with 6 athletes as complete for backward compatibility.

---

## Roster Lock Time

### Overview

The roster lock time feature allows commissioners to set a deadline after which roster edits are permanently locked. This prevents team changes after a certain time, ensuring fairness when the race or event begins.

### Database Schema

A `roster_lock_time` column was added to the `games` table:

```sql
ALTER TABLE games 
ADD COLUMN roster_lock_time TIMESTAMP WITH TIME ZONE;
```

### Default Configuration

For the **default game**, the roster lock time is set to:
- **Date**: November 2, 2025
- **Time**: 8:35 AM EST (13:35 UTC)

This is configured via the migration script `migrations/005_roster_lock_time.sql`.

### Behavior

1. **Before Lock Time**: Users can edit their rosters normally via the salary cap draft interface
2. **After Lock Time**: 
   - The roster becomes permanently locked (similar to when race results are entered)
   - All edit buttons are hidden
   - Users can view their roster but cannot make changes
   - A notice is displayed showing the lock time

### UI Indicators

The salary cap draft page displays:
- **Before lock**: "⏰ Roster Lock: Rosters will lock at [date/time]" (orange background)
- **After lock**: "⏰ Roster Lock: Rosters locked as of [date/time]" (red background)

### API Changes

**GET /api/game-state** now includes:
```json
{
  "rosterLockTime": "2025-11-02T13:35:00.000Z"
}
```

### Customization

To set a different lock time for a game:

```sql
UPDATE games 
SET roster_lock_time = '2025-11-03 09:00:00+00'::timestamptz
WHERE game_id = 'your-game-id';
```

Or via the API:

```javascript
await fetch('/api/game-state?gameId=your-game-id', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    rosterLockTime: '2025-11-03T09:00:00.000Z'
  })
});
```

### Time Zone Considerations

- The database stores times in UTC with timezone information (`TIMESTAMP WITH TIME ZONE`)
- The frontend displays times in the user's local timezone
- EST (Eastern Standard Time) is UTC-5
- EDT (Eastern Daylight Time) is UTC-4

---

## References

- Salary calculation algorithm: `scripts/calculate-athlete-salaries.js`
- Test script: `scripts/test-salary-calculation.js`
- API endpoint: `pages/api/salary-cap-draft.js`
- Partial save endpoint: `pages/api/teams/partial-save.js`
- Client UI logic: `public/salary-cap-draft.js`
- Team page component: `pages/team/[session].tsx`
- Styles: `public/style.css` (Salary Cap Draft section)
- Database schema: `schema.sql` (athletes, salary_cap_teams, games tables)
- Auto-save migration: `migrations/011_add_is_complete_to_salary_cap_teams.sql`
- Roster lock migration: `migrations/005_roster_lock_time.sql`
