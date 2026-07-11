import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseEnvOrThrow } from "@/lib/supabase/env";

export function createBrowserSupabaseClient() {
  const env = getSupabaseEnvOrThrow();

  return createBrowserClient(env.url, env.publishableKey);
}
