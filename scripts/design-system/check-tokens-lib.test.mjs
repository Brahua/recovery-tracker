import { describe, expect, it } from "vitest";

import { findViolations, isCheckedFile } from "./check-tokens-lib.mjs";

const rules = (css) => findViolations(css).map((v) => v.rule);

describe("findViolations", () => {
  it("accepts styles that only use tokens", () => {
    const css = `.a {
      color: var(--rr-pain-soft);
      border: 1px solid rgb(var(--rr-ink-rgb) / 0.08);
      transition: transform 200ms var(--rr-ease-out);
      font-family: var(--rr-font-display);
    }`;
    expect(findViolations(css)).toEqual([]);
  });

  it("flags literal hex colors with their line", () => {
    expect(findViolations(".a {\n  color: #fff;\n}")).toEqual([
      expect.objectContaining({ rule: "hex-color", line: 2, text: "#fff" }),
    ]);
  });

  it("flags literal color functions but not channel tokens", () => {
    expect(rules(".a{background:rgba(244, 239, 231, 0.08)}")).toEqual(["literal-color-function"]);
    expect(rules(".a{color:rgb(255 255 255)}")).toEqual(["literal-color-function"]);
    expect(rules(".a{color:oklch(70% 0.1 150)}")).toEqual(["literal-color-function"]);
    expect(rules(".a{color:rgb(var(--rr-white-rgb) / 0.5)}")).toEqual([]);
  });

  it("flags easing curves and font stacks", () => {
    expect(rules(".a{transition:all 1s cubic-bezier(0.2, 0.8, 0.2, 1)}")).toEqual(["cubic-bezier"]);
    expect(rules(".a{font-family:var(--font-archivo), sans-serif}")).toEqual(["font-family"]);
    expect(rules(".a{font-family: Georgia}")).toEqual(["font-family"]);
  });

  it("ignores comments and ids in selectors", () => {
    expect(findViolations("/* was #e5a087 and rgba(0, 0, 0, 1) */ .a{color:var(--rr-ink)}")).toEqual([]);
    expect(findViolations("#main .a{color:var(--rr-ink)}")).toEqual([]);
  });
});

describe("isCheckedFile", () => {
  it("checks every stylesheet except tokens", () => {
    expect(isCheckedFile("surfaces/history.css")).toBe(true);
    expect(isCheckedFile("base.css")).toBe(true);
    expect(isCheckedFile("tokens/colors.css")).toBe(false);
    expect(isCheckedFile("README.md")).toBe(false);
  });
});
