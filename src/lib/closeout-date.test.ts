import { describe, expect, it } from "vitest";

import {
  futureCloseoutDateMessage,
  getCloseoutDateError,
  invalidCloseoutDateMessage,
} from "@/lib/closeout-date";

describe("getCloseoutDateError", () => {
  it("rejects a closeout dated after today", () => {
    expect(getCloseoutDateError("2026-07-18", "2026-07-17")).toBe(
      futureCloseoutDateMessage,
    );
  });

  it("accepts today and earlier dates", () => {
    expect(getCloseoutDateError("2026-07-17", "2026-07-17")).toBeNull();
    expect(getCloseoutDateError("2026-07-16", "2026-07-17")).toBeNull();
  });

  it("rejects malformed and impossible calendar dates before querying", () => {
    expect(getCloseoutDateError("not-a-date", "2026-07-17")).toBe(
      invalidCloseoutDateMessage,
    );
    expect(getCloseoutDateError("2026-02-30", "2026-07-17")).toBe(
      invalidCloseoutDateMessage,
    );
  });
});
