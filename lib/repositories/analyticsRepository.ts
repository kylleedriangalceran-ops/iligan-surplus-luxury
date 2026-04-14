import { query } from '../db';
import { getJsonCache, setJsonCache } from '../redisCache';

export interface MerchantAnalytics {
  totalRevenue: number;
  totalItemsSold: number;
  wasteReduced: number;
  activeListings: number;
  revenueByMonth: Array<{ month: string; revenue: number; surplusEarnings: number }>;
  topItems: Array<{ item: string; sold: number; revenue: number }>;
  customerImpact: {
    totalCustomers: number;
    moneySaved: number;
  };
}

const ANALYTICS_CACHE_TTL = 30; // 30 seconds for real-time feel

/**
 * getMerchantAnalytics
 * Fetches comprehensive analytics data for a merchant's store
 * Cached for 30 seconds for real-time performance
 */
export async function getMerchantAnalytics(storeId: string): Promise<MerchantAnalytics> {
  const cacheKey = `analytics:merchant:${storeId}`;
  const cached = await getJsonCache<MerchantAnalytics>(cacheKey);
  if (cached) return cached;

  // Get revenue and items sold from completed reservations
  const revenueQuery = await query(
    `SELECT 
      COALESCE(SUM(sl.reserved_price), 0) as total_revenue,
      COALESCE(COUNT(r.id), 0) as total_sold
     FROM reservations r
     JOIN surplus_listings sl ON r.listing_id = sl.id
     WHERE sl.store_id = $1 AND r.status = 'CLAIMED'`,
    [storeId]
  );

  // Get active listings count
  const activeQuery = await query(
    `SELECT COUNT(*) as active_count
     FROM surplus_listings
     WHERE store_id = $1 AND quantity_available > 0`,
    [storeId]
  );

  // Get revenue by month (last 12 months)
  const monthlyQuery = await query(
    `SELECT 
      TO_CHAR(r.updated_at, 'Mon') as month,
      COALESCE(SUM(sl.original_price), 0) as revenue,
      COALESCE(SUM(sl.reserved_price), 0) as surplus_earnings,
      EXTRACT(YEAR FROM r.updated_at) as yr,
      EXTRACT(MONTH FROM r.updated_at) as mo
     FROM reservations r
     JOIN surplus_listings sl ON r.listing_id = sl.id
     WHERE sl.store_id = $1 
       AND r.status = 'CLAIMED'
      AND r.updated_at >= NOW() - INTERVAL '12 months'
     GROUP BY TO_CHAR(r.updated_at, 'Mon'), yr, mo
     ORDER BY yr DESC, mo DESC
     LIMIT 12`,
    [storeId]
  );

  // Get top selling items
  const topItemsQuery = await query(
    `SELECT 
      sl.title as item,
      COUNT(r.id) as sold,
      COALESCE(SUM(sl.reserved_price), 0) as revenue
     FROM surplus_listings sl
     LEFT JOIN reservations r ON sl.id = r.listing_id AND r.status = 'CLAIMED'
     WHERE sl.store_id = $1
     GROUP BY sl.id, sl.title
     ORDER BY sold DESC, revenue DESC
     LIMIT 5`,
    [storeId]
  );

  // Get customer impact data
  const customerQuery = await query(
    `SELECT 
      COUNT(DISTINCT r.customer_id) as total_customers,
      COALESCE(SUM(sl.original_price - sl.reserved_price), 0) as money_saved
     FROM reservations r
     JOIN surplus_listings sl ON r.listing_id = sl.id
     WHERE sl.store_id = $1 AND r.status = 'CLAIMED'`,
    [storeId]
  );

  const totalRevenue = parseFloat(revenueQuery.rows[0]?.total_revenue || 0);
  const totalSold = parseInt(revenueQuery.rows[0]?.total_sold || 0);
  const activeListings = parseInt(activeQuery.rows[0]?.active_count || 0);

  // Estimate waste reduced: average 2.5kg per item sold
  const wasteReduced = Math.floor(totalSold * 2.5);

  const analytics: MerchantAnalytics = {
    totalRevenue,
    totalItemsSold: totalSold,
    wasteReduced,
    activeListings,
    revenueByMonth: monthlyQuery.rows.map(row => ({
      month: row.month,
      revenue: parseFloat(row.revenue),
      surplusEarnings: parseFloat(row.surplus_earnings),
    })).reverse(), // Oldest to newest
    topItems: topItemsQuery.rows.map(row => ({
      item: row.item,
      sold: parseInt(row.sold || 0),
      revenue: parseFloat(row.revenue || 0),
    })),
    customerImpact: {
      totalCustomers: parseInt(customerQuery.rows[0]?.total_customers || 0),
      moneySaved: parseFloat(customerQuery.rows[0]?.money_saved || 0),
    },
  };

  await setJsonCache(cacheKey, analytics, ANALYTICS_CACHE_TTL);
  return analytics;
}
