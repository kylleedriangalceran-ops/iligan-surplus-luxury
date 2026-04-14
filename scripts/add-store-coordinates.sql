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
