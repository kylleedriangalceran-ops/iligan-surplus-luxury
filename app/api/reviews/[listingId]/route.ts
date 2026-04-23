import { NextRequest, NextResponse } from "next/server";
import { getReviewsByListingId, getAggregatedRating } from "@/lib/repositories/reviewRepository";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
) {
  const { listingId } = await params;

  if (!listingId) {
    return NextResponse.json({ error: "Missing listing ID" }, { status: 400 });
  }

  const [reviews, aggregated] = await Promise.all([
    getReviewsByListingId(listingId),
    getAggregatedRating(listingId),
  ]);

  // Check if current user can review (has CLAIMED reservation and hasn't reviewed)
  let canReview = false;
  const session = await auth();
  if (session?.user?.id) {
    const claimedRes = await query(
      `SELECT 1 FROM reservations WHERE customer_id = $1 AND listing_id = $2 AND status = 'CLAIMED' LIMIT 1`,
      [session.user.id, listingId]
    );
    const reviewedRes = await query(
      `SELECT 1 FROM reviews WHERE customer_id = $1 AND listing_id = $2 LIMIT 1`,
      [session.user.id, listingId]
    );
    canReview = claimedRes.rows.length > 0 && reviewedRes.rows.length === 0;
  }

  return NextResponse.json({
    reviews: reviews.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    })),
    aggregated,
    canReview,
  });
}
