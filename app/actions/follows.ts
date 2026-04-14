"use server";

import { auth } from "@/lib/auth";
import { followStore, unfollowStore, checkIsFollowing, getUserFollowedStores } from "@/lib/repositories/followRepository";
import { revalidatePath } from "next/cache";

export async function toggleStoreFollow(storeId: string, isCurrentlyFollowing: boolean) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be logged in to follow stores." };
  }

  // Double check the internal state to avoid race condition blindly inserting
  // Or just rely on the UI intent. Let's rely on UI intent.
  try {
    if (isCurrentlyFollowing) {
      await unfollowStore(session.user.id, storeId);
    } else {
      await followStore(session.user.id, storeId);
    }
    
    // Revalidate paths where feed/cards might be rendered
    revalidatePath("/feed");
    revalidatePath(`/store/${storeId}`); // If such a route exists
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
