import { query } from "../db";
import { pusherServer } from "../pusher";
import { getJsonCache, setJsonCache } from "../redisCache";
import {
  CACHE_KEYS,
  CACHE_TTL,
  invalidateNotificationCaches,
} from "../cacheInvalidation";

export interface Notification {
  id: string;
  userId: string | null;
  message: string;
  type: "NEW_DROP" | "RESERVATION_MADE" | "RESERVATION_CLAIMED" | "RESERVATION_CANCELLED" | "MERCHANT_APPROVED" | "MERCHANT_REJECTED" | "NEW_FOLLOWER";
  isRead: boolean;
  link: string | null;
  createdAt: Date;
}

type CachedNotification = Omit<Notification, "createdAt"> & { createdAt: string };

function rehydrateNotification(row: CachedNotification): Notification {
  return { ...row, createdAt: new Date(row.createdAt) };
}

export async function createNotification(
  userId: string | null,
  message: string,
  type: Notification["type"],
  link?: string
) {
  const sql = `
    INSERT INTO notifications (user_id, message, type, link)
    VALUES ($1, $2, $3, $4)
    RETURNING id, created_at
  `;
  const res = await query(sql, [userId, message, type, link || null]);
  const row = res.rows[0];

  // Invalidate notification caches for this user
  await invalidateNotificationCaches(userId);

  // Broadcast real-time event via Pusher
  const channel = userId ? `private-notifications-${userId}` : "notifications-global";
  try {
    await pusherServer.trigger(channel, "new-notification", {
      id: row.id,
      userId,
      message,
      type,
      isRead: false,
      link: link || null,
      createdAt: row.created_at,
    });
  } catch (error) {
    console.error("Failed to broadcast notification via Pusher:", error);
  }
}

/**
 * getUnreadNotificationsCount
 * Cached with a short TTL for near-real-time accuracy.
 */
export async function getUnreadNotificationsCount(userId: string): Promise<number> {
  const cacheKey = `${CACHE_KEYS.NOTIFICATIONS_UNREAD_PREFIX}${userId}`;
  const cached = await getJsonCache<number>(cacheKey);
  if (cached !== null) return cached;

  const sql = `
    SELECT COUNT(*) as count 
    FROM notifications 
    WHERE (user_id = $1 OR user_id IS NULL) AND is_read = FALSE
  `;
  const res = await query(sql, [userId]);
  const count = parseInt(res.rows[0]?.count || "0", 10);

  await setJsonCache(cacheKey, count, CACHE_TTL.NOTIFICATIONS);
  return count;
}

/**
 * getNotifications
 * Cached notification list with short TTL.
 */
export async function getNotifications(userId: string, limit = 10): Promise<Notification[]> {
  const cacheKey = `${CACHE_KEYS.NOTIFICATIONS_LIST_PREFIX}${userId}`;
  const cached = await getJsonCache<CachedNotification[]>(cacheKey);
  if (cached) return cached.map(rehydrateNotification);

  const sql = `
    SELECT id, user_id, message, type, is_read, link, created_at
    FROM notifications
    WHERE (user_id = $1 OR user_id IS NULL)
    ORDER BY created_at DESC
    LIMIT $2
  `;
  const res = await query(sql, [userId, limit]);
  const notifications: Notification[] = res.rows.map(row => ({
    id: row.id,
    userId: row.user_id,
    message: row.message,
    type: row.type,
    isRead: row.is_read,
    link: row.link,
    createdAt: new Date(row.created_at)
  }));

  const toCache: CachedNotification[] = notifications.map((n) => ({
    ...n,
    createdAt: n.createdAt.toISOString(),
  }));
  await setJsonCache(cacheKey, toCache, CACHE_TTL.NOTIFICATIONS);

  return notifications;
}

export async function markNotificationsAsRead(userId: string) {
  const sql = `
    UPDATE notifications 
    SET is_read = TRUE 
    WHERE (user_id = $1 OR user_id IS NULL) AND is_read = FALSE
  `;
  await query(sql, [userId]);

  // Invalidate both count and list caches
  await invalidateNotificationCaches(userId);
}

export async function markNotificationAsRead(userId: string, notificationId: string) {
  const sql = `
    UPDATE notifications
    SET is_read = TRUE
    WHERE id = $1 AND (user_id = $2 OR user_id IS NULL) AND is_read = FALSE
  `;
  await query(sql, [notificationId, userId]);
  await invalidateNotificationCaches(userId);
}

export async function clearNotificationsForUser(userId: string) {
  const sql = `
    DELETE FROM notifications
    WHERE user_id = $1
  `;
  await query(sql, [userId]);
  await invalidateNotificationCaches(userId);
}
