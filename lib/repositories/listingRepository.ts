import { cache } from 'react';
import { unstable_cache, revalidateTag } from 'next/cache';
import { query } from '../db';
import { getJsonCache, setJsonCache } from '../redisCache';
import {
  CACHE_KEYS,
  CACHE_TTL,
  invalidateListingCaches,
} from '../cacheInvalidation';

export interface ActiveListing {
  id: string;
  storeId: string;
  merchantId: string;
  storeName: string;
  storeLocation: string;
  storeLatitude?: number | null;
  storeLongitude?: number | null;
  title: string;
  originalPrice: number;
  reservedPrice: number;
  quantityAvailable: number;
  pickupTimeWindow: string;
  imageUrl: string | null;
  createdAt: Date;
}

type CachedActiveListing = Omit<ActiveListing, "createdAt"> & { createdAt: string };

/**
 * Base data fetching function.
 * We extract this so it can be wrapped tightly in `unstable_cache`.
 */
async function fetchActiveListingsFromDb(): Promise<ActiveListing[]> {
  const sql = `
    SELECT 
      sl.id, 
      sl.store_id, 
      sl.title, 
      sl.original_price, 
      sl.reserved_price, 
      sl.quantity_available, 
      sl.pickup_time_window, 
      sl.aesthetic_cover_image_url,
      sl.created_at,
      s.name AS store_name,
      s.iligan_barangay_location AS store_location,
      s.latitude AS store_latitude,
      s.longitude AS store_longitude,
      s.merchant_id
    FROM surplus_listings sl
    JOIN stores s ON sl.store_id = s.id
    WHERE sl.created_at >= NOW() - INTERVAL '24 hours'
      AND sl.quantity_available >= 0
    ORDER BY sl.created_at DESC
  `;
  
  const res = await query(sql);
  
  // Type mapping: Snake case -> Camel case
  return res.rows.map((row) => ({
    id: row.id,
    storeId: row.store_id,
    merchantId: row.merchant_id,
    storeName: row.store_name,
    storeLocation: row.store_location,
    title: row.title,
    originalPrice: parseFloat(row.original_price),
    reservedPrice: parseFloat(row.reserved_price),
    quantityAvailable: row.quantity_available,
    pickupTimeWindow: row.pickup_time_window,
    imageUrl: row.aesthetic_cover_image_url || null,
    createdAt: new Date(row.created_at),
  }));
}

function toCachedListings(listings: ActiveListing[]): CachedActiveListing[] {
  return listings.map((listing) => ({
    ...listing,
    createdAt: listing.createdAt.toISOString(),
  }));
}

function fromCachedListings(cached: CachedActiveListing[]): ActiveListing[] {
  return cached.map((listing) => ({
    ...listing,
    createdAt: new Date(listing.createdAt),
  }));
}

/**
 * getActiveListings
 * 1. `unstable_cache` provides high-performance Edge caching until invalidated via tags.
 * 2. `cache()` prevents redundant SQL calls within the exact same React render lifecycle.
 */
export const getActiveListings = cache(
  unstable_cache(
    async () => {
      const cachedListings = await getJsonCache<CachedActiveListing[]>(CACHE_KEYS.ACTIVE_LISTINGS);
      if (cachedListings !== null) {
        return fromCachedListings(cachedListings);
      }

      const listings = await fetchActiveListingsFromDb();
      await setJsonCache(CACHE_KEYS.ACTIVE_LISTINGS, toCachedListings(listings), CACHE_TTL.ACTIVE_LISTINGS);
      return listings;
    },
    ['surplus-active-listings'], // Key identifier for caching mechanism mapping
    {
      tags: ['active-listings'], // Cache tags allowing on-demand Next.js invalidate triggers
      revalidate: 60, // ISR-style revalidation window for listing freshness
    }
  )
);

/**
 * decrementQuantity
 * Modifies state directly in PostgreSQL, then forcibly invalidates the Edge Cache
 * so subsequent hits accurately register the inventory decrease.
 */
