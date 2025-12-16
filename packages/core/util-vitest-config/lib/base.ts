import { configDefaults, defineConfig, mergeConfig } from "vitest/config";

export const baseVitestConfig = mergeConfig(
  { test: configDefaults },
  defineConfig({
    test: {
      coverage: {
        exclude: ["**/__generated__/**"],
      },
      typecheck: {
        enabled: false,
      },
    },
  }),
);
