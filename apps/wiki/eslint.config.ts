import {
  type ConfigArray,
  baseEslintConfig,
} from "@repo/core-util-eslint-config";
import { nextJsEslintConfig } from "@repo/core-util-eslint-config/nextjs";

import { globalIgnores } from "eslint/config";

export default [
  ...baseEslintConfig,
  ...nextJsEslintConfig,
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  globalIgnores([".source/", "scripts/"]),
] satisfies ConfigArray;
