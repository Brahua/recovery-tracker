import type { accessModes } from "@/lib/validation/access";

export type AccessMode = (typeof accessModes)[number];

export interface AccessInvite {
  email: string;
  note: string | null;
  createdAt: string;
  /** The email already has an account (signed in at least once). */
  joined: boolean;
}

export interface AccessOverview {
  mode: AccessMode;
  invites: AccessInvite[];
}

interface AccessInviteRow {
  email?: unknown;
  note?: unknown;
  created_at?: unknown;
  joined?: unknown;
}

// Maps the jsonb returned by admin_list_access(); unknown shapes fall back to the safe default.
export function mapAccessOverview(value: unknown): AccessOverview {
  const row = (value ?? {}) as { mode?: unknown; invites?: unknown };
  const invites = Array.isArray(row.invites) ? (row.invites as AccessInviteRow[]) : [];

  return {
    mode: row.mode === "open" ? "open" : "invite_only",
    invites: invites
      .filter((invite) => typeof invite.email === "string")
      .map((invite) => ({
        email: invite.email as string,
        note: typeof invite.note === "string" ? invite.note : null,
        createdAt: typeof invite.created_at === "string" ? invite.created_at : "",
        joined: invite.joined === true,
      })),
  };
}

export function isAppAdmin(user: { app_metadata?: Record<string, unknown> | null } | null) {
  return user?.app_metadata?.role === "admin";
}

// What the admin shares (WhatsApp, Messages…) after inviting someone.
export function buildInviteMessage(email: string, siteUrl: string) {
  return `Te invité a Recovery Ritual, la app para seguir tu rehabilitación. Entra con tu cuenta de Google (${email}) en ${siteUrl}`;
}
