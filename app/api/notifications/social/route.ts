import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "no-store" };

export interface SocialUser {
  userId: string;
  name: string;
  email: string;
  followedAt: string;
}

/**
 * GET /api/notifications/social
 * - MERCHANT: returns the list of users who follow their store (Followers)
 * - CUSTOMER: returns the list of stores the user follows (Followings)
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ items: [], role: null }, { status: 401, headers: noStore });
    }

    const { id: userId, role } = session.user as { id: string; role: "MERCHANT" | "CUSTOMER" | "ADMIN" };

    if (role === "MERCHANT") {
      // Get users who follow this merchant's store
      const res = await query(
        `SELECT 
           u.id        AS user_id,
           u.name,
           u.email,
           f.created_at AS followed_at
         FROM follows f
         JOIN stores s ON f.store_id = s.id
         JOIN users u ON f.user_id = u.id
         WHERE s.merchant_id = $1
         ORDER BY f.created_at DESC
         LIMIT 50`,
        [userId]
      );

      const items: SocialUser[] = res.rows.map((r) => ({
        userId: r.user_id,
        name: r.name,
        email: r.email,
        followedAt: r.followed_at,
      }));

      return NextResponse.json({ items, role: "MERCHANT" }, { headers: noStore });
    } else {
      // CUSTOMER: get stores they follow
      const res = await query(
        `SELECT 
           s.id          AS store_id,
           s.name        AS store_name,
           u.id          AS merchant_user_id,
           u.name        AS merchant_name,
           f.created_at  AS followed_at
         FROM follows f
         JOIN stores s ON f.store_id = s.id
         JOIN users u ON s.merchant_id = u.id
         WHERE f.user_id = $1
         ORDER BY f.created_at DESC
         LIMIT 50`,
        [userId]
      );

      const items = res.rows.map((r) => ({
        storeId: r.store_id,
        storeName: r.store_name,
        merchantUserId: r.merchant_user_id,
        merchantName: r.merchant_name,
        followedAt: r.followed_at,
      }));

      return NextResponse.json({ items, role: "CUSTOMER" }, { headers: noStore });
    }
  } catch (err) {
    console.error("Error fetching social data:", err);
    return NextResponse.json({ items: [], role: null }, { status: 500, headers: noStore });
  }
}
