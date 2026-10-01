// Pure helpers behind compare-css.mjs: normalize compiled CSS and resolve design tokens,
// so a refactor can prove it leaves the compiled stylesheet unchanged.

/** Drops comments and formatting so only the CSS content is compared. */
export function normalizeCss(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    // Only around separators whose spacing never changes meaning. Not ":", "(" or ")":
    // in selectors ".a :hover" and ".a:hover" are different rules.
    .replace(/\s*([{};,>])\s*/g, "$1")
    .replace(/;}/g, "}")
    .trim();
}

/** Collects `--name: value` declarations from the stylesheet (last one wins, like the cascade on :root). */
export function collectCustomProperties(css) {
  const props = new Map();
  for (const match of css.matchAll(/(--[\w-]+)\s*:\s*([^;{}]+)(?:;|(?=}))/g)) {
    props.set(match[1], match[2].trim());
  }
  return props;
}

/** Replaces var(--x) and var(--x, fallback) with their values, recursively. Unknown vars stay as they are. */
export function resolveVars(value, props, depth = 0) {
  if (depth > 20) return value;
  let changed = false;
  const out = value.replace(/var\(\s*(--[\w-]+)\s*(?:,([^()]*(?:\([^()]*\)[^()]*)*))?\)/g, (whole, name, fallback) => {
    if (props.has(name)) {
      changed = true;
      return props.get(name);
    }
    if (fallback !== undefined) {
      changed = true;
      return fallback.trim();
    }
    return whole;
  });
  return changed ? resolveVars(out, props, depth + 1) : out;
}

const round = (n) => Number(Number(n).toFixed(4));

/** Writes every color as rgba(r,g,b,a) so `#fff`, `rgb(255 255 255 / 1)` and `rgba(255, 255, 255, 1)` compare equal. */
export function canonicalizeColors(css) {
  const hex = (h) => {
    let s = h.slice(1).toLowerCase();
    if (s.length === 3 || s.length === 4) s = [...s].map((c) => c + c).join("");
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16));
    const a = s.length === 8 ? round(parseInt(s.slice(6, 8), 16) / 255) : 1;
    return `rgba(${r},${g},${b},${a})`;
  };
  return css
    .replace(/#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b/g, hex)
    .replace(/rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)\s*(?:[,/]\s*([\d.]+%?))?\s*\)/g, (_, r, g, b, a) => {
      const alpha = a === undefined ? 1 : a.endsWith("%") ? round(parseFloat(a) / 100) : round(a);
      return `rgba(${round(r)},${round(g)},${round(b)},${alpha})`;
    });
}

/**
 * Normalized CSS with every design token resolved to its final value and the token definitions removed,
 * so moving a literal into a token (or a token between files) does not count as a change.
 */
export function resolvedCss(css, { tokenPrefixes = ["--rr-", "--font-"] } = {}) {
  const props = collectCustomProperties(css);
  const isToken = (name) => tokenPrefixes.some((prefix) => name.startsWith(prefix));
  const withoutDefs = css.replace(/(--[\w-]+)\s*:\s*[^;{}]+(?:;|(?=}))/g, (decl, name) => (isToken(name) ? "" : decl));
  const tokenProps = new Map([...props].filter(([name]) => isToken(name)));
  const resolved = withoutDefs.replace(/var\([^;{}]*\)/g, (expr) => resolveVars(expr, tokenProps));
  // Empty rules left behind (e.g. a :root that only held tokens) are not content.
  return canonicalizeColors(normalizeCss(resolved)).replace(/[^{}]*\{\}/g, "");
}

/** Position and surrounding text of the first difference, or null when equal. */
export function firstDifference(a, b, context = 120) {
  if (a === b) return null;
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i += 1;
  return { index: i, before: a.slice(Math.max(0, i - context), i + context), after: b.slice(Math.max(0, i - context), i + context) };
}
