import { recoveryTimeZone } from "@/lib/recovery-date";
import type {
  FinalState,
  ReboundLevel,
  SessionType,
} from "@/types/recovery";

export const sessionTypeLabels: Record<SessionType, string> = {
  HOME: "En casa",
  PHYSIOTHERAPY: "Fisioterapia",
  HYDROTHERAPY: "Hidroterapia",
  GYM: "Gimnasio",
  WALK: "Caminata",
  OTHER: "Otra",
};

export const sessionTypeGlyphs: Record<SessionType, string> = {
  HOME: "CS",
  PHYSIOTHERAPY: "FS",
  HYDROTHERAPY: "HT",
  GYM: "GM",
  WALK: "CM",
  OTHER: "OT",
};

export const finalStateLabels: Record<FinalState, string> = {
  BETTER: "Mejor",
  SAME: "Igual",
  WORSE: "Peor",
};

export const reboundLabels: Record<ReboundLevel, string> = {
  NONE: "Sin rebote",
  MILD: "Leve",
  MODERATE: "Moderado",
  STRONG: "Fuerte",
};

const dayFormatter = new Intl.DateTimeFormat("es-PE", {
  day: "numeric",
  month: "long",
  weekday: "long",
  timeZone: recoveryTimeZone,
});

const rangeFormatter = new Intl.DateTimeFormat("es-PE", {
  day: "2-digit",
  month: "short",
  timeZone: recoveryTimeZone,
});

export const historyTimeFormatter = new Intl.DateTimeFormat("es-PE", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: recoveryTimeZone,
});

const decimalFormatter = new Intl.NumberFormat("es-ES", {
  maximumFractionDigits: 2,
});

function dateFromKey(date: string) {
  return new Date(`${date}T12:00:00.000Z`);
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatHistoryDay(date: string) {
  return capitalize(dayFormatter.format(dateFromKey(date)));
}

export function formatHistoryRange(from: string, to: string) {
  const format = (date: string) =>
    rangeFormatter.format(dateFromKey(date)).replaceAll(".", "").toUpperCase();

  return `${format(from)} — ${format(to)}`;
}

export function formatHistoryNumber(value: number) {
  return decimalFormatter.format(value);
}
