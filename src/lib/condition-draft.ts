import type { BodyZone, Condition, ConditionKind, ConditionSide } from "@/lib/condition";

// The condition form while it is being filled: nothing is chosen yet, so every field can be empty.
export interface ConditionDraft {
  zone: BodyZone | "";
  side: ConditionSide | "";
  kind: ConditionKind | "";
  startedOn: string;
}

export const emptyConditionDraft: ConditionDraft = {
  zone: "",
  side: "",
  kind: "",
  startedOn: "",
};

export function draftFromCondition(condition: Condition | null | undefined): ConditionDraft {
  if (!condition) return { ...emptyConditionDraft };
  return {
    zone: condition.zone,
    side: condition.side ?? "",
    kind: condition.kind,
    startedOn: condition.startedOn ?? "",
  };
}

export function isConditionDraftEmpty(draft: ConditionDraft) {
  return !draft.zone && !draft.side && !draft.kind && !draft.startedOn;
}

/** What the server validates (conditionSchema): empty choices are sent as missing. */
export function conditionInputFromDraft(draft: ConditionDraft) {
  return {
    zone: draft.zone || undefined,
    side: draft.side || null,
    kind: draft.kind || undefined,
    startedOn: draft.startedOn || null,
  };
}
