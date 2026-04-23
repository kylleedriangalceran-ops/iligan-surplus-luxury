"use server";

import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import { createReview, hasUserReviewed } from "@/lib/repositories/reviewRepository";
import { revalidateTag } from "next/cache";

export async function submitReview(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be signed in to leave a review." };
  }

  const customerId = session.user.id;
  const listingId = formData.get("listingId") as string;
  const ratingStr = formData.get("rating") as string;
  const comment = (formData.get("comment") as string)?.trim() || "";

  // ─── Validation ──────────────────────────────────────────────
  if (!listingId) {
    return { error: "Missing listing ID." };
  }

  const rating = parseInt(ratingStr, 10);
  if (isNaN(rating) || rating < 1 || rating > 5) {
    return { error: "Rating must be between 1 and 5." };
  }

  if (comment.length > 500) {
    return { error: "Comment must be 500 characters or less." };
  }

  // ─── Security: Verify CLAIMED reservation ────────────────────
  const verifyRes = await query(
    `SELECT 1 FROM reservations
     WHERE customer_id = $1 AND listing_id = $2 AND status = 'CLAIMED'
     LIMIT 1`,
    [customerId, listingId]
  );

  if (verifyRes.rows.length === 0) {
    return { error: "You can only review items you have picked up." };
  }

  // ─── Check duplicate ────────────────────────────────────────
  const alreadyReviewed = await hasUserReviewed(customerId, listingId);
  if (alreadyReviewed) {
    return { error: "You have already reviewed this item." };
  }

  // ─── Insert ──────────────────────────────────────────────────
  const review = await createReview(customerId, listingId, rating, comment);

  if (!review) {
    return { error: "Failed to submit review. You may have already reviewed this item." };
  }

  // ─── Revalidate ──────────────────────────────────────────────
  // @ts-expect-error - Next.js revalidateTag signature
  revalidateTag(`reviews-${listingId}`);

  return { success: true, message: "Review submitted successfully." };
}
