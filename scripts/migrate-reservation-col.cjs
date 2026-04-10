const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:1234@localhost:5432/iligan_surplus',
});

async function migrate() {
  try {
    await pool.query(`
      ALTER TABLE reservations 
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    `);
    console.log('SUCCESS: updated_at column added to reservations');
  } catch (err) {
    console.error('Migration error:', err.message);
  } finally {
    await pool.end();
  }
}

migrate();
