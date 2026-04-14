type RedisPrimitive = string | number;

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const redisEnabled = Boolean(redisUrl && redisToken);

// ─── In-Memory Fallback ────────────────────────────────────────
// When Upstash is not configured, use a process-level Map so local
// development still benefits from caching without requiring Redis.
interface MemoryEntry {
  value: string;
  expiresAt: number; // epoch ms, 0 = never
}

const memoryStore = new Map<string, MemoryEntry>();

function memGet(key: string): string | null {
  const entry = memoryStore.get(key);
  if (!entry) return null;
  if (entry.expiresAt > 0 && Date.now() > entry.expiresAt) {
    memoryStore.delete(key);
    return null;
  }
  return entry.value;
}

function memSet(key: string, value: string, ttlSeconds?: number) {
  memoryStore.set(key, {
    value,
    expiresAt: ttlSeconds && ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : 0,
  });
}

function memDel(key: string) {
  memoryStore.delete(key);
}

function memDelByPrefix(prefix: string) {
  for (const k of memoryStore.keys()) {
    if (k.startsWith(prefix)) memoryStore.delete(k);
  }
}

function memIncr(key: string): number {
  const current = memGet(key);
  const next = (current ? parseInt(current, 10) : 0) + 1;
  const entry = memoryStore.get(key);
  memSet(key, String(next), entry?.expiresAt ? Math.max(0, Math.round((entry.expiresAt - Date.now()) / 1000)) : undefined);
  return next;
}

function memDecr(key: string): number {
  const current = memGet(key);
  const next = Math.max(0, (current ? parseInt(current, 10) : 0) - 1);
  const entry = memoryStore.get(key);
  memSet(key, String(next), entry?.expiresAt ? Math.max(0, Math.round((entry.expiresAt - Date.now()) / 1000)) : undefined);
  return next;
}

// ─── Redis Helpers ─────────────────────────────────────────────
let hasLoggedRedisFallback = false;

function logRedisFallback(error: unknown) {
  if (hasLoggedRedisFallback) return;
  hasLoggedRedisFallback = true;
  console.warn(
    "[redis-cache] Redis unavailable or misconfigured. Falling back to in-memory cache.",
    error
  );
}

function buildCommandUrl(command: string, args: RedisPrimitive[]) {
  const encoded = [command, ...args.map((arg) => encodeURIComponent(String(arg)))].join("/");
  return `${redisUrl}/${encoded}`;
}

async function runRedisCommand<T>(command: string, args: RedisPrimitive[] = []): Promise<T | null> {
  if (!redisEnabled) return null;

  try {
    const response = await fetch(buildCommandUrl(command, args), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${redisToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Redis command failed with status ${response.status}`);
    }

    const payload = (await response.json()) as { result?: T; error?: string };
    if (payload.error) {
      throw new Error(payload.error);
    }

    return payload.result ?? null;
  } catch (error) {
    logRedisFallback(error);
    return null;
  }
}

// ─── Public API ────────────────────────────────────────────────

export function isRedisCacheEnabled() {
  return redisEnabled;
}

/**
 * Get a JSON-serialized value from cache.
 * Falls back to in-memory store when Redis is not configured.
 */
export async function getJsonCache<T>(key: string): Promise<T | null> {
  // Try Redis first
  if (redisEnabled) {
    const raw = await runRedisCommand<string>("GET", [key]);
    if (raw) {
      try {
        return JSON.parse(raw) as T;
      } catch {
        return null;
      }
    }
    // Redis miss — do NOT fall through to memory store if Redis is online
    return null;
  }

  // In-memory fallback
  const memRaw = memGet(key);
  if (!memRaw) return null;
  try {
    return JSON.parse(memRaw) as T;
  } catch {
    return null;
  }
}

/**
 * Store a JSON-serialized value in cache.
 */
export async function setJsonCache<T>(key: string, value: T, ttlSeconds?: number) {
  const payload = JSON.stringify(value);

  if (redisEnabled) {
    if (ttlSeconds && ttlSeconds > 0) {
      await runRedisCommand("SETEX", [key, ttlSeconds, payload]);
    } else {
      await runRedisCommand("SET", [key, payload]);
    }
    return;
  }

  // In-memory fallback
  memSet(key, payload, ttlSeconds);
}

/**
 * Delete a single cache key.
 */
export async function deleteCacheKey(key: string) {
  if (redisEnabled) {
    await runRedisCommand("DEL", [key]);
    return;
  }
  memDel(key);
}

/**
 * Delete all cache keys matching a given prefix.
 * On Upstash this is expensive (SCAN + DEL); use sparingly.
 * For in-memory mode, iterates the Map.
 */
export async function deleteCacheByPrefix(prefix: string) {
  if (redisEnabled) {
    // Upstash supports SCAN via REST. We do a single pass.
    // For safety we delete individual keys returned by SCAN.
    try {
      let cursor = "0";
      do {
        const res = await runRedisCommand<[string, string[]]>("SCAN", [
          cursor as unknown as number,
          "MATCH" as unknown as number,
          `${prefix}*` as unknown as number,
          "COUNT" as unknown as number,
          100 as number,
        ]);
        if (!res) break;
        cursor = res[0];
        const keys = res[1];
        if (keys && keys.length > 0) {
          for (const k of keys) {
            await runRedisCommand("DEL", [k]);
          }
        }
      } while (cursor !== "0");
    } catch {
      // If SCAN fails, silently degrade — keys will expire via TTL
    }
    return;
  }

  memDelByPrefix(prefix);
}

/**
 * Atomically increment a cached integer value.
 * Returns the new value, or null if Redis is unavailable.
 */
export async function incrementCache(key: string): Promise<number | null> {
  if (redisEnabled) {
    return runRedisCommand<number>("INCR", [key]);
  }
  return memIncr(key);
}

/**
 * Atomically decrement a cached integer value (floor at 0).
 * Returns the new value, or null if Redis is unavailable.
 */
export async function decrementCache(key: string): Promise<number | null> {
  if (redisEnabled) {
    return runRedisCommand<number>("DECR", [key]);
  }
  return memDecr(key);
}
