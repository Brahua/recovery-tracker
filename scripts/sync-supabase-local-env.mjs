import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

function parseEnvBlock(text) {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const pairs = new Map();

  for (const line of lines) {
    const equalIndex = line.indexOf("=");

    if (equalIndex === -1) {
      continue;
    }

    const key = line.slice(0, equalIndex).trim();
    const value = line.slice(equalIndex + 1).trim();
    pairs.set(key, value);
  }

  return pairs;
}

const statusOutput = execFileSync(
  "npx",
  ["supabase", "status", "--output", "env"],
  {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  },
);

const envPairs = parseEnvBlock(statusOutput);
const supabaseUrl = envPairs.get("API_URL");
const publishableKey = envPairs.get("ANON_KEY");

if (!supabaseUrl || !publishableKey) {
  throw new Error(
    "Could not extract API_URL and ANON_KEY from `supabase status --output env`.",
  );
}

const envContents = [
  `NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}`,
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${publishableKey}`,
  "NEXT_PUBLIC_SITE_URL=http://localhost:3000",
  "",
].join("\n");

writeFileSync(join(process.cwd(), ".env.local"), envContents, "utf8");

process.stdout.write("Wrote .env.local from local Supabase status.\n");
