import { query } from '../db';
import { getJsonCache, setJsonCache } from '../redisCache';
import { CACHE_KEYS, CACHE_TTL, invalidateMessageCaches } from '../cacheInvalidation';

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: Date;
}



export interface RecentMessager {
  userId: string;
  name: string;
  lastMessageAt: Date;
}

type CachedRecentMessager = Omit<RecentMessager, 'lastMessageAt'> & { lastMessageAt: string };

export async function sendMessage(senderId: string, receiverId: string, content: string): Promise<ChatMessage | null> {
  const sql = `
    INSERT INTO messages (sender_id, receiver_id, content)
    VALUES ($1, $2, $3)
    RETURNING id, sender_id, receiver_id, content, created_at
  `;

  const res = await query(sql, [senderId, receiverId, content]);

  if (res.rows.length === 0) return null;

  const row = res.rows[0];

  // Invalidate recent messagers cache for both users
  await invalidateMessageCaches(senderId, receiverId);

  return {
    id: row.id,
    senderId: row.sender_id,
    receiverId: row.receiver_id,
    content: row.content,
    createdAt: new Date(row.created_at),
  };
}

/**
 * getConversation
 * Not cached — per-pair dataset changes too frequently for cache hits to be meaningful.
 */
export async function getConversation(user1Id: string, user2Id: string): Promise<ChatMessage[]> {
  const sql = `
    SELECT id, sender_id, receiver_id, content, created_at
    FROM messages
    WHERE (sender_id = $1 AND receiver_id = $2)
       OR (sender_id = $2 AND receiver_id = $1)
    ORDER BY created_at ASC
  `;

  const res = await query(sql, [user1Id, user2Id]);

  return res.rows.map(row => ({
    id: row.id,
    senderId: row.sender_id,
    receiverId: row.receiver_id,
    content: row.content,
    createdAt: new Date(row.created_at),
  }));
}

/**
 * getRecentMessagers
 * Cached sidebar list of recent conversation partners.
 */
export async function getRecentMessagers(userId: string): Promise<RecentMessager[]> {
  const cacheKey = `${CACHE_KEYS.MESSAGES_RECENT_PREFIX}${userId}`;
  const cached = await getJsonCache<CachedRecentMessager[]>(cacheKey);
  if (cached) {
    return cached.map((r) => ({
      ...r,
      lastMessageAt: new Date(r.lastMessageAt),
    }));
  }

  const sql = `
    SELECT DISTINCT ON (m.other_user_id)
      m.other_user_id as user_id,
      u.name as name,
      m.created_at as last_message_at
    FROM (
      SELECT 
        CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END as other_user_id,
        created_at
      FROM messages
      WHERE sender_id = $1 OR receiver_id = $1
      ORDER BY created_at DESC
    ) m
    JOIN users u ON u.id = m.other_user_id
    ORDER BY m.other_user_id, m.created_at DESC
  `;

  const res = await query(sql, [userId]);

  const messagers: RecentMessager[] = res.rows.map(row => ({
    userId: row.user_id,
    name: row.name,
    lastMessageAt: new Date(row.last_message_at),
  })).sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());

  const toCache: CachedRecentMessager[] = messagers.map((m) => ({
    ...m,
    lastMessageAt: m.lastMessageAt.toISOString(),
  }));
  await setJsonCache(cacheKey, toCache, CACHE_TTL.MESSAGES);

  return messagers;
}
