#!/usr/bin/env node

/**
 * Manual athlete enrichment script
 * 
 * This script allows you to manually specify World Athletics IDs for athletes.
 * You can find IDs by searching on worldathletics.org and looking at the URL.
 * 
 * Usage: Edit the athleteIds object below, then run:
 *   node scripts/manual-enrich.js
 */

import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Manual mapping of athlete names to World Athletics IDs
// Find IDs at: https://worldathletics.org/athletes-home?query=[name]
const athleteIds = {
  // Example entries (update these with real IDs):
  'Eliud Kipchoge': '14208194',
  'Sifan Hassan': '14489606',
  'Hellen Obiri': '14424921',
  
  // Add more athletes here as you find their IDs
  // 'Athlete Name': 'ID',
};

async function enrichWithManualIds() {
  try {
    console.log('🏃 Starting manual athlete enrichment...\n');
    
    const athletesPath = join(__dirname, '..', 'athletes.json');
    const athletesData = JSON.parse(await fs.readFile(athletesPath, 'utf-8'));
    
    // Create backup
    const backupPath = join(__dirname, '..', 'athletes.json.backup');
    await fs.writeFile(backupPath, JSON.stringify(athletesData, null, 2));
    console.log('✅ Created backup: athletes.json.backup\n');
    
    let updatedCount = 0;
    
    // Process men
    console.log('📊 Processing Men Athletes:\n');
    for (const athlete of athletesData.men) {
      if (athleteIds[athlete.name]) {
        const id = athleteIds[athlete.name];
        athlete.headshotUrl = `https://media.aws.iaaf.org/athletes/${id}.jpg`;
        athlete.worldAthletics = {
          id: id,
          profileUrl: `https://worldathletics.org/athletes/${athlete.country.toLowerCase()}/${athlete.name.toLowerCase().replace(/\s+/g, '-')}-${id}`
        };
        console.log(`  ✅ Updated: ${athlete.name} (ID: ${id})`);
        updatedCount++;
      } else {
        console.log(`  ⏭️  Skipped: ${athlete.name} (no ID provided)`);
      }
    }
    
    // Process women
    console.log('\n📊 Processing Women Athletes:\n');
    for (const athlete of athletesData.women) {
      if (athleteIds[athlete.name]) {
        const id = athleteIds[athlete.name];
        athlete.headshotUrl = `https://media.aws.iaaf.org/athletes/${id}.jpg`;
        athlete.worldAthletics = {
          id: id,
          profileUrl: `https://worldathletics.org/athletes/${athlete.country.toLowerCase()}/${athlete.name.toLowerCase().replace(/\s+/g, '-')}-${id}`
        };
        console.log(`  ✅ Updated: ${athlete.name} (ID: ${id})`);
        updatedCount++;
      } else {
        console.log(`  ⏭️  Skipped: ${athlete.name} (no ID provided)`);
      }
    }
    
    // Write updated data
    await fs.writeFile(
      athletesPath,
      JSON.stringify(athletesData, null, 2),
      'utf8'
    );
    
    console.log('\n✅ Enrichment complete!');
    console.log(`   Updated: ${updatedCount} athletes`);
    console.log(`   Skipped: ${(athletesData.men.length + athletesData.women.length) - updatedCount} athletes`);
    console.log(`\n📝 Updated file: ${athletesPath}`);
    console.log(`\n💡 To add more athletes, edit the athleteIds object in this script.`);
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

enrichWithManualIds();
