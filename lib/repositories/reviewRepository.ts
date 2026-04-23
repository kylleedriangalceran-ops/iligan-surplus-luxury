import { cache } from 'react';
import { unstable_cache, revalidateTag } from 'next/cache';
import { query } from '../db';
import { getJsonCache, setJsonCache } from '../redisCache';
import {
  CACHE_KEYS,
  CACHE_TTL,
  invalidateReviewCaches,
} from '../cacheInvalidation';

// ─── Types ─────────────────────────────────────────────────────

export interface Review {
  id: string;
  customerId: string;
  customerName: string;
  listingId: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface AggregatedRating {
  average: number;
  count: number;
}

type CachedReview = Omit<Review, 'createdAt'> & { createdAt: string };

function fromCached(cached: CachedReview[]): Review[] {
  return cached.map((r) => ({
    ...r,
    createdAt: new Date(r.createdAt),
  }));
}

function toCached(reviews: Review[]): CachedReview[] {
  return reviews.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  }));
}

// ─── Fetch Reviews ─────────────────────────────────────────────

async function fetchReviewsByListingIdFromDb(listingId: string): Promise<Review[]> {
  const sql = `
    SELECT
      r.id,
      r.customer_id,
      r.listing_id,
      r.rating,
      r.comment,
      r.created_at,
      u.name AS customer_name
    FROM reviews r
    JOIN users u ON r.customer_id = u.id
    WHERE r.listing_id = $1
    ORDER BY r.created_at DESC
  `;

  const res = await query(sql, [listingId]);

  return res.rows.map((row) => ({
    id: row.id,
    customerId: row.customer_id,
    customerName: row.customer_name,
    listingId: row.listing_id,
    rating: row.rating,
    comment: row.comment || '',
    createdAt: new Date(row.created_at),
  }));
}

/**
 * getReviewsByListingId
 * Cached via unstable_cache + Redis for high performance.
 */
export function getReviewsByListingId(listingId: string): Promise<Review[]> {
  const cachedFn = cache(
    unstable_cache(
      async () => {
        const cacheKey = `${CACHE_KEYS.REVIEWS_LISTING_PREFIX}${listingId}`;
        const cached = await getJsonCache<CachedReview[]>(cacheKey);
        if (cached) return fromCached(cached);

        const reviews = await fetchReviewsByListingIdFromDb(listingId);
        await setJsonCache(cacheKey, toCached(reviews), CACHE_TTL.REVIEWS);
        return reviews;
      },
      [`reviews-list-${listingId}`],
      {
        tags: [`reviews-${listingId}`],
        revalidate: 120,
      }
    )
  );
  return cachedFn();
}

// ─── Aggregated Rating ─────────────────────────────────────────

async function fetchAggregatedRatingFromDb(listingId: string): Promise<AggregatedRating> {
  const sql = `
    SELECT
      COALESCE(AVG(rating), 0)::numeric(2,1) AS average,
      COUNT(*)::int AS count
    FROM reviews
    WHERE listing_id = $1
  `;

  const res = await query(sql, [listingId]);
  const row = res.rows[0];

  return {
    average: parseFloat(row?.average) || 0,
    count: row?.count || 0,
  };
}

/**
 * getAggregatedRating
 * Returns { average, count } for a listing. Cached.
 */
export function getAggregatedRating(listingId: string): Promise<AggregatedRating> {
  const cachedFn = cache(
    unstable_cache(
      async () => {
        const cacheKey = `${CACHE_KEYS.REVIEWS_AGGREGATED_PREFIX}${listingId}`;
        const cached = await getJsonCache<AggregatedRating>(cacheKey);
        if (cached) return cached;

        const rating = await fetchAggregatedRatingFromDb(listingId);
        await setJsonCache(cacheKey, rating, CACHE_TTL.REVIEWS);
        return rating;
      },
      [`reviews-aggregated-${listingId}`],
      {
        tags: [`reviews-${listingId}`],
        revalidate: 120,
      }
    )
  );
  return cachedFn();
}

/**
 * Batch fetch aggregated ratings for multiple listings.
 * Used on the feed page to avoid N+1 queries.
 */
export async function getBatchAggregatedRatings(
  listingIds: string[]
): Promise<Map<string, AggregatedRating>> {
  if (listingIds.length === 0) return new Map();

  const sql = `
    SELECT
      listing_id,
      COALESCE(AVG(rating), 0)::numeric(2,1) AS average,
      COUNT(*)::int AS count
    FROM reviews
    WHERE listing_id = ANY($1)
    GROUP BY listing_id
  `;

  const res = await query(sql, [listingIds]);
  const map = new Map<string, AggregatedRating>();

  for (const row of res.rows) {
    map.set(row.listing_id, {
      average: parseFloat(row.average) || 0,
      count: row.count || 0,
    });
  }

  return map;
}

// ─── Check Existing Review ─────────────────────────────────────

export async function hasUserReviewed(customerId: string, listingId: string): Promise<boolean> {
  const sql = `SELECT 1 FROM reviews WHERE customer_id = $1 AND listing_id = $2 LIMIT 1`;
  const res = await query(sql, [customerId, listingId]);
  return res.rows.length > 0;
}

// ─── Create Review ─────────────────────────────────────────────

export async function createReview(
  customerId: string,
  listingId: string,
  rating: number,
  comment: string
): Promise<Review | null> {
  const sql = `
    INSERT INTO reviews (customer_id, listing_id, rating, comment)
    VALUES ($1, $2, $3, $4)
    RETURNING id, customer_id, listing_id, rating, comment, created_at
  `;

  try {
    const res = await query(sql, [customerId, listingId, rating, comment]);
    if (res.rows.length === 0) return null;

    const row = res.rows[0];

    // Invalidate caches
    await invalidateReviewCaches(listingId);
    // @ts-expect-error - Next.js revalidateTag signature
    revalidateTag(`reviews-${listingId}`);

    // Fetch user name for the return object
    const userRes = await query(`SELECT name FROM users WHERE id = $1`, [customerId]);
    const customerName = userRes.rows[0]?.name || 'Anonymous';

    return {
      id: row.id,
      customerId: row.customer_id,
      customerName,
      listingId: row.listing_id,
      rating: row.rating,
      comment: row.comment || '',
      createdAt: new Date(row.created_at),
    };
  } catch (error: unknown) {
    // Handle unique constraint violation (duplicate review)
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === '23505') {
      return null;
    }
    throw error;
  }
}
