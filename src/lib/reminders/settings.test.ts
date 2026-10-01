import { describe, expect, it } from "vitest";

import {
  defaultReminderSettings,
  localClock,
  minutesOfDay,
  pushSubscriptionInputSchema,
  reminderSettingsInputSchema,
  toReminderTime,
} from "@/lib/reminders/settings";

describe("reminder settings", () => {
  it("defaults to the closeout reminder at 21:30 and the session one off at 18:00", () => {
    expect(defaultReminderSettings).toMatchObject({
      sessionEnabled: false,
      sessionTime: "18:00",
      closeoutEnabled: true,
      closeoutTime: "21:30",
      timeZone: "America/Lima",
    });
  });

  it("accepts HH:MM times and rejects anything else", () => {
    const valid = {
      sessionEnabled: true,
      sessionTime: "07:05",
      closeoutEnabled: false,
      closeoutTime: "23:59",
    };
    expect(reminderSettingsInputSchema.safeParse(valid).success).toBe(true);
    for (const time of ["24:00", "7:05", "12:60", "", "noon"]) {
      expect(
        reminderSettingsInputSchema.safeParse({ ...valid, sessionTime: time }).success,
        time,
      ).toBe(false);
    }
  });

  it("only accepts https push endpoints with keys", () => {
    const sub = { endpoint: "https://web.push.apple.com/abc", keys: { p256dh: "k", auth: "a" } };
    expect(pushSubscriptionInputSchema.safeParse(sub).success).toBe(true);
    expect(
      pushSubscriptionInputSchema.safeParse({ ...sub, endpoint: "http://x.test/abc" }).success,
    ).toBe(false);
    expect(
      pushSubscriptionInputSchema.safeParse({
        endpoint: sub.endpoint,
        keys: { p256dh: "", auth: "a" },
      }).success,
    ).toBe(false);
  });
});

describe("time helpers", () => {
  it("trims Postgres seconds and converts to minutes", () => {
    expect(toReminderTime("21:30:00")).toBe("21:30");
    expect(minutesOfDay("21:30")).toBe(21 * 60 + 30);
  });

  it("reads the local date and minutes in Lima (UTC-5, no DST)", () => {
    // 2026-10-02 02:10 UTC is still 2026-10-01 21:10 in Lima.
    expect(localClock(new Date("2026-10-02T02:10:00Z"), "America/Lima")).toEqual({
      date: "2026-10-01",
      minutes: 21 * 60 + 10,
    });
    expect(localClock(new Date("2026-10-02T05:00:00Z"), "America/Lima")).toEqual({
      date: "2026-10-02",
      minutes: 0,
    });
  });
});
