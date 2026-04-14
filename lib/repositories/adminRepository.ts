import { query } from '../db';
import pool from '../db';
import { getJsonCache, setJsonCache, deleteCacheKey } from '../redisCache';
import {
  CACHE_KEYS,
  CACHE_TTL,
  invalidateUserCaches,
  invalidateListingCaches,
  invalidateApplicationCaches,
  invalidateSettingsCaches,
} from '../cacheInvalidation';

// ─── Interfaces ─────────────────────────────────────────────
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  isBanned: boolean;
  createdAt: Date;
}

export interface AdminStats {
  totalUsers: number;
  totalMerchants: number;
  totalCustomers: number;
  totalListings: number;
  totalReservations: number;
  pendingReservations: number;
  pendingApplications: number;
  totalRevenue: number;
}

export interface MerchantApplication {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  storeName: string;
  address: string;
  socialMedia: string | null;
  status: string;
  createdAt: Date;
}

export interface LiveDrop {
  id: string;
  title: string;
  storeName: string;
  merchantName: string;
  originalPrice: number;
  reservedPrice: number;
  quantityAvailable: number;
  pickupTimeWindow: string;
  imageUrl: string | null;
  createdAt: Date;
}

export interface GlobalSetting {
  key: string;
  value: string;
}

// ─── Cached row types (Dates serialized as ISO strings) ─────
type CachedAdminUser = Omit<AdminUser, 'createdAt'> & { createdAt: string };
type CachedMerchantApp = Omit<MerchantApplication, 'createdAt'> & { createdAt: string };
type CachedLiveDrop = Omit<LiveDrop, 'createdAt'> & { createdAt: string };

function rehydrateDate<T extends { createdAt: string }>(row: T): Omit<T, 'createdAt'> & { createdAt: Date } {
  return { ...row, createdAt: new Date(row.createdAt) };
}

// ─── Stats ──────────────────────────────────────────────────
export async function getAdminStats(): Promise<AdminStats> {
  // Check cache
  const cached = await getJsonCache<AdminStats>(CACHE_KEYS.ADMIN_STATS);
  if (cached) return cached;

  const [users, listings, reservations, applications, revenue] = await Promise.all([
    query(`SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE role = 'MERCHANT') as merchants,
      COUNT(*) FILTER (WHERE role = 'CUSTOMER') as customers
    FROM users`),
    query(`SELECT COUNT(*) as total FROM surplus_listings`),
    query(`SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'PENDING') as pending
    FROM reservations`),
    query(`SELECT COUNT(*) as total FROM merchant_applications WHERE status = 'PENDING'`),
    query(`SELECT COALESCE(SUM(sl.reserved_price), 0) as total_revenue FROM reservations r JOIN surplus_listings sl ON r.listing_id = sl.id WHERE r.status != 'CANCELLED'`),
  ]);

  const stats: AdminStats = {
    totalUsers: parseInt(users.rows[0].total),
    totalMerchants: parseInt(users.rows[0].merchants),
    totalCustomers: parseInt(users.rows[0].customers),
    totalListings: parseInt(listings.rows[0].total),
    totalReservations: parseInt(reservations.rows[0].total),
    pendingReservations: parseInt(reservations.rows[0].pending),
    pendingApplications: parseInt(applications.rows[0].total),
    totalRevenue: parseFloat(revenue.rows[0].total_revenue),
  };

  await setJsonCache(CACHE_KEYS.ADMIN_STATS, stats, CACHE_TTL.ADMIN_STATS);
  return stats;
}

// ─── Users ──────────────────────────────────────────────────
export async function getAllUsers(): Promise<AdminUser[]> {
  const cached = await getJsonCache<CachedAdminUser[]>(CACHE_KEYS.ADMIN_USERS);
  if (cached) return cached.map(rehydrateDate);

  const res = await query(
    `SELECT id, name, email, phone, role, is_banned, created_at FROM users ORDER BY created_at DESC`
  );

  const users: AdminUser[] = res.rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    isBanned: row.is_banned || false,
    createdAt: new Date(row.created_at),
  }));

  const toCache: CachedAdminUser[] = users.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
  }));
  await setJsonCache(CACHE_KEYS.ADMIN_USERS, toCache, CACHE_TTL.ADMIN_USERS);

  return users;
}

