# Fantasy NY Marathon 🗽

A simple fantasy game for the NY Marathon where you can compete with 2-3 friends!

## Features

- 🎮 **No Traditional Login**: Players authenticate using special codes
- 🏆 **Snake Draft System**: Automatic snake draft of 3 men and 3 women per player
- 📱 **Mobile Friendly**: Fully responsive design for mobile devices
- 🎨 **Orange Red & Blue Blue Theme**: NY-inspired color scheme
- 💾 **Persistent Storage**: Game state saved in Vercel Blob storage
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

## Deployment to Vercel

### Prerequisites
- [Vercel account](https://vercel.com)
- [Vercel CLI](https://vercel.com/cli) (optional, for local development)

### Deploy to Production

1. Fork or clone this repository
2. Sign up for a [Vercel account](https://vercel.com) if you don't have one
3. Install Vercel CLI: `npm install -g vercel`
4. Run `vercel` in the project directory and follow the prompts
5. Add Blob storage:
   - Go to your project in the Vercel dashboard
   - Click on the **Storage** tab
   - Create a new **Blob** store
   - The storage will automatically be linked to your project
6. Initialize the storage (optional):
   - Visit `https://your-project.vercel.app/api/init-db` to verify setup
7. Your game is now live at `https://your-project.vercel.app`

### Local Development

1. Install dependencies: `npm install`
2. Create Blob storage on Vercel (via the dashboard)
3. Link your local project: `vercel link`
4. Pull environment variables: `vercel env pull`
5. Run locally: `vercel dev`
6. Visit `http://localhost:3000`

## Game Rules

- Each player ranks their top 10 men and top 10 women runners
- A snake draft automatically assigns 3 men and 3 women to each player
- The team with the lowest combined finish time wins!
- The commissioner manually enters the official race results

## Technical Details

- **Frontend**: Pure HTML, CSS, and JavaScript (no build step required)
- **Backend**: Vercel Serverless Functions (Node.js)
- **Database**: Vercel Blob Storage
- **Hosting**: Vercel
- **API Endpoints**:
  - `/api/game-state` - Get/update game configuration and players
  - `/api/rankings` - Store and retrieve player rankings
  - `/api/draft` - Save draft results
  - `/api/results` - Store race results
  - `/api/init-db` - Initialize blob storage (no action required)

## Database Schema

The app uses Vercel Blob storage with JSON files:
- `game-state.json` - Stores game configuration and player list
- `rankings.json` - Stores each player's ranked athletes
- `teams.json` - Stores drafted teams
- `results.json` - Stores athlete finish times

Each game has its own blob namespace for data isolation.

## Athletes Data

The game includes the confirmed NY Marathon elite field with:
- 33 men's elite runners
- 25 women's elite runners

Athletes include their country and personal best times.

## Environment Variables

Required environment variables (automatically set by Vercel when you add Blob storage):
- `BLOB_READ_WRITE_TOKEN` - Blob storage access token

## License

MIT License - See LICENSE file for details

