import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment');
  process.exit(1);
}
const sql = neon(DATABASE_URL);

async function checkMigration() {
  const tables = [
    'users', 'one_time_passwords', 'magic_links', 'user_profiles',
    'totp_backup_codes', 'user_games', 'invite_codes', 'invite_code_usage',
    'user_sessions', 'audit_log'
  ];
  const functions = ['cleanup_expired_auth_tokens', 'user_has_valid_auth', 'soft_delete_user'];

  console.log('🔍 Checking tables...');
  for (const table of tables) {
    const result = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = ${table}
      ) as exists
    `;
    console.log(`   ${result[0].exists ? '✅' : '❌'} Table '${table}'`);
  }

  console.log('\n🔍 Checking functions...');
  for (const func of functions) {
    const result = await sql`
      SELECT EXISTS (SELECT FROM pg_proc WHERE proname = ${func}) as exists
    `;
    console.log(`   ${result[0].exists ? '✅' : '❌'} Function '${func}'`);
  }

  // Check admin user
  const adminUser = await sql`
    SELECT * FROM users WHERE email = 'admin@marathon-majors-league.com'
  `;
  console.log('\n👤 Admin user status:');
  if (adminUser.length > 0) {
    console.log(`   ✅ Admin user created (ID: ${adminUser[0].id})`);
  } else {
    console.log('   ❌ Admin user not found');
  }
}

checkMigration();
