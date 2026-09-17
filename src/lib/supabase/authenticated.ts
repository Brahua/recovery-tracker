import { createServerSupabaseClient } from "@/lib/supabase/server";

export const authenticationRequiredMessage = "Authenticated user is required.";

export class AuthenticationRequiredError extends Error {
  constructor() {
    super(authenticationRequiredMessage);
    this.name = "AuthenticationRequiredError";
  }
}

export type ServerSupabaseClient = Awaited<ReturnType<typeof createServerSupabaseClient>>;

export async function requireAuthenticatedSupabase() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new AuthenticationRequiredError();
  }

  return { supabase, userId: user.id };
}
