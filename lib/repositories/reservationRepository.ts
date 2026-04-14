import { query } from '../db';
import { getJsonCache, setJsonCache } from '../redisCache';
import {
  CACHE_KEYS,
  CACHE_TTL,
  invalidateReservationCaches,
} from '../cacheInvalidation';

export interface Reservation {
  id: string;
  customerId: string;
  listingId: string;
  status: 'PENDING' | 'CLAIMED' | 'CANCELLED';
  reservationToken: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReservationWithDetails extends Reservation {
  listingTitle: string;
  storeName: string;
  pickupTimeWindow: string;
  reservedPrice: number;
}

// ─── Cached row types ──────────────────────────────────────
type CachedReservationWithDetails = Omit<ReservationWithDetails, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};

type CachedStoreReservation = CachedReservationWithDetails & {
  customerName: string;
  customerEmail: string;
};

function rehydrateReservation(row: CachedReservationWithDetails): ReservationWithDetails {
  return {
    ...row,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

function rehydrateStoreReservation(row: CachedStoreReservation): ReservationWithDetails & { customerName: string; customerEmail: string } {
  return {
    ...row,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

// ─── Create ────────────────────────────────────────────────
export async function createReservation(
  customerId: string,
  listingId: string,
  token: string
): Promise<Reservation | null> {
  const sql = `
    INSERT INTO reservations (customer_id, listing_id, reservation_token)
    VALUES ($1, $2, $3)
    RETURNING id, customer_id, listing_id, status, reservation_token, created_at, updated_at
  `;

  try {
    const res = await query(sql, [customerId, listingId, token]);

    if (res.rows.length === 0) return null;

    const row = res.rows[0];

    // Find the store_id for this listing so we can invalidate store-level caches
    const storeRes = await query(`SELECT store_id FROM surplus_listings WHERE id = $1`, [listingId]);
    const storeId = storeRes.rows[0]?.store_id;

    await invalidateReservationCaches(customerId, storeId);

    return {
      id: row.id,
      customerId: row.customer_id,
      listingId: row.listing_id,
      status: row.status as 'PENDING' | 'CLAIMED' | 'CANCELLED',
      reservationToken: row.reservation_token,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  } catch (error) {
    console.error('Failed to create reservation:', error);
    throw new Error('Failed to create reservation');
  }
}

/**
 * getReservationsByCustomerId
 * Cached per-customer reservation list.
 */
export async function getReservationsByCustomerId(customerId: string): Promise<ReservationWithDetails[]> {
  const cacheKey = `${CACHE_KEYS.RESERVATIONS_CUSTOMER_PREFIX}${customerId}`;
  const cached = await getJsonCache<CachedReservationWithDetails[]>(cacheKey);
  if (cached) return cached.map(rehydrateReservation);

  const sql = `
    SELECT 
      r.id, r.customer_id, r.listing_id, r.status, r.reservation_token, r.created_at, r.updated_at,
      sl.title AS listing_title, sl.reserved_price, sl.pickup_time_window,
      s.name AS store_name
    FROM reservations r
    JOIN surplus_listings sl ON r.listing_id = sl.id
    JOIN stores s ON sl.store_id = s.id
    WHERE r.customer_id = $1
    ORDER BY r.created_at DESC
  `;

  const res = await query(sql, [customerId]);

  const reservations: ReservationWithDetails[] = res.rows.map((row) => ({
    id: row.id,
    customerId: row.customer_id,
    listingId: row.listing_id,
    status: row.status as 'PENDING' | 'CLAIMED' | 'CANCELLED',
    reservationToken: row.reservation_token,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    listingTitle: row.listing_title,
    storeName: row.store_name,
    pickupTimeWindow: row.pickup_time_window,
    reservedPrice: parseFloat(row.reserved_price),
  }));

  const toCache: CachedReservationWithDetails[] = reservations.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));
  await setJsonCache(cacheKey, toCache, CACHE_TTL.RESERVATIONS);

  return reservations;
}

/**
 * getReservationsByStoreId
 * Cached per-store reservation list with customer details.
 */
export async function getReservationsByStoreId(storeId: string): Promise<(ReservationWithDetails & { customerName: string; customerEmail: string })[]> {
  const cacheKey = `${CACHE_KEYS.RESERVATIONS_STORE_PREFIX}${storeId}`;
  const cached = await getJsonCache<CachedStoreReservation[]>(cacheKey);
  if (cached) return cached.map(rehydrateStoreReservation);

  const sql = `
    SELECT 
      r.id, r.customer_id, r.listing_id, r.status, r.reservation_token, r.created_at, r.updated_at,
      sl.title AS listing_title, sl.reserved_price, sl.pickup_time_window,
      s.name AS store_name,
      u.name AS customer_name, u.email AS customer_email
    FROM reservations r
    JOIN surplus_listings sl ON r.listing_id = sl.id
    JOIN stores s ON sl.store_id = s.id
    JOIN users u ON r.customer_id = u.id
    WHERE sl.store_id = $1
    ORDER BY r.created_at DESC
  `;

  const res = await query(sql, [storeId]);

  const reservations = res.rows.map((row) => ({
    id: row.id,
    customerId: row.customer_id,
    listingId: row.listing_id,
    status: row.status as 'PENDING' | 'CLAIMED' | 'CANCELLED',
    reservationToken: row.reservation_token,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    listingTitle: row.listing_title,
    storeName: row.store_name,
    pickupTimeWindow: row.pickup_time_window,
    reservedPrice: parseFloat(row.reserved_price),
    customerName: row.customer_name,
    customerEmail: row.customer_email,
  }));

  const toCache: CachedStoreReservation[] = reservations.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));
  await setJsonCache(cacheKey, toCache, CACHE_TTL.RESERVATIONS);

  return reservations;
}

/**
 * updateReservationStatus
 * Updates status and invalidates both customer and store caches.
 */
export async function updateReservationStatus(
  reservationId: string,
  status: 'CLAIMED' | 'CANCELLED'
): Promise<boolean> {
  const sql = `
    UPDATE reservations 
    SET status = $2, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING id, customer_id, listing_id
  `;

  const res = await query(sql, [reservationId, status]);

  if (res.rows.length > 0) {
    const { customer_id, listing_id } = res.rows[0];

    // Look up the store for cross-repository invalidation
    const storeRes = await query(`SELECT store_id FROM surplus_listings WHERE id = $1`, [listing_id]);
    const storeId = storeRes.rows[0]?.store_id;

    await invalidateReservationCaches(customer_id, storeId);
    return true;
  }

  return false;
}
