import { baseVitestConfig } from "@repo/core-util-vitest-config/base";

import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import storycap from "@storycap-testrun/browser/vitest-plugin";
import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import path from "node:path";
import { configDefaults, defineConfig, mergeConfig } from "vitest/config";

import type {
  TestProjectInlineConfiguration,
  ViteUserConfig,
} from "vitest/config";

const createStorybookPlugin = () =>
  storybookTest({
    configDir: path.join(import.meta.dirname, ".storybook"),
    storybookScript: "pnpm storybook --no-open",
  });

const screenshotViewport = { width: 1280, height: 720 };

// Captures a screenshot of every story for visual regression testing.
// Screenshots are compared against `main` in CI by reg-actions.
const visualTestProject = {
  extends: true,
  plugins: [
    createStorybookPlugin(),
    storycap({
      viewport: screenshotViewport,
      output: {
        dir: path.join(import.meta.dirname, "__screenshots__"),
      },
    }),
  ],
  test: {
    name: "visual",
    setupFiles: ["./.storybook/vitest.visual.setup.ts"],
    browser: {
      enabled: true,
      provider: playwright({
        contextOptions: {
          reducedMotion: "reduce", // Helps prevent animations from causing screenshot diffs
          viewport: screenshotViewport,
        },
      }),
      headless: true,
      instances: [{ browser: "chromium" }],
    },
  },
} satisfies TestProjectInlineConfiguration;

// Only register the visual project when explicitly requested, so it doesn't run
// alongside the component tests in watch mode or the Storybook UI.
const isVisualTestRun = process.env["VISUAL_TESTS"] === "true";

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
          plugins: [createStorybookPlugin()],
          test: {
            name: "storybook",
            browser: {
              enabled: true,
              provider: playwright(),
              headless: true,
              instances: [{ browser: "chromium" }],
            },
          },
        },
        ...(isVisualTestRun ? [visualTestProject] : []),
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
