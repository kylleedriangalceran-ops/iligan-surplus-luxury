"use server";

import { auth } from "@/lib/auth";
import { findStoreByMerchantId, createStore } from "@/lib/repositories/storeRepository";
import { createListing } from "@/lib/repositories/listingRepository";
import { updateReservationStatus } from "@/lib/repositories/reservationRepository";
import { createNotification } from "@/lib/repositories/notificationRepository";
import { revalidatePath } from "next/cache";

export async function createStoreAction(
  prevState: { error?: string; success?: boolean } | null | undefined,
  formData: FormData
) {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "MERCHANT" && session.user.role !== "ADMIN")) {
    return { error: "Unauthorized: Merchant access required." };
  }

  const name = formData.get("name") as string;
  const location = formData.get("location") as string;

  if (!name || !location) {
    return { error: "Please fill in all required fields." };
  }

  // Check if merchant already has a store
  const existing = await findStoreByMerchantId(session.user.id);
  if (existing) {
    return { error: "You already have a registered store." };
  }

  try {
    const store = await createStore({
      merchantId: session.user.id,
      name,
      location,
    });

    if (!store) {
      return { error: "Failed to create store. Please try again." };
    }

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("createStoreAction error:", error);
    return { error: "Database error. Please verify your connection." };
  }
}

export async function createSurplusDrop(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "MERCHANT" && session.user.role !== "ADMIN")) {
    return { error: "Unauthorized: Merchant access required." };
  }

  const store = await findStoreByMerchantId(session.user.id);
  if (!store) {
    return { error: "You must create a store first before adding listings." };
  }

  const title = formData.get("title") as string;
  const originalPrice = parseFloat(formData.get("originalPrice") as string);
  const reservedPrice = parseFloat(formData.get("reservedPrice") as string);
  const quantityAvailable = parseInt(formData.get("quantityAvailable") as string);
  const pickupTimeWindow = formData.get("pickupTimeWindow") as string;
  const imageUrl = (formData.get("imageUrl") as string) || undefined;

  if (!title || isNaN(originalPrice) || isNaN(reservedPrice) || isNaN(quantityAvailable) || !pickupTimeWindow) {
    return { error: "Please fill in all fields with valid values." };
  }

  if (reservedPrice >= originalPrice) {
    return { error: "Surplus price must be less than the original price." };
  }

  try {
    const listing = await createListing({
      storeId: store.id,
      title,
      originalPrice,
      reservedPrice,
      quantityAvailable,
      pickupTimeWindow,
      imageUrl,
    });

    if (!listing) {
      return { error: "Failed to create listing." };
    }

    // Targeted notification blast to active followers 
    const { getStoreFollowers } = await import("@/lib/repositories/followRepository");
    const followers = await getStoreFollowers(store.id);

    if (followers.length > 0) {
      const messages = followers.map((follower) => 
        createNotification(
          follower.user_id,
          `New Drop: ${store.name} listed ${title} for ₱${reservedPrice.toFixed(2)}!`,
          "NEW_DROP",
          "/feed"
        )
      );
      // Wait for all pushes to settle
      await Promise.allSettled(messages);
    }

    revalidatePath("/dashboard");
    revalidatePath("/feed");
    return { success: true };
  } catch (error) {
    console.error("createSurplusDrop error:", error);
    return { error: "Database error during listing creation." };
  }
}

export async function updateReservationStatusAction(
  reservationId: string,
  status: "CLAIMED" | "CANCELLED"
) {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "MERCHANT" && session.user.role !== "ADMIN")) {
    throw new Error("Unauthorized");
  }

  const success = await updateReservationStatus(reservationId, status);
  
  if (!success) {
    throw new Error("Failed to update reservation status.");
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/reservations");
  return { success: true };
}

export async function verifyPickup(reservationId: string) {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "MERCHANT" && session.user.role !== "ADMIN")) {
    return { error: "Unauthorized access. Merchant Privileges Required." };
  }

  // Find store by current merchant to prove authorization
  const store = await findStoreByMerchantId(session.user.id);
  if (!store && session.user.role !== "ADMIN") {
      return { error: "You must have an active store to verify pickups." };
  }

  // Cross-reference reservation's listing to merchant's store
  // To avoid massive dependency injection loop, we just use a direct query.
  // We can import query directly if necessary, or get it from reservationRepository.
  // Actually, reservationRepository.ts has updateReservationStatus which does not verify caller.
  // We should do a direct query to ensure it belongs to storeId.
  const { query } = await import("@/lib/db");
  
  try {
    const res = await query(
      `SELECT r.id, r.status, sl.store_id, sl.title
       FROM reservations r
       JOIN surplus_listings sl ON r.listing_id = sl.id
       WHERE r.id = $1`,
      [reservationId]
    );

    if (res.rows.length === 0) {
      return { error: "Invalid QR Code: Reservation not found." };
    }

    const { status, store_id, title } = res.rows[0];

    if (session.user.role !== "ADMIN" && store_id !== store?.id) {
       return { error: "Access Denied: This reservation belongs to a different store." };
    }

    if (status === "CLAIMED") {
      return { error: "This QR Code has already been scanned and claimed." };
    }
    
    if (status === "CANCELLED") {
      return { error: "This reservation was cancelled." };
    }

    // Now update using the repository method to handle cache invalidation
    const success = await updateReservationStatus(reservationId, "CLAIMED");
    if (!success) {
      return { error: "Database error during status update." };
    }

    revalidatePath("/dashboard");
    revalidatePath("/feed");
    return { success: true, message: `Successfully verified pickup for: ${title}` };
  } catch (err) {
    console.error("verifyPickup Error:", err);
    return { error: "A server error occurred while verifying the pass." };
  }
}

// ─── Store Location ─────────────────────────────────────────
export async function updateStoreLocation(latitude: number, longitude: number) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "MERCHANT") {
    return { error: "Unauthorized: Only merchants can update store location" };
  }

  const { updateStoreCoordinates } = await import("@/lib/repositories/storeRepository");
  
  try {
    const updated = await updateStoreCoordinates(session.user.id, latitude, longitude);
    if (!updated) {
      return { error: "No store found for this merchant. Please create your store first." };
    }
    
    revalidatePath("/dashboard");
    revalidatePath("/map");
    revalidatePath("/feed");
    
    return { success: true };
  } catch (error) {
    console.error("updateStoreLocation error:", error);
    return { error: "Failed to update store location" };
  }
}
