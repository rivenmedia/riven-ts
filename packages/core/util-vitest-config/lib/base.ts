import path from "node:path";
import { loadEnvFile } from "node:process";
import swc from "unplugin-swc";
import {
  type Plugin,
  configDefaults,
  defineConfig,
  mergeConfig,
} from "vitest/config";

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
          exclude: ["**/__generated__/**", "**/__tests__/**"],
        },
        setupFiles: [
          path.resolve(
            import.meta.dirname,
            "./setup-files/restore-environment.ts",
          ),
        ],
      },
      plugins: [swc.vite() as Plugin],
    }),
  );
});
