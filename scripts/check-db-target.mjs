// Runs before every `supabase db push` npm script: refuses to write to a linked hosted project
// (production) unless ALLOW_PROD_DB=1. `supabase:push:dry` stays unguarded because it only reads.
import { existsSync, readFileSync } from "node:fs";

import { remoteWriteRefusal } from "./db-target.mjs";

const refFile = "supabase/.temp/project-ref";
const linkedRef = existsSync(refFile) ? readFileSync(refFile, "utf8").trim() : null;
const refusal = remoteWriteRefusal(linkedRef, process.env);

if (refusal) {
  console.error(refusal);
  process.exit(1);
}

console.log(`Target Supabase project: ${linkedRef} (ALLOW_PROD_DB=1)`);
