"use server";

import { auth } from "@/lib/auth";
import { followStore, unfollowStore, checkIsFollowing, getUserFollowedStores } from "@/lib/repositories/followRepository";
import { revalidatePath } from "next/cache";
import { query } from "@/lib/db";
import { createNotification } from "@/lib/repositories/notificationRepository";

export async function toggleStoreFollow(storeId: string, isCurrentlyFollowing: boolean) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be logged in to follow stores." };
  }

  const followerName = session.user.name ?? "Someone";

  try {
    if (isCurrentlyFollowing) {
      await unfollowStore(session.user.id, storeId);
    } else {
      await followStore(session.user.id, storeId);

      // Notify the merchant in real-time
      try {
        const res = await query(
          `SELECT s.merchant_id, s.name AS store_name FROM stores s WHERE s.id = $1 LIMIT 1`,
          [storeId]
        );
        if (res.rows.length > 0) {
          const { merchant_id, store_name } = res.rows[0];
          await createNotification(
            merchant_id,
            `@${followerName} followed your store`,
            "NEW_FOLLOWER",
            `/dashboard`
          );
        }
      } catch (notifErr) {
        // Non-fatal — don't block the follow action
        console.error("Follow notification error:", notifErr);
      }
    }

    // Revalidate paths where feed/cards might be rendered
    revalidatePath("/feed");
    revalidatePath(`/store/${storeId}`);
    return { success: true, isFollowing: !isCurrentlyFollowing };
  } catch (error) {
    console.error("toggleStoreFollow Error:", error);
    return { error: "An error occurred while following the store." };
  }
}

export async function getIsFollowing(storeId: string) {
  const session = await auth();
  if (!session?.user?.id) return false;
  
  return checkIsFollowing(session.user.id, storeId);
}

export async function getFollowedMerchants() {
  const session = await auth();
  if (!session?.user?.id) return [];

  return getUserFollowedStores(session.user.id);
}
