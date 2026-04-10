"use server";

import { auth } from "@/lib/auth";
import { sendMessage, getConversation, getRecentMessagers } from "@/lib/repositories/messageRepository";
import { pusherServer } from "@/lib/pusher";

/**
 * Generates a deterministic channel name for a 1-on-1 conversation.
 * Sorts IDs so both users subscribe to the same channel regardless of who initiated.
 */
function getChatChannel(userId1: string, userId2: string): string {
  const sorted = [userId1, userId2].sort();
  return `chat-${sorted[0]}-${sorted[1]}`;
}

export async function sendUserMessage(receiverId: string, content: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const message = await sendMessage(session.user.id, receiverId, content);

  // Broadcast via Pusher for real-time delivery
  if (message) {
    const channel = getChatChannel(session.user.id, receiverId);
    await pusherServer.trigger(channel, "new-message", {
      id: message.id,
      senderId: message.senderId,
      receiverId: message.receiverId,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
    });
  }

  return message;
}

export async function getUserConversation(otherUserId: string) {
  const session = await auth();
  if (!session?.user?.id) return [];

  return getConversation(session.user.id, otherUserId);
}

export async function getInbox() {
  const session = await auth();
  if (!session?.user?.id) return [];

  return getRecentMessagers(session.user.id);
}

/**
 * Helper exported so client components can derive the channel name.
 */
export async function getChatChannelName(otherUserId: string): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  return getChatChannel(session.user.id, otherUserId);
}
