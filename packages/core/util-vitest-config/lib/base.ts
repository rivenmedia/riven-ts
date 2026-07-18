import path from "node:path";
import { loadEnvFile } from "node:process";
import { fileURLToPath } from "node:url";
import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

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

  return defineConfig({
    test: {
      globals: true, // Enables testing-library auto cleanup
      restoreMocks: true,
      coverage: {
        enabled: !isWatch,
        include: ["**/*.?(c|m)[jt]s?(x)"],
        exclude: [
          "**/__{tests,generated}__/**",
          "*/*.{config,setup}.?(c|m)[jt]s?(x)",
          "graphql-codegen.ts",
          "*.typegen.ts",
          "*.d.ts",
        ],
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
  });
});
