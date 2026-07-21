import globals from "globals";
import { defineConfig } from "oxlint";

import { jsFiles, testFiles, tsFiles } from "../internal/file-types.ts";

export const oxlintPluginTypescriptConfig = defineConfig({
  overrides: [
    {
      files: [tsFiles, jsFiles],
      plugins: ["typescript"],
      rules: {
        "typescript/ban-types": "off",
        "typescript/prefer-optional-chain": "deny",
        "typescript/no-extraneous-class": [
          "deny",
          { allowWithDecorator: true },
        ],

        // Rules that will be enabled in the future, but are currently disabled to avoid noise
        "typescript/explicit-function-return-type": "off",
        "typescript/explicit-module-boundary-types": "off",
        "typescript/method-signature-style": "off",
        "typescript/no-empty-interface": "off",
        "typescript/strict-boolean-expressions": "off",

        // Type-aware rules that are disabled for now, but will be enabled in the future
        "typescript/consistent-type-exports": "off",
        "typescript/consistent-return": "off",
        "typescript/no-unsafe-type-assertion": "off",
        "typescript/prefer-readonly-parameter-types": "off",
        "typescript/require-array-sort-compare": "off",
      },
      env: {
        ...globals.node,
        ...globals.es2024,
      },
    },
    {
      files: [...testFiles],
      plugins: ["typescript"],
      rules: {
        "typescript/no-unsafe-argument": "allow", // Allow the use of helpers such as expect.objectContaining() which return `any`
        "typescript/strict-void-return": [
          "deny",
          {
            allowReturnAny: true, // Allow mocks to return `any` in test files
          },
        ],
      },
    },
  ],
});
