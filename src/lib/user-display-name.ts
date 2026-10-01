export interface DisplayNameUser {
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

// The name the user chose in Ajustes (user_metadata.display_name), as typed.
export function getChosenDisplayName(user?: DisplayNameUser | null) {
  const chosen = user?.user_metadata?.display_name;
  return typeof chosen === "string" && chosen.trim() ? chosen.trim() : null;
}

// Prefers the name chosen in Ajustes; then the first word of the Google name (full_name, which
// Google may rewrite on every sign-in); then the email's local part (up to the first ".", "_" or
// "-").
export function getUserDisplayName(user?: DisplayNameUser | null) {
  const chosen = getChosenDisplayName(user);
  if (chosen) return chosen;

  const metadataName = user?.user_metadata?.full_name;

  if (typeof metadataName === "string" && metadataName.trim()) {
    return metadataName.trim().split(/\s+/)[0];
  }

  const localPart = user?.email?.trim().split("@")[0];
  if (!localPart) return null;

  const firstName = localPart.split(/[._-]/)[0] || localPart;
  return capitalize(firstName);
}
