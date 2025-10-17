# Re-seed Database with Enriched Data

To update your production database with the enriched World Athletics data:

## Option 1: Via Browser (Easiest)

1. Open your browser
2. Navigate to: `https://your-app.vercel.app/api/init-db`
3. You should see a success message
4. Make a POST request to force re-seeding:
   - Open browser console (F12)
   - Run this command:
   ```javascript
   fetch('https://your-app.vercel.app/api/init-db', { method: 'POST' })
     .then(r => r.json())
     .then(console.log)
   ```

## Option 2: Via curl

```bash
# Check database status
curl https://your-app.vercel.app/api/init-db

# Force re-seed with enriched data
curl -X POST https://your-app.vercel.app/api/init-db
```

## What This Does

The init-db endpoint will:
1. ✅ Check if World Athletics columns exist
2. ✅ Add them if missing (already done in your case)
3. ✅ Re-seed all athletes with enriched data from athletes.json
4. ✅ Update existing athlete records with:
   - World Athletics ID
   - World Athletics profile URL
   - Marathon ranking (where available)
   - Road running ranking (where available)
   - Updated headshot URLs

## Verify It Worked

After re-seeding, check the frontend:
1. Create a new game or refresh an existing one
2. When ranking athletes, you should see:
   - Ranking badges like "Marathon #5" 
   - Clickable athlete names that link to World Athletics
3. On team pages, athlete names should be clickable links
4. Headshots should display for 47 out of 58 athletes

## Troubleshooting

If data still doesn't appear:
1. Check browser console for errors
2. Hard refresh the page (Cmd+Shift+R or Ctrl+Shift+F5)
3. Clear browser cache
4. Verify API response: `curl https://your-app.vercel.app/api/athletes | head -100`
