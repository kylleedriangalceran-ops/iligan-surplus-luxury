"use server";

import { auth } from "@/lib/auth";
import { createMerchantApplication, getExistingApplication } from "@/lib/repositories/userRepository";

export async function submitMerchantApplication(
  prevState: { error?: string, success?: boolean } | null | undefined,
  formData: FormData
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { error: "You must be logged in to apply." };
    }

    if (session.user.role === "MERCHANT") {
      return { error: "You are already a merchant." };
    }

    // Check for existing pending or approved application
    const existing = await getExistingApplication(session.user.id);
    if (existing) {
      if (existing.status === "PENDING") {
        return { error: "You already have a pending application under review." };
      }
      if (existing.status === "APPROVED") {
        return { error: "Your application has already been approved. Please refresh the page to access your dashboard." };
      }
    }

    const storeName = formData.get("storeName") as string;
    const address = formData.get("address") as string;
    const socialMedia = formData.get("socialMedia") as string;

    if (!storeName || !address) {
      return { error: "Store Name and Address are required." };
    }

    const success = await createMerchantApplication(
      session.user.id,
      storeName,
      address,
      socialMedia
    );

    if (!success) {
      return { error: "Failed to submit application. You may have already submitted one." };
    }

    // Notify admin users about the new application (non-blocking)
    try {
      const { getAdminUserIds } = await import("@/lib/repositories/adminRepository");
      const { createNotification } = await import("@/lib/repositories/notificationRepository");
      const adminIds = await getAdminUserIds();

      await Promise.allSettled(
        adminIds.map((adminId) =>
          createNotification(
            adminId,
            `New merchant application from ${session.user?.name || session.user?.email || "a user"} for "${storeName}"`,
            "MERCHANT_APPROVED",
            "/admin"
          )
        )
      );
    } catch (error) {
      console.error("Failed to notify admins about new application:", error);
    }

    return { success: true };
  } catch (error) {
    console.error("submitMerchantApplication error:", error);
    return { error: "An unexpected error occurred. Please try again." };
  }
}
