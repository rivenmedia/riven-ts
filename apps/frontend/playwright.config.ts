import { defineConfig, devices } from "@playwright/test";
import z from "zod";

const isCI = z.stringbool().default(false).parse(process.env["CI"]);
const baseURL = "https://localhost:9000";

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "tests",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  ...(isCI && { workers: 1 }),
  reporter: "html",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          args: ["--ignore-certificate-errors"],
        },
      },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: baseURL,
    gracefulShutdown: {
      signal: "SIGTERM",
      timeout: 5000,
    },
    reuseExistingServer: !isCI,
    stdout: "pipe",
    stderr: "pipe",
    wait: {
      stdout: new RegExp(`Local:[ \\t]+${baseURL}`, "i"),
    },
  },
});
