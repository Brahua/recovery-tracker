// Appearance chosen in Ajustes → Apariencia: theme and accent color. The account
// (user_metadata.preferences) is the source of truth; a cookie mirrors it so an inline script in
// the root layout can set <html data-theme data-accent> before the first paint
// (node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md).

export const themes = ["dark", "light", "system"] as const;
export const accents = ["green", "terracotta", "amber"] as const;

export type Theme = (typeof themes)[number];
export type Accent = (typeof accents)[number];

export interface Appearance {
  theme: Theme;
  accent: Accent;
}

export const defaultAppearance: Appearance = { theme: "dark", accent: "green" };

export const APPEARANCE_COOKIE = "rr-appearance";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

/** Browser bar / status bar color per resolved theme; dark matches manifest.ts. */
export const themeColors = { dark: "#0e0c0a", light: "#f4efe7" } as const;

/** Names for the accent picker; swatch colors are --rr-swatch-* tokens (Claude Design, "Estilo → accentColor"). */
export const accentOptions: Record<Accent, { label: string }> = {
  green: { label: "Verde" },
  terracotta: { label: "Terracota" },
  amber: { label: "Ámbar" },
};

export const themeOptions: Record<Theme, { label: string }> = {
  dark: { label: "Oscuro" },
  light: { label: "Claro" },
  system: { label: "Sistema" },
};

function isTheme(value: unknown): value is Theme {
  return themes.includes(value as Theme);
}

function isAccent(value: unknown): value is Accent {
  return accents.includes(value as Accent);
}

/** Reads user_metadata.preferences; anything unknown falls back to the default. */
export function appearanceFromMetadata(metadata?: Record<string, unknown> | null): Appearance {
  const preferences = (metadata?.preferences ?? {}) as Record<string, unknown>;
  return {
    theme: isTheme(preferences.theme) ? preferences.theme : defaultAppearance.theme,
    accent: isAccent(preferences.accent) ? preferences.accent : defaultAppearance.accent,
  };
}

export function serializeAppearanceCookie({ theme, accent }: Appearance) {
  return `${theme}.${accent}`;
}

export function parseAppearanceCookie(value: string | null | undefined): Appearance {
  const [theme, accent] = (value ?? "").split(".");
  return {
    theme: isTheme(theme) ? theme : defaultAppearance.theme,
    accent: isAccent(accent) ? accent : defaultAppearance.accent,
  };
}

export function appearanceCookieString(appearance: Appearance, secure: boolean) {
  return [
    `${APPEARANCE_COOKIE}=${serializeAppearanceCookie(appearance)}`,
    "Path=/",
    `Max-Age=${COOKIE_MAX_AGE_SECONDS}`,
    "SameSite=Lax",
    ...(secure ? ["Secure"] : []),
  ].join("; ");
}

export function sameAppearance(a: Appearance, b: Appearance) {
  return a.theme === b.theme && a.accent === b.accent;
}

// Runs in <head> before the first paint. Kept tiny and dependency-free: it only accepts the known
// values, so a tampered cookie cannot inject anything into the attributes.
export const appearanceInlineScript = `(function(){try{var m=document.cookie.match(/(?:^|; )${APPEARANCE_COOKIE}=([a-z]+)\\.([a-z]+)/);if(!m)return;var d=document.documentElement;if(${JSON.stringify(themes)}.indexOf(m[1])>-1)d.setAttribute("data-theme",m[1]);if(${JSON.stringify(accents)}.indexOf(m[2])>-1)d.setAttribute("data-accent",m[2]);}catch(e){}})()`;
