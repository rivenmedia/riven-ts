import {
  configDefaults,
  defineConfig,
  mergeConfig,
  type Plugin,
} from "vitest/config";
import swc from "unplugin-swc";

export const baseVitestConfig = mergeConfig(
  { test: configDefaults },
  defineConfig({
    test: {
      coverage: {
        exclude: ["**/__generated__/**"],
      },
    },
    plugins: [swc.vite() as Plugin],
  }),
);
