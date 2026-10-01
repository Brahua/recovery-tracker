import { describe, expect, it } from "vitest";

import { mapPushSubscriptionRow, mapReminderSettingsRow } from "@/data/reminders-mappers";

describe("reminders mappers", () => {
  it("falls back to the defaults when the user has no settings row", () => {
    expect(mapReminderSettingsRow(null)).toEqual({
      sessionEnabled: false,
      sessionTime: "18:00",
      closeoutEnabled: true,
      closeoutTime: "21:30",
      timeZone: "America/Lima",
    });
  });

  it("maps a stored row and trims seconds from times", () => {
    expect(
      mapReminderSettingsRow({
        user_id: "u1",
        session_enabled: true,
        session_time: "07:15:00",
        closeout_enabled: false,
        closeout_time: "22:00:00",
        timezone: "America/Lima",
      }),
    ).toEqual({ sessionEnabled: true, sessionTime: "07:15", closeoutEnabled: false, closeoutTime: "22:00", timeZone: "America/Lima" });
  });

  it("maps a push subscription row to the web-push shape", () => {
    expect(mapPushSubscriptionRow({ id: "s1", user_id: "u1", endpoint: "https://e", p256dh: "p", auth: "a" })).toEqual({
      id: "s1",
      userId: "u1",
      endpoint: "https://e",
      keys: { p256dh: "p", auth: "a" },
    });
  });
});
