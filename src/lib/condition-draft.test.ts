import { describe, expect, it } from "vitest";

import {
  conditionInputFromDraft,
  draftFromCondition,
  emptyConditionDraft,
  isConditionDraftEmpty,
} from "@/lib/condition-draft";
import { conditionSchema } from "@/lib/validation/condition";

describe("condition draft", () => {
  it("starts empty and fills from a saved condition", () => {
    expect(isConditionDraftEmpty(emptyConditionDraft)).toBe(true);
    const draft = draftFromCondition({ zone: "KNEE", side: "LEFT", kind: "SURGERY" });
    expect(draft).toEqual({ zone: "KNEE", side: "LEFT", kind: "SURGERY", startedOn: "" });
    expect(isConditionDraftEmpty(draft)).toBe(false);
    expect(draftFromCondition(null)).toEqual(emptyConditionDraft);
  });

  it("a half-filled draft fails validation with a message for the missing field", () => {
    const result = conditionSchema.safeParse(
      conditionInputFromDraft({ ...emptyConditionDraft, kind: "INJURY" }),
    );
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Elige la zona del cuerpo.");
  });

  it("a filled draft passes validation", () => {
    const result = conditionSchema.safeParse(
      conditionInputFromDraft({
        zone: "HIP",
        side: "RIGHT",
        kind: "SURGERY",
        startedOn: "2026-08-01",
      }),
    );
    expect(result.success).toBe(true);
  });
});
