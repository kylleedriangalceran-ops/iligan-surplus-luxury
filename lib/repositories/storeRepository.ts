import { cache } from 'react';
import { query } from '../db';

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

/**
 * findStoreByMerchantId
 * Cached per-render lookup of a merchant's store.
 */
export const findStoreByMerchantId = cache(async (merchantId: string): Promise<Store | null> => {
  const res = await query(
    'SELECT id, merchant_id, name, iligan_barangay_location, latitude, longitude, aesthetic_cover_image_url, created_at FROM stores WHERE merchant_id = $1',
    [merchantId]
  );

  if (res.rows.length === 0) return null;

  const row = res.rows[0];
  return {
    id: row.id,
    merchantId: row.merchant_id,
    name: row.name,
    location: row.iligan_barangay_location,
    latitude: row.latitude ? parseFloat(row.latitude) : null,
    longitude: row.longitude ? parseFloat(row.longitude) : null,
    coverImageUrl: row.aesthetic_cover_image_url,
    createdAt: new Date(row.created_at),
  };
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
  return {
    id: row.id,
    merchantId: row.merchant_id,
    name: row.name,
    location: row.iligan_barangay_location,
    latitude: row.latitude ? parseFloat(row.latitude) : null,
    longitude: row.longitude ? parseFloat(row.longitude) : null,
    coverImageUrl: row.aesthetic_cover_image_url,
    createdAt: new Date(row.created_at),
  };
}

/**
 * getStoreStats
 * Dashboard statistics for a merchant's store.
 */
export async function getStoreStats(storeId: string): Promise<StoreStats> {
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

  return {
    activeListings: parseInt(row.active_listings) || 0,
    pendingReservations: parseInt(row.pending_reservations) || 0,
    totalReserved: parseInt(row.total_reserved) || 0,
  };
}
