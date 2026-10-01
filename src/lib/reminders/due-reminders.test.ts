import { describe, expect, it } from "vitest";

import {
  DISPATCH_WINDOW_MINUTES,
  dueReminders,
  openReminderWindows,
} from "@/lib/reminders/due-reminders";
import { defaultReminderSettings } from "@/lib/reminders/settings";
import type { ReminderSettings } from "@/types/reminders";

const settings: ReminderSettings = {
  ...defaultReminderSettings,
  sessionEnabled: true,
  sessionTime: "18:00",
  closeoutEnabled: true,
  closeoutTime: "21:30",
};

/** Lima is UTC-5 all year. */
const lima = (date: string, time: string) => new Date(`${date}T${time}:00-05:00`);

const pending = { hasSessionToday: false, hasCloseoutToday: false, deliveredToday: [] as const };

describe("dueReminders", () => {
  it("sends nothing before the chosen time", () => {
    // 21:29: the closeout time has not come and the session window (18:00–20:00) already closed.
    expect(dueReminders({ now: lima("2026-10-01", "21:29"), settings, ...pending }).kinds).toEqual(
      [],
    );
    expect(dueReminders({ now: lima("2026-10-01", "17:59"), settings, ...pending }).kinds).toEqual(
      [],
    );
  });

  it("sends exactly at the chosen time and during the next two hours", () => {
    expect(dueReminders({ now: lima("2026-10-01", "21:30"), settings, ...pending }).kinds).toEqual([
      "closeout",
    ]);
    expect(dueReminders({ now: lima("2026-10-01", "23:29"), settings, ...pending }).kinds).toEqual([
      "closeout",
    ]);
  });

  it("skips a reminder that is more than two hours late", () => {
    expect(DISPATCH_WINDOW_MINUTES).toBe(120);
    expect(dueReminders({ now: lima("2026-10-01", "20:00"), settings, ...pending }).kinds).toEqual(
      [],
    );
  });

  it("only reminds what is still pending today", () => {
    const now = lima("2026-10-01", "21:35");
    const closeoutAt = { ...settings, sessionTime: "21:00" };
    expect(dueReminders({ now, settings: closeoutAt, ...pending }).kinds).toEqual([
      "session",
      "closeout",
    ]);
    expect(
      dueReminders({ now, settings: closeoutAt, ...pending, hasSessionToday: true }).kinds,
    ).toEqual(["closeout"]);
    expect(
      dueReminders({ now, settings: closeoutAt, ...pending, hasCloseoutToday: true }).kinds,
    ).toEqual(["session"]);
  });

  it("sends each reminder once per day", () => {
    expect(
      dueReminders({
        now: lima("2026-10-01", "21:40"),
        settings,
        ...pending,
        deliveredToday: ["closeout"],
      }).kinds,
    ).toEqual([]);
  });

  it("respects switched-off reminders", () => {
    const off = { ...settings, closeoutEnabled: false };
    expect(
      dueReminders({ now: lima("2026-10-01", "21:40"), settings: off, ...pending }).kinds,
    ).toEqual([]);
  });

  it("uses the Lima calendar day, not UTC", () => {
    // 02:40 UTC on Oct 2 is still Oct 1, 21:40 in Lima.
    const result = dueReminders({ now: new Date("2026-10-02T02:40:00Z"), settings, ...pending });
    expect(result).toEqual({ localDate: "2026-10-01", kinds: ["closeout"] });
  });

  it("does not carry a late-night window past midnight", () => {
    const lateNight = { ...settings, sessionEnabled: false, closeoutTime: "23:30" };
    expect(
      dueReminders({ now: lima("2026-10-01", "23:55"), settings: lateNight, ...pending }).kinds,
    ).toEqual(["closeout"]);
    expect(
      dueReminders({ now: lima("2026-10-02", "00:10"), settings: lateNight, ...pending }).kinds,
    ).toEqual([]);
  });
});

describe("openReminderWindows", () => {
  it("lists open windows without looking at the database", () => {
    expect(openReminderWindows(lima("2026-10-01", "18:05"), settings)).toEqual({
      localDate: "2026-10-01",
      kinds: ["session"],
    });
  });
});
