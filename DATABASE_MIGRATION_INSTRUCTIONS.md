# Database Migration Instructions

## Required: Add Latitude and Longitude Columns

Before using the merchant location feature, you need to run this SQL migration:

### Option 1: Using psql command line
```bash
psql -U your_username -d iligan_luxury_surplus -f scripts/add-store-coordinates.sql
```

### Option 2: Using pgAdmin or any PostgreSQL client
Copy and paste this SQL:

```sql
-- Add latitude and longitude columns to stores table
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Add index for geospatial queries
CREATE INDEX IF NOT EXISTS idx_stores_coordinates ON stores(latitude, longitude);

-- Update existing stores to have default Iligan City coordinates (merchants can update later)
UPDATE stores 
SET latitude = 8.2280, longitude = 124.2452 
WHERE latitude IS NULL OR longitude IS NULL;
```

### Option 3: Using your database management tool
1. Connect to your `iligan_luxury_surplus` database
2. Run the SQL script located at `scripts/add-store-coordinates.sql`

## Verification

After running the migration, verify it worked:

```sql
-- Check if columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'stores' 
AND column_name IN ('latitude', 'longitude');

-- Check if index was created
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'stores' 
AND indexname = 'idx_stores_coordinates';
```

You should see both columns listed and the index created.

## What This Enables

- Merchants can set their store location on an interactive map
- Customers see merchant locations in real-time on the map page
- Fast geospatial queries with the index
- Default coordinates set to Iligan City center for existing stores
