import { describe, expect, it } from "vitest";

import {
  defaultSessionGoal,
  formatSessionGoal,
  parseSessionGoal,
  sessionGoalFromMetadata,
} from "@/lib/session-goal";
import { sessionGoalSchema } from "@/lib/validation/session-goal";

describe("parseSessionGoal", () => {
  it("reads a valid goal", () => {
    expect(parseSessionGoal({ perDay: 2, daysPerWeek: 5 })).toEqual({ perDay: 2, daysPerWeek: 5 });
  });

  it("falls back to 1 session, every day when missing", () => {
    expect(parseSessionGoal(undefined)).toEqual(defaultSessionGoal);
    expect(parseSessionGoal(null)).toEqual({ perDay: 1, daysPerWeek: 7 });
    expect(sessionGoalFromMetadata({})).toEqual(defaultSessionGoal);
    expect(sessionGoalFromMetadata(null)).toEqual(defaultSessionGoal);
  });

  it("replaces each invalid part with its default", () => {
    expect(parseSessionGoal({ perDay: 0, daysPerWeek: 5 })).toEqual({ perDay: 1, daysPerWeek: 5 });
    expect(parseSessionGoal({ perDay: 3, daysPerWeek: 8 })).toEqual({ perDay: 3, daysPerWeek: 7 });
    expect(parseSessionGoal({ perDay: "2", daysPerWeek: 2.5 })).toEqual(defaultSessionGoal);
    expect(parseSessionGoal("2x5")).toEqual(defaultSessionGoal);
  });

  it("reads it from user_metadata.session_goal", () => {
    expect(sessionGoalFromMetadata({ session_goal: { perDay: 2, daysPerWeek: 3 } })).toEqual({
      perDay: 2,
      daysPerWeek: 3,
    });
  });
});

describe("formatSessionGoal", () => {
  it("words the goal in Spanish", () => {
    expect(formatSessionGoal({ perDay: 1, daysPerWeek: 7 })).toBe(
      "1 sesión al día, todos los días",
    );
    expect(formatSessionGoal({ perDay: 2, daysPerWeek: 5 })).toBe(
      "2 sesiones al día, 5 días a la semana",
    );
    expect(formatSessionGoal({ perDay: 1, daysPerWeek: 1 })).toBe(
      "1 sesión al día, 1 día a la semana",
    );
  });
});

describe("sessionGoalSchema", () => {
  it("accepts 1–5 sessions and 1–7 days", () => {
    expect(sessionGoalSchema.parse({ perDay: 5, daysPerWeek: 1 })).toEqual({
      perDay: 5,
      daysPerWeek: 1,
    });
  });

  it("rejects values out of range or not whole", () => {
    expect(sessionGoalSchema.safeParse({ perDay: 6, daysPerWeek: 5 }).success).toBe(false);
    expect(sessionGoalSchema.safeParse({ perDay: 2, daysPerWeek: 0 }).success).toBe(false);
    expect(sessionGoalSchema.safeParse({ perDay: 1.5, daysPerWeek: 5 }).success).toBe(false);
    expect(sessionGoalSchema.safeParse({ perDay: "2", daysPerWeek: 5 }).success).toBe(false);
  });
});
