import type { PushSubscriptionInput } from "@/types/reminders";

export interface PushPayload {
  title: string;
  body: string;
  /** Path the app opens when the notification is tapped (handled by public/sw.js). */
  url: string;
  /** Same tag replaces an older notification instead of stacking. */
  tag: string;
}

export type PushResult =
  | { status: "sent" }
  /** The browser dropped this subscription (404/410): delete it. */
  | { status: "gone" }
  | { status: "failed"; statusCode?: number; message: string };

export interface VapidConfig {
  subject: string;
  publicKey: string;
  privateKey: string;
}

/** The part of the `web-push` module we use; injected so tests can fake it. */
export interface WebPushClient {
  sendNotification(
    subscription: PushSubscriptionInput,
    payload: string,
    options: { vapidDetails: VapidConfig; TTL: number; urgency: "normal" },
  ): Promise<unknown>;
}

/** VAPID settings from the environment, or null while they are not configured. */
export function readVapidConfig(env: Record<string, string | undefined>): VapidConfig | null {
  const publicKey = env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  const privateKey = env.VAPID_PRIVATE_KEY?.trim();
  const subject = env.VAPID_SUBJECT?.trim();
  if (!publicKey || !privateKey || !subject) return null;
  return { subject, publicKey, privateKey };
}

// A reminder that waited more than two hours is stale (matches the dispatch window).
const TTL_SECONDS = 2 * 60 * 60;

export function createPushSender(client: WebPushClient, vapid: VapidConfig) {
  return async function sendPush(
    subscription: PushSubscriptionInput,
    payload: PushPayload,
  ): Promise<PushResult> {
    try {
      await client.sendNotification(
        { endpoint: subscription.endpoint, keys: subscription.keys },
        JSON.stringify(payload),
        { vapidDetails: vapid, TTL: TTL_SECONDS, urgency: "normal" },
      );
      return { status: "sent" };
    } catch (error) {
      const statusCode = (error as { statusCode?: number })?.statusCode;
      if (statusCode === 404 || statusCode === 410) return { status: "gone" };
      const message =
        (error as { body?: string; message?: string })?.body ||
        (error as Error)?.message ||
        "Unknown error";
      return { status: "failed", statusCode, message };
    }
  };
}

export type PushSender = ReturnType<typeof createPushSender>;
