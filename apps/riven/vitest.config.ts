import { defineConfig, mergeConfig } from "vitest/config";
import { baseVitestConfig } from "@repo/core-util-vitest-config/base";

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
