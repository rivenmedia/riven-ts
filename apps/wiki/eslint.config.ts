import {
  type ConfigArray,
  baseEslintConfig,
} from "@repo/core-util-eslint-config";

export default [
  ...baseEslintConfig,
  {
    ignores: [".source/", "scripts/"],
  },
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
] satisfies ConfigArray;
