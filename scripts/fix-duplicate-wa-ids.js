#!/usr/bin/env node
/**
 * Fix Duplicate World Athletics IDs
 * 
 * Problem: World Athletics API sometimes returns IDs with leading zeros ('014645745')
 * and sometimes without ('14645745'), causing duplicate athlete entries.
 * 
 * Solution:
 * 1. Find all duplicate athletes (same WA ID when normalized)
 * 2. Keep the most recently updated entry
 * 3. Migrate all references to use the kept entry
 * 4. Delete the old duplicate entry
 * 5. Normalize all WA IDs (strip leading zeros)
 */

import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function fixDuplicateWAIds() {
  console.log('🔍 Finding duplicate World Athletics IDs...\n');

  // Find all duplicates
  const duplicates = await sql`
    SELECT 
      LTRIM(world_athletics_id, '0') as normalized_id,
      ARRAY_AGG(id ORDER BY updated_at DESC, last_fetched_at DESC NULLS LAST) as athlete_ids,
      ARRAY_AGG(name ORDER BY updated_at DESC, last_fetched_at DESC NULLS LAST) as names,
      ARRAY_AGG(world_athletics_id ORDER BY updated_at DESC, last_fetched_at DESC NULLS LAST) as wa_ids
    FROM athletes 
    WHERE world_athletics_id IS NOT NULL
    GROUP BY LTRIM(world_athletics_id, '0')
    HAVING COUNT(*) > 1
    ORDER BY normalized_id
  `;

  if (duplicates.length === 0) {
    console.log('✅ No duplicates found!\n');
    return;
  }

  console.log(`Found ${duplicates.length} duplicate athlete(s):\n`);

  for (const dup of duplicates) {
    const normalizedId = dup.normalized_id;
    const athleteIds = dup.athlete_ids;
    const names = dup.names;
    const waIds = dup.wa_ids;

    console.log(`📍 Normalized WA ID: ${normalizedId}`);
    console.log(`   Duplicate entries:`);
    
    for (let i = 0; i < athleteIds.length; i++) {
      console.log(`     - ID ${athleteIds[i]}: ${names[i]} (WA ID: ${waIds[i]})`);
    }

    const keepId = athleteIds[0]; // Most recently updated
    const deleteIds = athleteIds.slice(1);

    console.log(`   ✅ Keeping: ID ${keepId} (${names[0]})`);
    console.log(`   ❌ Deleting: IDs ${deleteIds.join(', ')}`);

    // Update foreign key references
    // Note: As of now, we have these FK relationships:
    // - salary_cap_teams.athlete_id
    // - draft_teams.athlete_id  
    // - player_rankings.athlete_id
    // - race_results.athlete_id
    // - athlete_progression.athlete_id (has UNIQUE constraint on athlete_id, discipline, season)
    // - athlete_races.athlete_id

    // For athlete_progression, we need to handle conflicts specially
    // Delete progression records for duplicate athletes that would conflict
    for (const deleteId of deleteIds) {
      const deleted = await sql`
        DELETE FROM athlete_progression
        WHERE athlete_id = ${deleteId}
        AND (discipline, season) IN (
          SELECT discipline, season
          FROM athlete_progression
          WHERE athlete_id = ${keepId}
        )
      `;
      
      if (deleted.count > 0) {
        console.log(`     Deleted ${deleted.count} conflicting progression record(s) for athlete ${deleteId}`);
      }

      // Update non-conflicting progression records
      const updated = await sql`
        UPDATE athlete_progression
        SET athlete_id = ${keepId}
        WHERE athlete_id = ${deleteId}
      `;
      
      if (updated.count > 0) {
        console.log(`     Updated ${updated.count} progression record(s) to athlete ${keepId}`);
      }
    }

    const tables = [
      'salary_cap_teams',
      'draft_teams',
      'player_rankings',
      'race_results',
      'athlete_races'
    ];

    for (const table of tables) {
      for (const deleteId of deleteIds) {
        // Use sql.query for dynamic table names
        const result = await sql.query(
          `UPDATE ${table} SET athlete_id = $1 WHERE athlete_id = $2`,
          [keepId, deleteId]
        );
        
        if (result.rowCount > 0) {
          console.log(`     Updated ${result.rowCount} row(s) in ${table}`);
        }
      }
    }

    // Delete duplicate athlete entries
    for (const deleteId of deleteIds) {
      await sql`DELETE FROM athletes WHERE id = ${deleteId}`;
      console.log(`     Deleted athlete ID ${deleteId}`);
    }

    console.log();
  }

  // Now normalize ALL world_athletics_id values
  console.log('🔧 Normalizing all World Athletics IDs (stripping leading zeros)...\n');

  const normalized = await sql`
    UPDATE athletes 
    SET world_athletics_id = LTRIM(world_athletics_id, '0')
    WHERE world_athletics_id ~ '^0+'
  `;

  console.log(`✅ Normalized ${normalized.count} athlete(s)\n`);

  // Verify no more duplicates
  const remaining = await sql`
    SELECT COUNT(*) as count
    FROM (
      SELECT world_athletics_id
      FROM athletes 
      WHERE world_athletics_id IS NOT NULL
      GROUP BY world_athletics_id
      HAVING COUNT(*) > 1
    ) as dups
  `;

  if (remaining[0].count > 0) {
    console.log(`⚠️  Warning: ${remaining[0].count} duplicate(s) still remain!`);
  } else {
    console.log('✅ All duplicates resolved!');
  }

  console.log('\n✨ Done!');
}

fixDuplicateWAIds().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
