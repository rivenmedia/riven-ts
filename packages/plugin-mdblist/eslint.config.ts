import {
  baseEslintConfig,
  type ConfigArray,
} from "@repo/core-util-eslint-config";

export default [
  ...baseEslintConfig,
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
        allowDefaultProject: ["kubb.config.ts", "types/*.d.ts"],
      },
    },
  },
] satisfies ConfigArray;
