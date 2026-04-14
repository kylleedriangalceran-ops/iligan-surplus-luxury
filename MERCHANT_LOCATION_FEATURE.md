# Merchant Location Feature

## Overview
Merchants can now set their store location on an interactive map, which will be displayed in real-time to all customers (both followers and non-followers) on the customer map page.

## Database Migration

First, run the migration to add latitude and longitude columns to the stores table:

```bash
# Connect to your PostgreSQL database and run:
psql -U your_username -d your_database -f scripts/add-store-coordinates.sql
```

Or manually execute:
```sql
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

CREATE INDEX IF NOT EXISTS idx_stores_coordinates ON stores(latitude, longitude);

UPDATE stores 
SET latitude = 8.2280, longitude = 124.2452 
WHERE latitude IS NULL OR longitude IS NULL;
```

## Features

### For Merchants:
1. **Set Location Button** - Available on the merchant dashboard
   - Shows "Set Location" if no location is set (amber/warning style)
   - Shows "Update Location" if location exists (green/success style)

2. **Interactive Map Panel**
   - Click anywhere on the map to place a marker
   - Drag the marker to adjust the exact location
   - Real-time coordinate display
   - Save button to persist the location

3. **Real-time Updates**
   - Location changes are immediately reflected on the customer map
   - Cache invalidation ensures fresh data

### For Customers:
1. **Map Display**
   - All merchants with set locations appear on the map
   - Followed merchants have a distinct gold pin with star icon
   - Regular merchants have a standard dark pin
   - Pin tooltips show store name, location, and active drops count

2. **Real-time Visibility**
   - When a merchant sets/updates their location, it appears immediately on the map
   - No page refresh needed (cache TTL: 60 seconds)

## Components Created

1. **SetLocationPanel.tsx** - Interactive map panel for setting location
2. **SetLocationWrapper.tsx** - Client wrapper with toast notifications
3. **updateStoreLocation** - Server action in `app/actions/merchant.ts`
4. **updateStoreCoordinates** - Repository function in `lib/repositories/storeRepository.ts`

## How It Works

1. Merchant clicks "Set Location" button on dashboard
2. Slide-out panel opens with interactive Leaflet map
3. Merchant clicks or drags marker to desired location
4. Coordinates are displayed in real-time
5. Merchant clicks "Save Location"
6. Server action updates database and invalidates caches
7. Customer map automatically shows the merchant's location

## Technical Details

- **Map Library**: Leaflet (via react-leaflet)
- **Coordinate Precision**: 8 decimal places for latitude, 11 for longitude
- **Default Location**: Iligan City center (8.2280, 124.2452)
- **Cache Strategy**: 60-second TTL with automatic invalidation on updates
- **Database Index**: Geospatial index on (latitude, longitude) for fast queries

## Styling

- Consistent with the luxury minimalist aesthetic
- Sky blue (#0EA5E9) theme for location features
- Smooth animations and transitions
- Responsive design for mobile and desktop
