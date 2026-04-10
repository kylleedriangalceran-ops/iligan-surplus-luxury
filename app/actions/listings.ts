"use server";

import { auth } from "@/lib/auth";
import { decrementQuantity } from "@/lib/repositories/listingRepository";
import { createReservation } from "@/lib/repositories/reservationRepository";
import { createNotification } from "@/lib/repositories/notificationRepository";
import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";

export async function reserveSurplusItem(listingId: string) {
  // 1. Verify user is logged in
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized: You must be logged in to reserve an item.");
  }

  const userId = session.user.id;

  // 2. Call listingRepository.decrementQuantity(listingId)
  const isDecremented = await decrementQuantity(listingId);
  
  if (!isDecremented) {
    throw new Error("Failed to reserve: Item might be out of stock or does not exist.");
  }

  // 3. Generate a secure 6-digit alphanumeric reservation token
  const token = randomBytes(3).toString("hex").toUpperCase();

  // 4. Create a new row in the reservations table
  try {
    await createReservation(userId, listingId, token);

    // 5. Notify the merchant who owns this listing
    try {
      const listingInfo = await query(
        `SELECT sl.title, s.merchant_id FROM surplus_listings sl JOIN stores s ON sl.store_id = s.id WHERE sl.id = $1`,
        [listingId]
      );
      if (listingInfo.rows.length > 0) {
        const { title, merchant_id } = listingInfo.rows[0];
        await createNotification(
          merchant_id,
          `A customer reserved "${title}" (Token: ${token})`,
          "RESERVATION_MADE",
          "/dashboard/reservations"
        );
      }
    } catch (notifError) {
      // Non-critical: don't block reservation if notification fails
      console.error("Notification creation failed:", notifError);
    }
  } catch (error) {
    // Ideally, we'd roll back the inventory here if this fails, but it's an MVP
    console.error("Critical error: Failed to generate reservation receipt.", error);
    throw new Error("Failed to finalize reservation. Please contact support.");
  }

  // 6. Instantly update the UI
  revalidatePath("/feed");
  
  return { success: true, token };
}
