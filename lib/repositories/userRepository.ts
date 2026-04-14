import { cache } from 'react';
import bcrypt from 'bcryptjs';
import { query } from '../db';
import { getJsonCache, setJsonCache } from '../redisCache';
import { CACHE_KEYS, CACHE_TTL, invalidateApplicationCaches } from '../cacheInvalidation';

// Interface matching the NextAuth module declaration and pure DB representations
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role: 'MERCHANT' | 'CUSTOMER' | 'ADMIN';
  passwordHash?: string;
  createdAt: Date;
}

export interface CreateUserData {
  email: string;
  passwordRaw: string;
  name: string;
  phone?: string;
  role?: 'MERCHANT' | 'CUSTOMER' | 'ADMIN';
}

// Cached user type — excludes passwordHash for security
type CachedUser = Omit<User, 'createdAt' | 'passwordHash'> & { createdAt: string };

/**
 * findUserByEmail
 * Uses React's `cache()` to deduplicate identical requests within a single React render.
 * Also uses Redis/in-memory cache for cross-request caching.
 *
 * SECURITY NOTE: The cached version does NOT include passwordHash.
 * Auth credential verification always hits PostgreSQL directly via `findUserByEmailForAuth`.
 */
export const findUserByEmail = cache(async (email: string): Promise<User | null> => {
  const cacheKey = `${CACHE_KEYS.USER_EMAIL_PREFIX}${email}`;

  // Try cache first (no passwordHash in cache)
  const cached = await getJsonCache<CachedUser>(cacheKey);
  if (cached) {
    return {
      ...cached,
      createdAt: new Date(cached.createdAt),
      // passwordHash is intentionally undefined for cached reads
    };
  }

  try {
    const res = await query(
      'SELECT id, email, name, phone, password_hash, role, created_at FROM users WHERE email = $1',
      [email]
    );
    
    if (res.rows.length === 0) return null;

    const rawUser = res.rows[0];

    const user: User = {
      id: rawUser.id,
      email: rawUser.email,
      name: rawUser.name,
      phone: rawUser.phone,
      role: rawUser.role,
      passwordHash: rawUser.password_hash,
      createdAt: new Date(rawUser.created_at),
    };

    // Cache WITHOUT passwordHash
    const toCache: CachedUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    };
    await setJsonCache(cacheKey, toCache, CACHE_TTL.USER_SESSION);

    return user;
  } catch (error: unknown) {
    console.error('findUserByEmail error (DB might be offline):', error);
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`DB Error during lookup: ${msg}`);
  }
});

/**
 * findUserByEmailForAuth
 * ALWAYS hits PostgreSQL directly — used exclusively for credential verification.
 * Never cached because passwordHash must be fresh and present.
 */
export async function findUserByEmailForAuth(email: string): Promise<User | null> {
  try {
    const res = await query(
      'SELECT id, email, name, phone, password_hash, role, created_at FROM users WHERE email = $1',
      [email]
    );
    
    if (res.rows.length === 0) return null;

    const rawUser = res.rows[0];

    return {
      id: rawUser.id,
      email: rawUser.email,
      name: rawUser.name,
      phone: rawUser.phone,
      role: rawUser.role,
      passwordHash: rawUser.password_hash,
      createdAt: new Date(rawUser.created_at),
    };
  } catch (error: unknown) {
    console.error('findUserByEmailForAuth error:', error);
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`DB Error during auth lookup: ${msg}`);
  }
}

/**
 * getUserRoleById
 * Fast, cached role lookup for the JWT callback.
 * Called on every token refresh — optimized with a short-TTL cache
 * so role changes (e.g., CUSTOMER → MERCHANT on approval) propagate
 * within ~30 seconds without hammering the database.
 */
export async function getUserRoleById(
  userId: string
): Promise<'MERCHANT' | 'CUSTOMER' | 'ADMIN' | null> {
  const cacheKey = `${CACHE_KEYS.USER_ROLE_PREFIX}${userId}`;

  // Check cache first
  const cached = await getJsonCache<string>(cacheKey);
  if (cached) return cached as 'MERCHANT' | 'CUSTOMER' | 'ADMIN';

  try {
    const res = await query('SELECT role FROM users WHERE id = $1', [userId]);
    if (res.rows.length === 0) return null;

    const role = res.rows[0].role as 'MERCHANT' | 'CUSTOMER' | 'ADMIN';
    await setJsonCache(cacheKey, role, CACHE_TTL.USER_ROLE);
    return role;
  } catch (error) {
    console.error('getUserRoleById error:', error);
    return null; // Graceful degradation — keep the existing JWT role
  }
}

/**
 * createUser
 * Hashes passwords and inserts the user into standard PostgreSQL.
 */
export async function createUser(data: CreateUserData): Promise<User | null> {
  const hashedPassword = await bcrypt.hash(data.passwordRaw, 10);
  const role = data.role ?? 'CUSTOMER';

  try {
    const res = await query(
      `INSERT INTO users (email, password_hash, name, phone, role) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, email, name, phone, role, created_at`,
      [data.email, hashedPassword, data.name, data.phone || null, role]
    );

    const rawUser = res.rows[0];

    return {
      id: rawUser.id,
      email: rawUser.email,
      name: rawUser.name,
      phone: rawUser.phone,
      role: rawUser.role,
      createdAt: new Date(rawUser.created_at),
    };
  } catch (error: unknown) {
    console.error('Error creating user:', error);
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`DB Error during creation: ${msg}`);
  }
}

/**
 * createMerchantApplication
 * Injects a new application into the system for Admin review.
 */
export async function createMerchantApplication(
  userId: string,
  storeName: string,
  address: string,
  socialMedia?: string
): Promise<boolean> {
  try {
    const res = await query(
      `INSERT INTO merchant_applications (user_id, store_name, address, social_media) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id`,
      [userId, storeName, address, socialMedia || null]
    );
    if (res.rows.length > 0) {
      await invalidateApplicationCaches();
      return true;
    }
    return false;
  } catch (error: unknown) {
    console.error('Error creating merchant application:', error);
    return false;
  }
}

/**
 * getExistingApplication
 * Check if a user already has a pending or approved merchant application.
 */
export async function getExistingApplication(
  userId: string
): Promise<{ id: string; status: string } | null> {
  try {
    const res = await query(
      `SELECT id, status FROM merchant_applications 
       WHERE user_id = $1 AND status IN ('PENDING', 'APPROVED')
       ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );
    return res.rows.length > 0 ? { id: res.rows[0].id, status: res.rows[0].status } : null;
  } catch (error: unknown) {
    console.error('Error checking existing application:', error);
    return null;
  }
}
