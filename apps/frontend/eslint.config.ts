import {
  type ConfigArray,
  baseEslintConfig,
} from "@repo/core-util-eslint-config";
import { nextJsEslintConfig } from "@repo/core-util-eslint-config/nextjs";
import { storybookEslintConfig } from "@repo/core-util-eslint-config/storybook";

import { globalIgnores } from "eslint/config";

export default [
  ...baseEslintConfig,
  ...nextJsEslintConfig,
  ...storybookEslintConfig,
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
    },
  }, // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
] satisfies ConfigArray;
