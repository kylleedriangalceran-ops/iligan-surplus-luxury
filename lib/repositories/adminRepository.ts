import { query } from '../db';

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

// ─── Stats ──────────────────────────────────────────────────
export async function getAdminStats(): Promise<AdminStats> {
  const [users, listings, reservations, applications] = await Promise.all([
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
  ]);

  return {
    totalUsers: parseInt(users.rows[0].total),
    totalMerchants: parseInt(users.rows[0].merchants),
    totalCustomers: parseInt(users.rows[0].customers),
    totalListings: parseInt(listings.rows[0].total),
    totalReservations: parseInt(reservations.rows[0].total),
    pendingReservations: parseInt(reservations.rows[0].pending),
    pendingApplications: parseInt(applications.rows[0].total),
  };
}

// ─── Users ──────────────────────────────────────────────────
export async function getAllUsers(): Promise<AdminUser[]> {
  const res = await query(
    `SELECT id, name, email, phone, role, is_banned, created_at FROM users ORDER BY created_at DESC`
  );

  return res.rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    isBanned: row.is_banned || false,
    createdAt: new Date(row.created_at),
  }));
}

export async function updateUserRole(userId: string, role: 'MERCHANT' | 'CUSTOMER' | 'ADMIN'): Promise<boolean> {
  const res = await query(
    `UPDATE users SET role = $2 WHERE id = $1 RETURNING id`,
    [userId, role]
  );
  return res.rows.length > 0;
}

export async function deleteUser(userId: string): Promise<boolean> {
  const res = await query(
    `DELETE FROM users WHERE id = $1 RETURNING id`,
    [userId]
  );
  return res.rows.length > 0;
}

export async function toggleUserBan(userId: string, ban: boolean): Promise<boolean> {
  const res = await query(
    `UPDATE users SET is_banned = $2 WHERE id = $1 RETURNING id`,
    [userId, ban]
  );
  return res.rows.length > 0;
}

// ─── Merchant Applications ─────────────────────────────────
export async function getPendingApplications(): Promise<MerchantApplication[]> {
  const res = await query(`
    SELECT 
      ma.id, ma.user_id, ma.store_name, ma.address, ma.social_media, ma.status, ma.created_at,
      u.name as user_name, u.email as user_email
    FROM merchant_applications ma
    JOIN users u ON u.id = ma.user_id
    WHERE ma.status = 'PENDING'
    ORDER BY ma.created_at ASC
  `);

  return res.rows.map((row) => ({
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
}

export async function approveApplication(applicationId: string): Promise<{ userId: string; storeName: string; address: string } | null> {
  // Get the application data first
  const appRes = await query(
    `UPDATE merchant_applications SET status = 'APPROVED', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING user_id, store_name, address`,
    [applicationId]
  );

  if (appRes.rows.length === 0) return null;

  const { user_id, store_name, address } = appRes.rows[0];

  // Upgrade user role to MERCHANT
  await query(`UPDATE users SET role = 'MERCHANT' WHERE id = $1`, [user_id]);

  // Create a stores record
  await query(
    `INSERT INTO stores (merchant_id, name, iligan_barangay_location) VALUES ($1, $2, $3) ON CONFLICT (merchant_id) DO NOTHING`,
    [user_id, store_name, address]
  );

  return { userId: user_id, storeName: store_name, address };
}

export async function rejectApplication(applicationId: string): Promise<boolean> {
  const res = await query(
    `UPDATE merchant_applications SET status = 'REJECTED', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id`,
    [applicationId]
  );
  return res.rows.length > 0;
}

// ─── Live Drops ─────────────────────────────────────────────
export async function getLiveDrops(): Promise<LiveDrop[]> {
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

  return res.rows.map((row) => ({
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
}

export async function deleteListing(listingId: string): Promise<boolean> {
  const res = await query(
    `DELETE FROM surplus_listings WHERE id = $1 RETURNING id`,
    [listingId]
  );
  return res.rows.length > 0;
}

// ─── Global Settings ────────────────────────────────────────
export async function getGlobalSettings(): Promise<GlobalSetting[]> {
  const res = await query(`SELECT key, value FROM global_settings ORDER BY key ASC`);
  return res.rows.map((row) => ({ key: row.key, value: row.value }));
}

export async function updateGlobalSetting(key: string, value: string): Promise<boolean> {
  const res = await query(
    `UPDATE global_settings SET value = $2, updated_at = CURRENT_TIMESTAMP WHERE key = $1 RETURNING key`,
    [key, value]
  );
  return res.rows.length > 0;
}
