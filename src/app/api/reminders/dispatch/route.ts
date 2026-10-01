import { createDispatchStore } from "@/data/reminders-dispatch-store";
import { getPushSender } from "@/lib/push/server";
import { createDispatchHandler } from "@/lib/reminders/dispatch-handler";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

// Called every 5 minutes by Supabase pg_cron (public.dispatch_reminders) with the shared secret.
export async function POST(request: Request) {
  const handle = createDispatchHandler({
    secret: process.env.REMINDERS_DISPATCH_SECRET,
    getSender: getPushSender,
    getStore: () => {
      const client = createAdminSupabaseClient();
      return client ? createDispatchStore(client) : null;
    },
  });
  return handle(request);
}
