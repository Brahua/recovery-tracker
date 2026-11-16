"use client";

import { useId } from "react";

import {
  formatDaysPerWeek,
  formatSessionsPerDay,
  sessionGoalDaysOptions,
  sessionGoalPerDayOptions,
  type SessionGoal,
} from "@/lib/session-goal";

interface SessionGoalFieldsProps {
  goal: SessionGoal;
  onChange: (goal: SessionGoal) => void;
  disabled?: boolean;
}

// Sessions per day and days per week: shared by Ajustes and the onboarding setup.
export function SessionGoalFields({ goal, onChange, disabled }: SessionGoalFieldsProps) {
  const perDayId = useId();
  const daysId = useId();

  return (
    <>
      <div className="rr-settings-form">
        <label htmlFor={perDayId}>¿Cuántas sesiones al día?</label>
        <select
          disabled={disabled}
          id={perDayId}
          onChange={(event) => onChange({ ...goal, perDay: Number(event.target.value) })}
          value={goal.perDay}
        >
          {sessionGoalPerDayOptions.map((value) => (
            <option key={value} value={value}>
              {formatSessionsPerDay(value)}
            </option>
          ))}
        </select>
      </div>
      <div className="rr-settings-form">
        <label htmlFor={daysId}>¿Cuántos días a la semana?</label>
        <select
          disabled={disabled}
          id={daysId}
          onChange={(event) => onChange({ ...goal, daysPerWeek: Number(event.target.value) })}
          value={goal.daysPerWeek}
        >
          {sessionGoalDaysOptions.map((value) => (
            <option key={value} value={value}>
              {formatDaysPerWeek(value)}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
