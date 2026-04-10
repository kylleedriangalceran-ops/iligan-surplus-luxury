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
  revalidatePath("/admin");
  return result;
}

export async function rejectMerchantApplication(applicationId: string) {
  await requireAdmin();
  await rejectApplication(applicationId);
  revalidatePath("/admin");
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
