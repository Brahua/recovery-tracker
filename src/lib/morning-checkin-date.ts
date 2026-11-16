import { getRecoveryDateKey } from "@/lib/recovery-date";

// Dates of the morning check-in ("¿Cómo amaneciste?"): the day the patient woke up. One per day,
// never in the future.
export const futureMorningDateMessage = "No puedes registrar una mañana con fecha futura.";
export const duplicateMorningDateMessage =
  "Ese día ya tiene un registro de la mañana. Elige otra fecha.";
export const invalidMorningDateMessage = "Selecciona una fecha válida.";

export function getMorningCheckinDateError(date: string, today = getRecoveryDateKey()) {
  const parsedDate = new Date(`${date}T00:00:00.000Z`);
  const isValidDate =
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    !Number.isNaN(parsedDate.getTime()) &&
    parsedDate.toISOString().slice(0, 10) === date;

  if (!isValidDate) return invalidMorningDateMessage;
  return date > today ? futureMorningDateMessage : null;
}
