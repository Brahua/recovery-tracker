// Rules behind `npm run design:check`: outside src/design-system/styles/tokens/, styles must use
// design tokens instead of literal colors, easing curves or font stacks.

const RULES = [
  { id: "hex-color", pattern: /#[0-9a-fA-F]{3,8}\b(?![^{}]*\{)/g, hint: "use a color token (var(--rr-…))" },
  {
    id: "literal-color-function",
    pattern: /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(\s*(?!var\()[^)]*\)/g,
    hint: "use a color token, or rgb(var(--rr-…-rgb) / alpha) for transparency",
  },
  { id: "cubic-bezier", pattern: /\bcubic-bezier\(/g, hint: "use an easing token (var(--rr-ease-…))" },
  {
    id: "font-family",
    pattern: /font-family\s*:\s*(?!\s*var\(--rr-font-[\w-]+\)\s*[;}])[^;}]*/g,
    hint: "use a font token (var(--rr-font-…))",
  },
];

/** Literal values that should be tokens, with 1-based line numbers. Comments are ignored. */
export function findViolations(css) {
  // Blank out comments but keep their line breaks so line numbers stay right.
  const code = css.replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, " "));
  const violations = [];
  for (const rule of RULES) {
    for (const match of code.matchAll(rule.pattern)) {
      const line = code.slice(0, match.index).split("\n").length;
      violations.push({ rule: rule.id, line, text: match[0].trim(), hint: rule.hint });
    }
  }
  return violations.sort((a, b) => a.line - b.line);
}

/** Files under the styles folder that must follow the rules (everything except tokens/). */
export function isCheckedFile(relativePath) {
  return relativePath.endsWith(".css") && !/(^|\/)tokens\//.test(relativePath);
}
