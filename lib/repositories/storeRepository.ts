import { cache } from 'react';
import { query } from '../db';
import { getJsonCache, setJsonCache, deleteCacheKey } from '../redisCache';
import {
  CACHE_KEYS,
  CACHE_TTL,
  invalidateStoreStatsCaches,
} from '../cacheInvalidation';

export interface Store {
  id: string;
  merchantId: string;
  name: string;
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  coverImageUrl: string | null;
  createdAt: Date;
}

export interface CreateStoreData {
  merchantId: string;
  name: string;
  location: string;
  latitude?: number;
  longitude?: number;
  coverImageUrl?: string;
}

export interface StoreStats {
  activeListings: number;
  pendingReservations: number;
  totalReserved: number;
}

type CachedStore = Omit<Store, "createdAt"> & { createdAt: string };

/**
 * findStoreByMerchantId
 * Cached per-render lookup of a merchant's store.
 */
export const findStoreByMerchantId = cache(async (merchantId: string): Promise<Store | null> => {
  const cacheKey = `${CACHE_KEYS.STORE_BY_MERCHANT_PREFIX}${merchantId}`;
  const cachedStore = await getJsonCache<CachedStore>(cacheKey);

  if (cachedStore) {
    return {
      ...cachedStore,
      createdAt: new Date(cachedStore.createdAt),
    };
  }

  const res = await query(
    'SELECT id, merchant_id, name, iligan_barangay_location, latitude, longitude, aesthetic_cover_image_url, created_at FROM stores WHERE merchant_id = $1',
    [merchantId]
  );

  if (res.rows.length === 0) return null;

  const row = res.rows[0];
  const store: Store = {
    id: row.id,
    merchantId: row.merchant_id,
    name: row.name,
    location: row.iligan_barangay_location,
    latitude: row.latitude ? parseFloat(row.latitude) : null,
    longitude: row.longitude ? parseFloat(row.longitude) : null,
    coverImageUrl: row.aesthetic_cover_image_url,
    createdAt: new Date(row.created_at),
  };

  await setJsonCache<CachedStore>(
    cacheKey,
    {
      ...store,
      createdAt: store.createdAt.toISOString(),
    },
    CACHE_TTL.STORE_BY_MERCHANT
  );

  return store;
});

/**
 * createStore
 * Inserts a new store for a merchant.
 */
export async function createStore(data: CreateStoreData): Promise<Store | null> {
  const res = await query(
    `INSERT INTO stores (merchant_id, name, iligan_barangay_location, latitude, longitude, aesthetic_cover_image_url)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, merchant_id, name, iligan_barangay_location, latitude, longitude, aesthetic_cover_image_url, created_at`,
    [data.merchantId, data.name, data.location, data.latitude || null, data.longitude || null, data.coverImageUrl || null]
  );

  if (res.rows.length === 0) return null;

  const row = res.rows[0];
  const store: Store = {
    id: row.id,
    merchantId: row.merchant_id,
    name: row.name,
    location: row.iligan_barangay_location,
    latitude: row.latitude ? parseFloat(row.latitude) : null,
    longitude: row.longitude ? parseFloat(row.longitude) : null,
    coverImageUrl: row.aesthetic_cover_image_url,
    createdAt: new Date(row.created_at),
  };

  await setJsonCache<CachedStore>(
    `${CACHE_KEYS.STORE_BY_MERCHANT_PREFIX}${store.merchantId}`,
    {
      ...store,
      createdAt: store.createdAt.toISOString(),
    },
    CACHE_TTL.STORE_BY_MERCHANT
  );

  return store;
}

/**
 * getStoreStats
 * Dashboard statistics for a merchant's store. Cached with 30s TTL.
 */
export async function getStoreStats(storeId: string): Promise<StoreStats> {
  const cacheKey = `${CACHE_KEYS.STORE_STATS_PREFIX}${storeId}`;
  const cached = await getJsonCache<StoreStats>(cacheKey);
  if (cached) return cached;

  const statsQuery = `
    SELECT
      (SELECT COUNT(*) FROM surplus_listings WHERE store_id = $1 AND quantity_available > 0) AS active_listings,
      (SELECT COUNT(*) FROM reservations r 
       JOIN surplus_listings sl ON r.listing_id = sl.id 
       WHERE sl.store_id = $1 AND r.status = 'PENDING') AS pending_reservations,
      (SELECT COUNT(*) FROM reservations r 
       JOIN surplus_listings sl ON r.listing_id = sl.id 
       WHERE sl.store_id = $1) AS total_reserved
  `;

  const res = await query(statsQuery, [storeId]);
  const row = res.rows[0];

  const stats: StoreStats = {
    activeListings: parseInt(row.active_listings) || 0,
    pendingReservations: parseInt(row.pending_reservations) || 0,
    totalReserved: parseInt(row.total_reserved) || 0,
  };

  await setJsonCache(cacheKey, stats, CACHE_TTL.STORE_STATS);
  return stats;
}

/**
 * updateStoreCoordinates
 * Updates the latitude and longitude for a merchant's store.
 * Invalidates the store cache to ensure fresh data.
 */
export async function updateStoreCoordinates(
  merchantId: string,
  latitude: number,
  longitude: number
): Promise<boolean> {
  const res = await query(
    `UPDATE stores 
     SET latitude = $2, longitude = $3
     WHERE merchant_id = $1 
     RETURNING id`,
    [merchantId, latitude, longitude]
  );

  if (res.rows.length > 0) {
    // Invalidate store cache
    await deleteCacheKey(`${CACHE_KEYS.STORE_BY_MERCHANT_PREFIX}${merchantId}`);
    return true;
  }

  return false;
}
