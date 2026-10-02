import { describe, expect, it } from "vitest";

import { APP_BACKGROUND } from "@/app/manifest";
import {
  appearanceCookieString,
  appearanceFromMetadata,
  appearanceInlineScript,
  defaultAppearance,
  parseAppearanceCookie,
  sameAppearance,
  serializeAppearanceCookie,
  themeColors,
} from "@/lib/appearance";
import { appearanceSchema } from "@/lib/validation/appearance";

describe("appearance", () => {
  it("defaults to the dark theme and the green accent", () => {
    expect(defaultAppearance).toEqual({ theme: "dark", accent: "green" });
    expect(appearanceFromMetadata(null)).toEqual(defaultAppearance);
    expect(appearanceFromMetadata({ display_name: "Ana" })).toEqual(defaultAppearance);
  });

  it("reads the saved preferences and ignores unknown values", () => {
    expect(appearanceFromMetadata({ preferences: { theme: "light", accent: "amber" } })).toEqual({
      theme: "light",
      accent: "amber",
    });
    expect(appearanceFromMetadata({ preferences: { theme: "neon", accent: "pink" } })).toEqual(
      defaultAppearance,
    );
  });

  it("round-trips through the cookie and rejects tampered values", () => {
    const appearance = { theme: "system", accent: "terracotta" } as const;
    expect(serializeAppearanceCookie(appearance)).toBe("system.terracotta");
    expect(parseAppearanceCookie("system.terracotta")).toEqual(appearance);
    expect(parseAppearanceCookie('light."><script>')).toEqual({ theme: "light", accent: "green" });
    expect(parseAppearanceCookie(undefined)).toEqual(defaultAppearance);
  });

  it("writes a long-lived, same-site cookie, secure on https", () => {
    const cookie = appearanceCookieString({ theme: "dark", accent: "amber" }, true);
    expect(cookie).toContain("rr-appearance=dark.amber");
    expect(cookie).toContain("Path=/");
    expect(cookie).toContain("SameSite=Lax");
    expect(cookie).toContain("Secure");
    expect(appearanceCookieString(defaultAppearance, false)).not.toContain("Secure");
  });

  it("only lets the inline script set known themes and accents", () => {
    expect(appearanceInlineScript).toContain('["dark","light","system"]');
    expect(appearanceInlineScript).toContain('["green","terracotta","amber"]');
    expect(appearanceInlineScript).toContain("rr-appearance=");
  });

  it("keeps the dark theme color in sync with the manifest", () => {
    expect(themeColors.dark).toBe(APP_BACKGROUND);
  });

  it("compares appearances by value", () => {
    expect(sameAppearance(defaultAppearance, { theme: "dark", accent: "green" })).toBe(true);
    expect(sameAppearance(defaultAppearance, { theme: "dark", accent: "amber" })).toBe(false);
  });

  it("validates what the settings action receives", () => {
    expect(appearanceSchema.safeParse({ theme: "light", accent: "green" }).success).toBe(true);
    expect(appearanceSchema.safeParse({ theme: "light" }).success).toBe(false);
    expect(appearanceSchema.safeParse({ theme: "sepia", accent: "green" }).success).toBe(false);
  });
});
