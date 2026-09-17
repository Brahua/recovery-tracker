export interface DisplayNameUser {
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

// Prefers the name saved on the Supabase account; falls back to the email's
// local part (up to the first ".", "_" or "-") when none is set.
export function getUserDisplayName(user?: DisplayNameUser | null) {
  const metadataName = user?.user_metadata?.full_name;

  if (typeof metadataName === "string" && metadataName.trim()) {
    return metadataName.trim().split(/\s+/)[0];
  }

  const localPart = user?.email?.trim().split("@")[0];
  if (!localPart) return null;

  const firstName = localPart.split(/[._-]/)[0] || localPart;
  return capitalize(firstName);
}
