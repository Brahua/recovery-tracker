import { mapAccessOverview, type AccessMode, type AccessOverview } from "@/lib/access";
import { requireAuthenticatedSupabase } from "@/lib/supabase/authenticated";

export class AccessDeniedError extends Error {
  constructor() {
    super("Only the admin can manage access.");
    this.name = "AccessDeniedError";
  }
}

export class AccessRepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AccessRepositoryError";
  }
}

export interface AccessRepository {
  getOverview(): Promise<AccessOverview>;
  /** Resolves false when the email was already invited. */
  invite(email: string): Promise<boolean>;
  /** Resolves false when the email was not in the list. */
  remove(email: string): Promise<boolean>;
  setMode(mode: AccessMode): Promise<void>;
}

function toError(error: { code?: string; message: string }) {
  return error.code === "42501"
    ? new AccessDeniedError()
    : new AccessRepositoryError(error.message);
}

// Invite list and access mode (ADR-005). Every function checks the admin role in the database.
export async function createAccessRepository(): Promise<AccessRepository> {
  const { supabase } = await requireAuthenticatedSupabase();

  return {
    async getOverview() {
      const { data, error } = await supabase.rpc("admin_list_access");
      if (error) throw toError(error);
      return mapAccessOverview(data);
    },

    async invite(email) {
      const { data, error } = await supabase.rpc("admin_invite_email", { p_email: email });
      if (error) throw toError(error);
      return data === true;
    },

    async remove(email) {
      const { data, error } = await supabase.rpc("admin_remove_email", { p_email: email });
      if (error) throw toError(error);
      return data === true;
    },

    async setMode(mode) {
      const { error } = await supabase.rpc("admin_set_access_mode", { p_mode: mode });
      if (error) throw toError(error);
    },
  };
}