export async function updateUserRole(userId: string, role: 'MERCHANT' | 'CUSTOMER' | 'ADMIN'): Promise<boolean> {
  const res = await query(
    `UPDATE users SET role = $2 WHERE id = $1 RETURNING id, email`,
    [userId, role]
  );
  if (res.rows.length > 0) {
    await invalidateUserCaches(res.rows[0].email);
    return true;
  }
  return false;
}

export async function deleteUser(userId: string): Promise<boolean> {
  // Grab email before deletion for cache invalidation
  const lookup = await query(`SELECT email FROM users WHERE id = $1`, [userId]);
  const email = lookup.rows[0]?.email;

  const res = await query(
    `DELETE FROM users WHERE id = $1 RETURNING id`,
    [userId]
  );
  if (res.rows.length > 0) {
    await invalidateUserCaches(email);
    return true;
  }
  return false;
}

export async function toggleUserBan(userId: string, ban: boolean): Promise<boolean> {
  const res = await query(
    `UPDATE users SET is_banned = $2 WHERE id = $1 RETURNING id, email`,
    [userId, ban]
  );
  if (res.rows.length > 0) {
    await invalidateUserCaches(res.rows[0].email);
    return true;
  }
  return false;
}

// ─── Merchant Applications ─────────────────────────────────
/**
 * getPendingApplications
 * Fetches all pending merchant applications with user details.
 * Cached for fast admin dashboard loads.
 */
export async function getPendingApplications(): Promise<MerchantApplication[]> {
  const cached = await getJsonCache<CachedMerchantApp[]>(CACHE_KEYS.ADMIN_APPLICATIONS);
  if (cached) return cached.map(rehydrateDate);

  const res = await query(`
    SELECT 
      ma.id, ma.user_id, ma.store_name, ma.address, ma.social_media, ma.status, ma.created_at,
      u.name as user_name, u.email as user_email
    FROM merchant_applications ma
    JOIN users u ON u.id = ma.user_id
    WHERE ma.status = 'PENDING'
    ORDER BY ma.created_at ASC
  `);

  const apps: MerchantApplication[] = res.rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    userEmail: row.user_email,
    storeName: row.store_name,
    address: row.address,
    socialMedia: row.social_media,
    status: row.status,
    createdAt: new Date(row.created_at),
  }));

  const toCache: CachedMerchantApp[] = apps.map((a) => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
  }));
  await setJsonCache(CACHE_KEYS.ADMIN_APPLICATIONS, toCache, CACHE_TTL.ADMIN_APPLICATIONS);

  return apps;
}

/**
 * approveApplication
 * Atomically converts a customer to a merchant when their application is approved.
 * 
 * OPTIMIZATIONS:
 * - Uses database transaction for atomicity (all-or-nothing)
 * - Single query to update application + fetch user email
 * - Checks if store exists before creating (handles missing UNIQUE constraint)
 * - Immediate cache invalidation (role, email, store, applications)
 * - Fire-and-forget cache invalidation to prevent blocking
 * 
 * The user becomes a merchant IMMEDIATELY upon approval with all caches purged
 * so their next JWT refresh (within 30s) will reflect the new MERCHANT role.
 */
