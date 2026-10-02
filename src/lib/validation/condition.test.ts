import { describe, expect, it } from "vitest";

import { conditionSchema, parseCondition } from "@/lib/validation/condition";

describe("conditionSchema", () => {
  it("accepts a full condition", () => {
    expect(
      conditionSchema.parse({
        zone: "KNEE",
        side: "RIGHT",
        kind: "SURGERY",
        startedOn: "2026-07-10",
      }),
    ).toEqual({ zone: "KNEE", side: "RIGHT", kind: "SURGERY", startedOn: "2026-07-10" });
  });

  it("treats an empty side and date as not given", () => {
    expect(
      conditionSchema.parse({ zone: "KNEE", side: null, kind: "INJURY", startedOn: "" }),
    ).toEqual({ zone: "KNEE", kind: "INJURY" });
  });

  it("drops the side of a zone that has none", () => {
    expect(conditionSchema.parse({ zone: "NECK", side: "LEFT", kind: "CHRONIC" })).toEqual({
      zone: "NECK",
      kind: "CHRONIC",
    });
  });

  it("rejects an unknown zone, kind or a future date", () => {
    expect(conditionSchema.safeParse({ zone: "HEAD", kind: "INJURY" }).success).toBe(false);
    expect(conditionSchema.safeParse({ zone: "KNEE", kind: "WHATEVER" }).success).toBe(false);
    expect(
      conditionSchema.safeParse({ zone: "KNEE", kind: "SURGERY", startedOn: "2999-01-01" }).success,
    ).toBe(false);
  });
});

describe("parseCondition", () => {
  it("reads a stored condition", () => {
    expect(parseCondition({ zone: "SHOULDER", side: "LEFT", kind: "INJURY" })).toEqual({
      zone: "SHOULDER",
      side: "LEFT",
      kind: "INJURY",
    });
  });

  it("ignores anything invalid, as if there were no condition", () => {
    expect(parseCondition(undefined)).toBeNull();
    expect(parseCondition(null)).toBeNull();
    expect(parseCondition("rodilla")).toBeNull();
    expect(parseCondition({ zone: "<script>", kind: "INJURY" })).toBeNull();
  });
});
