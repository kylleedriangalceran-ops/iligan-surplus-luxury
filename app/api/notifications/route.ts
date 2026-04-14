import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  clearNotificationsForUser,
  getNotifications,
  getUnreadNotificationsCount,
  markNotificationAsRead,
  markNotificationsAsRead,
} from "@/lib/repositories/notificationRepository";

export const dynamic = "force-dynamic";
const noStoreHeaders = { "Cache-Control": "no-store" };

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ notifications: [], unreadCount: 0 }, { status: 401, headers: noStoreHeaders });
    }

    const unreadCount = await getUnreadNotificationsCount(session.user.id);
    const notifications = await getNotifications(session.user.id, 20);

    return NextResponse.json({ notifications, unreadCount }, { headers: noStoreHeaders });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ notifications: [], unreadCount: 0 }, { status: 500, headers: noStoreHeaders });
  }
}

export async function POST() {
  // Mark as read
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ success: false }, { status: 401, headers: noStoreHeaders });

    await markNotificationsAsRead(session.user.id);
    return NextResponse.json({ success: true }, { headers: noStoreHeaders });
  } catch {
    return NextResponse.json({ success: false }, { status: 500, headers: noStoreHeaders });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false }, { status: 401, headers: noStoreHeaders });
    }

    const body = await req.json().catch(() => null);
    const notificationId = body?.notificationId as string | undefined;
    if (!notificationId) {
      return NextResponse.json({ success: false, error: "notificationId is required" }, { status: 400, headers: noStoreHeaders });
    }

    await markNotificationAsRead(session.user.id, notificationId);
    return NextResponse.json({ success: true }, { headers: noStoreHeaders });
  } catch {
    return NextResponse.json({ success: false }, { status: 500, headers: noStoreHeaders });
  }
}

export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false }, { status: 401, headers: noStoreHeaders });
    }

    await clearNotificationsForUser(session.user.id);
    return NextResponse.json({ success: true }, { headers: noStoreHeaders });
  } catch {
    return NextResponse.json({ success: false }, { status: 500, headers: noStoreHeaders });
  }
}
