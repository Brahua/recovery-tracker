import { z } from "zod";

import { recoveryTimeZone } from "@/lib/recovery-date";
import type { ReminderKind, ReminderSettings } from "@/types/reminders";

/** Starting point until the user saves their own (spec: session off at 18:00, closeout on at 21:30). */
export const defaultReminderSettings: ReminderSettings = {
  sessionEnabled: false,
  sessionTime: "18:00",
  closeoutEnabled: true,
  closeoutTime: "21:30",
  timeZone: recoveryTimeZone,
};

const timeSchema = z
  .string({ error: "Elige una hora." })
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Elige una hora válida (HH:MM).");

export const reminderSettingsInputSchema = z.object({
  sessionEnabled: z.boolean(),
  sessionTime: timeSchema,
  closeoutEnabled: z.boolean(),
  closeoutTime: timeSchema,
});

export type ReminderSettingsInput = z.infer<typeof reminderSettingsInputSchema>;

export const pushSubscriptionInputSchema = z.object({
  endpoint: z.string().url().startsWith("https://").max(2000),
  keys: z.object({
    p256dh: z.string().min(1).max(500),
    auth: z.string().min(1).max(500),
  }),
});

/** Postgres returns `time` as "HH:MM:SS"; the app works with "HH:MM". */
export function toReminderTime(value: string) {
  return value.slice(0, 5);
}

export function minutesOfDay(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/** Local calendar date ("YYYY-MM-DD") and minutes since local midnight for `now` in `timeZone`. */
export function localClock(now: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "00";
  return {
    date: `${part("year")}-${part("month")}-${part("day")}`,
    minutes: Number(part("hour")) * 60 + Number(part("minute")),
  };
}

export const reminderLabels: Record<ReminderKind, string> = {
  session: "Sesión del día",
  closeout: "Cierre nocturno",
};
