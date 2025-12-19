import { configDefaults, defineConfig, mergeConfig } from "vitest/config";
import swc from "unplugin-swc";

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
    plugins: [swc.vite()],
  }),
);
