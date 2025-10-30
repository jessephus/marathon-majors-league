# Fantasy NY Marathon 🗽🏃‍♂️

**Turn marathon watching into the ultimate competitive experience!**

Experience the thrill of the New York City Marathon like never before with this interactive fantasy game. Compete with your friends by drafting elite runners and cheering them on as they race through the five boroughs.

<img width="1536" height="1024" alt="AI generated image depicting a Ugandan athlete finishing a marathon with a Marathon Majors Fantasy League graphic on his racing singlet." src="https://github.com/user-attachments/assets/c66852b6-3087-4335-9be5-dd16ee4ed431" />

With live result tracking, snake draft mechanics, and mobile-friendly gameplay, every step of the marathon becomes edge-of-your-seat entertainment. Perfect for marathon fans, running enthusiasts, or anyone who loves friendly competition during one of the world's most prestigious races!

## ✨ Features

- 🔗 **Account-Free Team Creation**: Create and join games with unique URLs - no registration required
- 🎮 **Code-Based Authentication**: Legacy support for players who join with game codes
- 💰 **Salary Cap Draft**: Daily fantasy-style team building with $30k budget constraint
- 🐍 **Intelligent Snake Draft**: Alternative fair automated drafting of 3 men and 3 women per player
- 📱 **Mobile-First Design**: Optimized for watching and managing on your phone
- 🎨 **NYC-Inspired Theme**: Orange and blue styling that captures the city's energy
- ⚡ **Live Results Updates**: Real-time standings throughout the race with split times
- 🏆 **Live Leaderboard**: Dedicated race day view showing team rankings with your position highlighted
- 👑 **Commissioner Dashboard**: Complete game management and result entry tools
- 💾 **Cloud Storage**: Reliable game state persistence with Neon Postgres database
- 🏆 **Multiple Game Support**: Run tournaments or multiple leagues simultaneously
- 🔄 **Automated Data Sync**: Top 100 marathon athletes automatically synced from World Athletics every 2 days
- 🔒 **Secure Sessions**: 90-day session tokens with upgrade path to full user accounts

## 🎯 How to Play

### 👑 For the Commissioner

1. **Initialize the Game**
   - Open the app and click **"Commissioner Mode"**
   - Set the number of players (2-4 supported)
   - Click **"Generate Player Codes"** to create unique access codes

2. **Share & Setup**
   - Share the player codes with your friends along with the game URL
   - Wait for all players to join and submit their athlete rankings

3. **Execute the Draft**
   - Click **"Run Snake Draft"** to automatically assign teams
   - Each player gets 3 men and 3 women based on their rankings

4. **Live Results Management**
   - Enter split times throughout the race (5K, 10K, half-marathon, etc.)
   - Click **"Update Live Results"** to push updates to all players
   - Continue updating as the race progresses

5. **Crown the Champion**
   - Enter final finish times when the race concludes
   - Click **"Finalize Results & Crown Winner"** to declare the victor!

### 🏃‍♂️ For Players

1. **Join the Game**
   - Enter your unique player code (provided by the commissioner)
   - Click **"Enter Game"** to access the drafting interface

2. **Draft Your Dream Team**
   - Rank your top 10 men and top 10 women elite runners
   - Use the intuitive drag-and-drop interface to order your preferences
   - Click athletes to add them, or use the × button to remove them
   - Submit your rankings when you're satisfied

3. **Follow the Action**
   - View your drafted team after the snake draft completes
   - Click **"View Leaderboard"** to see live rankings during the race
   - Check where you stand against the competition with instant visual feedback
   - Your team is highlighted so you can quickly find your position
   - Watch live standings update as the commissioner enters race progress
   - Celebrate when your team takes the lead! 🎉

## 🚀 Quick Deploy to Vercel

### One-Click Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/jessephus/marathon-majors-league)

### Manual Setup

