import { describe, expect, it } from "vitest";

import {
  canonicalizeColors,
  collectCustomProperties,
  firstDifference,
  normalizeCss,
  resolveVars,
  resolvedCss,
} from "./css-compare-lib.mjs";

describe("normalizeCss", () => {
  it("ignores comments, line breaks and spacing", () => {
    const a = "/* a */\nh1,\nh2 {\n  color: red;\n  transition: a 1s,\n    b 2s;\n}";
    const b = "h1, h2 { color: red; transition: a 1s, b 2s }";
    expect(normalizeCss(a)).toBe(normalizeCss(b));
  });

  it("keeps real differences", () => {
    expect(normalizeCss(".a{color:red}")).not.toBe(normalizeCss(".a{color:blue}"));
    expect(normalizeCss(".a{margin:1px 2px}")).not.toBe(normalizeCss(".a{margin:1px2px}"));
    expect(normalizeCss(".a :hover{color:red}")).not.toBe(normalizeCss(".a:hover{color:red}"));
  });
});

describe("token resolution", () => {
  it("resolves nested vars and fallbacks", () => {
    const props = collectCustomProperties(":root{--a:#fff;--b:var(--a);}");
    expect(resolveVars("var(--b)", props)).toBe("#fff");
    expect(resolveVars("var(--missing, 3px)", props)).toBe("3px");
    expect(resolveVars("var(--missing)", props)).toBe("var(--missing)");
  });

  it("writes every color form the same way", () => {
    expect(canonicalizeColors("#fff")).toBe("rgba(255,255,255,1)");
    expect(canonicalizeColors("rgb(244 239 231 / 0.08)")).toBe("rgba(244,239,231,0.08)");
    expect(canonicalizeColors("rgba(244, 239, 231, 0.08)")).toBe("rgba(244,239,231,0.08)");
    expect(canonicalizeColors("rgb(46 125 91 / 22%)")).toBe("rgba(46,125,91,0.22)");
  });

  it("treats moving a literal into a token as no change", () => {
    const before =
      ":root{--rr-ink:#f4efe7}.a{border:1px solid rgba(244, 239, 231, 0.08);color:#e5a087}";
    const after =
      ":root{--rr-ink:#f4efe7;--rr-ink-rgb:244 239 231;--rr-pain-soft:#e5a087}" +
      ".a{border:1px solid rgb(var(--rr-ink-rgb) / 0.08);color:var(--rr-pain-soft)}";
    expect(resolvedCss(after)).toBe(resolvedCss(before));
  });

  it("detects a changed value behind a token", () => {
    const before = ".a{color:#e5a087}";
    const after = ":root{--rr-pain-soft:#e5a088}.a{color:var(--rr-pain-soft)}";
    expect(resolvedCss(after)).not.toBe(resolvedCss(before));
  });

  it("leaves non-design variables alone", () => {
    expect(resolvedCss(":root{--tw-x:1}.a{width:var(--tw-x)}")).toContain("var(--tw-x)");
  });
});

describe("firstDifference", () => {
  it("is null for equal strings and points at the first mismatch otherwise", () => {
    expect(firstDifference("abc", "abc")).toBeNull();
    expect(firstDifference("abc", "abd")?.index).toBe(2);
  });
});
