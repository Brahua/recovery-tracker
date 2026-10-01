import type { PushResult, PushSender } from "@/lib/push/sender";
import { dueReminders, openReminderWindows } from "@/lib/reminders/due-reminders";
import { reminderMessages } from "@/lib/reminders/messages";
import type { ReminderKind, ReminderSettings, StoredPushSubscription } from "@/types/reminders";

/** Data access the dispatcher needs (service_role in production, a fake in tests). Reads are batched. */
export interface DispatchStore {
  listActiveSettings(): Promise<Array<{ userId: string; settings: ReminderSettings }>>;
  usersWithSessionOn(userIds: string[], localDate: string): Promise<Set<string>>;
  usersWithCloseoutOn(userIds: string[], localDate: string): Promise<Set<string>>;
  deliveriesOn(userIds: string[], localDate: string): Promise<Map<string, ReminderKind[]>>;
  subscriptionsFor(userIds: string[]): Promise<Map<string, StoredPushSubscription[]>>;
  /** Records the delivery; false when it was already recorded (another run sent it). */
  reserveDelivery(userId: string, kind: ReminderKind, localDate: string): Promise<boolean>;
  deleteSubscription(id: string): Promise<void>;
  markSubscriptionSuccess(id: string): Promise<void>;
}

export interface DispatchSummary {
  candidates: number;
  remindersSent: number;
  notificationsSent: number;
  subscriptionsRemoved: number;
  failures: number;
}

export async function dispatchReminders({
  now,
  store,
  sendPush,
}: {
  now: Date;
  store: DispatchStore;
  sendPush: PushSender;
}): Promise<DispatchSummary> {
  const summary: DispatchSummary = {
    candidates: 0,
    remindersSent: 0,
    notificationsSent: 0,
    subscriptionsRemoved: 0,
    failures: 0,
  };

  // 1. Only users with a reminder window open right now (pure, no extra queries).
  const candidates = (await store.listActiveSettings()).filter(
    ({ settings }) => openReminderWindows(now, settings).kinds.length > 0,
  );
  summary.candidates = candidates.length;
  if (candidates.length === 0) return summary;

  // Every candidate shares the app's time zone (America/Lima), so one local date covers the batch.
  const byDate = new Map<string, typeof candidates>();
  for (const candidate of candidates) {
    const { localDate } = openReminderWindows(now, candidate.settings);
    byDate.set(localDate, [...(byDate.get(localDate) ?? []), candidate]);
  }

  for (const [localDate, group] of byDate) {
    const userIds = group.map(({ userId }) => userId);
    const [withSession, withCloseout, delivered, subscriptions] = await Promise.all([
      store.usersWithSessionOn(userIds, localDate),
      store.usersWithCloseoutOn(userIds, localDate),
      store.deliveriesOn(userIds, localDate),
      store.subscriptionsFor(userIds),
    ]);

    for (const { userId, settings } of group) {
      const devices = subscriptions.get(userId) ?? [];
      // Without a device there is nobody to notify; do not burn today's reminder.
      if (devices.length === 0) continue;

      const { kinds } = dueReminders({
        now,
        settings,
        hasSessionToday: withSession.has(userId),
        hasCloseoutToday: withCloseout.has(userId),
        deliveredToday: delivered.get(userId) ?? [],
      });

      for (const kind of kinds) {
        // Reserve first: a concurrent run that loses the insert does not send again.
        if (!(await store.reserveDelivery(userId, kind, localDate))) continue;
        summary.remindersSent += 1;

        for (const device of devices) {
          const result: PushResult = await sendPush(device, reminderMessages[kind]);
          if (result.status === "sent") {
            summary.notificationsSent += 1;
            await store.markSubscriptionSuccess(device.id);
          } else if (result.status === "gone") {
            summary.subscriptionsRemoved += 1;
            await store.deleteSubscription(device.id);
          } else {
            summary.failures += 1;
            console.error("Reminder push failed.", kind, result.statusCode, result.message);
          }
        }
      }
    }
  }

  return summary;
}
