import { describe, expect, it } from "vitest";

import nextConfig, { SECURITY_HEADERS } from "../../next.config";

describe("security headers", () => {
  it("applies every security header to all routes", async () => {
    const rules = await nextConfig.headers!();

    expect(rules).toEqual([{ source: "/:path*", headers: SECURITY_HEADERS }]);
  });

  it("forbids framing and MIME sniffing", () => {
    const byKey = Object.fromEntries(SECURITY_HEADERS.map(({ key, value }) => [key, value]));

    expect(byKey["Content-Security-Policy"]).toBe("frame-ancestors 'none'");
    expect(byKey["X-Frame-Options"]).toBe("DENY");
    expect(byKey["X-Content-Type-Options"]).toBe("nosniff");
    expect(byKey["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
  });

  it("does not advertise the framework", () => {
    expect(nextConfig.poweredByHeader).toBe(false);
  });
});
