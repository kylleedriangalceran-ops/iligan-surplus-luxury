const { Pool } = require("pg");
require("dotenv").config({ path: ".env.local" });
require("dotenv").config();

async function migrate() {
  const connectionString =
    process.env.DATABASE_URL ||
    "postgresql://postgres:1234@localhost:5432/iligan_surplus";

  const pool = new Pool({ connectionString });

  const sql = `
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'surplus_drop_status') THEN
        CREATE TYPE surplus_drop_status AS ENUM ('LIVE', 'SOLD_OUT', 'ARCHIVED');
      END IF;
    END$$;

    CREATE TABLE IF NOT EXISTS products (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      merchant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      original_price DECIMAL(10, 2) NOT NULL,
      image_url TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_products_merchant_id ON products(merchant_id);
    CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);

    CREATE TABLE IF NOT EXISTS surplus_drops (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      quantity INT NOT NULL CHECK (quantity >= 0),
      discount_price DECIMAL(10, 2) NOT NULL CHECK (discount_price >= 0),
      status surplus_drop_status NOT NULL DEFAULT 'LIVE',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_surplus_drops_product_id ON surplus_drops(product_id);
    CREATE INDEX IF NOT EXISTS idx_surplus_drops_status_created_at ON surplus_drops(status, created_at DESC);
  `;

  try {
    console.log("Migrating master menu tables (products, surplus_drops)...");
    await pool.query(sql);
    console.log("Migration complete.");
  } catch (err) {
    console.error("Migration failed:", err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

migrate();

