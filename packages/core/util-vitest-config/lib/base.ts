import path from "node:path";
import { loadEnvFile } from "node:process";
import { fileURLToPath } from "node:url";
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

  const isWatch = process.argv.includes("--watch");

  return mergeConfig(
    { test: configDefaults },
    defineConfig({
      test: {
        restoreMocks: true,
        coverage: {
          enabled: !isWatch,
          exclude: ["**/__generated__/**", "**/__tests__/**"],
        },
        setupFiles: [
          fileURLToPath(
            import.meta.resolve("./setup-files/restore-environment.ts"),
          ),
        ],
        retry: process.env["CI"] ? 2 : 0,
        hookTimeout: 30_000,
      },
      plugins: [swc.vite() as unknown as Plugin],
    }),
  );
});
