import { configDefaults, defineConfig, mergeConfig } from "vitest/config";

export const baseVitestConfig = mergeConfig(
  configDefaults,
  defineConfig({
    test: {},
  }),
);
