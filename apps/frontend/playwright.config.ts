import { defineConfig, devices } from "@playwright/test";
import z from "zod";

import type { Project } from "@playwright/test";

const environment = z
  .object({
    CI: z.stringbool().default(false),
    /**
     * Run the tests against `next dev`, rather than a production build.
     */
    E2E_DEV_SERVER: z.stringbool().default(false),
  })
  .parse(process.env);

const isCI = environment.CI;
const isDevServer = environment.E2E_DEV_SERVER && !isCI;

// Both servers use plain HTTP. `next start` doesn't support HTTPS, and `next dev --experimental-https` intermittently
// drops WebSocket connections. That includes the HMR socket Next.js sends React's debug info for server renders over,
// so pages get stuck mid-render. Each server has its own port, so it doesn't clash with a regular dev server.
const devServerPort = 9101;
const productionServerPort = 9100;

const baseURL = `http://localhost:${String(isDevServer ? devServerPort : productionServerPort)}`;

const productionServerCommand = isCI
  ? // CI builds the app beforehand, via the `e2e:headless` task's dependencies
    `pnpm start --port ${String(productionServerPort)}`
  : `pnpm turbo run build --filter=@repo/frontend --output-logs=errors-only && pnpm start --port ${String(productionServerPort)}`;

const chromium: Project = {
  name: "chromium",
  use: {
    ...devices["Desktop Chrome"],
    // Use the full browser in new headless mode, rather than the separate headless shell
    channel: "chromium",
  },
};

const firefox: Project = {
  name: "firefox",
  use: devices["Desktop Firefox"],
};

const webkit: Project = {
  name: "webkit",
  use: devices["Desktop Safari"],
};

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "tests",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  ...(isCI && { workers: 1 }),
  reporter: isCI ? [["github"], ["html", { open: "never" }]] : "html",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  // CI only installs Chromium. Run every browser locally with `pnpm e2e:headless`.
  projects: isCI ? [chromium] : [chromium, firefox, webkit],
  webServer: {
    command: isDevServer
      ? `pnpm exec next dev --port ${String(devServerPort)}`
      : productionServerCommand,
    // Wait for the port rather than requesting a page, which outside of a test would reach for the real backend
    port: isDevServer ? devServerPort : productionServerPort,
    env: {
      ENABLE_TEST_PROXY: "true",
      // The tests mock the network themselves, and the development mocks would intercept Next.js' requests to the test proxy
      ENABLE_MOCKS: "false",
      ORIGIN: baseURL,
    },
    // Allow time to build the app locally
    timeout: isDevServer || isCI ? 60_000 : 300_000,
    gracefulShutdown: {
      signal: "SIGTERM",
      timeout: 5000,
    },
    reuseExistingServer: !isCI,
    stdout: "pipe",
    stderr: "pipe",
    // Requesting a page would hang on the session check, as there's no backend outside of tests
    wait: {
      stdout: /Ready in/u,
    },
  },
});
