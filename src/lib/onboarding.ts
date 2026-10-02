// First-run onboarding (docs/specs/access-onboarding-personalization-spec.md): a new account goes
// to /bienvenida until user_metadata.onboarding_completed_at is set (finishing or skipping).

export const ONBOARDING_PATH = "/bienvenida";
/** /bienvenida?recorrido=1 replays the tour from Ajustes, without the setup step. */
export const ONBOARDING_REPLAY_PATH = `${ONBOARDING_PATH}?recorrido=1`;

export function hasCompletedOnboarding(metadata?: Record<string, unknown> | null) {
  const completedAt = metadata?.onboarding_completed_at;
  return typeof completedAt === "string" && completedAt.length > 0;
}
