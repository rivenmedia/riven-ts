import { defineConfig } from "oxlint";

import { jsFiles, tsFiles } from "../internal/file-types.ts";

export const noUnusedVariables = defineConfig({
  overrides: [
    {
      files: [tsFiles, jsFiles],
      plugins: ["eslint"],
      rules: {
        "no-unused-vars": [
          "error",
          {
            argsIgnorePattern: "^_",
            ignoreRestSiblings: true,
          },
        ],
      },
    },
  ],
});
