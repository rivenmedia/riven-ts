import svelte from "eslint-plugin-svelte";
import { defineConfig } from "eslint/config";
import globals from "globals";

import { svelteFiles } from "../internal/file-types.ts";

export const svelteCore = defineConfig(
  {
    name: "riven:apply-svelte-recommended-config",
    files: [svelteFiles],
    extends: svelte.configs.recommended,
  },
  {
    name: "riven:apply-svelte-language-config",
    files: [svelteFiles],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
  },
  {
    name: "riven:apply-svelte-prettier-config",
    files: [svelteFiles],
    extends: svelte.configs.prettier,
  },
  {
    name: "riven:disable-conflicting-typescript-eslint-rules",
    files: ["**/*.svelte"],
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-confusing-void-expression": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/restrict-template-expressions": "off",
      "@typescript-eslint/no-useless-default-assignment": "off",
    },
  },
);
