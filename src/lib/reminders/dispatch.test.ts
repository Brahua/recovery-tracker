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
    sessionsInWeekOf: async () => new Map(),
    sessionGoalsFor: vi.fn(async () => new Map()),
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

    expect(summary).toEqual({
      candidates: 1,
      remindersSent: 1,
      notificationsSent: 2,
      subscriptionsRemoved: 0,
      failures: 0,
    });
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
    expect((await dispatchReminders({ now, store: done, sendPush: sendAll() })).remindersSent).toBe(
      0,
    );

    const delivered = fakeStore({
      deliveriesOn: async () => new Map([["ana", ["closeout"] as ReminderKind[]]]),
    });
    expect(
      (await dispatchReminders({ now, store: delivered, sendPush: sendAll() })).remindersSent,
    ).toBe(0);
  });

  it("does not use up the reminder when the user has no device", async () => {
    const store = fakeStore({ subscriptionsFor: async () => new Map() });
    await dispatchReminders({ now, store, sendPush: sendAll() });
    expect(store.reserveDelivery).not.toHaveBeenCalled();
  });

  it("removes subscriptions the browser dropped and counts failures", async () => {
    const results: PushResult[] = [
      { status: "gone" },
      { status: "failed", statusCode: 500, message: "x" },
    ];
    const sendPush = vi.fn(async () => results.shift()!);
    const store = fakeStore();
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const summary = await dispatchReminders({ now, store, sendPush });
    errors.mockRestore();

    expect(store.deleteSubscription).toHaveBeenCalledWith("d1");
    expect(summary).toMatchObject({
      remindersSent: 1,
      notificationsSent: 0,
      subscriptionsRemoved: 1,
      failures: 1,
    });
  });

  it("does not query per-user data when no window is open", async () => {
    const store = fakeStore({ sessionsInWeekOf: vi.fn(async () => new Map()) });
    const summary = await dispatchReminders({
      now: new Date("2026-10-01T10:00:00-05:00"),
      store,
      sendPush: sendAll(),
    });
    expect(summary.candidates).toBe(0);
    expect(store.sessionsInWeekOf).not.toHaveBeenCalled();
  });

  describe("session reminder and the session goal", () => {
    // 2026-10-01 is a Thursday; ana has the session reminder at 21:00 and the closeout off.
    const sessionAt = {
      listActiveSettings: async () => [
        {
          userId: "ana",
          settings: {
            ...defaultReminderSettings,
            sessionEnabled: true,
            sessionTime: "21:00",
            closeoutEnabled: false,
          },
        },
      ],
    };
    const at = (date: string) => ({ occurredAt: `${date}T15:00:00.000Z` });

    it("reminds while today's sessions are below the goal", async () => {
      const store = fakeStore({
        ...sessionAt,
        sessionsInWeekOf: async () => new Map([["ana", [at("2026-10-01")]]]),
        sessionGoalsFor: vi.fn(async () => new Map([["ana", { perDay: 2, daysPerWeek: 5 }]])),
      });
      const sendPush = sendAll();
      expect((await dispatchReminders({ now, store, sendPush })).remindersSent).toBe(1);
      expect(sendPush).toHaveBeenCalledWith(device("d1", "ana"), reminderMessages.session);
      expect(store.sessionGoalsFor).toHaveBeenCalledWith(["ana"]);
    });

    it("does not remind once today's goal is met", async () => {
      const store = fakeStore({
        ...sessionAt,
        sessionsInWeekOf: async () => new Map([["ana", [at("2026-10-01")]]]),
      });
      expect((await dispatchReminders({ now, store, sendPush: sendAll() })).remindersSent).toBe(0);
    });

    it("does not remind on a rest day once the week is met", async () => {
      const store = fakeStore({
        ...sessionAt,
        // Monday to Wednesday of that week.
        sessionsInWeekOf: async () =>
          new Map([["ana", [at("2026-09-28"), at("2026-09-29"), at("2026-09-30")]]]),
        sessionGoalsFor: vi.fn(async () => new Map([["ana", { perDay: 1, daysPerWeek: 3 }]])),
      });
      expect((await dispatchReminders({ now, store, sendPush: sendAll() })).remindersSent).toBe(0);
    });

    it("only reads goals for users with a device and an open session window", async () => {
      const store = fakeStore();
      await dispatchReminders({ now, store, sendPush: sendAll() });
      expect(store.sessionGoalsFor).not.toHaveBeenCalled();
    });
  });
});
