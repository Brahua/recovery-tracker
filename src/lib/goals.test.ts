import { describe, expect, it } from "vitest";

import { canAddGoal, maxPendingGoals, splitGoals } from "@/lib/goals";
import { goalTitleSchema } from "@/lib/validation/goals";
import type { RecoveryGoal } from "@/types/goals";

function goal(id: string, createdAt: string, achievedAt?: string): RecoveryGoal {
  return { id, title: `Meta ${id}`, createdAt, achievedAt };
}

describe("splitGoals", () => {
  it("keeps pending goals in writing order and achieved ones newest first", () => {
    const { pending, achieved } = splitGoals([
      goal("b", "2026-10-02T10:00:00Z"),
      goal("c", "2026-10-01T10:00:00Z", "2026-10-03T10:00:00Z"),
      goal("a", "2026-10-01T09:00:00Z"),
      goal("d", "2026-09-30T10:00:00Z", "2026-10-04T10:00:00Z"),
    ]);

    expect(pending.map((item) => item.id)).toEqual(["a", "b"]);
    expect(achieved.map((item) => item.id)).toEqual(["d", "c"]);
  });
});

describe("canAddGoal", () => {
  it("stops at the pending limit", () => {
    expect(canAddGoal(maxPendingGoals - 1)).toBe(true);
    expect(canAddGoal(maxPendingGoals)).toBe(false);
  });
});

describe("goalTitleSchema", () => {
  it("trims and collapses spaces", () => {
    expect(goalTitleSchema.parse("  subir   escaleras sin dolor ")).toBe(
      "subir escaleras sin dolor",
    );
  });

  it("rejects short, long and control-character titles", () => {
    expect(goalTitleSchema.safeParse("ab").success).toBe(false);
    expect(goalTitleSchema.safeParse("a".repeat(81)).success).toBe(false);
    expect(goalTitleSchema.safeParse("hola\u0007mundo").success).toBe(false);
    expect(goalTitleSchema.safeParse(42).success).toBe(false);
  });
});
