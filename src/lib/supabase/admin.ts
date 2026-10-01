import "server-only";

import { createClient } from "@supabase/supabase-js";

// service_role client: bypasses RLS. Only for the reminders dispatcher, never in code that reaches
// the browser. Null until SUPABASE_SERVICE_ROLE_KEY is set (Vercel Production, sensitive).
export function createAdminSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceRoleKey) return null;
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
