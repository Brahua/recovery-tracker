export interface SupabaseEnv {
  url: string;
  publishableKey: string;
}

function cleanEnvValue(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function getSupabaseEnv(): SupabaseEnv | null {
  const url = cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const publishableKey = cleanEnvValue(
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );

  if (!url || !publishableKey) {
    return null;
  }

  return {
    url,
    publishableKey,
  };
}

export function getSupabaseEnvOrThrow(): SupabaseEnv {
  const env = getSupabaseEnv();

  if (!env) {
    throw new Error(
      "Missing Supabase env. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  return env;
}
