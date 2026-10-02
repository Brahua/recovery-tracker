import { getRecoveryDateKey } from "@/lib/recovery-date";

export const futureCloseoutDateMessage = "No puedes registrar un cierre con una fecha futura.";
export const duplicateCloseoutDateMessage =
  "Ese día ya tiene un cierre registrado. Elige otra fecha.";
export const invalidCloseoutDateMessage = "Selecciona una fecha válida para el cierre.";

const closeoutTimePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

// The closeout picker sends "YYYY-MM-DDTHH:MM" (Lima): the date is the day being closed and the
// time the hour it was closed. A missing or malformed time leaves closedTime undefined.
export function splitCloseoutDateTime(value: string) {
  const [date = "", time = ""] = value.split("T");
  return { date, closedTime: closeoutTimePattern.test(time) ? time : undefined };
}

export function getCloseoutDateError(date: string, today = getRecoveryDateKey()) {
  const parsedDate = new Date(`${date}T00:00:00.000Z`);
  const isValidDate =
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    !Number.isNaN(parsedDate.getTime()) &&
    parsedDate.toISOString().slice(0, 10) === date;

  if (!isValidDate) return invalidCloseoutDateMessage;
  return date > today ? futureCloseoutDateMessage : null;
}
