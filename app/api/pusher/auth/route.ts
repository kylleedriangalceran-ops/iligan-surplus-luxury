import { auth } from "@/lib/auth";
import { pusherServer } from "@/lib/pusher";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const data = await req.formData();
    const socketId = data.get("socket_id") as string;
    const channelName = data.get("channel_name") as string;

    if (!socketId || !channelName) {
      return new NextResponse("Missing parameters", { status: 400 });
    }

    // Ensure users can only subscribe to their own private channels
    if (channelName.startsWith("private-notifications-") && channelName !== `private-notifications-${session.user.id}`) {
      return new NextResponse("Unauthorized channel access", { status: 403 });
    }

    const authResponse = pusherServer.authorizeChannel(socketId, channelName, {
      user_id: session.user.id,
      user_info: {
        name: session.user.name,
      },
    });

    return NextResponse.json(authResponse);
  } catch (error) {
    console.error("Pusher Auth Error:", error);
    return new NextResponse("Server error during pusher auth", { status: 500 });
  }
}