export async function decrementQuantity(listingId: string): Promise<boolean> {
  const sql = `
    UPDATE surplus_listings 
    SET quantity_available = quantity_available - 1
    WHERE id = $1 AND quantity_available > 0
    RETURNING id, quantity_available
  `;

  const res = await query(sql, [listingId]);

  if (res.rows.length > 0) {
    // @ts-expect-error - Next.js natively crashes if a 2nd argument is provided here, despite generic TS typings
    revalidateTag('active-listings');
    await invalidateListingCaches();
    return true;
  }

  return false;
}

/**
 * getListingsByStoreId
 * Returns all listings for a specific store (merchant's own view).
 */
export async function getListingsByStoreId(storeId: string): Promise<ActiveListing[]> {
  const sql = `
    SELECT 
      sl.id, sl.store_id, sl.title, sl.original_price, sl.reserved_price,
      sl.quantity_available, sl.pickup_time_window, sl.aesthetic_cover_image_url,
      sl.created_at,
      s.name AS store_name, s.iligan_barangay_location AS store_location,
      s.latitude AS store_latitude, s.longitude AS store_longitude, s.merchant_id
    FROM surplus_listings sl
    JOIN stores s ON sl.store_id = s.id
    WHERE sl.store_id = $1
    ORDER BY sl.created_at DESC
  `;

  const res = await query(sql, [storeId]);

  return res.rows.map((row) => ({
    id: row.id,
    storeId: row.store_id,
    merchantId: row.merchant_id,
    storeName: row.store_name,
    storeLocation: row.store_location,
    storeLatitude: row.store_latitude ? parseFloat(row.store_latitude) : null,
    storeLongitude: row.store_longitude ? parseFloat(row.store_longitude) : null,
    title: row.title,
    originalPrice: parseFloat(row.original_price),
    reservedPrice: parseFloat(row.reserved_price),
    quantityAvailable: row.quantity_available,
    pickupTimeWindow: row.pickup_time_window,
    imageUrl: row.aesthetic_cover_image_url || null,
    createdAt: new Date(row.created_at),
  }));
}

export interface CreateListingData {
  storeId: string;
  title: string;
  originalPrice: number;
  reservedPrice: number;
  quantityAvailable: number;
  pickupTimeWindow: string;
  imageUrl?: string;
}

/**
 * createListing
 * Inserts a new surplus listing and invalidates the cache.
 */
export async function createListing(data: CreateListingData): Promise<ActiveListing | null> {
  const sql = `
    INSERT INTO surplus_listings (store_id, title, original_price, reserved_price, quantity_available, pickup_time_window, aesthetic_cover_image_url)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id, store_id, title, original_price, reserved_price, quantity_available, pickup_time_window, aesthetic_cover_image_url, created_at
  `;

  const res = await query(sql, [
    data.storeId,
    data.title,
    data.originalPrice,
    data.reservedPrice,
    data.quantityAvailable,
    data.pickupTimeWindow,
    data.imageUrl || null,
  ]);

  if (res.rows.length === 0) return null;

  const row = res.rows[0];

  // Invalidate public feed + admin caches
  // @ts-expect-error - Next.js natively crashes if a 2nd argument is provided here
  revalidateTag('active-listings');
  await invalidateListingCaches();

  return {
    id: row.id,
    storeId: row.store_id,
    merchantId: '', // Default empty since creation doesn't instantly join merchant
    storeName: '',
    storeLocation: '',
    storeLatitude: null,
    storeLongitude: null,
    title: row.title,
    originalPrice: parseFloat(row.original_price),
    reservedPrice: parseFloat(row.reserved_price),
    quantityAvailable: row.quantity_available,
    pickupTimeWindow: row.pickup_time_window,
    imageUrl: row.aesthetic_cover_image_url || null,
    createdAt: new Date(row.created_at),
  };
}
