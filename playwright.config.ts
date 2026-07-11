import { existsSync } from "node:fs";

import { defineConfig, devices } from "@playwright/test";

const authFile = "playwright/.auth/user.json";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  retries: 0,
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
        storageState: existsSync(authFile) ? authFile : undefined,
      },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: "npm run dev -- --port 3000",
    url: "http://localhost:3000",
    reuseExistingServer: true,
  },
});
