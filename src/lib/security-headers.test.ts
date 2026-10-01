import { describe, expect, it } from "vitest";

import nextConfig, { SECURITY_HEADERS, SERVICE_WORKER_HEADERS } from "../../next.config";

describe("security headers", () => {
  it("applies every security header to all routes", async () => {
    const rules = await nextConfig.headers!();

    expect(rules[0]).toEqual({ source: "/:path*", headers: SECURITY_HEADERS });
  });

  it("forbids framing and MIME sniffing", () => {
    const byKey = Object.fromEntries(SECURITY_HEADERS.map(({ key, value }) => [key, value]));

    expect(byKey["Content-Security-Policy"]).toBe("frame-ancestors 'none'");
    expect(byKey["X-Frame-Options"]).toBe("DENY");
    expect(byKey["X-Content-Type-Options"]).toBe("nosniff");
    expect(byKey["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
  });

  it("never serves the service worker from cache and keeps it same-origin", async () => {
    const rules = await nextConfig.headers!();
    expect(rules.at(-1)).toEqual({ source: "/sw.js", headers: SERVICE_WORKER_HEADERS });
    const byKey = Object.fromEntries(SERVICE_WORKER_HEADERS.map(({ key, value }) => [key, value]));
    expect(byKey["Cache-Control"]).toContain("no-store");
    expect(byKey["Content-Security-Policy"]).toContain("script-src 'self'");
  });

  it("does not advertise the framework", () => {
    expect(nextConfig.poweredByHeader).toBe(false);
  });
});
