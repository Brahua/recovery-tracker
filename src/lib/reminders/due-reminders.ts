import { localClock, minutesOfDay } from "@/lib/reminders/settings";
import { reminderKinds, type ReminderKind, type ReminderSettings } from "@/types/reminders";

/** A reminder that could not go out within two hours of its time is skipped for that day. */
export const DISPATCH_WINDOW_MINUTES = 120;

function isEnabled(settings: ReminderSettings, kind: ReminderKind) {
  return kind === "session" ? settings.sessionEnabled : settings.closeoutEnabled;
}

function timeOf(settings: ReminderSettings, kind: ReminderKind) {
  return kind === "session" ? settings.sessionTime : settings.closeoutTime;
}

/**
 * Kinds whose time has come today (local) and whose window is still open, before checking the
 * database. Lets the dispatcher only load data for users who might get a reminder now.
 */
export function openReminderWindows(now: Date, settings: ReminderSettings) {
  const { date, minutes } = localClock(now, settings.timeZone);
  const kinds = reminderKinds.filter((kind) => {
    if (!isEnabled(settings, kind)) return false;
    const start = minutesOfDay(timeOf(settings, kind));
    return minutes >= start && minutes < start + DISPATCH_WINDOW_MINUTES;
  });
  return { localDate: date, kinds };
}

export interface DueRemindersInput {
  now: Date;
  settings: ReminderSettings;
  /** True while today's session goal is not met and the week's goal is not met either. */
  sessionGoalPending: boolean;
  /** Today's morning check-in exists (the stored "closeout" kind reminds it). */
  hasCheckinToday: boolean;
  deliveredToday: readonly ReminderKind[];
}

/**
 * Reminders to send now: window open, still pending (session goal not met / no morning check-in) and
 * not sent yet today. A met week means a rest day is fine, so no session reminder.
 */
export function dueReminders({
  now,
  settings,
  sessionGoalPending,
  hasCheckinToday,
  deliveredToday,
}: DueRemindersInput) {
  const { localDate, kinds } = openReminderWindows(now, settings);
  return {
    localDate,
    kinds: kinds.filter((kind) => {
      if (deliveredToday.includes(kind)) return false;
      return kind === "session" ? sessionGoalPending : !hasCheckinToday;
    }),
  };
}
