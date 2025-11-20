/**
 * Fix Broken Athlete Headshots
 * 
 * Checks all athlete headshot URLs and replaces broken ones with placeholder images.
 * This ensures SSR always renders the correct image without client-side fallbacks.
 * 
 * Run with: node scripts/fix-broken-headshots.js
 */

import { neon } from '@neondatabase/serverless';
import https from 'https';
import http from 'http';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const sql = neon(process.env.DATABASE_URL);

// Test if an image URL is accessible
async function isImageAccessible(url) {
  return new Promise((resolve) => {
    if (!url || url.includes('null') || url.trim() === '') {
      resolve(false);
      return;
    }

    const protocol = url.startsWith('https') ? https : http;
    const timeout = 5000; // 5 second timeout

    const req = protocol.get(url, { timeout }, (res) => {
      // Success if status is 200-299
      const success = res.statusCode >= 200 && res.statusCode < 300;
      resolve(success);
      res.resume(); // Consume response to free memory
    });

    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

// Get placeholder URL based on gender
function getPlaceholderUrl(gender) {
  // Use relative URLs that work both server-side and client-side
  return gender === 'men' ? '/images/man-runner.png' : '/images/woman-runner.png';
}

async function fixBrokenHeadshots() {
  console.log('🔍 Checking athlete headshot URLs...\n');

  try {
    // Get all athletes with headshot URLs
    const athletes = await sql`
      SELECT id, name, gender, headshot_url, world_athletics_id
      FROM athletes 
      WHERE headshot_url IS NOT NULL 
      AND headshot_url != ''
      ORDER BY name
    `;

    console.log(`Found ${athletes.length} athletes with headshot URLs\n`);

    let checkedCount = 0;
    let brokenCount = 0;
    let fixedCount = 0;
    let restoredCount = 0;
    const brokenAthletes = [];
    const restoredAthletes = [];

    // Check each athlete's image
    for (const athlete of athletes) {
      checkedCount++;
      process.stdout.write(`Checking ${checkedCount}/${athletes.length}: ${athlete.name}...`);

      const isPlaceholder = athlete.headshot_url.includes('/images/');
      
      // If it's a placeholder, try to restore the WA URL
      if (isPlaceholder && athlete.world_athletics_id) {
        const waUrl = `https://media.aws.iaaf.org/athletes/${athlete.world_athletics_id}.jpg`;
        const waAccessible = await isImageAccessible(waUrl);
        
        if (waAccessible) {
          restoredCount++;
          restoredAthletes.push(athlete);
          console.log(` 🔄 RESTORED from placeholder`);
          
          // Update to WA URL
          await sql`
            UPDATE athletes 
            SET headshot_url = ${waUrl}
            WHERE id = ${athlete.id}
          `;
          console.log(`   → Updated to: ${waUrl}`);
          continue;
        } else {
          console.log(` ✅ Placeholder (WA still unavailable)`);
          continue;
        }
      }

      // Check if current URL is accessible
      const isAccessible = await isImageAccessible(athlete.headshot_url);

      if (!isAccessible) {
        brokenCount++;
        brokenAthletes.push(athlete);
        console.log(` ❌ BROKEN`);

        // Update to placeholder
        const placeholderUrl = getPlaceholderUrl(athlete.gender);
        await sql`
          UPDATE athletes 
          SET headshot_url = ${placeholderUrl}
          WHERE id = ${athlete.id}
        `;
        fixedCount++;
        console.log(`   → Updated to: ${placeholderUrl}`);
      } else {
        console.log(` ✅ OK`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Summary:');
    console.log(`   Total checked: ${checkedCount}`);
    console.log(`   Working: ${checkedCount - brokenCount - restoredCount}`);
    console.log(`   Broken and fixed: ${brokenCount}`);
    console.log(`   Placeholders restored to WA: ${restoredCount}`);
    console.log(`   Placeholders remaining: ${checkedCount - (checkedCount - brokenCount - restoredCount) - brokenCount - restoredCount}`);

    if (restoredAthletes.length > 0) {
      console.log('\n🔄 Restored to World Athletics URLs:');
      restoredAthletes.forEach(a => {
        console.log(`   - ${a.name} (${a.gender})`);
      });
    }

    if (brokenAthletes.length > 0) {
      console.log('\n🔧 Fixed with placeholders:');
      brokenAthletes.forEach(a => {
        console.log(`   - ${a.name} (${a.gender})`);
      });
    }

    console.log('\n✅ Done!');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
fixBrokenHeadshots();
