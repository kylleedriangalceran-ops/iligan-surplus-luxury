import { Pool, QueryResultRow } from 'pg';

if (!process.env.DATABASE_URL) {
  // If not using Neon, standard local PostgreSQL looks like:
  // postgresql://postgres:password@localhost:5432/iligan_surplus
  console.warn('DATABASE_URL is not set. Database connections will fail.');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Add SSL if you are connecting to a remote db like Supabase or Neon.
  // ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

/**
 * Executes a query against the PostgreSQL database.
 * Pure PostgreSQL approach leveraging the 'pg' library.
 */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: (string | number | boolean | null)[]
) {
  const res = await pool.query<T>(text, params);
  return res;
}

export default pool;
