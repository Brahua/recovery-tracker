import { describe, expect, it } from "vitest";

import {
  addRecoveryDays,
  getRecoveryDateKey,
  getRecoveryUtcRange,
  getRecoveryWeekKeys,
  parseRecoveryDateTimeLocal,
  toRecoveryDateTimeLocal,
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

  it("builds UTC query bounds that include the full Lima evening", () => {
    const range = getRecoveryUtcRange("2026-07-16", "2026-07-16");
    const eveningSession = new Date("2026-07-17T00:47:00.000Z").getTime();

    expect(range).toEqual({
      fromInclusive: "2026-07-16T05:00:00.000Z",
      toExclusive: "2026-07-17T05:00:00.000Z",
    });
    expect(eveningSession).toBeGreaterThanOrEqual(
      new Date(range.fromInclusive).getTime(),
    );
    expect(eveningSession).toBeLessThan(new Date(range.toExclusive).getTime());
  });
});

describe("Lima datetime-local values", () => {
  it("formats a timestamp in Lima time", () => {
    expect(toRecoveryDateTimeLocal("2026-10-02T01:30:00.000Z")).toBe("2026-10-01T20:30");
    expect(toRecoveryDateTimeLocal(new Date("2026-10-01T05:00:00.000Z"))).toBe("2026-10-01T00:00");
  });

  it("reads a datetime-local value as Lima time", () => {
    expect(parseRecoveryDateTimeLocal("2026-10-01T20:30")).toBe("2026-10-02T01:30:00.000Z");
    expect(parseRecoveryDateTimeLocal("2026-10-01T00:15:30")).toBe("2026-10-01T05:15:30.000Z");
  });

  it("round-trips without drifting", () => {
    const saved = "2026-09-29T23:45:00.000Z";
    expect(parseRecoveryDateTimeLocal(toRecoveryDateTimeLocal(saved))).toBe(saved);
  });

  it("rejects malformed values", () => {
    expect(parseRecoveryDateTimeLocal("")).toBeNull();
    expect(parseRecoveryDateTimeLocal("2026-10-01")).toBeNull();
    expect(parseRecoveryDateTimeLocal("2026-13-45T25:00")).toBeNull();
  });
});
