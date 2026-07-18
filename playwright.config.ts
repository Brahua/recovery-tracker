import { defineConfig, devices } from "@playwright/test";

const authFile = "playwright/.auth/user.json";

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
    baseURL: "http://localhost:3000",
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
      ? "npm run start -- --port 3000"
      : "npm run dev -- --port 3000",
    url: "http://localhost:3000",
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
});
