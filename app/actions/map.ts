"use server";

import { query } from "@/lib/db";
import { getJsonCache, setJsonCache } from "@/lib/redisCache";
import { CACHE_KEYS, CACHE_TTL } from "@/lib/cacheInvalidation";
import { auth } from "@/lib/auth";
import { getUserFollowedStores } from "@/lib/repositories/followRepository";

export interface MapMerchant {
  storeId: string;
  merchantId: string;
  storeName: string;
  location: string;
  latitude: number;
  longitude: number;
  activeDrops: number;
  averageRating: number;
  reviewCount: number;
}

const MAP_CACHE_KEY = "map:merchants:v1";

/**
 * Fetches all approved merchants who have valid coordinates,
 * along with a count of their currently active surplus listings.
 * Cached for 60 seconds.
 */
export async function getApprovedMerchantsForMap(): Promise<MapMerchant[]> {
  const cached = await getJsonCache<MapMerchant[]>(MAP_CACHE_KEY);
  if (cached) return cached;

  const sql = `
    SELECT 
      s.id AS store_id,
      s.merchant_id,
      s.name AS store_name,
      s.iligan_barangay_location AS location,
      s.latitude,
      s.longitude,
      COALESCE(
        (SELECT COUNT(*) FROM surplus_listings sl 
         WHERE sl.store_id = s.id AND sl.quantity_available > 0),
        0
      )::int AS active_drops,
      COALESCE(
        (
          SELECT ROUND(AVG(r.rating)::numeric, 1)
          FROM reviews r
          JOIN surplus_listings sl ON r.listing_id = sl.id
          WHERE sl.store_id = s.id
        ),
        0
      )::float AS average_rating,
      COALESCE(
        (
          SELECT COUNT(r.id)
          FROM reviews r
          JOIN surplus_listings sl ON r.listing_id = sl.id
          WHERE sl.store_id = s.id
        ),
        0
      )::int AS review_count
    FROM stores s
    JOIN users u ON s.merchant_id = u.id
    WHERE s.latitude IS NOT NULL 
      AND s.longitude IS NOT NULL
      AND u.role = 'MERCHANT'
    ORDER BY active_drops DESC
  `;

  const res = await query(sql, []);

  const merchants: MapMerchant[] = res.rows.map((row) => ({
    storeId: row.store_id,
    merchantId: row.merchant_id,
    storeName: row.store_name,
    location: row.location,
    latitude: parseFloat(row.latitude),
    longitude: parseFloat(row.longitude),
    activeDrops: parseInt(row.active_drops) || 0,
    averageRating: parseFloat(row.average_rating) || 0,
    reviewCount: parseInt(row.review_count) || 0,
  }));

  await setJsonCache(MAP_CACHE_KEY, merchants, CACHE_TTL.ACTIVE_LISTINGS);
  return merchants;
}

/**
 * Returns storeIds that the current user follows.
 */
export async function getFollowedStoreIds(): Promise<Set<string>> {
  const session = await auth();
  if (!session?.user?.id) return new Set();
  
  const stores = await getUserFollowedStores(session.user.id);
  return new Set(stores.map((s) => s.storeId));
}
