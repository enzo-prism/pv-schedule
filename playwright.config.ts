import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  timeout: 120000,
  expect: {
    timeout: 10000,
  },
  use: {
    baseURL: "http://localhost:5001",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5001",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: {
      PORT: "5001",
      USE_IN_MEMORY_STORAGE: "true",
      USE_SAMPLE_DATA: "false",
      USE_PRODUCTION_DATA: "false",
      SEED_DEMO_DATA: "false",
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  workers: 1,
});
