import { baseVitestConfig } from "@repo/core-util-vitest-config/base";

import { defineConfig, mergeConfig } from "vitest/config";

export default defineConfig((env) =>
  mergeConfig(
    baseVitestConfig(env),
    defineConfig({
      test: {
        setupFiles: ["vitest.setup.ts"],
      },
    }),
  ),
);
