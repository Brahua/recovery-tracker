import {
  mapPushSubscriptionRow,
  mapReminderSettingsRow,
  pushSubscriptionColumns,
  reminderSettingsColumns,
  type PushSubscriptionRow,
  type ReminderSettingsRow,
} from "@/data/reminders-mappers";
import type { ReminderSettingsInput } from "@/lib/reminders/settings";
import { requireAuthenticatedSupabase } from "@/lib/supabase/authenticated";
import type { PushSubscriptionInput, ReminderSettings, StoredPushSubscription } from "@/types/reminders";

export class RemindersRepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RemindersRepositoryError";
  }
}

export interface RemindersRepository {
  getSettings(): Promise<ReminderSettings>;
  saveSettings(input: ReminderSettingsInput): Promise<void>;
  registerSubscription(subscription: PushSubscriptionInput, userAgent: string | null): Promise<void>;
  removeSubscription(endpoint: string): Promise<void>;
  removeSubscriptionById(id: string): Promise<void>;
  listSubscriptions(): Promise<StoredPushSubscription[]>;
}

// Signed-in user's reminder settings and devices. RLS limits every query to the owner.
export async function createRemindersRepository(): Promise<RemindersRepository> {
  const { supabase, userId } = await requireAuthenticatedSupabase();

  return {
    async getSettings() {
      const { data, error } = await supabase
        .from("reminder_settings")
        .select(reminderSettingsColumns)
        .eq("user_id", userId)
        .maybeSingle<ReminderSettingsRow>();
      if (error) throw new RemindersRepositoryError(error.message);
      return mapReminderSettingsRow(data);
    },

    async saveSettings(input) {
      const { error } = await supabase.from("reminder_settings").upsert(
        {
          user_id: userId,
          session_enabled: input.sessionEnabled,
          session_time: input.sessionTime,
          closeout_enabled: input.closeoutEnabled,
          closeout_time: input.closeoutTime,
        },
        { onConflict: "user_id" },
      );
      if (error) throw new RemindersRepositoryError(error.message);
    },

    async registerSubscription(subscription, userAgent) {
      const { error } = await supabase.rpc("register_push_subscription", {
        subscription_endpoint: subscription.endpoint,
        subscription_p256dh: subscription.keys.p256dh,
        subscription_auth: subscription.keys.auth,
        subscription_user_agent: userAgent,
      });
      if (error) throw new RemindersRepositoryError(error.message);
    },

    async removeSubscription(endpoint) {
      const { error } = await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
      if (error) throw new RemindersRepositoryError(error.message);
    },

    async removeSubscriptionById(id) {
      const { error } = await supabase.from("push_subscriptions").delete().eq("id", id);
      if (error) throw new RemindersRepositoryError(error.message);
    },

    async listSubscriptions() {
      const { data, error } = await supabase
        .from("push_subscriptions")
        .select(pushSubscriptionColumns)
        .eq("user_id", userId)
        .returns<PushSubscriptionRow[]>();
      if (error) throw new RemindersRepositoryError(error.message);
      return (data ?? []).map(mapPushSubscriptionRow);
    },
  };
}
