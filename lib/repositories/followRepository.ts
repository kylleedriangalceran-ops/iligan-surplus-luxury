import { query } from '../db';
import { getJsonCache, setJsonCache } from '../redisCache';
import {
  CACHE_KEYS,
  CACHE_TTL,
  invalidateFollowCaches,
} from '../cacheInvalidation';

export interface Follower {
  user_id: string;
}

export interface FollowedStore {
  storeId: string;
  storeName: string;
  merchantId: string;
}

export async function checkIsFollowing(userId: string, storeId: string): Promise<boolean> {
  const cacheKey = `${CACHE_KEYS.USER_FOLLOWS_PREFIX}${userId}:store:${storeId}`;
  const cached = await getJsonCache<boolean>(cacheKey);
  if (cached !== null) return cached;

  const sql = `SELECT 1 FROM follows WHERE user_id = $1 AND store_id = $2 LIMIT 1`;
  const res = await query(sql, [userId, storeId]);
  const isFollowing = res.rows.length > 0;

  await setJsonCache(cacheKey, isFollowing, CACHE_TTL.FOLLOWS);
  return isFollowing;
}

export async function followStore(userId: string, storeId: string): Promise<boolean> {
  const sql = `
    INSERT INTO follows (user_id, store_id)
    VALUES ($1, $2)
    ON CONFLICT (user_id, store_id) DO NOTHING
  `;
  await query(sql, [userId, storeId]);
  await invalidateFollowCaches(userId, storeId);
  return true;
}

export async function unfollowStore(userId: string, storeId: string): Promise<boolean> {
  const sql = `
    DELETE FROM follows
    WHERE user_id = $1 AND store_id = $2
  `;
  await query(sql, [userId, storeId]);
  await invalidateFollowCaches(userId, storeId);
  return true;
}

export async function getStoreFollowers(storeId: string): Promise<Follower[]> {
  const cacheKey = `${CACHE_KEYS.STORE_FOLLOWERS_PREFIX}${storeId}`;
  const cached = await getJsonCache<Follower[]>(cacheKey);
  if (cached) return cached;

  const sql = `SELECT user_id FROM follows WHERE store_id = $1`;
  const res = await query(sql, [storeId]);
  
  const followers = res.rows.map(row => ({ user_id: row.user_id }));
  await setJsonCache(cacheKey, followers, CACHE_TTL.FOLLOWS);
  
  return followers;
}

export async function getUserFollowedStores(userId: string): Promise<FollowedStore[]> {
  const cacheKey = `${CACHE_KEYS.USER_FOLLOWS_PREFIX}${userId}:stores`;
  const cached = await getJsonCache<FollowedStore[]>(cacheKey);
  if (cached) return cached;

  const sql = `
    SELECT 
      s.id as store_id, 
      s.name as store_name, 
      s.merchant_id 
    FROM follows f
    JOIN stores s ON f.store_id = s.id
    WHERE f.user_id = $1
  `;
  const res = await query(sql, [userId]);
  
  const stores = res.rows.map((row) => ({
    storeId: row.store_id,
    storeName: row.store_name,
    merchantId: row.merchant_id,
  }));

  await setJsonCache(cacheKey, stores, CACHE_TTL.FOLLOWS);
  return stores;
}
