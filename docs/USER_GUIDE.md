# User Guide - Fantasy NY Marathon

## Table of Contents
- [Getting Started](#getting-started)
- [For Commissioners](#for-commissioners)
- [For Players](#for-players)
- [Game Rules](#game-rules)
- [Troubleshooting](#troubleshooting)
- [Advanced Features](#advanced-features)

## Getting Started

### What is Fantasy NY Marathon?
Fantasy NY Marathon is a fun, competitive game where you and your friends draft elite marathon runners and compete to see whose team performs best in the actual New York City Marathon. Think fantasy football, but for marathon running!

### Requirements
- **2-4 friends** to play with
- **Web browser** (works on phone, tablet, or computer)
- **One commissioner** to manage the game
- **Internet connection** during the marathon for live updates

### Quick Start
1. **Commissioner**: Deploy the game (see [Deployment Guide](DEPLOYMENT.md))
2. **Commissioner**: Generate player codes and share with friends
3. **Players**: Use codes to join and rank your top athletes
4. **Commissioner**: Run the draft when everyone's ready
5. **Everyone**: Watch the marathon and track your team's performance!

## For Commissioners

### Setting Up a Game

#### 1. Access Commissioner Mode
- Click the **"Commissioner Mode"** button at the bottom of the page
- Enter the password: `kipchoge`
- You'll see the Commissioner Dashboard

#### 2. Generate Player Codes
- Set the number of players (2-4)
- Click **"Generate Player Codes"**
- Share the codes with your friends along with the game URL
- Example codes: RUNNER, SPRINTER, PACER, CHAMPION

#### 3. Monitor Player Progress
The dashboard shows each player's status:
- ✓ **Green checkmark**: Rankings submitted
- ○ **Yellow circle**: Still pending
- **Summary**: "2 of 3 players have submitted rankings"

#### 4. Run the Draft
- Wait for all players to submit their rankings
- Click **"Run Snake Draft"** to automatically assign teams
- Each player gets 3 men and 3 women based on their preferences

### Managing Live Results

#### During the Marathon
1. **Enter Split Times**: Use the results form to enter athlete times at various points (5K, 10K, half-marathon, etc.)
2. **Update Live Results**: Click to push updates to all players
3. **Monitor Standings**: Watch the live leaderboard update
4. **Continue Throughout Race**: Repeat for each checkpoint

#### Finalizing Results
1. **Enter Final Times**: Input official finish times
2. **Finalize Results**: Click **"Finalize Results & Crown Winner"**
3. **Winner Declared**: Final standings are locked and displayed

### Commissioner Tools
- **Reset Live Results**: Clear all times but keep teams
- **Reset Game**: Start completely over (careful - cannot be undone!)
- **Export Data**: Download game data as JSON backup

## For Players

### Joining a Game

#### 1. Enter Your Code
- Go to the game URL provided by your commissioner
- Enter the player code you received (e.g., "RUNNER")
- Click **"Enter Game"**

#### 2. Draft Your Team
You'll see the ranking interface with:
- **Left side**: Your current rankings (empty at start)
- **Right side**: Available athletes to choose from
- **Tabs**: Switch between Men and Women

### Creating Your Rankings

#### Selecting Athletes
- **Click athletes** to add them to your rankings
- **Maximum**: 10 men and 10 women
- **Drag and drop** to reorder your preferences
- **Remove**: Click the × button to remove athletes

#### Strategy Tips
1. **Balance speed and consistency**: Mix elite runners with reliable performers
2. **Check personal bests**: Look at each athlete's best marathon time
3. **Consider course experience**: Some runners perform better in NYC
4. **Rank honestly**: Higher-ranked athletes are more likely to be drafted to your team

#### Submit Rankings
- Must rank exactly 10 men and 10 women
- Click **"Submit Rankings"** when satisfied
- Cannot change after submission (draft prevents changes)

### During the Marathon

#### Viewing Your Team
- Click **"View Teams"** after the draft
- See your 3 men and 3 women (6 total athletes)
- Watch live updates as results come in

#### Viewing the Leaderboard
Once race results start coming in:
1. **Access the Leaderboard**: Click **"View Leaderboard"** button on the teams page
2. **See Your Ranking**: The leaderboard shows:
   - Top 3 teams with medal indicators (🥇 🥈 🥉)
   - Your team's position (highlighted in orange if not in top 3)
   - Total points for each team
3. **Live Updates**: Pull down to refresh and see latest standings
4. **Return to Team**: Click **"Back to Your Team"** to view athlete details

The leaderboard is designed for quick glances during the race - perfect for checking standings while watching the marathon!

#### Following Results
- **Refresh the page** to see latest updates
- **Team ranking**: See if you're 🥇, 🥈, 🥉, or #4
- **Individual times**: Track each athlete's progress
- **Average time**: Your team's overall performance

## Game Rules

### Team Composition
- **6 athletes total**: 3 men + 3 women
- **Draft order**: Randomized snake draft
- **Selection**: Based on your submitted rankings

### Scoring System
- **Winner**: Team with **lowest combined finish time**
- **All 6 athletes**: Must finish for time to count
- **DNF handling**: Did Not Finish = maximum penalty time

### Draft Process
The snake draft works like this:
1. **Round 1**: Players pick in order A → B → C → D
2. **Round 2**: Reverse order D → C → B → A  
3. **Round 3**: Back to A → B → C → D
4. **Continues**: Until everyone has 3 men and 3 women

### Fair Play Rules
- **No changing rankings** after submission
- **Commissioner controls results** to prevent cheating
- **Results locked** once finalized
- **One game per marathon** (reset for new events)

## Troubleshooting

### Common Issues

#### "Invalid player code"
- Check spelling and capitalization
- Ask commissioner to regenerate codes
- Make sure you're on the right game URL

#### "You have already submitted rankings"
- You can't change rankings after submission
- Wait for the commissioner to run the draft
- View your team after draft completion

#### Rankings not saving
- Check internet connection
- Make sure you have exactly 10 men and 10 women
- Try refreshing the page and re-entering

#### Can't see live results
- Make sure commissioner has updated results
- Refresh your browser page
- Check if results have been finalized

### Mobile Issues
- **Drag and drop**: May not work on all mobile browsers - use click to add/remove instead
- **Small screen**: Rotate to landscape for better view
- **Touch issues**: Make sure to tap directly on athlete names

### Browser Compatibility
- **Recommended**: Chrome, Firefox, Safari (latest versions)
- **Required**: JavaScript enabled
- **Internet**: Stable connection during marathon

## Advanced Features

### Live Results System
The game supports real-time updates throughout the marathon:

#### For Commissioners
- **Split timing**: Enter times at 5K, 10K, half-marathon, etc.
- **Auto-save**: Results save as you type
- **Live standings**: See rankings update in real-time
- **Flexible updates**: Update as often as desired

#### For Players
- **Real-time rankings**: See your team's position change
- **Individual progress**: Track each athlete's splits
- **Refresh for updates**: New data appears when you refresh
- **Final notification**: Clear indication when results are locked

### Multi-Game Support
While designed for single events, the system supports multiple games:
- **Unique game IDs**: Each deployment can run multiple concurrent games
- **Data isolation**: Games don't interfere with each other
- **Scalable**: Add more commissioners for larger groups

### Data Export
Commissioners can export complete game data:
- **JSON format**: Easy to read and analyze
- **Complete history**: All rankings, draft results, and final scores
- **Backup purposes**: Keep records of past games
- **Analysis**: Review drafting strategies and outcomes

### Customization Options
The system can be modified for other marathon events:
- **Athlete database**: Update `athletes.json` with different runners
- **Game settings**: Modify team sizes or draft rules
- **Scoring system**: Adjust how winners are determined
- **UI themes**: Customize colors and branding

## Tips for a Great Experience

### For Commissioners
1. **Test beforehand**: Run through the complete process before race day
2. **Clear communication**: Make sure all players understand the timeline
3. **Have backups**: Export data regularly during live results
4. **Stay organized**: Have official race results ready for quick entry

### For Players
1. **Research athletes**: Study recent performances and NYC course records
2. **Submit early**: Don't wait until the last minute
3. **Stay engaged**: Watch the race and cheer for your team
4. **Have fun**: Remember it's about enjoying the marathon together!

### Group Tips
1. **Schedule draft**: Set a clear deadline for rankings submission
2. **Watch together**: Consider viewing the race as a group
3. **Create stakes**: Small prizes or bragging rights for the winner
4. **Document memories**: Take screenshots of results and funny moments