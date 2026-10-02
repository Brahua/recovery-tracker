import { describe, expect, it } from "vitest";

import {
  conditionAreaPhrase,
  conditionSummary,
  conditionWeek,
  isValidStartedOn,
  treatmentZoneSuggestionsFor,
  type Condition,
} from "@/lib/condition";

const today = "2026-10-02";

describe("conditionAreaPhrase", () => {
  it("returns nothing without a condition or for 'Otra zona'", () => {
    expect(conditionAreaPhrase(null)).toBeUndefined();
    expect(conditionAreaPhrase({ zone: "OTHER", kind: "OTHER" })).toBeUndefined();
  });

  it("agrees the side with the gender of the zone", () => {
    expect(conditionAreaPhrase({ zone: "KNEE", side: "RIGHT", kind: "SURGERY" })).toBe(
      "tu rodilla derecha",
    );
    expect(conditionAreaPhrase({ zone: "SHOULDER", side: "LEFT", kind: "INJURY" })).toBe(
      "tu hombro izquierdo",
    );
    expect(conditionAreaPhrase({ zone: "WRIST_HAND", side: "LEFT", kind: "INJURY" })).toBe(
      "tu muñeca y mano izquierda",
    );
  });

  it("uses the plural for both sides and no side when there is none", () => {
    expect(conditionAreaPhrase({ zone: "KNEE", side: "BOTH", kind: "CHRONIC" })).toBe(
      "tus rodillas",
    );
    expect(conditionAreaPhrase({ zone: "NECK", kind: "CHRONIC" })).toBe("tu cuello");
    expect(conditionAreaPhrase({ zone: "KNEE", kind: "SURGERY" })).toBe("tu rodilla");
  });
});

describe("conditionWeek", () => {
  const knee: Condition = { zone: "KNEE", kind: "SURGERY", startedOn: "2026-07-10" };

  it("counts the first week as week 1", () => {
    expect(conditionWeek({ ...knee, startedOn: today }, today)).toBe(1);
    expect(conditionWeek({ ...knee, startedOn: "2026-09-26" }, today)).toBe(1);
    expect(conditionWeek({ ...knee, startedOn: "2026-09-25" }, today)).toBe(2);
  });

  it("is undefined without a date or with a future one", () => {
    expect(conditionWeek({ zone: "KNEE", kind: "SURGERY" }, today)).toBeUndefined();
    expect(conditionWeek({ ...knee, startedOn: "2026-10-03" }, today)).toBeUndefined();
  });
});

describe("conditionSummary", () => {
  it("shows the zone and the week since the start", () => {
    expect(
      conditionSummary(
        { zone: "KNEE", side: "RIGHT", kind: "SURGERY", startedOn: "2026-07-10" },
        today,
      ),
    ).toBe("Rodilla derecha · semana 13 desde la operación");
  });

  it("falls back to the kind when there is no date", () => {
    expect(conditionSummary({ zone: "LOWER_BACK", kind: "CHRONIC" }, today)).toBe(
      "Zona lumbar · dolor que viene de tiempo",
    );
  });

  it("does not invent a zone for 'Otra zona'", () => {
    expect(conditionSummary({ zone: "OTHER", kind: "INJURY" }, today)).toBe("Lesión o golpe");
    expect(conditionSummary(null, today)).toBeUndefined();
  });
});

describe("treatmentZoneSuggestionsFor", () => {
  it("suggests the zones of the condition", () => {
    expect(treatmentZoneSuggestionsFor({ zone: "KNEE", kind: "SURGERY" })).toContain(
      "Tendón rotuliano",
    );
    expect(treatmentZoneSuggestionsFor({ zone: "SHOULDER", kind: "INJURY" })).toContain(
      "Manguito rotador",
    );
  });

  it("uses a generic list without a condition or for 'Otra zona'", () => {
    expect(treatmentZoneSuggestionsFor(null)).toContain("Zona lumbar");
    expect(treatmentZoneSuggestionsFor({ zone: "OTHER", kind: "OTHER" })).toContain("Zona lumbar");
  });
});

describe("isValidStartedOn", () => {
  it("accepts a real past day and today", () => {
    expect(isValidStartedOn("2026-07-10", today)).toBe(true);
    expect(isValidStartedOn(today, today)).toBe(true);
  });

  it("rejects future, impossible, malformed and ancient dates", () => {
    expect(isValidStartedOn("2026-10-03", today)).toBe(false);
    expect(isValidStartedOn("2026-02-30", today)).toBe(false);
    expect(isValidStartedOn("2026-13-45", today)).toBe(false);
    expect(isValidStartedOn("10/07/2026", today)).toBe(false);
    expect(isValidStartedOn("1900-01-01", today)).toBe(false);
  });
});
