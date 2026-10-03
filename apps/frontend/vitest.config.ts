import { baseVitestConfig } from "@repo/core-util-vitest-config/base";

import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import path from "node:path";
import { storybookVis } from "storybook-addon-vis/vitest-plugin";
import { configDefaults, defineConfig, mergeConfig } from "vitest/config";

import { browserWsEndpoint, snapshotRootDir } from "./.storybook/vis-paths.ts";

import type { PluginOption } from "vite";
import type { ViteUserConfig } from "vitest/config";

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
            // `storybookVis` is typed as returning `any`
            storybookVis({
              // A string would have a CI/platform subdirectory appended - the directory is chosen by the browser instead
              snapshotRootDir: () => snapshotRootDir,
              diffOptions: {
                // Ignores minor rendering noise from blurs, gradients and image decoding
                threshold: 0.1,
              },
              failureThresholdType: "pixel",
              failureThreshold: 50,
            }) as PluginOption,
          ],
          test: {
            name: "storybook",
            browser: {
              enabled: true,
              provider: playwright({
                ...(browserWsEndpoint && {
                  connectOptions: {
                    wsEndpoint: browserWsEndpoint,
                    // Routes the containerised browser's requests for localhost back to the Vite server on the host
                    exposeNetwork: "<loopback>",
                  },
                }),
                contextOptions: {
                  reducedMotion: "reduce",
                  // Pin environment-dependent rendering so host settings don't leak into snapshots
                  deviceScaleFactor: 1,
                  locale: "en-GB",
                  timezoneId: "UTC",
                },
              }),
              headless: true,
              instances: [{ browser: "chromium" }],
            },
            setupFiles: ["./.storybook/vitest.setup.ts"],
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
