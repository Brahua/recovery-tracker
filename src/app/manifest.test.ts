import { existsSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import manifest, { APP_BACKGROUND } from "./manifest";

describe("web app manifest", () => {
  const value = manifest();

  it("opens the app standalone from the home screen", () => {
    expect(value).toMatchObject({ start_url: "/", scope: "/", display: "standalone", lang: "es" });
    expect(value.name).toBe("Recovery Tracker");
    expect(value.short_name?.length).toBeLessThanOrEqual(12);
  });

  it("uses the dark theme background", () => {
    expect(value.background_color).toBe(APP_BACKGROUND);
    expect(value.theme_color).toBe(APP_BACKGROUND);
  });

  it("ships 192, 512 and maskable icons that exist in public/", () => {
    const icons = value.icons ?? [];
    expect(icons.map((icon) => `${icon.sizes}:${icon.purpose}`)).toEqual([
      "192x192:any",
      "512x512:any",
      "512x512:maskable",
    ]);
    for (const icon of icons) {
      expect(existsSync(path.join("public", icon.src))).toBe(true);
    }
  });
});
