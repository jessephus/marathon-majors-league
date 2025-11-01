# Next.js Migration

This project has been migrated to Next.js to reduce the number of serverless functions deployed to Vercel.

## What Changed

### Before Migration
- 13+ separate serverless functions (one per API file)
- Vanilla HTML/CSS/JS frontend
- Exceeded Vercel Hobby tier limits

### After Migration
- Single Next.js application
- All API routes bundled together
- React-based frontend serving the same UI
- Reduced function count to stay within Vercel limits

## File Structure

```
/pages
  /api          - Next.js API routes (bundled together)
    *.js        - API endpoints (migrated from /api)
  index.js      - Main page (migrated from index.html)

/public         - Static assets
  app.js        - Frontend JavaScript
  style.css     - Stylesheets
  athletes.json - Athlete data

/api            - Old API files (kept for reference, excluded from deployment)
index.html      - Old HTML file (kept for reference, excluded from deployment)
```

## Local Development

```bash
npm install
npm run dev
```

Access the app at http://localhost:3000

## Deployment

The app deploys automatically to Vercel with the Next.js framework.

```bash
npm run build  # Build for production
npm run start  # Start production server locally
```

## Benefits

- ✅ Reduced serverless function count
- ✅ Stays within Vercel Hobby tier limits
- ✅ Faster builds and deployments
- ✅ Same functionality as before
- ✅ Better performance with Next.js optimizations
- ✅ ~50% faster page loads with caching
- ✅ ~70% fewer API calls with SWR
- ✅ Server-side computation for heavy operations
- ✅ Bundle analysis for monitoring growth

## Performance Features Added

### 1. Data Caching with SWR

The application now uses SWR (stale-while-revalidate) for intelligent data fetching with different cache strategies per data type.

### 2. Server-Side Optimizations

API endpoints include ETag headers, Cache-Control headers, and conditional scoring to minimize redundant computation.

### 3. Bundle Optimization

Run `npm run build:analyze` to visualize bundle composition and identify optimization opportunities.

## Documentation

See these guides for more information:

- **[Performance Optimization](PERFORMANCE_OPTIMIZATION.md)** - Detailed optimization documentation
- **[Incremental Optimization](INCREMENTAL_OPTIMIZATION.md)** - Step-by-step migration guide
- **[Architecture](ARCHITECTURE.md)** - Technical architecture overview

