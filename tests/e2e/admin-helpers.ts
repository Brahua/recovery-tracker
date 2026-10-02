import { execFileSync } from "node:child_process";

import type { BrowserContext } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

import { e2eTargetRefusal } from "../../scripts/db-target.mjs";

// Service-role access to the local Supabase only (playwright.config.ts already refuses any other
// target), read from `supabase status` so the key never lands in an env file the app reads.
function localAdminClient() {
  const status = execFileSync("npx", ["supabase", "status", "--output", "env"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  const env = new Map(
    status
      .split("\n")
      .map((line) => line.trim().match(/^([A-Z_]+)=(.*)$/))
      .filter((match): match is RegExpMatchArray => match !== null)
      .map(([, key, value]) => [key, value.replace(/^"|"$/g, "")]),
  );
  const url = env.get("API_URL");
  const serviceRoleKey = env.get("SERVICE_ROLE_KEY");
  const refusal = e2eTargetRefusal(url);
  if (refusal || !url || !serviceRoleKey) {
    throw new Error(
      refusal ?? "Local Supabase status did not include API_URL and SERVICE_ROLE_KEY.",
    );
  }
  return createClient(url, serviceRoleKey, { auth: { persistSession: false } });
}

// The signed-in user's id, from the @supabase/ssr session cookie ("base64-" + JSON, maybe chunked).
async function currentUserId(context: BrowserContext) {
  const chunks = (await context.cookies())
    .filter((cookie) => /^sb-.+-auth-token(\.\d+)?$/.test(cookie.name))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
    .map((cookie) => cookie.value);
  const raw = chunks.join("");
  const json = raw.startsWith("base64-")
    ? Buffer.from(raw.slice("base64-".length), "base64url").toString("utf8")
    : decodeURIComponent(raw);
  const id = (JSON.parse(json) as { user?: { id?: string } }).user?.id;
  if (!id) throw new Error("No Supabase session cookie in this browser context.");
  return id;
}

// Grants or revokes app_metadata.role = "admin" for the E2E user (Ajustes → Acceso, ADR-005).
export async function setCurrentUserAdmin(context: BrowserContext, admin: boolean) {
  const client = localAdminClient();
  const id = await currentUserId(context);
  const { error } = await client.auth.admin.updateUserById(id, {
    app_metadata: { role: admin ? "admin" : null },
  });
  if (error) throw error;
}
