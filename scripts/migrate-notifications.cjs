const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:1234@localhost:5432/iligan_surplus',
});

async function migrateNotifications() {
  try {
    await pool.query(`
      DO $$ BEGIN
          CREATE TYPE notification_type AS ENUM ('NEW_DROP', 'RESERVATION_MADE', 'RESERVATION_CLAIMED', 'RESERVATION_CANCELLED');
      EXCEPTION
          WHEN duplicate_object THEN null;
      END $$;

      CREATE TABLE IF NOT EXISTS notifications (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE, 
          message TEXT NOT NULL,
          type notification_type NOT NULL,
          is_read BOOLEAN DEFAULT FALSE,
          link VARCHAR(255),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
    `);
    console.log('SUCCESS: Notifications table and enum created successfully.');
  } catch (err) {
    console.error('Migration error:', err.message);
  } finally {
    await pool.end();
  }
}

migrateNotifications();
