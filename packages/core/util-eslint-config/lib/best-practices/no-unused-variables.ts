import type { ConfigArray } from "typescript-eslint";

export const noUnusedVariables = [
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
    },
  },
] satisfies ConfigArray;
