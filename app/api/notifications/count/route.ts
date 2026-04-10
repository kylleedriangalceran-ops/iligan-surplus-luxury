import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ unreadCount: 0 }, { status: 401 });
    }

    const { id, role } = session.user;
    let unreadCount = 0;

    if (role === "MERCHANT") {
      // Merchants: count new PENDING reservations created in the last 24 hours
      const merchantSql = `
        SELECT COUNT(*) as count 
        FROM reservations r
        JOIN surplus_listings sl ON r.listing_id = sl.id
        JOIN stores s ON sl.store_id = s.id
        WHERE s.merchant_id = $1 AND r.status = 'PENDING' AND r.created_at >= NOW() - INTERVAL '24 HOURS'
      `;
      const res = await query(merchantSql, [id]);
      unreadCount = parseInt(res.rows[0]?.count || "0", 10);
    } else {
      // Customers: count recent listings created in the last 24 hours
      const customerSql = `
        SELECT COUNT(*) as count
        FROM surplus_listings
        WHERE created_at >= NOW() - INTERVAL '24 HOURS'
      `;
      const res = await query(customerSql);
      unreadCount = parseInt(res.rows[0]?.count || "0", 10);
    }

    return NextResponse.json({ unreadCount });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ unreadCount: 0 }, { status: 500 });
  }
}
