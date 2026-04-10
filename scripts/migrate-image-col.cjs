const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:1234@localhost:5432/iligan_surplus',
});

async function migrate() {
  try {
    await pool.query(`
      ALTER TABLE surplus_listings 
      ADD COLUMN IF NOT EXISTS aesthetic_cover_image_url TEXT;
    `);
    console.log('SUCCESS: aesthetic_cover_image_url column added to surplus_listings');
  } catch (err) {
    console.error('Migration error:', err.message);
  } finally {
    await pool.end();
  }
}

migrate();
