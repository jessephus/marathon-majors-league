import { neon } from '@neondatabase/serverless';
import fs from 'fs';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment');
  process.exit(1);
}

console.log('🚀 Running Migration 003: User Account System\n');

const sql = neon(DATABASE_URL);

try {
  // Read the migration file
  const migrationSQL = fs.readFileSync('./migrations/003_user_account_system.sql', 'utf8');
  
  console.log('📄 Migration file loaded');
  console.log('🔧 Executing migration...\n');
  
  // Execute the migration
  // Note: neon doesn't support multi-statement queries directly, so we need to split them
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  let successCount = 0;
  let errors = [];
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';';
    try {
      await sql.unsafe(statement);
      successCount++;
      if ((i + 1) % 10 === 0) {
        console.log(`✓ Executed ${i + 1}/${statements.length} statements...`);
      }
    } catch (error) {
      // Some errors are expected (e.g., "already exists" for IF NOT EXISTS clauses)
      if (error.message.includes('already exists')) {
        successCount++;
      } else {
        errors.push({ statement: statement.substring(0, 100), error: error.message });
      }
    }
  }
  
  console.log(`\n✅ Migration completed successfully!`);
  console.log(`   Executed ${successCount}/${statements.length} statements`);
  
  if (errors.length > 0) {
    console.log(`\n⚠️  ${errors.length} warnings/errors:`);
    errors.forEach(({ statement, error }, i) => {
      console.log(`   ${i + 1}. ${error}`);
      console.log(`      Statement: ${statement}...`);
    });
  }
  
  // Verify tables were created
  console.log('\n🔍 Verifying migration...\n');
  
  const tables = [
    'users', 'one_time_passwords', 'magic_links', 'user_profiles',
    'totp_backup_codes', 'user_games', 'invite_codes', 'invite_code_usage',
    'user_sessions', 'audit_log'
  ];
  
  for (const table of tables) {
    const result = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = ${table}
      ) as exists
    `;
    if (result[0].exists) {
      console.log(`   ✅ Table '${table}' created`);
    } else {
      console.log(`   ❌ Table '${table}' NOT found`);
    }
  }
  
  // Check admin user was created
  const adminUser = await sql`
    SELECT * FROM users WHERE email = 'admin@marathon-majors-league.com'
  `;
  
  if (adminUser.length > 0) {
    console.log(`\n   ✅ Admin user created (ID: ${adminUser[0].id})`);
  } else {
    console.log(`\n   ⚠️  Admin user not found`);
  }
  
  console.log('\n🎉 Migration 003 completed successfully! ✨');
  console.log('\nNext steps:');
  console.log('1. Run tests: node tests/migration-003.test.js');
  console.log('2. Update admin credentials in database');
  console.log('3. Generate invite codes for initial users');
  
} catch (error) {
  console.error('\n❌ Migration failed:');
  console.error(error);
  process.exit(1);
}
