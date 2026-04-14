const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    await client.connect();
    await client.query(`
      CREATE TABLE IF NOT EXISTS follows (
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (user_id, store_id)
      );
      CREATE INDEX IF NOT EXISTS idx_follows_store_id ON follows(store_id);
      CREATE INDEX IF NOT EXISTS idx_follows_user_id ON follows(user_id);
    `);
    console.log('Follows table created');
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
