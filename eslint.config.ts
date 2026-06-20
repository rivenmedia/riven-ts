import { baseEslintConfig } from "@repo/core-util-eslint-config";
import { createTypescriptEslintConfig } from "@repo/core-util-eslint-config/typescript";

import { defineConfig } from "eslint/config";

export default defineConfig(
  baseEslintConfig,
  createTypescriptEslintConfig(import.meta.dirname),
  {
    // Ignore all files except for root-level repository files (e.g. tooling configs)
    ignores: ["**/**", "!turbo/**/*.ts", "!*.ts"],
  },
);
