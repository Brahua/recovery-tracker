import { describe, expect, it } from "vitest";

import { parseExercisePayload } from "@/features/check-in/post-therapy/exercise-payload";

describe("parseExercisePayload", () => {
  it("accepts a valid nested exercise payload", () => {
    const result = parseExercisePayload(
      JSON.stringify([
        {
          name: "Step-up",
          shortcutId: "STEP_UP",
          sets: [
            { position: 0, reps: 12, weightKg: 10 },
            { position: 1, reps: 10, weightKg: 12.5 },
          ],
        },
      ]),
    );

    expect(result[0]?.sets[1]).toEqual({
      position: 1,
      reps: 10,
      weightKg: 12.5,
    });
  });

  it("rejects malformed JSON without exposing parser internals", () => {
    expect(() => parseExercisePayload("{not-json")).toThrow(
      "Los ejercicios enviados no son validos.",
    );
  });

  it("rejects an empty exercise collection", () => {
    expect(() => parseExercisePayload("[]")).toThrow(
      "Los ejercicios enviados no son validos.",
    );
  });

  it("rejects invalid nested numeric values", () => {
    expect(() =>
      parseExercisePayload(
        JSON.stringify([
          {
            name: "TKE",
            sets: [{ position: 0, reps: "abc" }],
          },
        ]),
      ),
    ).toThrow("Los ejercicios enviados no son validos.");
  });
});
