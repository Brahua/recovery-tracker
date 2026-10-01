import { loadEnvConfig } from "@next/env";
import { defineConfig, devices } from "@playwright/test";

import { e2eTargetRefusal } from "./scripts/db-target.mjs";

const authFile = "playwright/.auth/user.json";

// E2E creates anonymous users and writes data, so it must never reach the production
// Supabase project. Load the same env files the app server will read (process env wins)
// and refuse to start unless Supabase is the local CLI stack.
loadEnvConfig(process.cwd(), true);
const e2eRefusal = e2eTargetRefusal(process.env.NEXT_PUBLIC_SUPABASE_URL);
if (e2eRefusal) {
  throw new Error(e2eRefusal);
}

// A server we did not start may point anywhere (another app, or production), so reusing one
// is opt-in. E2E_PORT avoids clashing with a dev server already on 3000.
const port = Number(process.env.E2E_PORT ?? 3000);
const baseURL = `http://localhost:${port}`;
const reuseExistingServer = process.env.E2E_REUSE_SERVER === "1";

// In CI we run against a production build (`next build` runs as a prior step,
// then `next start` here). `next dev` compiles routes on-demand on first hit,
// which widens the pre-hydration window enough that early interactions (e.g.
// the pain sliders) land on the DOM before React attaches its handlers, leaving
// form state null and the save button disabled. A prebuilt server hydrates
// fast and deterministically. Locally we keep `next dev` for fast iteration.
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  retries: isCI ? 1 : 0,
  use: {
    baseURL,
    trace: "retain-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: authFile,
      },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: isCI
      ? `npm run start -- --port ${port}`
      : `npm run dev -- --port ${port}`,
    url: baseURL,
    reuseExistingServer,
    timeout: 120_000,
  },
});
