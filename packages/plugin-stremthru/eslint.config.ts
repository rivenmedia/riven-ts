import {
  type ConfigArray,
  baseEslintConfig,
} from "@repo/core-util-eslint-config";

export default [
  ...baseEslintConfig,
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
] satisfies ConfigArray;