export async function approveApplication(applicationId: string): Promise<{ userId: string; storeName: string; address: string; userEmail: string } | null> {
  // Use a transaction for atomicity — all-or-nothing
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // 1. Update application status and get user details in one query
    const appRes = await client.query(
      `UPDATE merchant_applications ma
       SET status = 'APPROVED', updated_at = CURRENT_TIMESTAMP
       FROM users u
       WHERE ma.id = $1 AND ma.user_id = u.id
       RETURNING ma.user_id, ma.store_name, ma.address, u.email`,
      [applicationId]
    );

    if (appRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    const { user_id, store_name, address, email } = appRes.rows[0];

    // 2. Upgrade user role to MERCHANT
    await client.query(`UPDATE users SET role = 'MERCHANT' WHERE id = $1`, [user_id]);

    // 3. Check if store already exists for this merchant
    const existingStore = await client.query(
      `SELECT id FROM stores WHERE merchant_id = $1`,
      [user_id]
    );

    if (existingStore.rows.length === 0) {
      // Create new store
      await client.query(
        `INSERT INTO stores (merchant_id, name, iligan_barangay_location) 
         VALUES ($1, $2, $3)`,
        [user_id, store_name, address]
      );
    } else {
      // Update existing store
      await client.query(
        `UPDATE stores SET name = $2, iligan_barangay_location = $3 WHERE merchant_id = $1`,
        [user_id, store_name, address]
      );
    }

    // Commit transaction
    await client.query('COMMIT');

    // 4. Invalidate ALL user-related caches immediately (fire-and-forget)
    Promise.all([
      deleteCacheKey(`${CACHE_KEYS.USER_ROLE_PREFIX}${user_id}`),
      deleteCacheKey(`${CACHE_KEYS.USER_EMAIL_PREFIX}${email}`),
      deleteCacheKey(`${CACHE_KEYS.STORE_BY_MERCHANT_PREFIX}${user_id}`),
      invalidateApplicationCaches(),
    ]).catch((err) => console.error('[approveApplication] Cache invalidation failed:', err));

    return { userId: user_id, storeName: store_name, address, userEmail: email };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[approveApplication] Transaction failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function rejectApplication(applicationId: string): Promise<{ userId: string } | null> {
  const res = await query(
    `UPDATE merchant_applications SET status = 'REJECTED', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id, user_id`,
    [applicationId]
  );
  if (res.rows.length > 0) {
    await invalidateApplicationCaches();
    return { userId: res.rows[0].user_id };
  }
  return null;
}

// ─── Live Drops ─────────────────────────────────────────────
export async function getLiveDrops(): Promise<LiveDrop[]> {
  const cached = await getJsonCache<CachedLiveDrop[]>(CACHE_KEYS.ADMIN_DROPS);
  if (cached) return cached.map(rehydrateDate);

  const res = await query(`
    SELECT 
      sl.id, sl.title, sl.original_price, sl.reserved_price, sl.quantity_available, 
      sl.pickup_time_window, sl.aesthetic_cover_image_url, sl.created_at,
      s.name as store_name,
      u.name as merchant_name
    FROM surplus_listings sl
    JOIN stores s ON s.id = sl.store_id
    JOIN users u ON u.id = s.merchant_id
    WHERE sl.quantity_available > 0
    ORDER BY sl.created_at DESC
  `);

  const drops: LiveDrop[] = res.rows.map((row) => ({
    id: row.id,
    title: row.title,
    storeName: row.store_name,
    merchantName: row.merchant_name,
    originalPrice: parseFloat(row.original_price),
    reservedPrice: parseFloat(row.reserved_price),
    quantityAvailable: row.quantity_available,
    pickupTimeWindow: row.pickup_time_window,
    imageUrl: row.aesthetic_cover_image_url,
    createdAt: new Date(row.created_at),
  }));

  const toCache: CachedLiveDrop[] = drops.map((d) => ({
    ...d,
    createdAt: d.createdAt.toISOString(),
  }));
  await setJsonCache(CACHE_KEYS.ADMIN_DROPS, toCache, CACHE_TTL.ADMIN_DROPS);

  return drops;
}

export async function deleteListing(listingId: string): Promise<boolean> {
  const res = await query(
    `DELETE FROM surplus_listings WHERE id = $1 RETURNING id`,
    [listingId]
  );
  if (res.rows.length > 0) {
    await invalidateListingCaches();
    return true;
  }
  return false;
}

// ─── Global Settings ────────────────────────────────────────
export async function getGlobalSettings(): Promise<GlobalSetting[]> {
  const cached = await getJsonCache<GlobalSetting[]>(CACHE_KEYS.ADMIN_SETTINGS);
  if (cached) return cached;

  const res = await query(`SELECT key, value FROM global_settings ORDER BY key ASC`);
  const settings: GlobalSetting[] = res.rows.map((row) => ({ key: row.key, value: row.value }));

  await setJsonCache(CACHE_KEYS.ADMIN_SETTINGS, settings, CACHE_TTL.ADMIN_SETTINGS);
  return settings;
}

export async function updateGlobalSetting(key: string, value: string): Promise<boolean> {
  const res = await query(
    `UPDATE global_settings SET value = $2, updated_at = CURRENT_TIMESTAMP WHERE key = $1 RETURNING key`,
    [key, value]
  );
  if (res.rows.length > 0) {
    await invalidateSettingsCaches();
    return true;
  }
  return false;
}

// ─── Helpers ────────────────────────────────────────────────
export async function getAdminUserIds(): Promise<string[]> {
  const res = await query(`SELECT id FROM users WHERE role = 'ADMIN'`);
  return res.rows.map((row) => row.id);
}
