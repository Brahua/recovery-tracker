import { describe, expect, it } from "vitest";

import {
  countValidTreatments,
  createTreatmentDraft,
  findRepeatedTreatmentIds,
  formatTreatment,
  getTreatmentDraftError,
  isModalityInCategory,
  toTreatmentPayload,
  treatmentCatalog,
  treatmentLabel,
  treatmentTakesMinutes,
  type TreatmentDraft,
} from "@/lib/treatments";
import { treatmentModalities } from "@/types/recovery";

function draft(id: string, overrides: Partial<TreatmentDraft> = {}): TreatmentDraft {
  return { ...createTreatmentDraft(id, "PHYSICAL_AGENT", "TECAR"), ...overrides };
}

describe("treatment catalog", () => {
  it("lists every code except OTHER exactly once", () => {
    const codes = treatmentCatalog.flatMap((group) =>
      group.options.map((option) => option.modality),
    );

    expect(new Set(codes).size).toBe(codes.length);
    expect([...codes, "OTHER"].sort()).toEqual([...treatmentModalities].sort());
  });

  it("knows the category of each code and accepts OTHER anywhere", () => {
    expect(isModalityInCategory("SHOCKWAVE", "PHYSICAL_AGENT")).toBe(true);
    expect(isModalityInCategory("SHOCKWAVE", "TAPING")).toBe(false);
    expect(isModalityInCategory("OTHER", "INVASIVE")).toBe(true);
  });

  it("does not ask minutes for taping or infiltrations", () => {
    expect(treatmentTakesMinutes("KINESIO_TAPE")).toBe(false);
    expect(treatmentTakesMinutes("INFILTRATION")).toBe(false);
    expect(treatmentTakesMinutes("LASER")).toBe(true);
    expect(treatmentTakesMinutes("OTHER")).toBe(true);
  });
});

describe("treatment drafts", () => {
  it("accepts a treatment without zone or minutes", () => {
    expect(getTreatmentDraftError(draft("a"))).toBeNull();
  });

  it("requires a name for OTHER", () => {
    expect(getTreatmentDraftError(draft("a", { modality: "OTHER" }))).toBe(
      "Escribe qué tratamiento fue.",
    );
    expect(
      getTreatmentDraftError(draft("a", { modality: "OTHER", customName: "Indiba" })),
    ).toBeNull();
  });

  it("rejects minutes outside 1 to 120 or with decimals", () => {
    expect(getTreatmentDraftError(draft("a", { durationMinutes: "0" }))).not.toBeNull();
    expect(getTreatmentDraftError(draft("a", { durationMinutes: "121" }))).not.toBeNull();
    expect(getTreatmentDraftError(draft("a", { durationMinutes: "7.5" }))).not.toBeNull();
    expect(getTreatmentDraftError(draft("a", { durationMinutes: "10" }))).toBeNull();
  });

  it("ignores minutes typed for a treatment that does not take them", () => {
    const taping = draft("a", {
      category: "TAPING",
      modality: "KINESIO_TAPE",
      durationMinutes: "999",
    });

    expect(getTreatmentDraftError(taping)).toBeNull();
    expect(toTreatmentPayload([taping])[0].durationMinutes).toBeUndefined();
  });

  it("flags a repeated OTHER name, ignoring case", () => {
    const drafts = [
      draft("a", { modality: "OTHER", customName: "Indiba" }),
      draft("b", { category: "MANUAL_THERAPY", modality: "OTHER", customName: "indiba " }),
      draft("c", { modality: "OTHER", customName: "Vibración" }),
    ];

    expect(findRepeatedTreatmentIds(drafts)).toEqual(new Set(["b"]));
    expect(countValidTreatments(drafts)).toBe(2);
  });

  it("builds the payload in order, trimming text and dropping blanks", () => {
    expect(
      toTreatmentPayload([
        draft("a", { bodyZone: "  Rodilla anterior ", durationMinutes: "10" }),
        draft("b", {
          category: "INVASIVE",
          modality: "OTHER",
          customName: " Indiba ",
          bodyZone: " ",
        }),
      ]),
    ).toEqual([
      {
        category: "PHYSICAL_AGENT",
        modality: "TECAR",
        customName: undefined,
        bodyZone: "Rodilla anterior",
        durationMinutes: 10,
      },
      {
        category: "INVASIVE",
        modality: "OTHER",
        customName: "Indiba",
        bodyZone: undefined,
        durationMinutes: undefined,
      },
    ]);
  });
});

describe("treatment formatting", () => {
  it("joins label, zone and minutes", () => {
    expect(
      formatTreatment({
        category: "PHYSICAL_AGENT",
        modality: "LASER",
        bodyZone: "Tendón rotuliano",
        durationMinutes: 5,
      }),
    ).toBe("Láser · Tendón rotuliano · 5 min");
    expect(formatTreatment({ category: "TAPING", modality: "KINESIO_TAPE" })).toBe("Kinesiotape");
  });

  it("uses the custom name for OTHER", () => {
    expect(treatmentLabel({ modality: "OTHER", customName: "Indiba" })).toBe("Indiba");
  });
});
