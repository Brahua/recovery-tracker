"use client";

import { DateField } from "@/components/date-field";
import { duplicateCloseoutDateMessage, splitCloseoutDateTime } from "@/lib/closeout-date";
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
  /** "HH:MM" in Lima time. */
  closedTime: string;
  dateLabel: string;
  hasCloseout: boolean;
  isPending: boolean;
  onChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  selectedDate: string;
  today: string;
}

// One picker for the day being closed and the hour it was closed ("Hoy · 22:30"). The form posts
// it as closedAt; the server splits it into date and closed_time.
export function CloseoutDateContext({
  closedTime,
  dateLabel,
  hasCloseout,
  isPending,
  onChange,
  onTimeChange,
  selectedDate,
  today,
}: CloseoutDateContextProps) {
  return (
    <section aria-label="Fecha del cierre" className="rr-closeout-date-context">
      <DateField
        defaultValue={`${selectedDate}T${closedTime}`}
        display={`${dateLabel} · ${closedTime}`}
        key={selectedDate}
        label="Fecha y hora del cierre"
        max={`${today}T23:59`}
        name="closedAt"
        onChange={(event) => {
          const { date, closedTime: time } = splitCloseoutDateTime(event.target.value);
          if (time) onTimeChange(time);
          if (date && date !== selectedDate) onChange(date);
        }}
        required
        type="datetime-local"
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
