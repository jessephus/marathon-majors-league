# Fantasy NY Marathon 🗽🏃‍♂️

**Turn marathon watching into the ultimate competitive experience!**

Experience the thrill of the New York City Marathon like never before with this interactive fantasy game. Compete with your friends by drafting elite runners and cheering them on as they race through the five boroughs.

<img width="1536" height="1024" alt="AI generated image depicting a Ugandan athlete finishing a marathon with a Marathon Majors Fantasy League graphic on his racing singlet." src="https://github.com/user-attachments/assets/c66852b6-3087-4335-9be5-dd16ee4ed431" />

With live result tracking, snake draft mechanics, and mobile-friendly gameplay, every step of the marathon becomes edge-of-your-seat entertainment. Perfect for marathon fans, running enthusiasts, or anyone who loves friendly competition during one of the world's most prestigious races!

## ✨ Features

- 🎮 **Code-Based Authentication**: No accounts needed - players join with unique game codes
- 🐍 **Intelligent Snake Draft**: Fair automated drafting of 3 men and 3 women per player
- 📱 **Mobile-First Design**: Optimized for watching and managing on your phone
- 🎨 **NYC-Inspired Theme**: Orange and blue styling that captures the city's energy
- ⚡ **Live Results Updates**: Real-time standings throughout the race with split times
- � **Commissioner Dashboard**: Complete game management and result entry tools
- 💾 **Cloud Storage**: Reliable game state persistence with Neon Postgres database
- 🏆 **Multiple Game Support**: Run tournaments or multiple leagues simultaneously

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

- **Team Size**: Each player drafts exactly 3 men and 3 women (6 total athletes)
- **Draft Process**: Snake draft based on your submitted rankings - higher ranked athletes are prioritized
- **Winning Condition**: The team with the **lowest combined finish time** across all 6 athletes wins
- **Live Tracking**: Follow your team's progress with real-time split updates throughout the race
- **Commissioner Control**: Only the game commissioner can enter and update official race results
- **Fair Play**: Results are locked once finalized to ensure game integrity

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
| `/api/game-state` | Game configuration and player management |
| `/api/rankings` | Store and retrieve player athlete rankings |
| `/api/draft` | Execute snake draft and save team assignments |
| `/api/results` | Race result entry and live updates |
| `/api/init-db` | Initialize database and seed athletes |

### Data Structure
The application uses Neon Postgres with these key tables:
- **`athletes`** - Elite runner profiles with personal bests
- **`games`** - Game settings, player list, and draft status
- **`player_rankings`** - Each player's ranked athlete preferences
- **`draft_teams`** - Post-draft team assignments
- **`race_results`** - Live and final athlete finish times
- **`users`** - Future user account support (not yet implemented)

Each game instance maintains isolated data through unique game IDs.

## 🏃‍♀️ Elite Athletes Database

The game features the official New York City Marathon elite field:
- **33 men's elite runners** with confirmed personal bests
- **25 women's elite runners** with official time records
- **Complete athlete profiles** including country representation and headshot photos
- **Real-time updates** as race results come in

All athlete data includes:
- Full name and country code
- Personal best marathon time
- Official headshot (when available)
- Unique athlete ID for tracking

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

- **[Neon Setup Guide](NEON_SETUP.md)** - Database setup and initialization instructions
- **[Architecture Guide](docs/ARCHITECTURE.md)** - Detailed technical architecture and system design
- **[User Guide](docs/USER_GUIDE.md)** - Complete player and commissioner instructions  
- **[Development Guide](docs/DEVELOPMENT.md)** - Development environment and code standards
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Detailed setup instructions
- **[Live Results Feature](docs/LIVE_RESULTS_FEATURE.md)** - Real-time update system documentation
- **[Migration Guide](docs/MIGRATION.md)** - Database migration history and decisions
- **[Changelog](docs/CHANGELOG.md)** - Project evolution and version history

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

