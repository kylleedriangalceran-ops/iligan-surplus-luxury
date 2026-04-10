import { query } from "../db";
import { pusherServer } from "../pusher";

export interface Notification {
  id: string;
  userId: string | null;
  message: string;
  type: "NEW_DROP" | "RESERVATION_MADE" | "RESERVATION_CLAIMED" | "RESERVATION_CANCELLED";
  isRead: boolean;
  link: string | null;
  createdAt: Date;
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

export async function getUnreadNotificationsCount(userId: string): Promise<number> {
  const sql = `
    SELECT COUNT(*) as count 
    FROM notifications 
    WHERE (user_id = $1 OR user_id IS NULL) AND is_read = FALSE
  `;
  const res = await query(sql, [userId]);
  return parseInt(res.rows[0]?.count || "0", 10);
}

export async function getNotifications(userId: string, limit = 10): Promise<Notification[]> {
  const sql = `
    SELECT id, user_id, message, type, is_read, link, created_at
    FROM notifications
    WHERE (user_id = $1 OR user_id IS NULL)
    ORDER BY created_at DESC
    LIMIT $2
  `;
  const res = await query(sql, [userId, limit]);
  return res.rows.map(row => ({
    id: row.id,
    userId: row.user_id,
    message: row.message,
    type: row.type,
    isRead: row.is_read,
    link: row.link,
    createdAt: new Date(row.created_at)
  }));
}

export async function markNotificationsAsRead(userId: string) {
  const sql = `
    UPDATE notifications 
    SET is_read = TRUE 
    WHERE (user_id = $1 OR user_id IS NULL) AND is_read = FALSE
  `;
  await query(sql, [userId]);
}
