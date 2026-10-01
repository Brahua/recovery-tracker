// Shared guards that keep scripts and tests away from the production Supabase project.
// Plain ESM so it runs under `node` without a build step; covered by scripts/db-target.test.mjs.

/** Hosted Supabase project that holds real data (formerly "staging"; see ADR-004). */
export const PRODUCTION_PROJECT_REF = "pevrupenrzueyzidfeah";

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "[::1]", "::1", "host.docker.internal"]);

/** True when the Supabase URL points at the local CLI stack (Docker), never a hosted project. */
export function isLocalSupabaseUrl(url) {
  if (!url) return false;
  try {
    return LOCAL_HOSTNAMES.has(new URL(url).hostname);
  } catch {
    return false;
  }
}

/**
 * Writing to a linked remote project needs an explicit ALLOW_PROD_DB=1.
 * Returns an error message when the write must be refused, or null when it may proceed.
 */
export function remoteWriteRefusal(linkedRef, env) {
  if (!linkedRef) {
    return "No Supabase project is linked. Run `npm run supabase:link` first.";
  }
  if (env.ALLOW_PROD_DB === "1") {
    return null;
  }
  const label = linkedRef === PRODUCTION_PROJECT_REF ? "the PRODUCTION project" : "a hosted project";
  return [
    `Refusing to write to ${label} (${linkedRef}).`,
    "Migrations reach production through CI after every check passes (docs/deployment.md).",
    "If you really mean it, re-run with ALLOW_PROD_DB=1.",
  ].join("\n");
}

/** Refusal message for E2E runs whose Supabase URL is not local, or null when safe. */
export function e2eTargetRefusal(supabaseUrl) {
  if (isLocalSupabaseUrl(supabaseUrl)) {
    return null;
  }
  return [
    `E2E must run against local Supabase, but NEXT_PUBLIC_SUPABASE_URL is ${supabaseUrl || "unset"}.`,
    "Start it with `npm run supabase:start` and point the app at it (see docs/setup/playwright-auth.md).",
  ].join("\n");
}
