import {
  type ConfigArray,
  baseEslintConfig,
} from "@repo/core-util-eslint-config";

import svelte from "eslint-plugin-svelte";

export default [
  ...baseEslintConfig,
  // Scope svelte rules to .svelte files only; otherwise the parserServices
  // are missing on non-svelte files and the plugin throws.
  ...svelte.configs["flat/recommended"].map((c) => ({
    ...c,
    files: ["**/*.svelte"],
  })),
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    ignores: [
      ".svelte-kit/**",
      "build/**",
      "node_modules/**",
      "src/lib/graphql/__generated__/**",
      "**/*.typegen.ts",
    ],
  },
] satisfies ConfigArray;
