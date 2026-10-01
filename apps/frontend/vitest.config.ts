import { baseVitestConfig } from "@repo/core-util-vitest-config/base";

import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import storycap from "@storycap-testrun/browser/vitest-plugin";
import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import path from "node:path";
import { configDefaults, defineConfig, mergeConfig } from "vitest/config";

import type { Viewport } from "next";
import type { ViteUserConfig } from "vitest/config";

export default defineConfig((config) => {
  const baseConfig = baseVitestConfig(config);

  const viewportConfig = {
    height: 720,
    width: 1280,
  } as const satisfies Viewport;

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
            storycap({
              viewport: viewportConfig,
              output: {
                dir: path.join(import.meta.dirname, "__screenshots__"),
                file: path.join("[file]", "[id].png"),
              },
            }),
          ],
          test: {
            name: "storybook",
            browser: {
              enabled: true,
              provider: playwright({
                contextOptions: {
                  reducedMotion: "reduce",
                  viewport: viewportConfig,
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
