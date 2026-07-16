export const authCallbackReasons = [
  "exchange_failed",
  "initiation_failed",
  "missing_code",
  "provider_rejected",
  "unknown",
] as const;

export type AuthCallbackReason = (typeof authCallbackReasons)[number];

const authCallbackCopy: Record<
  AuthCallbackReason,
  { title: string; description: string }
> = {
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

export function normalizeAuthCallbackReason(
  reason: string | undefined,
): AuthCallbackReason {
  return authCallbackReasons.includes(reason as AuthCallbackReason)
    ? (reason as AuthCallbackReason)
    : "unknown";
}

export function getAuthCallbackErrorCopy(reason: AuthCallbackReason) {
  return authCallbackCopy[reason];
}
