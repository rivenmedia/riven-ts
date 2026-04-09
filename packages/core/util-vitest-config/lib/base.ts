import path from "node:path";
import { loadEnvFile } from "node:process";
import swc from "unplugin-swc";
import { configDefaults, defineConfig, mergeConfig } from "vitest/config";

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
        restoreMocks: true,
        coverage: {
          exclude: ["**/__generated__/**", "**/__tests__/**"],
        },
        setupFiles: [
          path.resolve(
            import.meta.dirname,
            "./setup-files/restore-environment.ts",
          ),
        ],
        retry: process.env["CI"] ? 2 : 0,
      },
      plugins: [swc.vite()],
    }),
  );
});
