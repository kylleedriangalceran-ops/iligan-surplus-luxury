import PusherClient from "pusher-js";

/**
 * Client-side Pusher singleton.
 * We lazily initialize to avoid creating multiple connections.
 */
let pusherInstance: PusherClient | null = null;

export function getPusherClient(): PusherClient {
  if (!pusherInstance) {
    pusherInstance = new PusherClient(
      process.env.NEXT_PUBLIC_PUSHER_APP_KEY!,
      {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      }
    );
  }
  return pusherInstance;
}
