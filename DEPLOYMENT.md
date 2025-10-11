# Deployment Guide for Vercel

## Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/jessephus/fantasy-chicago-marathon)

## Manual Deployment Steps

### 1. Create a Vercel Account
- Go to [vercel.com](https://vercel.com)
- Sign up with GitHub, GitLab, or Bitbucket

### 2. Import Your Repository
- Click "Add New Project" in your Vercel dashboard
- Import your GitHub repository
- Vercel will automatically detect the configuration

### 3. Add Postgres Database
- In your project dashboard, go to the **Storage** tab
- Click "Create Database"
- Select **Postgres**
- Choose a name for your database (e.g., "fantasy-marathon-db")
- Select your region (choose one close to your users)
- Click "Create"

The database will be automatically connected to your project with the `POSTGRES_URL` environment variable.

### 4. Deploy
- Click "Deploy" 
- Wait for the build to complete
- Your site will be live at `https://your-project.vercel.app`

### 5. Initialize Database
- Visit `https://your-project.vercel.app/api/init-db`
- You should see a success message
- This creates all necessary database tables

### 6. Share with Friends
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

# Pull environment variables (including database connection)
vercel env pull

# Start development server
vercel dev
```

### Access Locally
- Open `http://localhost:3000` in your browser
- The app will use your production database
- Visit `http://localhost:3000/api/init-db` to initialize tables if needed

## Database Management

### View Database
1. Go to your Vercel project dashboard
2. Click on "Storage" tab
3. Click on your Postgres database
4. Use the "Query" tab to run SQL queries
5. Use the "Data" tab to browse tables

### Backup Database
```bash
# Export data from Vercel dashboard
# Or use pg_dump with connection string from environment variables
```

### Reset Game Data
- Use the "Reset Game" button in Commissioner Mode, or
- Manually delete records from the database tables in Vercel dashboard

## Troubleshooting

### Database Connection Errors
- Ensure Postgres database is created and linked
- Check that `POSTGRES_URL` environment variable is set
- Redeploy the project to refresh environment variables

### API Errors
- Check function logs in Vercel dashboard under "Deployments"
- Ensure database tables are initialized (visit `/api/init-db`)
- Verify API routes are accessible (e.g., `/api/game-state`)

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
  - Includes Postgres database (limited storage)
- For higher traffic or storage, upgrade to Pro plan

## Support

For issues specific to Vercel deployment:
- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Support](https://vercel.com/support)
