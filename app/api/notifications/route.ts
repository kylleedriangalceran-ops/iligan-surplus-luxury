import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getNotifications, getUnreadNotificationsCount, markNotificationsAsRead } from "@/lib/repositories/notificationRepository";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ notifications: [], unreadCount: 0 }, { status: 401 });
    }

    const unreadCount = await getUnreadNotificationsCount(session.user.id);
    const notifications = await getNotifications(session.user.id, 20);

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ notifications: [], unreadCount: 0 }, { status: 500 });
  }
}

export async function POST(request: Request) {
  // Mark as read
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ success: false }, { status: 401 });

    await markNotificationsAsRead(session.user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
