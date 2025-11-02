#!/usr/bin/env node

import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function checkColumnType() {
  const result = await sql`
    SELECT column_name, data_type, character_maximum_length
    FROM information_schema.columns
    WHERE table_name = 'race_results'
      AND column_name = 'finish_time_ms'
  `;
  
  console.log('finish_time_ms column info:');
  console.log(JSON.stringify(result, null, 2));
}

checkColumnType();
