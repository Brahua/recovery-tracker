import type { NextConfig } from "next";

/** Applied to every route, pages and route handlers alike. */
export const SECURITY_HEADERS = [
  // Nobody may frame the app (clickjacking); X-Frame-Options covers older browsers.
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // The app uses none of these device APIs.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

/**
 * The service worker must never be served stale (it controls every page), and may only run
 * same-origin code. Listed after the global rule so its CSP wins for /sw.js.
 */
export const SERVICE_WORKER_HEADERS = [
  { key: "Content-Type", value: "application/javascript; charset=utf-8" },
  { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
  { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: SECURITY_HEADERS },
      { source: "/sw.js", headers: SERVICE_WORKER_HEADERS },
    ];
  },
};

export default nextConfig;
