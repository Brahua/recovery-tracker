import { appearanceCookieString, themeColors, type Appearance } from "@/lib/appearance";

// Applies an appearance right away in the browser: <html> attributes, the cookie the inline
// script reads on the next load, and the browser bar color.
export function applyAppearance(appearance: Appearance) {
  const root = document.documentElement;
  root.setAttribute("data-theme", appearance.theme);
  root.setAttribute("data-accent", appearance.accent);
  document.cookie = appearanceCookieString(appearance, window.location.protocol === "https:");

  for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
    // "Sistema" keeps each tag's own media query (light or dark); a fixed theme overrides both.
    const forLight = meta.media.includes("light");
    const theme = appearance.theme === "system" ? (forLight ? "light" : "dark") : appearance.theme;
    meta.content = themeColors[theme];
  }
}
