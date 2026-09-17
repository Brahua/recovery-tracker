import { describe, expect, it } from "vitest";

import { exerciseInputSchema } from "@/lib/validation/exercises";

describe("exerciseInputSchema", () => {
  it("accepts form drafts and converts numeric strings", () => {
    expect(
      exerciseInputSchema.parse({
        name: "  Wall sit ",
        defaultIsometric: true,
        defaultSetCount: "3",
        defaultHoldSeconds: "45",
        defaultWeightKg: "",
        defaultDurationMinutes: null,
      }),
    ).toEqual({
      name: "Wall sit",
      defaultIsometric: true,
      defaultSetCount: 3,
      defaultHoldSeconds: 45,
    });
  });

  it("drops hold seconds when the exercise is not isometric by default", () => {
    expect(
      exerciseInputSchema.parse({ name: "Step-up", defaultReps: 12, defaultHoldSeconds: 30 })
        .defaultHoldSeconds,
    ).toBeUndefined();
  });

  it("rejects empty names, long names and out-of-range defaults", () => {
    expect(exerciseInputSchema.safeParse({ name: "  " }).success).toBe(false);
    expect(exerciseInputSchema.safeParse({ name: "x".repeat(81) }).success).toBe(false);
    expect(exerciseInputSchema.safeParse({ name: "Step-up", defaultSetCount: 21 }).success).toBe(false);
    expect(exerciseInputSchema.safeParse({ name: "Step-up", defaultReps: "abc" }).success).toBe(false);
  });
});
