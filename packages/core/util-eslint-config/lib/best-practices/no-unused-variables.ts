import { defineConfig } from "eslint/config";

import { jsFiles, svelteFiles, tsFiles } from "../internal/file-types.ts";

export const noUnusedVariables = defineConfig({
  name: "riven:no-unused-variables",
  files: [tsFiles, jsFiles, svelteFiles],
  rules: {
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        ignoreRestSiblings: true,
      },
    ],
  },
});
