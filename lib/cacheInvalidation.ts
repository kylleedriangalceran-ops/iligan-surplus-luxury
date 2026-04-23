/**
 * Centralized Cache Invalidation Helpers
 * ───────────────────────────────────────
 * When a mutation in one repository affects cached data in another,
 * these helpers ensure all stale cache entries are purged atomically.
 *
 * Each helper is fire-and-forget — failures are logged but never throw,
 * so mutations always succeed even when cache operations fail.
 */

import { deleteCacheKey, deleteCacheByPrefix } from './redisCache';

// ─── Cache Key Constants ───────────────────────────────────────
export const CACHE_KEYS = {
  // Listings
  ACTIVE_LISTINGS: 'listings:active:v1',

  // Master Menu
  PRODUCTS_BY_MERCHANT_PREFIX: 'products:merchant:',

  // Admin
  ADMIN_STATS: 'admin:stats:v1',
  ADMIN_USERS: 'admin:users:v1',
  ADMIN_DROPS: 'admin:drops:v1',
  ADMIN_SETTINGS: 'admin:settings:v1',
  ADMIN_APPLICATIONS: 'admin:applications:v1',

  // Dynamic keys (use as prefixes)
  STORE_BY_MERCHANT_PREFIX: 'store:merchant:',
  RESERVATIONS_CUSTOMER_PREFIX: 'reservations:customer:',
  RESERVATIONS_STORE_PREFIX: 'reservations:store:',
  NOTIFICATIONS_UNREAD_PREFIX: 'notifications:unread:',
  NOTIFICATIONS_LIST_PREFIX: 'notifications:list:',
  USER_EMAIL_PREFIX: 'user:email:',
  USER_ROLE_PREFIX: 'user:role:',
  MESSAGES_RECENT_PREFIX: 'messages:recent:',
  STORE_STATS_PREFIX: 'store:stats:',
  // Follows
  USER_FOLLOWS_PREFIX: 'user:follows:',
  STORE_FOLLOWERS_PREFIX: 'store:followers:',
  // Reviews
  REVIEWS_LISTING_PREFIX: 'reviews:listing:',
  REVIEWS_AGGREGATED_PREFIX: 'reviews:aggregated:',
} as const;

// ─── TTL Constants (seconds) ────────────────────────────────────
export const CACHE_TTL = {
  ACTIVE_LISTINGS: 60,
  PRODUCTS: 60,
  ADMIN_STATS: 30,
  ADMIN_USERS: 60,
  ADMIN_DROPS: 30,
  ADMIN_SETTINGS: 300,
  ADMIN_APPLICATIONS: 60,
  RESERVATIONS: 30,
  NOTIFICATIONS: 15,
  USER_SESSION: 120,
  USER_ROLE: 30,
  MESSAGES: 30,
  STORE_BY_MERCHANT: 300,
  STORE_STATS: 30,
  FOLLOWS: 300,
  REVIEWS: 120,
} as const;

// ─── Invalidation Helpers ──────────────────────────────────────

async function safeDelete(...keys: string[]) {
  try {
    await Promise.all(keys.map((k) => deleteCacheKey(k)));
  } catch (error) {
    console.error('[cache-invalidation] Failed to delete keys:', keys, error);
  }
}

async function safePrefixDelete(...prefixes: string[]) {
  try {
    await Promise.all(prefixes.map((p) => deleteCacheByPrefix(p)));
  } catch (error) {
    console.error('[cache-invalidation] Failed to delete prefixes:', prefixes, error);
  }
}

/**
 * Call after listing create, delete, or quantity change.
 */
export async function invalidateListingCaches() {
  await safeDelete(
    CACHE_KEYS.ACTIVE_LISTINGS,
    CACHE_KEYS.ADMIN_DROPS,
    CACHE_KEYS.ADMIN_STATS
  );
}

/**
 * Call after admin user mutations (role change, ban, delete).
 */
export async function invalidateUserCaches(email?: string) {
  const keys: string[] = [CACHE_KEYS.ADMIN_USERS, CACHE_KEYS.ADMIN_STATS];
  if (email) keys.push(`${CACHE_KEYS.USER_EMAIL_PREFIX}${email}`);
  await safeDelete(...keys);
}

/**
 * Call after reservation create or status change.
 */
export async function invalidateReservationCaches(customerId: string, storeId?: string) {
  await safeDelete(
    `${CACHE_KEYS.RESERVATIONS_CUSTOMER_PREFIX}${customerId}`,
    CACHE_KEYS.ADMIN_STATS
  );
  if (storeId) {
    await safeDelete(`${CACHE_KEYS.RESERVATIONS_STORE_PREFIX}${storeId}`);
    await safeDelete(`${CACHE_KEYS.STORE_STATS_PREFIX}${storeId}`);
  }
}

/**
 * Call after notification create or mark-as-read.
 */
export async function invalidateNotificationCaches(userId: string | null) {
  if (userId) {
    await safeDelete(
      `${CACHE_KEYS.NOTIFICATIONS_UNREAD_PREFIX}${userId}`,
      `${CACHE_KEYS.NOTIFICATIONS_LIST_PREFIX}${userId}`
    );
  } else {
    // Global notification — invalidate all notification caches
    await safePrefixDelete(
      CACHE_KEYS.NOTIFICATIONS_UNREAD_PREFIX,
      CACHE_KEYS.NOTIFICATIONS_LIST_PREFIX
    );
  }
}

/**
 * Call after merchant application approve/reject.
 */
export async function invalidateApplicationCaches() {
  await safeDelete(
    CACHE_KEYS.ADMIN_APPLICATIONS,
    CACHE_KEYS.ADMIN_STATS,
    CACHE_KEYS.ADMIN_USERS
  );
}

/**
 * Call after global setting update.
 */
export async function invalidateSettingsCaches() {
  await safeDelete(CACHE_KEYS.ADMIN_SETTINGS);
}

/**
 * Call after message send.
 */
export async function invalidateMessageCaches(senderId: string, receiverId: string) {
  await safeDelete(
    `${CACHE_KEYS.MESSAGES_RECENT_PREFIX}${senderId}`,
    `${CACHE_KEYS.MESSAGES_RECENT_PREFIX}${receiverId}`
  );
}

/**
 * Call after store stats change (listing create/delete, reservation change).
 */
export async function invalidateStoreStatsCaches(storeId: string) {
  await safeDelete(`${CACHE_KEYS.STORE_STATS_PREFIX}${storeId}`);
}

/**
 * Call after a user follows or unfollows a store
 */
export async function invalidateFollowCaches(userId: string, storeId: string) {
  await safeDelete(
    `${CACHE_KEYS.USER_FOLLOWS_PREFIX}${userId}:store:${storeId}`,
    `${CACHE_KEYS.USER_FOLLOWS_PREFIX}${userId}:stores`,
    `${CACHE_KEYS.STORE_FOLLOWERS_PREFIX}${storeId}`
  );
}

/**
 * Call after product create/update/delete for a merchant.
 */
export async function invalidateProductCaches(merchantId: string) {
  await safeDelete(`${CACHE_KEYS.PRODUCTS_BY_MERCHANT_PREFIX}${merchantId}`);
}

/**
 * Call after review create/update/delete.
 */
export async function invalidateReviewCaches(listingId: string) {
  await safeDelete(
    `${CACHE_KEYS.REVIEWS_LISTING_PREFIX}${listingId}`,
    `${CACHE_KEYS.REVIEWS_AGGREGATED_PREFIX}${listingId}`
  );
}
