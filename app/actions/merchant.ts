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

    await createNotification(
      null,
      `New Drop: ${store.name} listed ${title} for ₱${reservedPrice.toFixed(2)}!`,
      "NEW_DROP",
      "/feed"
    );

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
