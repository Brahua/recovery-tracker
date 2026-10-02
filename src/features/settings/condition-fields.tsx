"use client";

import { useId } from "react";

import {
  bodyZones,
  conditionDateLabel,
  conditionKinds,
  conditionKindLabels,
  conditionSideLabels,
  conditionSides,
  isSidedZone,
  zoneInfo,
} from "@/lib/condition";
import type { ConditionDraft } from "@/lib/condition-draft";
import { getRecoveryDateKey } from "@/lib/recovery-date";

interface ConditionFieldsProps {
  draft: ConditionDraft;
  onChange: (draft: ConditionDraft) => void;
  disabled?: boolean;
}

// Zone, side, what happened and since when: shared by Ajustes and the onboarding setup.
export function ConditionFields({ draft, onChange, disabled }: ConditionFieldsProps) {
  const zoneId = useId();
  const dateId = useId();
  const showSide = draft.zone !== "" && isSidedZone(draft.zone);

  return (
    <>
      <div className="rr-settings-form">
        <label htmlFor={zoneId}>¿Qué zona del cuerpo estás recuperando?</label>
        <select
          disabled={disabled}
          id={zoneId}
          onChange={(event) => {
            const zone = event.target.value as ConditionDraft["zone"];
            onChange({ ...draft, zone, side: zone !== "" && isSidedZone(zone) ? draft.side : "" });
          }}
          value={draft.zone}
        >
          <option value="">Elige una zona</option>
          {bodyZones.map((zone) => (
            <option key={zone} value={zone}>
              {zoneInfo[zone].label}
            </option>
          ))}
        </select>
      </div>

      {showSide ? (
        <fieldset className="rr-appearance-group" disabled={disabled}>
          <legend>¿Qué lado?</legend>
          <div className="rr-appearance-themes">
            {conditionSides.map((side) => (
              <label className="rr-appearance-theme" key={side}>
                <input
                  checked={draft.side === side}
                  name={`${zoneId}-side`}
                  onChange={() => onChange({ ...draft, side })}
                  type="radio"
                  value={side}
                />
                <span>{conditionSideLabels[side]}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      <fieldset className="rr-appearance-group" disabled={disabled}>
        <legend>¿Qué te pasó?</legend>
        <div className="rr-appearance-themes rr-condition-kinds">
          {conditionKinds.map((kind) => (
            <label className="rr-appearance-theme" key={kind}>
              <input
                checked={draft.kind === kind}
                name={`${zoneId}-kind`}
                onChange={() => onChange({ ...draft, kind })}
                type="radio"
                value={kind}
              />
              <span>{conditionKindLabels[kind]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="rr-settings-form">
        <label htmlFor={dateId}>
          {conditionDateLabel(draft.kind || "OTHER")} <span>(opcional)</span>
        </label>
        <input
          disabled={disabled}
          id={dateId}
          max={getRecoveryDateKey()}
          onChange={(event) => onChange({ ...draft, startedOn: event.target.value })}
          type="date"
          value={draft.startedOn}
        />
      </div>
    </>
  );
}
