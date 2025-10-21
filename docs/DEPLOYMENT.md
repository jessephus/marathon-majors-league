# Deployment Guide for Vercel

## Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/jessephus/marathon-majors-league)

## Manual Deployment Steps

### 1. Create a Vercel Account
- Go to [vercel.com](https://vercel.com)
- Sign up with GitHub, GitLab, or Bitbucket

### 2. Import Your Repository
- Click "Add New Project" in your Vercel dashboard
- Import your GitHub repository
- Vercel will automatically detect the configuration. No custom build output is required—leave `vercel.json` with the default Next.js settings so API routes remain active.

### 3. Add Neon Postgres Database
- In your project dashboard, go to the **Integrations** tab
- Search for and add the **Neon** integration
- Follow prompts to create/connect a Neon Postgres database
- Vercel automatically sets the `DATABASE_URL` environment variable

### 4. Initialize Database Schema
- Go to [console.neon.tech](https://console.neon.tech)
- Select your database and open the **SQL Editor**
- Copy contents of `schema.sql` from the repository root
- Paste and execute the SQL to create tables and indexes

See [NEON_SETUP.md](../NEON_SETUP.md) for detailed database setup instructions.

### 5. Deploy
- Click "Deploy" in Vercel dashboard
- Wait for the build to complete
- Your site will be live at `https://your-project.vercel.app`

### 6. Seed Athletes Data
- Visit `https://your-project.vercel.app/api/init-db`
- Athletes will be automatically seeded from `athletes.json`
- You should see a success message with athlete count

### 7. Share with Friends
- Give your friends the URL: `https://your-project.vercel.app`
- As commissioner, generate player codes in the app
- Share the codes with your players

## Local Development

### Setup
```bash
# Install Vercel CLI
npm install -g vercel

# Install dependencies
npm install

# Link to your Vercel project
vercel link

# Pull environment variables (including DATABASE_URL)
vercel env pull

# Start development server
vercel dev
```

### Access Locally
- Open `http://localhost:3000` in your browser
- The app will use your production Neon Postgres database
- Visit `http://localhost:3000/api/init-db` to verify database connection

## Database Management

### View Database
1. Go to [console.neon.tech](https://console.neon.tech)
2. Select your database
3. Use SQL Editor to query data or browse tables

### Backup Data
```

```

### Local Development

### Reset Game Data
- Use the "Reset Game" button in Commissioner Mode
- Or manually delete data from specific tables via SQL:
```sql
DELETE FROM race_results WHERE game_id = 'your-game-id';
DELETE FROM draft_teams WHERE game_id = 'your-game-id';
DELETE FROM player_rankings WHERE game_id = 'your-game-id';
DELETE FROM games WHERE game_id = 'your-game-id';
```

## Troubleshooting

### Database Connection Errors
- Ensure Neon integration is added and DATABASE_URL is set
- Check that database is active in Neon console
- Verify schema has been initialized (run schema.sql)
- Redeploy the project to refresh environment variables

### API Errors
- Check function logs in Vercel dashboard under "Deployments"
- Ensure database is accessible (visit `/api/init-db`)
- Verify API routes are accessible (e.g., `/api/game-state`)
- Check Neon console for query errors

### Athletes Not Loading
- Visit `/api/init-db` to seed athletes data
- Check that athletes.json exists in repository root
- Verify `/api/athletes` endpoint returns data
- Check browser console for errors

### CORS Issues
- API endpoints include CORS headers for all origins
- If issues persist, check browser console for specific errors

## Custom Domain (Optional)

1. Go to your project settings
2. Click "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions
5. Wait for DNS propagation (can take up to 48 hours)

## Monitoring

- View deployment logs in Vercel dashboard
- Monitor function execution time and errors
- Set up alerts for function failures (Pro plan)

## Cost

- Vercel Hobby plan: Free for personal projects
  - Includes serverless functions
  - Neon integration included
- Neon Free Tier: 
  - 3 GB storage
  - Unlimited queries
  - Auto-suspend when idle
- For higher traffic or storage, upgrade to Pro plans

## Support

For deployment issues and questions:
- **[Neon Setup Guide](../NEON_SETUP.md)** - Database configuration and initialization
- **[User Guide](USER_GUIDE.md)** - End-user setup and gameplay instructions
- **[Development Guide](DEVELOPMENT.md)** - Local development and contribution setup
- **[Architecture Guide](ARCHITECTURE.md)** - Technical architecture and data models
- **[Vercel Documentation](https://vercel.com/docs)** - Platform-specific help
- **[Neon Documentation](https://neon.tech/docs)** - Database-specific help
- **[Vercel Support](https://vercel.com/support)** - Direct platform support