1. **Fork this repository** to your GitHub account
2. **Create a Vercel account** at [vercel.com](https://vercel.com) (free tier available)
3. **Import your repository** in the Vercel dashboard
4. **Add Neon Postgres database**:
   - Navigate to your project's **Integrations** tab
   - Search for and add the **Neon** integration
   - Follow prompts to create/connect a Neon Postgres database
   - Vercel automatically configures the `DATABASE_URL` environment variable
5. **Deploy** - Database schema and athletes data are automatically initialized
   - The build process creates database tables and seeds athletes
   - If build fails, the app will auto-initialize on first access
   - **Your game data persists across deployments** - no data loss!
6. **Share** your game URL with friends!

**Note:** The database schema is automatically created - no manual SQL execution needed!

### Local Development

```bash
# Clone the repository
git clone https://github.com/your-username/marathon-majors-league.git
cd marathon-majors-league

# Install dependencies
npm install

# Link to your Vercel project (one-time setup)
vercel link

# Pull environment variables from Vercel (includes DATABASE_URL)
vercel env pull

# Start local development server
vercel dev

# Open http://localhost:3000
```

## 🏁 Game Rules & Scoring

### Version 2: Points-Based Scoring System 🎯

**Fantasy NY Marathon** now features an advanced points league system that rewards both placement and performance quality:

#### Point Categories

1. **Placement Points (Top 10)**
   - 1st place: 10 pts | 2nd: 9 pts | 3rd: 8 pts ... 10th: 1 pt
   - Ties handled with standard competition ranking

2. **Time Gap Bonuses**
   - Within 60s of winner: +5 pts
   - Within 2 minutes: +4 pts
   - Within 3 minutes: +3 pts
   - Within 5 minutes: +2 pts
   - Within 10 minutes: +1 pt

3. **Performance Bonuses**
   - **Negative Split**: +2 pts (second half faster than first)
   - **Even Pace**: +1 pt (consistent pacing within 0.5%)
   - **Fast Finish Kick**: +1 pt (final 5km 3% faster than average)

4. **Record Bonuses**
   - **World Record**: +15 pts 🌎
   - **Course Record**: +5 pts 🏆
   - Records may be provisional pending confirmation

### How to Win

- **Team Size**: Each player drafts exactly 3 men and 3 women (6 total athletes)
- **Draft Process**: Snake draft based on your submitted rankings
- **Winning**: Team with the **highest total points** across all athletes wins!
- **Live Tracking**: Follow real-time standings with detailed point breakdowns
- **Fair Play**: Results are locked once finalized to ensure integrity

For complete scoring details, see **[Points Scoring System Documentation](docs/POINTS_SCORING_SYSTEM.md)**.

### Legacy Scoring (Version 1)

The original time-based system (lowest combined finish time wins) remains available as a fallback for compatibility.

## 🛠️ Technical Architecture

### Stack Overview
- **Frontend**: Vanilla HTML, CSS, and JavaScript (no build step needed!)
- **Backend**: Vercel Serverless Functions (Node.js)
- **Database**: Neon Postgres (serverless PostgreSQL)
- **Hosting**: Vercel Edge Network
- **Real-time Updates**: Server-sent events for live result tracking

### API Endpoints
| Endpoint | Purpose |
|----------|---------|
| `/api/athletes` | Retrieve elite athlete database |
| `/api/races` | Manage marathon events and competitions |
| `/api/game-state` | Game configuration and player management |
| `/api/rankings` | Store and retrieve player athlete rankings |
| `/api/draft` | Execute snake draft and save team assignments |
| `/api/results` | Race result entry and live updates |
| `/api/init-db` | Initialize database and seed athletes |

### Data Structure
The application uses Neon Postgres with these key tables:
- **`athletes`** - Elite runner profiles with personal bests, rankings, and extended data
- **`races`** - Marathon events and competitions (currently 2025 NYC Marathon)
- **`athlete_races`** - Links athletes to specific races they're competing in
- **`games`** - Game settings, player list, and draft status
- **`player_rankings`** - Each player's ranked athlete preferences
- **`draft_teams`** - Post-draft team assignments
- **`race_results`** - Live and final athlete finish times
- **`users`** - Future user account support (not yet implemented)

Each game instance maintains isolated data through unique game IDs.

## 🏃‍♀️ Elite Athletes Database

The game features automatically synchronized athlete data from World Athletics:
- **Top 100 men** marathon runners from official World Athletics rankings
- **Top 100 women** marathon runners from official World Athletics rankings  
- **Automatic sync every 2 days** via GitHub Actions
- **Complete athlete profiles** including country representation and headshot photos
- **Extended athlete data** including World Athletics rankings and IDs
- **Real-time updates** as race results come in

All athlete data includes:
- Full name and country code
- Personal best marathon time
- Official headshot (when available)
- Unique World Athletics ID for tracking
- World Athletics profile and rankings (marathon, road running, overall)
- Extended fields for age, sponsor, and season best

### Automated Sync System

The athlete database is kept current through an automated GitHub Actions workflow that:
- Runs every 2 days at 2:00 AM UTC
- Fetches the top 100 men and women from World Athletics marathon rankings
- Uses intelligent delta detection to minimize API calls
- Only updates records when data actually changes (via SHA256 hash comparison)
- Can be manually triggered anytime from the Actions tab
- Automatically creates GitHub issues on sync failures

For more details, see the **[Sync Top 100 Guide](docs/SYNC_TOP_100.md)**.

## 🔧 Configuration

### Environment Variables
Required for deployment (automatically configured when using Neon integration):
```
DATABASE_URL=postgresql://username:password@host.neon.tech/dbname
```

### Game Settings
Customizable options in the application:
- **Player count**: 2-4 players supported
- **Game ID**: Support for multiple concurrent games
- **Commissioner password**: Secure game management access
- **Result update frequency**: Live or batch result updates

## 📚 Additional Documentation

**[📖 Complete Documentation Index](docs/README.md)** - Find all documentation organized by topic and role

### Quick Links

- **[User Guide](docs/USER_GUIDE.md)** - Complete player and commissioner instructions  
- **[Salary Cap Draft Guide](docs/SALARY_CAP_DRAFT.md)** - Daily fantasy-style team building system
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Deploy your own instance to Vercel
- **[Development Guide](docs/DEVELOPMENT.md)** - Local development and code standards
- **[Database Guide](docs/DATABASE.md)** - Schema, initialization, and troubleshooting
- **[Sync Top 100 Guide](docs/SYNC_TOP_100.md)** - Automated World Athletics data sync
- **[Architecture Guide](docs/ARCHITECTURE.md)** - Technical architecture and design
- **[Changelog](docs/CHANGELOG.md)** - Version history and updates

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests.

### Development Setup
1. Fork the repository
2. Follow the local development setup above
3. Make your changes
4. Test thoroughly with multiple players
5. Submit a pull request

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details.

---

**Ready to make marathon watching unforgettable?** Deploy your own Fantasy NY Marathon game and let the competition begin! 🏃‍♂️🏆

