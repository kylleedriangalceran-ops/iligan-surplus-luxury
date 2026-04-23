// eslint-disable-next-line @typescript-eslint/no-require-imports
require('dotenv').config({ path: '.env' });
// eslint-disable-next-line @typescript-eslint/no-require-imports 
const { Pool } = require('pg');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function seedAdmin() {
  const client = await pool.connect();
  try {
    const email = 'admin@iligan-surplus.com';
    const password = 'adminpassword123';
    const name = 'System Administrator';

    // Check if admin exists
    const res = await client.query('SELECT * FROM users WHERE email = $1', [email]);
    if (res.rows.length > 0) {
      console.log('Admin already exists! Promoting just in case.');
      await client.query("UPDATE users SET role = 'ADMIN' WHERE email = $1", [email]);
      console.log(`Use email: ${email} and the password you previously created for it.`);
    } else {
      console.log('Creating new admin user...');
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);

      await client.query(`
        INSERT INTO users (email, password_hash, name, role)
        VALUES ($1, $2, $3, 'ADMIN')
      `, [email, hash, name]);

      console.log('Successfully created admin user!');
      console.log(`Email: ${email}`);
      console.log(`Password: ${password}`);
    }
  } catch (error) {
    console.error('Error seeding admin:', error);
  } finally {
    client.release();
    pool.end();
  }
}

seedAdmin();
