import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const colors = readFileSync(path.resolve("src/design-system/styles/tokens/colors.css"), "utf8");

// Body of every rule whose selector starts with `prefix`, keyed by the rest of the selector.
function rulesFor(prefix: string) {
  const rules = new Map<string, string>();
  for (const match of colors.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = match[1].trim().split("\n").pop()!.trim();
    if (selector.startsWith(prefix)) {
      rules.set(selector.slice(prefix.length), match[2].replace(/\s+/g, " ").trim());
    }
  }
  return rules;
}

describe("light theme tokens", () => {
  it('keeps "Claro" and "Sistema" (in light mode) identical', () => {
    const light = rulesFor(':root[data-theme="light"]');
    const system = rulesFor(':root[data-theme="system"]');
    expect([...light.keys()].sort()).toEqual([
      "",
      '[data-accent="amber"]',
      '[data-accent="terracotta"]',
    ]);
    expect(system).toEqual(light);
  });

  it("redefines every accent text token for each accent on paper", () => {
    const light = rulesFor(':root[data-theme="light"]');
    for (const variant of ["", '[data-accent="amber"]', '[data-accent="terracotta"]']) {
      for (const token of ["--rr-accent-light", "--rr-accent-on-tint", "--rr-accent-text"]) {
        expect(light.get(variant)).toContain(`${token}:`);
      }
    }
  });
});
