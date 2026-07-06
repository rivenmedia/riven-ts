import { baseVitestConfig } from "@repo/core-util-vitest-config/base";

import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import path from "node:path";
import { type ViteUserConfig, defineConfig, mergeConfig } from "vitest/config";

export default defineConfig((config) => {
  const baseConfig = baseVitestConfig(config);

  return mergeConfig<typeof baseConfig, ViteUserConfig>(baseConfig, {
    plugins: [react()],
    resolve: {
      tsconfigPaths: true,
    },
    test: {
      projects: [
        {
          extends: true,
          plugins: [
            storybookTest({
              configDir: path.join(import.meta.dirname, ".storybook"),
              storybookScript: "pnpm storybook --no-open",
            }),
          ],
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
        {
          test: {
            name: "unit",
            environment: "jsdom",
            exclude: [
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
