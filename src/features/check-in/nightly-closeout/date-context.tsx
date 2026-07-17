"use client";

import { useState } from "react";

import { duplicateCloseoutDateMessage } from "@/lib/closeout-date";
import { addRecoveryDays, recoveryTimeZone } from "@/lib/recovery-date";

export function formatCloseoutDateLabel(value: string, today: string) {
  if (value === today) return "Hoy";
  if (value === addRecoveryDays(today, -1)) return "Ayer";

  const date = new Date(`${value}T12:00:00-05:00`);
  return new Intl.DateTimeFormat("es-PE", {
    day: "numeric",
    month: "long",
    timeZone: recoveryTimeZone,
    weekday: "long",
  }).format(date);
}

interface CloseoutDateContextProps {
  dateLabel: string;
  hasCloseout: boolean;
  isPending: boolean;
  onChange: (date: string) => void;
  selectedDate: string;
  today: string;
}

export function CloseoutDateContext({
  dateLabel,
  hasCloseout,
  isPending,
  onChange,
  selectedDate,
  today,
}: CloseoutDateContextProps) {
  const [showDate, setShowDate] = useState(false);

  return (
    <section aria-label="Fecha del cierre" className="rr-closeout-date-context">
      <button
        aria-expanded={showDate}
        className="rr-context-time"
        onClick={() => setShowDate((visible) => !visible)}
        type="button"
      >
        <span>{dateLabel}</span>
        <small>{showDate ? "cerrar" : "cambiar"}</small>
      </button>
      {showDate ? (
        <label className="rr-date-control">
          <span>Fecha del cierre</span>
          <input
            defaultValue={selectedDate}
            key={selectedDate}
            max={today}
            name="date"
            onChange={(event) => onChange(event.target.value)}
            required
            type="date"
          />
        </label>
      ) : (
        <input name="date" type="hidden" value={selectedDate} />
      )}
      {isPending ? <p role="status">Buscando registros de ese día…</p> : null}
      {hasCloseout ? (
        <p className="rr-closeout-date-warning" role="alert">
          {duplicateCloseoutDateMessage}
        </p>
      ) : null}
    </section>
  );
}
