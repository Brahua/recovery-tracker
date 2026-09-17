export const unexpectedErrorMessage =
  "No pudimos conectar. Revisa tu conexión e inténtalo de nuevo.";

export type ActionOutcome =
  | { kind: "success" }
  | { kind: "invalid"; message: string }
  | { kind: "unexpected"; message: string };

interface ActionResultLike {
  ok?: boolean;
  error?: string | null;
}

// Validation-style failures stay inline next to the form; anything the action
// could not report itself (a thrown error) becomes a floating error toast.
export function resolveActionOutcome(
  result: ActionResultLike | undefined,
  fallbackError: string,
): ActionOutcome {
  if (result?.ok === false || (result?.ok === undefined && result?.error)) {
    return { kind: "invalid", message: result.error || fallbackError };
  }

  return { kind: "success" };
}

export function resolveThrownOutcome(
  error: unknown,
): Extract<ActionOutcome, { kind: "unexpected" }> {
  if (isNavigationSignal(error)) throw error;
  return { kind: "unexpected", message: unexpectedErrorMessage };
}

// Next.js implements redirect()/notFound() by throwing; those must propagate.
function isNavigationSignal(error: unknown) {
  const digest =
    typeof error === "object" && error !== null && "digest" in error
      ? (error as { digest?: unknown }).digest
      : undefined;
  return (
    typeof digest === "string" &&
    (digest.startsWith("NEXT_REDIRECT") || digest.startsWith("NEXT_HTTP_ERROR_FALLBACK"))
  );
}
