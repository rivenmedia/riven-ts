import { fileURLToPath } from "node:url";
import swc from "unplugin-swc";
import { configDefaults, defineConfig, mergeConfig } from "vitest/config";

export const baseVitestConfig = defineConfig(() => {
  const isWatch = process.argv.includes("--watch");
  const ignorePatterns = ["**/{__generated__,docker-data,.next,.turbo}/**"];

  return mergeConfig(
    { test: configDefaults },
    defineConfig({
      test: {
        exclude: ignorePatterns,
        restoreMocks: true,
        coverage: {
          enabled: !isWatch,
          exclude: [...ignorePatterns, "**/__tests__/**"],
        },
        setupFiles: [
          fileURLToPath(
            import.meta.resolve("./setup-files/restore-environment.ts"),
          ),
        ],
        retry: process.env["CI"] ? 2 : 0,
        hookTimeout: 30_000,
      },
      plugins: [swc.vite()],
      server: {
        watch: {
          ignored: ignorePatterns,
        },
      },
    }),
  );
});
