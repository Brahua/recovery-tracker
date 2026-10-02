export const authCallbackReasons = [
  "exchange_failed",
  "initiation_failed",
  "missing_code",
  "not_invited",
  "provider_rejected",
  "unknown",
] as const;

export type AuthCallbackReason = (typeof authCallbackReasons)[number];

const authCallbackCopy: Record<AuthCallbackReason, { title: string; description: string }> = {
  exchange_failed: {
    title: "No pudimos verificar el acceso.",
    description:
      "Inicia el acceso nuevamente desde la misma direccion y el mismo navegador. No cambies entre localhost, 127.0.0.1 o la IP de tu red.",
  },
  initiation_failed: {
    title: "Google no esta disponible ahora.",
    description:
      "Supabase no pudo iniciar el acceso con Google. Revisa la configuracion del proveedor e intenta nuevamente.",
  },
  missing_code: {
    title: "El acceso no se completo.",
    description:
      "No recibimos una respuesta valida del proveedor. Vuelve al inicio e intenta nuevamente.",
  },
  not_invited: {
    title: "Recovery Ritual está en acceso por invitación.",
    description:
      "Tu cuenta de Google no está en la lista de invitados. Si alguien te invitó, entra con el correo que le diste; si no, pídele una invitación a quien te compartió la app.",
  },
  provider_rejected: {
    title: "Google rechazo el acceso.",
    description:
      "Comprueba que tu cuenta este autorizada como usuario de prueba en Google OAuth y que las credenciales configuradas en Supabase sigan vigentes.",
  },
  unknown: {
    title: "No se pudo completar el login.",
    description:
      "Vuelve al inicio e intenta nuevamente. Si el problema continua, revisa los registros de Auth en Supabase.",
  },
};

export function normalizeAuthCallbackReason(reason: string | undefined): AuthCallbackReason {
  return authCallbackReasons.includes(reason as AuthCallbackReason)
    ? (reason as AuthCallbackReason)
    : "unknown";
}

export function getAuthCallbackErrorCopy(reason: AuthCallbackReason) {
  return authCallbackCopy[reason];
}

// Supabase Auth redirects to /auth/callback with ?error=…&error_description=… when sign-in fails.
// The before_user_created hook rejects uninvited emails with a 403 and the message "not_invited"
// (supabase/migrations/20261004000000_access_control.sql), which arrives as access_denied.
export function getProviderErrorReason(
  error: string | null,
  description: string | null,
): AuthCallbackReason {
  if (error === "access_denied" && description === "not_invited") return "not_invited";
  return "provider_rejected";
}
