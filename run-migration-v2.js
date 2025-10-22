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
  
  // Execute the entire migration as one transaction
  // Split by statement terminators but be smart about function definitions
  const statements = [];
  let currentStatement = '';
  let inFunction = false;
  
  migrationSQL.split('\n').forEach(line => {
    // Track if we're inside a function definition
    if (line.match(/CREATE (OR REPLACE )?FUNCTION/i)) {
      inFunction = true;
    }
    if (inFunction && line.trim() === '$$;') {
      inFunction = false;
      currentStatement += line + '\n';
      statements.push(currentStatement.trim());
      currentStatement = '';
      return;
    }
    
    currentStatement += line + '\n';
    
    // If we hit a semicolon and we're not in a function, it's a new statement
    if (!inFunction && line.trim().endsWith(';') && !line.trim().startsWith('--')) {
      const stmt = currentStatement.trim();
      if (stmt && !stmt.startsWith('--')) {
        statements.push(stmt);
      }
      currentStatement = '';
    }
  });
  
  // Add any remaining statement
  if (currentStatement.trim() && !currentStatement.trim().startsWith('--')) {
    statements.push(currentStatement.trim());
  }
  
  console.log(`📊 Found ${statements.length} SQL statements to execute\n`);
  
  let successCount = 0;
  let skipCount = 0;
  let errors = [];
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    
    // Skip comments and empty statements
    if (!statement || statement.startsWith('--') || statement.trim().length === 0) {
      skipCount++;
      continue;
    }
    
    try {
      await sql.unsafe(statement);
      successCount++;
      
      // Show progress every 5 statements
      if ((successCount) % 5 === 0) {
        console.log(`✓ Executed ${successCount} statements...`);
      }
    } catch (error) {
      // Some errors are expected (e.g., "already exists" warnings)
      const errorMsg = error.message.toLowerCase();
      if (errorMsg.includes('already exists') || 
          errorMsg.includes('does not exist') ||
          errorMsg.includes('duplicate')) {
        skipCount++;
      } else {
        console.error(`\n⚠️  Error on statement ${i + 1}:`);
        console.error(`   ${error.message}`);
        console.error(`   Statement: ${statement.substring(0, 200)}...\n`);
        errors.push({ index: i + 1, error: error.message, statement: statement.substring(0, 100) });
      }
    }
  }
  
  console.log(`\n✅ Migration execution completed!`);
  console.log(`   Executed: ${successCount} statements`);
  console.log(`   Skipped:  ${skipCount} statements`);
  console.log(`   Errors:   ${errors.length} errors\n`);
  
  // Verify tables were created
  console.log('🔍 Verifying migration results...\n');
  
  const tables = [
    'users', 'one_time_passwords', 'magic_links', 'user_profiles',
    'totp_backup_codes', 'user_games', 'invite_codes', 'invite_code_usage',
    'user_sessions', 'audit_log'
  ];
  
  let tablesCreated = 0;
  for (const table of tables) {
    const result = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = ${table}
      ) as exists
    `;
    if (result[0].exists) {
      console.log(`   ✅ Table '${table}' exists`);
      tablesCreated++;
    } else {
      console.log(`   ❌ Table '${table}' NOT found`);
    }
  }
  
  // Check functions
  console.log('\n🔧 Verifying functions...\n');
  const functions = ['cleanup_expired_auth_tokens', 'user_has_valid_auth', 'soft_delete_user'];
  let functionsCreated = 0;
  
  for (const func of functions) {
    const result = await sql`
      SELECT EXISTS (
        SELECT FROM pg_proc 
        WHERE proname = ${func}
      ) as exists
    `;
    if (result[0].exists) {
      console.log(`   ✅ Function '${func}' exists`);
      functionsCreated++;
    } else {
      console.log(`   ❌ Function '${func}' NOT found`);
    }
  }
  
  // Check admin user
  const adminUser = await sql`
    SELECT * FROM users WHERE email = 'admin@marathon-majors-league.com'
  `;
  
  console.log('\n👤 Admin user status:\n');
  if (adminUser.length > 0) {
    console.log(`   ✅ Admin user created (ID: ${adminUser[0].id})`);
    console.log(`   📧 Email: ${adminUser[0].email}`);
    console.log(`   👤 Name: ${adminUser[0].display_name}`);
    console.log(`   🔐 Admin: ${adminUser[0].is_admin}`);
  } else {
    console.log(`   ⚠️  Admin user not found`);
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 MIGRATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Tables created:    ${tablesCreated}/${tables.length}`);
  console.log(`Functions created: ${functionsCreated}/${functions.length}`);
  console.log(`Admin user:        ${adminUser.length > 0 ? 'Created ✅' : 'Not found ❌'}`);
  console.log('='.repeat(60));
  
  if (tablesCreated === tables.length && functionsCreated === functions.length && adminUser.length > 0) {
    console.log('\n🎉 Migration 003 completed successfully! ✨\n');
    console.log('Next steps:');
    console.log('1. Run tests: node tests/migration-003.test.js');
    console.log('2. Update admin credentials in database');
    console.log('3. Generate invite codes for initial users\n');
  } else {
    console.log('\n⚠️  Migration completed with warnings. Please review the output above.\n');
    if (errors.length > 0) {
      console.log('Errors encountered:');
      errors.forEach(({ index, error }) => {
        console.log(`  ${index}. ${error}`);
      });
    }
  }
  
} catch (error) {
  console.error('\n❌ Migration failed:');
  console.error(error);
  process.exit(1);
}
