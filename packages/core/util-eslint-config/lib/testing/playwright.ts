import playwright from "eslint-plugin-playwright";
import { defineConfig } from "eslint/config";

import { playwrightTestFiles } from "../internal/file-types.ts";

export const playwrightConfig = defineConfig([
  {
    files: [...playwrightTestFiles],
    extends: [playwright.configs["flat/recommended"]],
    rules: {
      "no-empty-pattern": "off", // Allow empty destructuring in test files for context extension
    },
  },
]);
