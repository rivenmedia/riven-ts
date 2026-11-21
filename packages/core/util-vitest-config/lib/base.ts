import { fileURLToPath } from "node:url";
import swc from "unplugin-swc";
import { configDefaults, defineConfig, mergeConfig } from "vitest/config";

export const testCodePatterns = [
  "**/{__tests__,__mocks__,mocks,playwright,tests}/**",
  "**/*.{spec,test}.{ts,tsx}",
  "**/*.stories.{ts,tsx}",
  "**/vitest.setup.ts",
  "**/setup-files/**",
];

export const baseVitestConfig = defineConfig(() => {
  const isWatch = process.argv.includes("--watch");
  const ignorePatterns = ["**/{__generated__,docker-data,.next,.turbo}/**"];

  return mergeConfig(
    { test: configDefaults },
    defineConfig({
      test: {
        globals: true, // Enables testing-library auto cleanup
        exclude: ignorePatterns,
        restoreMocks: true,
        coverage: {
          enabled: !isWatch,
          exclude: [...ignorePatterns, ...testCodePatterns],
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
