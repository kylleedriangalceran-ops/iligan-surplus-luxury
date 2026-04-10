require('dotenv').config({ path: '.env' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  const client = await pool.connect();

  try {
    console.log('Starting admin suite DB migration...');

    // 1. Create merchant_applications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS merchant_applications (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        store_name VARCHAR(255) NOT NULL,
        address TEXT NOT NULL,
        social_media VARCHAR(255),
        status VARCHAR(50) DEFAULT 'PENDING',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Created merchant_applications table.');

    // 2. Create global_settings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS global_settings (
        key VARCHAR(255) PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Created global_settings table.');

    // Seed global_settings if empty
    await client.query(`
      INSERT INTO global_settings (key, value) VALUES 
      ('maintenance_mode', 'false'),
      ('platform_fee_percent', '5')
      ON CONFLICT (key) DO NOTHING;
    `);
    console.log('Seeded global_settings.');

    // 3. Add is_banned to users table safely
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE;
    `);
    console.log('Added is_banned flag to users.');

    console.log('Migration successful!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
