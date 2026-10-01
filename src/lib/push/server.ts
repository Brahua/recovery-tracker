import "server-only";

import webpush from "web-push";

import { createPushSender, readVapidConfig, type PushSender } from "@/lib/push/sender";

/** Sender wired to `web-push` and the VAPID keys in the environment; null until they are set. */
export function getPushSender(): PushSender | null {
  const vapid = readVapidConfig(process.env);
  return vapid ? createPushSender(webpush, vapid) : null;
}
