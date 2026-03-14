import { baseVitestConfig } from "@repo/core-util-vitest-config/base";

import { defineConfig, mergeConfig } from "vitest/config";

export default defineConfig((env) =>
  mergeConfig(
    baseVitestConfig(env),
    defineConfig({
      test: {
        globalSetup: ["vitest.global-setup.ts"],
        setupFiles: ["vitest.setup.ts"],
      },
    }),
  ),
);
