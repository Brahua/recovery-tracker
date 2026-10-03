import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const refreshed = { name: "sb-session", value: "refreshed-token", options: { path: "/" } };
const noStore = { "Cache-Control": "private, no-cache, no-store, must-revalidate, max-age=0" };

vi.mock("@/lib/supabase/env", () => ({
  getSupabaseEnv: () => ({ url: "https://example.supabase.co", publishableKey: "key" }),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: (
    _url: string,
    _key: string,
    options: { cookies: { setAll: (c: unknown[], h: Record<string, string>) => void } },
  ) => ({
    auth: {
      // The access token was expired: getClaims refreshes it and hands the new cookies over.
      getClaims: async () => options.cookies.setAll([refreshed], noStore),
    },
  }),
}));

import { updateSession } from "@/lib/supabase/proxy";

describe("updateSession", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sends the refreshed session to the browser without letting it be cached", async () => {
    const response = await updateSession(
      new NextRequest("https://app.test/historial", { headers: { cookie: "sb-session=expired" } }),
    );

    expect(response.cookies.get("sb-session")?.value).toBe("refreshed-token");
    expect(response.headers.get("Cache-Control")).toBe(noStore["Cache-Control"]);
  });

  it("forwards the refreshed session to the page rendered in the same request", async () => {
    const response = await updateSession(
      new NextRequest("https://app.test/historial", { headers: { cookie: "sb-session=expired" } }),
    );

    expect(response.headers.get("x-middleware-request-cookie")).toContain(
      "sb-session=refreshed-token",
    );
  });
});
