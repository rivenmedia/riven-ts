import { loadEnvFile } from "node:process";
import path from "node:path";
import {
  configDefaults,
  defineConfig,
  mergeConfig,
  type Plugin,
} from "vitest/config";
import swc from "unplugin-swc";

export const baseVitestConfig = defineConfig(({ mode }) => {
  try {
    loadEnvFile(path.join(process.cwd(), ".env." + mode));
  } catch {
    /* empty */
  }

  try {
    loadEnvFile(path.join(process.cwd(), ".env"));
  } catch {
    /* empty */
  }

  return mergeConfig(
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
});
