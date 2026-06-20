import { defineConfig } from "eslint/config";

import { tsFiles } from "../internal/file-types.ts";

export const noUnusedVariables = defineConfig({
  name: "riven:no-unused-variables",
  files: [tsFiles],
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
