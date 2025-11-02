#!/usr/bin/env node

import { neon } from '@neondatabase/serverless';
import 'dotenv/config';
import fs from 'fs';

const sql = neon(process.env.DATABASE_URL);

async function runMigration() {
    console.log('🔄 Running Migration 009: time_gap_seconds decimal support');
    console.log('━'.repeat(60));
    
    try {
        // Execute migration directly
        await sql`
            ALTER TABLE race_results 
            ALTER COLUMN time_gap_seconds TYPE NUMERIC(10,3)
        `;
        
        console.log('✅ Migration completed successfully!');
        console.log('\nChanges:');
        console.log('  • time_gap_seconds: INTEGER → NUMERIC(10,3)');
        console.log('  • Now supports sub-second precision (e.g., 0.03 seconds)');
        
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error('\nError details:', error);
        process.exit(1);
    }
}

runMigration();
