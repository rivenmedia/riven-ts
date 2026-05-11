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
  {
    // Ignore all files except for root-level repository files (e.g. tooling configs)
    ignores: ["**/**", "!turbo/**/*.ts", "!*.ts"],
  },
] satisfies ConfigArray;
