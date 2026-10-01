import { defaultReminderSettings, toReminderTime } from "@/lib/reminders/settings";
import type { ReminderSettings, StoredPushSubscription } from "@/types/reminders";

export const reminderSettingsColumns =
  "user_id, session_enabled, session_time, closeout_enabled, closeout_time, timezone";

export interface ReminderSettingsRow {
  user_id: string;
  session_enabled: boolean;
  session_time: string;
  closeout_enabled: boolean;
  closeout_time: string;
  timezone: string;
}

export const pushSubscriptionColumns = "id, user_id, endpoint, p256dh, auth";

export interface PushSubscriptionRow {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

/** A user without a saved row gets the defaults. */
export function mapReminderSettingsRow(row: ReminderSettingsRow | null | undefined): ReminderSettings {
  if (!row) return { ...defaultReminderSettings };
  return {
    sessionEnabled: row.session_enabled,
    sessionTime: toReminderTime(row.session_time),
    closeoutEnabled: row.closeout_enabled,
    closeoutTime: toReminderTime(row.closeout_time),
    timeZone: row.timezone,
  };
}

export function mapPushSubscriptionRow(row: PushSubscriptionRow): StoredPushSubscription {
  return { id: row.id, userId: row.user_id, endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } };
}
