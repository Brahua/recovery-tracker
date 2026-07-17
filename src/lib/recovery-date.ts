export const recoveryTimeZone = "America/Lima";

const recoveryDateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "2-digit",
  month: "2-digit",
  timeZone: recoveryTimeZone,
  year: "numeric",
});

export function getRecoveryDateKey(value: Date | string = new Date()) {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date = value instanceof Date ? value : new Date(value);
  const parts = recoveryDateFormatter.formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value;

  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function addRecoveryDays(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function getRecoveryUtcRange(from: string, to: string) {
  return {
    fromInclusive: `${from}T05:00:00.000Z`,
    toExclusive: `${addRecoveryDays(to, 1)}T05:00:00.000Z`,
  };
}

export function getRecoveryWeekKeys(value: Date | string = new Date()) {
  const today = getRecoveryDateKey(value);
  const anchor = new Date(`${today}T00:00:00.000Z`);
  const daysSinceMonday = (anchor.getUTCDay() + 6) % 7;
  const monday = addRecoveryDays(today, -daysSinceMonday);

  return Array.from({ length: 7 }, (_, index) => addRecoveryDays(monday, index));
}
