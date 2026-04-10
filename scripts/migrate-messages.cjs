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
    CREATE TABLE IF NOT EXISTS messages (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
    CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
  `;

  try {
    console.log('Migrating messages table...');
    await pool.query(sql);
    console.log('Migration complete.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await pool.end();
  }
}

migrate();
