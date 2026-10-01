import type { SupabaseClient } from "@supabase/supabase-js";

import {
  mapPushSubscriptionRow,
  mapReminderSettingsRow,
  pushSubscriptionColumns,
  reminderSettingsColumns,
  type PushSubscriptionRow,
  type ReminderSettingsRow,
} from "@/data/reminders-mappers";
import { getRecoveryUtcRange } from "@/lib/recovery-date";
import type { DispatchStore } from "@/lib/reminders/dispatch";
import type { ReminderKind, StoredPushSubscription } from "@/types/reminders";

function check<T>({ data, error }: { data: T | null; error: { message: string } | null }): T {
  if (error) throw new Error(error.message);
  return data as T;
}

// DispatchStore over a service_role client (no RLS): one batched query per kind of data.
export function createDispatchStore(client: SupabaseClient): DispatchStore {
  return {
    async listActiveSettings() {
      const rows = check(
        await client
          .from("reminder_settings")
          .select(reminderSettingsColumns)
          .or("session_enabled.eq.true,closeout_enabled.eq.true")
          .returns<ReminderSettingsRow[]>(),
      );
      return (rows ?? []).map((row) => ({
        userId: row.user_id,
        settings: mapReminderSettingsRow(row),
      }));
    },

    async usersWithSessionOn(userIds, localDate) {
      const { fromInclusive, toExclusive } = getRecoveryUtcRange(localDate, localDate);
      const rows = check(
        await client
          .from("rehab_sessions")
          .select("user_id")
          .in("user_id", userIds)
          .gte("occurred_at", fromInclusive)
          .lt("occurred_at", toExclusive)
          .returns<Array<{ user_id: string }>>(),
      );
      return new Set((rows ?? []).map((row) => row.user_id));
    },

    async usersWithCloseoutOn(userIds, localDate) {
      const rows = check(
        await client
          .from("nightly_closeouts")
          .select("user_id")
          .in("user_id", userIds)
          .eq("date", localDate)
          .returns<Array<{ user_id: string }>>(),
      );
      return new Set((rows ?? []).map((row) => row.user_id));
    },

    async deliveriesOn(userIds, localDate) {
      const rows = check(
        await client
          .from("reminder_deliveries")
          .select("user_id, kind")
          .in("user_id", userIds)
          .eq("local_date", localDate)
          .returns<Array<{ user_id: string; kind: ReminderKind }>>(),
      );
      const byUser = new Map<string, ReminderKind[]>();
      for (const row of rows ?? [])
        byUser.set(row.user_id, [...(byUser.get(row.user_id) ?? []), row.kind]);
      return byUser;
    },

    async subscriptionsFor(userIds) {
      const rows = check(
        await client
          .from("push_subscriptions")
          .select(pushSubscriptionColumns)
          .in("user_id", userIds)
          .returns<PushSubscriptionRow[]>(),
      );
      const byUser = new Map<string, StoredPushSubscription[]>();
      for (const row of rows ?? []) {
        byUser.set(row.user_id, [...(byUser.get(row.user_id) ?? []), mapPushSubscriptionRow(row)]);
      }
      return byUser;
    },

    async reserveDelivery(userId, kind, localDate) {
      const rows = check(
        await client
          .from("reminder_deliveries")
          .upsert(
            { user_id: userId, kind, local_date: localDate },
            { onConflict: "user_id,kind,local_date", ignoreDuplicates: true },
          )
          .select("user_id")
          .returns<Array<{ user_id: string }>>(),
      );
      return (rows ?? []).length > 0;
    },

    async deleteSubscription(id) {
      check(await client.from("push_subscriptions").delete().eq("id", id));
    },

    async markSubscriptionSuccess(id) {
      check(
        await client
          .from("push_subscriptions")
          .update({ last_success_at: new Date().toISOString() })
          .eq("id", id),
      );
    },
  };
}
