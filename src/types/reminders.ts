export const reminderKinds = ["session", "closeout"] as const;
export type ReminderKind = (typeof reminderKinds)[number];

/** "HH:MM", 24-hour clock, in the user's time zone. */
export type ReminderTime = string;

export interface ReminderSettings {
  sessionEnabled: boolean;
  sessionTime: ReminderTime;
  closeoutEnabled: boolean;
  closeoutTime: ReminderTime;
  timeZone: string;
}

/** What the browser hands over after pushManager.subscribe() (PushSubscription.toJSON()). */
export interface PushSubscriptionInput {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export interface StoredPushSubscription extends PushSubscriptionInput {
  id: string;
  userId: string;
}
