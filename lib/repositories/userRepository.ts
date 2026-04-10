import { cache } from 'react';
import bcrypt from 'bcryptjs';
import { query } from '../db';

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

/**
 * findUserByEmail
 * Uses React's `cache()` to deduplicate identical requests within a single React render.
 * Highly useful if multiple components need the user's data on the same page.
 */
export const findUserByEmail = cache(async (email: string): Promise<User | null> => {
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
    console.error('findUserByEmail error (DB might be offline):', error);
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`DB Error during lookup: ${msg}`);
  }
});

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
    return res.rows.length > 0;
  } catch (error: unknown) {
    console.error('Error creating merchant application:', error);
    return false;
  }
}
