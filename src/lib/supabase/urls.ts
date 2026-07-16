import { headers } from "next/headers";

function stripTrailingSlash(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function isLoopbackHostname(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

export function selectRequestOrigin(
  configuredSiteUrl: string | undefined,
  requestOrigin: string | null,
) {
  if (configuredSiteUrl && requestOrigin) {
    const configuredUrl = new URL(configuredSiteUrl);
    const requestUrl = new URL(requestOrigin);

    if (
      isLoopbackHostname(configuredUrl.hostname) &&
      isLoopbackHostname(requestUrl.hostname)
    ) {
      return stripTrailingSlash(requestUrl.origin);
    }
  }

  return configuredSiteUrl ? stripTrailingSlash(configuredSiteUrl) : null;
}

export async function getRequestOrigin() {
  const headerStore = await headers();
  const forwardedHost = headerStore.get("x-forwarded-host");
  const host = forwardedHost ?? headerStore.get("host");

  if (!host) {
    return (
      selectRequestOrigin(process.env.NEXT_PUBLIC_SITE_URL, null) ??
      "http://localhost:3000"
    );
  }

  const protocol =
    headerStore.get("x-forwarded-proto") ??
    (isLoopbackHostname(host.split(":")[0]) ? "http" : "https");

  const requestOrigin =
    headerStore.get("origin") ?? `${protocol}://${host}`;

  return (
    selectRequestOrigin(process.env.NEXT_PUBLIC_SITE_URL, requestOrigin) ??
    requestOrigin
  );
}

export async function buildAuthCallbackUrl(nextPath: string) {
  const next = nextPath.startsWith("/") ? nextPath : "/";
  return `${await getRequestOrigin()}/auth/callback?next=${encodeURIComponent(next)}`;
}
