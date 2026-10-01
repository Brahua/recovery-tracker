// `npm run design:check`: fails when a stylesheet outside src/design-system/styles/tokens/ uses a
// literal color, easing curve or font stack instead of a design token.
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { findViolations, isCheckedFile } from "./check-tokens-lib.mjs";

const STYLES = "src/design-system/styles";

const files = readdirSync(STYLES, { recursive: true })
  .map((file) => file.split(path.sep).join("/"))
  .filter(isCheckedFile)
  .sort();

let count = 0;
for (const file of files) {
  for (const v of findViolations(readFileSync(path.join(STYLES, file), "utf8"))) {
    count += 1;
    console.error(`${STYLES}/${file}:${v.line}  ${v.rule}  ${v.text}  → ${v.hint}`);
  }
}

if (count > 0) {
  console.error(`\n${count} literal value(s) outside tokens/. Add or reuse a token in ${STYLES}/tokens/.`);
  process.exit(1);
}
console.log(`design:check OK (${files.length} files).`);
