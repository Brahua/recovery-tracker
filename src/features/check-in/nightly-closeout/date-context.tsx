"use client";

import { DateField } from "@/components/date-field";
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
  return (
    <section aria-label="Fecha del cierre" className="rr-closeout-date-context">
      <DateField
        defaultValue={selectedDate}
        display={dateLabel}
        key={selectedDate}
        label="Fecha del cierre"
        max={today}
        name="date"
        onChange={(event) => {
          if (event.target.value) onChange(event.target.value);
        }}
        required
        type="date"
      />
      {isPending ? <p role="status">Buscando registros de ese día…</p> : null}
      {hasCloseout ? (
        <p className="rr-closeout-date-warning" role="alert">
          {duplicateCloseoutDateMessage}
        </p>
      ) : null}
    </section>
  );
}
