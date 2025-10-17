#!/usr/bin/env node

/**
 * Script to enrich athletes.json with World Athletics data
 * 
 * Fetches for each athlete:
 * - World Athletics ID
 * - Official headshot URL
 * - Current world rankings (marathon & road running)
 * - Updated country code
 * 
 * Usage: node scripts/enrich-athletes.js
 */

import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Rate limiting to avoid overwhelming the server
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Search for an athlete on World Athletics and extract their ID
 */
async function searchAthlete(name, country) {
  try {
    console.log(`Searching for: ${name} (${country})`);
    
    // Search by family name only (more reliable)
    const nameParts = name.split(' ');
    const searchFamilyName = nameParts[nameParts.length - 1]; // Last part is usually family name
    
    // Add discipline code for marathon to narrow results
    // Add timestamp to bust cache
    const searchUrl = `https://worldathletics.org/athletes-home?query=${encodeURIComponent(searchFamilyName)}&disciplineCode=MAR&_=${Date.now()}`;
    
    console.log(`  Searching via: ${searchUrl.replace(/&_=\d+/, '')}`);
    
    // Create an AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    try {
      const response = await fetch(searchUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': `Mozilla/5.0 (Node/${Date.now()})`,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Connection': 'close'
        },
        cache: 'no-store',
        redirect: 'follow'
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.log(`  ❌ Search failed (${response.status})`);
        return null;
      }
      
      const html = await response.text();
    
    // Extract JSON data from the page
    // Look specifically in the searchCompetitors query results, not initial data
    const searchResultsMatch = html.match(/"searchCompetitors\([^)]+\)":\[([^\]]+)\]/);
    
    if (!searchResultsMatch) {
      console.log(`  ❌ Could not find searchCompetitors data in response`);
      return null;
    }
    
    const searchResultsJson = searchResultsMatch[1];
    const athletePattern = /"aaAthleteId":"(\d+)","familyName":"([^"]+)","givenName":"([^"]+)"/g;
    const matches = [...searchResultsJson.matchAll(athletePattern)];
    
    if (matches.length === 0) {
      console.log(`  ❌ No athletes found in search results`);
      return null;
    }
    
    // Find the best match by name
    const searchName = name.toLowerCase().trim();
    const searchParts = searchName.split(/\s+/);
    let bestMatch = null;
    
    // Debug: Show first few matches to understand the data
    if (process.env.DEBUG) {
      console.log(`  [DEBUG] Found ${matches.length} athletes in results`);
      if (matches.length > 0) {
        const firstMatch = matches[0];
        console.log(`  [DEBUG] First result: ${firstMatch[3]} ${firstMatch[2]} (ID: ${firstMatch[1]})`);
        console.log(`  [DEBUG] Searching for: "${searchName}"`);
        console.log(`  [DEBUG] Match would be: "${firstMatch[3].toLowerCase()} ${firstMatch[2].toLowerCase()}"`);
      }
    }
    
    for (const match of matches) {
      const athleteId = match[1];
      const familyName = match[2];
      const givenName = match[3];
      const fullName = `${givenName} ${familyName}`.toLowerCase().trim();
      const reversedFullName = `${familyName} ${givenName}`.toLowerCase().trim();
      const athleteFamilyName = familyName.toLowerCase().trim();
      const athleteGivenName = givenName.toLowerCase().trim();
      
      // Flexible matching strategies
      if (fullName === searchName ||
          reversedFullName === searchName ||
          // Match if all search parts are in the athlete name
          searchParts.every(part => fullName.includes(part) || reversedFullName.includes(part)) ||
          // Match by family name and given name appearing in any order
          (searchParts.includes(athleteGivenName) && searchParts.includes(athleteFamilyName))) {
        bestMatch = { athleteId, givenName, familyName };
        break; // Take the first match
      }
    }
    
    if (!bestMatch) {
      console.log(`  ❌ Could not find matching athlete in ${matches.length} results`);
      return null;
    }
    
    const { athleteId, givenName, familyName } = bestMatch;
    const nameSlug = `${givenName}-${familyName}`.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[áàâä]/g, 'a')
      .replace(/[éèêë]/g, 'e')
      .replace(/[íìîï]/g, 'i')
      .replace(/[óòôö]/g, 'o')
      .replace(/[úùûü]/g, 'u')
      .replace(/[ñ]/g, 'n')
      .replace(/[ç]/g, 'c')
      .replace(/[^\w-]/g, '');
    
    // Country mapping for URL
    const countryMap = {
      'KEN': 'kenya', 'NED': 'netherlands', 'ETH': 'ethiopia', 'TAN': 'tanzania',
      'NOR': 'norway', 'FRA': 'france', 'SUI': 'switzerland', 'USA': 'united-states',
      'ERI': 'eritrea', 'AUS': 'australia', 'ITA': 'italy', 'GBR': 'great-britain-ni',
      'JPN': 'japan', 'CAN': 'canada', 'MEX': 'mexico', 'IRE': 'ireland'
    };
    
    const countrySlug = countryMap[country] || country.toLowerCase();
    const profileUrl = `https://worldathletics.org/athletes/${countrySlug}/${nameSlug}-${athleteId}`;
    
    console.log(`  ✅ Found: ${givenName} ${familyName} (ID: ${athleteId})`);
    
    // Now fetch the actual profile page to get rankings
    await delay(1000); // Brief delay before fetching profile
    
    const profileResponse = await fetch(profileUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    
    if (!profileResponse.ok) {
      console.log(`  ⚠️  Could not fetch profile page for rankings`);
      // Still return the ID and headshot even if we can't get rankings
      const headshotUrl = `https://media.aws.iaaf.org/athletes/${athleteId}.jpg`;
      return {
        athleteId,
        headshotUrl,
        worldAthletics: {
          id: athleteId,
          profileUrl: profileUrl
        }
      };
    }
    
    const profileHtml = await profileResponse.text();
    
    const headshotUrl = `https://media.aws.iaaf.org/athletes/${athleteId}.jpg`;
    
    // Try to extract rankings from profile page
    const marathonRankMatch = profileHtml.match(/#(\d+)\s+(?:Man's|Woman's)\s+marathon/i);
    const roadRankMatch = profileHtml.match(/#(\d+)\s+(?:Man's|Woman's)\s+road\s+running/i);
    
    const result = {
      athleteId,
      headshotUrl,
      worldAthletics: {
        id: athleteId,
        profileUrl: profileUrl
      }
    };
    
    if (marathonRankMatch) {
      result.worldAthletics.marathonRank = parseInt(marathonRankMatch[1]);
    }
    
    if (roadRankMatch) {
      result.worldAthletics.roadRunningRank = parseInt(roadRankMatch[1]);
    }
    
    console.log(`  ✅ Found! ID: ${athleteId}${marathonRankMatch ? `, Marathon Rank: #${marathonRankMatch[1]}` : ''}${roadRankMatch ? `, Road Rank: #${roadRankMatch[1]}` : ''}`);
    
    return result;
    
    } catch (fetchError) {
      if (fetchError.name === 'AbortError') {
        console.log(`  ⏱️  Request timed out after 15 seconds`);
      } else {
        throw fetchError;
      }
    }
    
  } catch (error) {
    console.error(`  ❌ Error searching for ${name}:`, error.message);
    return null;
  }
}

/**
 * Main function to enrich all athletes
 */
async function enrichAthletes() {
  try {
    console.log('🏃 Starting athlete enrichment...\n');
    
    // Read current athletes.json
    const athletesPath = join(__dirname, '..', 'athletes.json');
    const athletesData = JSON.parse(await fs.readFile(athletesPath, 'utf-8'));
    
    // Create backup
    const backupPath = join(__dirname, '..', 'athletes.json.backup');
    await fs.writeFile(backupPath, JSON.stringify(athletesData, null, 2));
    console.log('✅ Created backup: athletes.json.backup\n');
    
    let updatedCount = 0;
    let notFoundCount = 0;
    
    // Process men
    console.log('📊 Processing Men Athletes:\n');
    for (const athlete of athletesData.men) {
      const data = await searchAthlete(athlete.name, athlete.country);
      
      if (data) {
        athlete.headshotUrl = data.headshotUrl;
        athlete.worldAthletics = data.worldAthletics;
        updatedCount++;
      } else {
        notFoundCount++;
      }
      
      // Rate limiting: wait 2 seconds between requests
      await delay(2000);
    }
    
    // Process women
    console.log('\n📊 Processing Women Athletes:\n');
    for (const athlete of athletesData.women) {
      const data = await searchAthlete(athlete.name, athlete.country);
      
      if (data) {
        athlete.headshotUrl = data.headshotUrl;
        athlete.worldAthletics = data.worldAthletics;
        updatedCount++;
      } else {
        notFoundCount++;
      }
      
      // Rate limiting: wait 2 seconds between requests
      await delay(2000);
    }
    
    // Write updated data
    await fs.writeFile(
      athletesPath,
      JSON.stringify(athletesData, null, 2),
      'utf8'
    );
    
    console.log('\n✅ Enrichment complete!');
    console.log(`   Updated: ${updatedCount} athletes`);
    console.log(`   Not found: ${notFoundCount} athletes`);
    console.log(`   Total: ${athletesData.men.length + athletesData.women.length} athletes`);
    console.log(`\n📝 Updated file: ${athletesPath}`);
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
enrichAthletes();
