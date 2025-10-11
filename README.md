# Fantasy Chicago Marathon 🏃

A simple fantasy game for the Chicago Marathon where you can compete with 2-3 friends!

## Features

- 🎮 **No Traditional Login**: Players authenticate using special codes
- 🏆 **Snake Draft System**: Automatic snake draft of 3 men and 3 women per player
- 📱 **Mobile Friendly**: Fully responsive design for mobile devices
- 🎨 **Red & Blue Theme**: Chicago-inspired color scheme
- 💾 **Browser Storage**: Game state saved in localStorage
- 👑 **Commissioner Controls**: Full game management dashboard

## How to Play

### For the Commissioner

1. Open the game and click **"Commissioner Mode"**
2. Set the number of players (2-4)
3. Click **"Generate Player Codes"** to create unique codes for each player
4. Share the codes with your friends (along with the game URL)
5. Wait for all players to submit their rankings
6. Click **"Run Snake Draft"** to execute the draft
7. After the marathon, enter the finish times in the **"Results Entry"** section
8. Click **"Calculate Winner"** to determine the champion!

### For Players

1. Enter your player code (provided by the commissioner)
2. Click **"Enter Game"**
3. Rank your top 10 men and top 10 women athletes
   - Click athletes to add them to your rankings
   - Drag and drop to reorder your rankings
   - Click the × button to remove an athlete
4. Click **"Submit Rankings"** when done
5. Wait for the draft to complete
6. View your team and the results!

## Deployment to GitHub Pages

1. Go to your repository settings
2. Navigate to **Pages** in the sidebar
3. Under **Source**, select the `main` branch
4. Click **Save**
5. Your site will be available at `https://[username].github.io/fantasy-chicago-marathon/`

## Game Rules

- Each player ranks their top 10 men and top 10 women runners
- A snake draft automatically assigns 3 men and 3 women to each player
- The team with the lowest combined finish time wins!
- The commissioner manually enters the official race results

## Technical Details

- Pure HTML, CSS, and JavaScript (no build step required)
- Uses localStorage for persistent game state
- Static site compatible with GitHub Pages
- Drag-and-drop rankings using HTML5 Drag API

## Athletes Data

The game includes the confirmed Chicago Marathon elite field with:
- 21 men's elite runners
- 18 women's elite runners

Athletes include their country and personal best times.

## License

MIT License - See LICENSE file for details

