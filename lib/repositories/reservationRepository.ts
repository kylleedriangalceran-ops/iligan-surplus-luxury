import { query } from '../db';

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
 * Returns all reservations for a customer with listing & store details.
 */
export async function getReservationsByCustomerId(customerId: string): Promise<ReservationWithDetails[]> {
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

  return res.rows.map((row) => ({
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
}

/**
 * getReservationsByStoreId
 * Returns all reservations for a merchant's store with customer & listing details.
 */
export async function getReservationsByStoreId(storeId: string): Promise<(ReservationWithDetails & { customerName: string; customerEmail: string })[]> {
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

  return res.rows.map((row) => ({
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
}

/**
 * updateReservationStatus
 * Updates a reservation's status (CLAIMED or CANCELLED).
 */
export async function updateReservationStatus(
  reservationId: string,
  status: 'CLAIMED' | 'CANCELLED'
): Promise<boolean> {
  const sql = `
    UPDATE reservations 
    SET status = $2, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING id
  `;

  const res = await query(sql, [reservationId, status]);
  return res.rows.length > 0;
}
