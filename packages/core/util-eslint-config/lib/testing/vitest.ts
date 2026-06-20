import vitest from "@vitest/eslint-plugin";
import { defineConfig } from "eslint/config";

import { testFiles } from "../internal/file-types.ts";

export const vitestConfig = defineConfig({
  name: "riven:apply-vitest-config",
  files: [...testFiles],
  plugins: {
    vitest,
  },
  rules: {
    ...vitest.configs.recommended.rules,
    "vitest/no-standalone-expect": "off", // https://github.com/vitest-dev/eslint-plugin-vitest/issues/686
    "no-empty-pattern": "off", // Allow empty destructuring in test files for vitest context extension
    "@typescript-eslint/no-unsafe-return": "off",
    "@typescript-eslint/no-unsafe-assignment": "off",
  },
  settings: {
    vitest: {
      typecheck: true,
      vitestImports: [/test-context.ts$/],
    },
  },
  languageOptions: {
    globals: vitest.environments.env.globals,
  },
});
