import { baseVitestConfig } from "@repo/core-util-vitest-config/base";

import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import path from "node:path";
import { storybookVis } from "storybook-addon-vis/vitest-plugin";
import { configDefaults, defineConfig, mergeConfig } from "vitest/config";

import type { Plugin, ViteUserConfig } from "vitest/config";
import type { BrowserCommand } from "vitest/node";

/**
 * Resizes the browser page that hosts the test iframe.
 *
 * Vitest scales the iframe down when it's larger than the page, so the page must grow along with it for full page snapshots.
 */
const setBrowserViewport: BrowserCommand<
  [width: number, height: number]
> = async ({ page }, width, height) => {
  await page.setViewportSize({ width, height });
};

export default defineConfig((config) => {
  const baseConfig = baseVitestConfig(config);

  return mergeConfig<typeof baseConfig, ViteUserConfig>(baseConfig, {
    plugins: [react()],
    resolve: {
      tsconfigPaths: true,
    },
    test: {
      coverage: {
        exclude: [".next/**", "playwright/**", "playwright-report/**"],
      },
      projects: [
        {
          extends: true,
          plugins: [
            storybookTest({
              configDir: path.join(import.meta.dirname, ".storybook"),
              storybookScript: "pnpm storybook --ci",
            }),
            storybookVis({
              diffOptions: {
                threshold: 0.1,
              },
              failureThresholdType: "percent",
              failureThreshold: 1,
            }) as Plugin,
          ],
          test: {
            name: "storybook",
            browser: {
              enabled: true,
              commands: { setBrowserViewport },
              provider: playwright({
                contextOptions: {
                  reducedMotion: "reduce",
                  deviceScaleFactor: 1,
                  locale: "en-GB",
                  timezoneId: "UTC",
                  // Matches Storybook's default story viewport, so the test iframe isn't scaled down to fit
                  viewport: {
                    width: 1200,
                    height: 900,
                  },
                },
              }),
              headless: true,
              instances: [{ browser: "chromium" }],
            },
            setupFiles: ["./.storybook/vitest.setup.ts"],
            testTimeout: 30_000,
          },
        },
        {
          test: {
            name: "unit",
            environment: "jsdom",
            exclude: [
              ...configDefaults.exclude,
              // Exclude Playwright test files
              "tests/**",
            ],
            setupFiles: ["./vitest.setup.ts"],
          },
        },
      ],
    },
  });
});
