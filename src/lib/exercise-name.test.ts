import { describe, expect, it } from "vitest";

import {
  findExerciseByName,
  matchExercises,
  normalizeExerciseName,
  selectMostUsedExercises,
} from "@/lib/exercise-name";

function exercise(name: string, overrides: { sessionCount?: number; archivedAt?: string } = {}) {
  return {
    id: name,
    name,
    sessionCount: overrides.sessionCount ?? 0,
    archivedAt: overrides.archivedAt,
  };
}

describe("normalizeExerciseName", () => {
  it("ignores case, accents, ñ and repeated whitespace", () => {
    expect(normalizeExerciseName("  Puente de   Glúteos ")).toBe("puente de gluteos");
    expect(normalizeExerciseName("Sentadilla ESPAÑOLA")).toBe("sentadilla espanola");
    expect(normalizeExerciseName("Propiocepción\tbásica")).toBe("propiocepcion basica");
  });
});

describe("matchExercises", () => {
  const catalog = [
    exercise("Puente de gluteos"),
    exercise("Gluteo medio con banda"),
    exercise("Step-up"),
    exercise("Glute kickback", { archivedAt: "2026-09-01T00:00:00.000Z" }),
  ];

  it("lists prefix matches before contains matches and skips archived exercises", () => {
    expect(matchExercises(catalog, "GLÚ").map((item) => item.name)).toEqual([
      "Gluteo medio con banda",
      "Puente de gluteos",
    ]);
  });

  it("returns nothing for an empty query and respects exclusions and limit", () => {
    expect(matchExercises(catalog, "  ")).toEqual([]);
    expect(
      matchExercises(catalog, "glu", { excludeIds: ["Puente de gluteos"] }).map((item) => item.name),
    ).toEqual(["Gluteo medio con banda"]);
    expect(matchExercises(catalog, "e", { limit: 1 })).toHaveLength(1);
  });
});

describe("findExerciseByName", () => {
  it("finds an exact match regardless of case and accents", () => {
    expect(findExerciseByName([exercise("Wall sit")], "wall  SIT")?.name).toBe("Wall sit");
    expect(findExerciseByName([exercise("Wall sit")], "wall")).toBeUndefined();
  });
});

describe("selectMostUsedExercises", () => {
  it("orders active exercises by usage and fills ties alphabetically", () => {
    const result = selectMostUsedExercises(
      [
        exercise("Step-up", { sessionCount: 2 }),
        exercise("Bicicleta", { sessionCount: 0 }),
        exercise("Wall sit", { sessionCount: 5 }),
        exercise("Archivado", { sessionCount: 9, archivedAt: "2026-09-01T00:00:00.000Z" }),
        exercise("Abducción", { sessionCount: 0 }),
      ],
      4,
    );

    expect(result.map((item) => item.name)).toEqual([
      "Wall sit",
      "Step-up",
      "Abducción",
      "Bicicleta",
    ]);
  });
});
