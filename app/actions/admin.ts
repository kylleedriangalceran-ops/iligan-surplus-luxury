"use server";

import { auth } from "@/lib/auth";
import {
  updateUserRole,
  deleteUser,
  toggleUserBan,
  approveApplication,
  rejectApplication,
  deleteListing,
  updateGlobalSetting,
} from "@/lib/repositories/adminRepository";
import { revalidatePath } from "next/cache";

import { createNotification } from "@/lib/repositories/notificationRepository";

// ─── Guard ──────────────────────────────────────────────────
async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
  return session;
}

// ─── User Management ────────────────────────────────────────
export async function changeUserRole(userId: string, role: "MERCHANT" | "CUSTOMER" | "ADMIN") {
  await requireAdmin();
  await updateUserRole(userId, role);
  revalidatePath("/admin");
}

export async function removeUser(userId: string) {
  const session = await requireAdmin();
  if (userId === session.user.id) {
    throw new Error("Cannot delete your own account.");
  }
  await deleteUser(userId);
  revalidatePath("/admin");
}

export async function suspendUser(userId: string, ban: boolean) {
  const session = await requireAdmin();
  if (userId === session.user.id) {
    throw new Error("Cannot suspend your own account.");
  }
  await toggleUserBan(userId, ban);
  revalidatePath("/admin");
}

// ─── Merchant Vetting ───────────────────────────────────────
export async function approveMerchantApplication(applicationId: string) {
  await requireAdmin();
  const result = await approveApplication(applicationId);
  if (!result) {
    throw new Error("Application not found or already processed.");
  }
  
  // Revalidate all affected paths immediately
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath("/feed");

  // Non-blocking notification — never let this fail the approval flow
  createNotification(
    result.userId,
    `Congratulations! Your merchant application for "${result.storeName}" has been approved. Welcome to the platform!`,
    "MERCHANT_APPROVED",
    "/dashboard"
  ).catch((error) => {
    console.error("Failed to send approval notification (approval still succeeded):", error);
  });

  return result;
}

export async function rejectMerchantApplication(applicationId: string) {
  await requireAdmin();
  const result = await rejectApplication(applicationId);
  if (!result) {
    throw new Error("Application not found or already processed.");
  }
  
  // Revalidate admin page immediately
  revalidatePath("/admin");

  // Non-blocking notification — never let this fail the rejection flow
  createNotification(
    result.userId,
    `Your merchant application has been declined. Please contact support for details.`,
    "MERCHANT_REJECTED",
    "/"
  ).catch((error) => {
    console.error("Failed to send rejection notification (rejection still succeeded):", error);
  });
}

// ─── Live Drops ─────────────────────────────────────────────
export async function removeListing(listingId: string) {
  await requireAdmin();
  await deleteListing(listingId);
  revalidatePath("/admin");
}

// ─── Global Settings ────────────────────────────────────────
export async function saveGlobalSetting(key: string, value: string) {
  await requireAdmin();
  await updateGlobalSetting(key, value);
  revalidatePath("/admin");
}

// ─── Merchant Location ──────────────────────────────────────
export async function updateStoreLocation(latitude: number, longitude: number) {
  const session = await auth();
  if (!session?.user || session.user.role !== "MERCHANT") {
    throw new Error("Unauthorized: Only merchants can update store location");
  }

  const { updateStoreCoordinates } = await import("@/lib/repositories/storeRepository");
  await updateStoreCoordinates(session.user.id, latitude, longitude);
  
  revalidatePath("/dashboard");
  revalidatePath("/map");
  revalidatePath("/feed");
}
