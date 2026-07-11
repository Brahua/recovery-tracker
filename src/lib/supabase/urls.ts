import { headers } from "next/headers";

function stripTrailingSlash(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export async function getRequestOrigin() {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return stripTrailingSlash(process.env.NEXT_PUBLIC_SITE_URL);
  }

  const headerStore = await headers();
  const forwardedHost = headerStore.get("x-forwarded-host");
  const host = forwardedHost ?? headerStore.get("host");

  if (!host) {
    return "http://localhost:3000";
  }

  const protocol =
    headerStore.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");

  return `${protocol}://${host}`;
}

export async function buildAuthCallbackUrl(nextPath: string) {
  const next = nextPath.startsWith("/") ? nextPath : "/";
  return `${await getRequestOrigin()}/auth/callback?next=${encodeURIComponent(next)}`;
}
