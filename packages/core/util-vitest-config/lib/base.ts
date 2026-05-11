import path from "node:path";
import { loadEnvFile } from "node:process";
import { fileURLToPath } from "node:url";
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
          enabled: true,
          exclude: ["**/__generated__/**", "**/__tests__/**"],
        },
        setupFiles: [
          fileURLToPath(
            import.meta.resolve("./setup-files/restore-environment.ts"),
          ),
        ],
        retry: process.env["CI"] ? 2 : 0,
      },
      plugins: [swc.vite()],
    }),
  );
});
