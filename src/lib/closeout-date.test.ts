import { describe, expect, it } from "vitest";

import {
  futureCloseoutDateMessage,
  getCloseoutDateError,
  splitCloseoutDateTime,
  invalidCloseoutDateMessage,
} from "@/lib/closeout-date";

describe("getCloseoutDateError", () => {
  it("rejects a closeout dated after today", () => {
    expect(getCloseoutDateError("2026-07-18", "2026-07-17")).toBe(futureCloseoutDateMessage);
  });

  it("accepts today and earlier dates", () => {
    expect(getCloseoutDateError("2026-07-17", "2026-07-17")).toBeNull();
    expect(getCloseoutDateError("2026-07-16", "2026-07-17")).toBeNull();
  });

  it("rejects malformed and impossible calendar dates before querying", () => {
    expect(getCloseoutDateError("not-a-date", "2026-07-17")).toBe(invalidCloseoutDateMessage);
    expect(getCloseoutDateError("2026-02-30", "2026-07-17")).toBe(invalidCloseoutDateMessage);
  });
});

describe("splitCloseoutDateTime", () => {
  it("splits the picker value into the day being closed and the hour", () => {
    expect(splitCloseoutDateTime("2026-10-01T00:32")).toEqual({
      date: "2026-10-01",
      closedTime: "00:32",
    });
  });

  it("leaves the time out when it is missing or malformed", () => {
    expect(splitCloseoutDateTime("2026-10-01")).toEqual({
      date: "2026-10-01",
      closedTime: undefined,
    });
    expect(splitCloseoutDateTime("2026-10-01T25:00")).toEqual({
      date: "2026-10-01",
      closedTime: undefined,
    });
    expect(splitCloseoutDateTime("")).toEqual({ date: "", closedTime: undefined });
  });
});
