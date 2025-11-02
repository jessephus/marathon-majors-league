// Check if specific athlete exists in database
require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function checkAthlete() {
  const searchName = 'Alexander Mutiso Munyao';
  
  console.log(`🔍 Searching for athletes matching: "${searchName}"\n`);

  try {
    // Try exact match
    const exactMatch = await sql`
      SELECT id, name, gender, country 
      FROM athletes 
      WHERE name = ${searchName}
    `;

    console.log('Exact match results:', exactMatch.length);
    if (exactMatch.length > 0) {
      exactMatch.forEach(athlete => {
        console.log(`  ✅ ID: ${athlete.id}, Name: "${athlete.name}", Gender: ${athlete.gender}, Country: ${athlete.country}`);
      });
    } else {
      console.log('  ❌ No exact match found');
    }

    console.log('');

    // Try case-insensitive match
    const caseInsensitive = await sql`
      SELECT id, name, gender, country 
      FROM athletes 
      WHERE LOWER(name) = LOWER(${searchName})
    `;

    console.log('Case-insensitive match results:', caseInsensitive.length);
    if (caseInsensitive.length > 0) {
      caseInsensitive.forEach(athlete => {
        console.log(`  ✅ ID: ${athlete.id}, Name: "${athlete.name}", Gender: ${athlete.gender}, Country: ${athlete.country}`);
      });
    }

    console.log('');

    // Try fuzzy match on last name
    const fuzzyMatch = await sql`
      SELECT id, name, gender, country 
      FROM athletes 
      WHERE LOWER(name) LIKE LOWER(${'%Munyao%'})
    `;

    console.log('Fuzzy match on "Munyao" results:', fuzzyMatch.length);
    if (fuzzyMatch.length > 0) {
      fuzzyMatch.forEach(athlete => {
        console.log(`  ✅ ID: ${athlete.id}, Name: "${athlete.name}", Gender: ${athlete.gender}, Country: ${athlete.country}`);
      });
    }

    console.log('');

    // Show all Alexander/Alex athletes
    const alexAthletes = await sql`
      SELECT id, name, gender, country 
      FROM athletes 
      WHERE LOWER(name) LIKE LOWER(${'%Alex%'})
      ORDER BY name
    `;

    console.log(`Athletes with "Alex" in name: ${alexAthletes.length}`);
    if (alexAthletes.length > 0) {
      alexAthletes.forEach(athlete => {
        console.log(`  - ID: ${athlete.id}, Name: "${athlete.name}", Gender: ${athlete.gender}, Country: ${athlete.country}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkAthlete();
