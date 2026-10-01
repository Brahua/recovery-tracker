import { createHash, timingSafeEqual } from "node:crypto";

import type { PushSender } from "@/lib/push/sender";
import { dispatchReminders, type DispatchStore } from "@/lib/reminders/dispatch";

/** Constant-time check of `Authorization: Bearer <secret>`. Hashing first makes lengths equal. */
export function isAuthorizedDispatch(authorization: string | null, secret: string) {
  const match = authorization?.match(/^Bearer (.+)$/);
  if (!match) return false;
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(match[1]), digest(secret));
}

export interface DispatchHandlerDeps {
  secret: string | undefined;
  getSender: () => PushSender | null;
  getStore: () => DispatchStore | null;
  now?: () => Date;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

// POST /api/reminders/dispatch, called every 5 minutes by Supabase pg_cron. Returns only counters.
export function createDispatchHandler({
  secret,
  getSender,
  getStore,
  now = () => new Date(),
}: DispatchHandlerDeps) {
  return async function handleDispatch(request: Request): Promise<Response> {
    if (!secret?.trim()) return json({ error: "Reminders are not configured." }, 503);
    if (!isAuthorizedDispatch(request.headers.get("authorization"), secret.trim())) {
      return json({ error: "Unauthorized." }, 401);
    }

    const sendPush = getSender();
    const store = getStore();
    if (!sendPush || !store) return json({ error: "Reminders are not configured." }, 503);

    try {
      return json(await dispatchReminders({ now: now(), store, sendPush }));
    } catch (error) {
      console.error("Reminder dispatch failed.", error);
      return json({ error: "Dispatch failed." }, 500);
    }
  };
}
