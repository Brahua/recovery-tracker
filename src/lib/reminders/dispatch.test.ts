import { describe, expect, it, vi } from "vitest";

import type { PushResult } from "@/lib/push/sender";
import { dispatchReminders, type DispatchStore } from "@/lib/reminders/dispatch";
import { reminderMessages } from "@/lib/reminders/messages";
import { defaultReminderSettings } from "@/lib/reminders/settings";
import type { ReminderKind, StoredPushSubscription } from "@/types/reminders";

const now = new Date("2026-10-01T21:35:00-05:00"); // Lima
const device = (id: string, userId: string): StoredPushSubscription => ({
  id,
  userId,
  endpoint: `https://push.example/${id}`,
  keys: { p256dh: "p", auth: "a" },
});

function fakeStore(overrides: Partial<DispatchStore> = {}) {
  const reserved = new Set<string>();
  const store: DispatchStore = {
    listActiveSettings: async () => [
      { userId: "ana", settings: { ...defaultReminderSettings } }, // closeout 21:30 on
      { userId: "beto", settings: { ...defaultReminderSettings, closeoutTime: "23:00" } }, // not yet
    ],
    usersWithSessionOn: async () => new Set(),
    usersWithCloseoutOn: async () => new Set(),
    deliveriesOn: async () => new Map<string, ReminderKind[]>(),
    subscriptionsFor: async () => new Map([["ana", [device("d1", "ana"), device("d2", "ana")]]]),
    reserveDelivery: vi.fn(async (userId, kind, date) => {
      const key = `${userId}:${kind}:${date}`;
      if (reserved.has(key)) return false;
      reserved.add(key);
      return true;
    }),
    deleteSubscription: vi.fn(async () => {}),
    markSubscriptionSuccess: vi.fn(async () => {}),
    ...overrides,
  };
  return store;
}

const sendAll = (result: PushResult = { status: "sent" }) => vi.fn(async () => result);

describe("dispatchReminders", () => {
  it("sends the due reminder to every device of the user and reserves it for today", async () => {
    const store = fakeStore();
    const sendPush = sendAll();
    const summary = await dispatchReminders({ now, store, sendPush });

    expect(summary).toEqual({ candidates: 1, remindersSent: 1, notificationsSent: 2, subscriptionsRemoved: 0, failures: 0 });
    expect(store.reserveDelivery).toHaveBeenCalledWith("ana", "closeout", "2026-10-01");
    expect(sendPush).toHaveBeenCalledWith(device("d1", "ana"), reminderMessages.closeout);
    expect(store.markSubscriptionSuccess).toHaveBeenCalledTimes(2);
  });

  it("does not send twice when the delivery was already reserved by another run", async () => {
    const store = fakeStore({ reserveDelivery: vi.fn(async () => false) });
    const sendPush = sendAll();
    const summary = await dispatchReminders({ now, store, sendPush });
    expect(sendPush).not.toHaveBeenCalled();
    expect(summary.remindersSent).toBe(0);
  });

  it("skips what is already done today or already delivered", async () => {
    const done = fakeStore({ usersWithCloseoutOn: async () => new Set(["ana"]) });
    expect((await dispatchReminders({ now, store: done, sendPush: sendAll() })).remindersSent).toBe(0);

    const delivered = fakeStore({ deliveriesOn: async () => new Map([["ana", ["closeout"] as ReminderKind[]]]) });
    expect((await dispatchReminders({ now, store: delivered, sendPush: sendAll() })).remindersSent).toBe(0);
  });

  it("does not use up the reminder when the user has no device", async () => {
    const store = fakeStore({ subscriptionsFor: async () => new Map() });
    await dispatchReminders({ now, store, sendPush: sendAll() });
    expect(store.reserveDelivery).not.toHaveBeenCalled();
  });

  it("removes subscriptions the browser dropped and counts failures", async () => {
    const results: PushResult[] = [{ status: "gone" }, { status: "failed", statusCode: 500, message: "x" }];
    const sendPush = vi.fn(async () => results.shift()!);
    const store = fakeStore();
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const summary = await dispatchReminders({ now, store, sendPush });
    errors.mockRestore();

    expect(store.deleteSubscription).toHaveBeenCalledWith("d1");
    expect(summary).toMatchObject({ remindersSent: 1, notificationsSent: 0, subscriptionsRemoved: 1, failures: 1 });
  });

  it("does not query per-user data when no window is open", async () => {
    const store = fakeStore({ usersWithSessionOn: vi.fn(async () => new Set<string>()) });
    const summary = await dispatchReminders({ now: new Date("2026-10-01T10:00:00-05:00"), store, sendPush: sendAll() });
    expect(summary.candidates).toBe(0);
    expect(store.usersWithSessionOn).not.toHaveBeenCalled();
  });
});
