const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

async function migrate() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const sql = `
    ALTER TABLE stores ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
    ALTER TABLE stores ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);
  `;

  try {
    console.log('Migrating stores table for coordinates...');
    await pool.query(sql);
    console.log('Migration complete.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await pool.end();
  }
}

migrate();
