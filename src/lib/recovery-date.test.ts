import { describe, expect, it } from "vitest";

import {
  addRecoveryDays,
  getRecoveryDateKey,
  getRecoveryWeekKeys,
} from "@/lib/recovery-date";

describe("recovery calendar dates", () => {
  it("keeps evening Lima activity on the local calendar day", () => {
    expect(getRecoveryDateKey("2026-07-17T00:30:00.000Z")).toBe("2026-07-16");
  });

  it("builds the local week from Monday through Sunday", () => {
    expect(getRecoveryWeekKeys("2026-07-17T00:30:00.000Z")).toEqual([
      "2026-07-13",
      "2026-07-14",
      "2026-07-15",
      "2026-07-16",
      "2026-07-17",
      "2026-07-18",
      "2026-07-19",
    ]);
  });

  it("moves between calendar keys without crossing through local timestamps", () => {
    expect(addRecoveryDays("2026-07-16", -1)).toBe("2026-07-15");
  });
});
