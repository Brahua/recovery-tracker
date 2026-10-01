// Compiles src/app/globals.css with Tailwind (no `next build`) and compares it with a baseline,
// to prove a CSS refactor does not change the stylesheet.
//
//   node scripts/design-system/compare-css.mjs snapshot <out.css>
//       compile the current stylesheet and save it as a baseline (keep baselines outside the repo)
//   node scripts/design-system/compare-css.mjs compare <baseline.css> [--resolve]
//       compile again and compare: same content except comments/whitespace (default), or, with
//       --resolve, same values once every --rr-* / --font-* token is resolved (for tokenization)
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

import { firstDifference, normalizeCss, resolvedCss } from "./css-compare-lib.mjs";

const ENTRY = "src/app/globals.css";

async function compile(entry = ENTRY) {
  const require = createRequire(path.resolve("package.json"));
  const postcss = require("postcss");
  const tailwind = require("@tailwindcss/postcss");
  const from = path.resolve(entry);
  const result = await postcss([tailwind({ base: process.cwd() })]).process(readFileSync(from, "utf8"), { from });
  return result.css;
}

const [command, file, ...flags] = process.argv.slice(2);

if (command === "snapshot" && file) {
  const css = await compile();
  writeFileSync(file, css);
  console.log(`Baseline written to ${file} (${css.length} bytes).`);
} else if (command === "compare" && file) {
  const resolve = flags.includes("--resolve");
  const view = resolve ? resolvedCss : normalizeCss;
  const [base, next] = [view(readFileSync(file, "utf8")), view(await compile())];
  const diff = firstDifference(base, next);
  if (!diff) {
    console.log(`${resolve ? "IDENTICAL (tokens resolved)" : "EQUIVALENT"}: ${next.length} normalized chars.`);
  } else {
    console.error(`DIFFERENT at char ${diff.index}\n--- baseline\n${diff.before}\n--- current\n${diff.after}`);
    process.exit(1);
  }
} else {
  console.error("Usage: compare-css.mjs snapshot <out.css> | compare <baseline.css> [--resolve]");
  process.exit(2);
}
