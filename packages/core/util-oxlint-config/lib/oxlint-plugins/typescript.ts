import globals from "globals";
import { defineConfig } from "oxlint";

import { jsFiles, tsFiles } from "../internal/file-types.ts";

export const oxlintPluginTypescriptConfig = defineConfig({
  overrides: [
    {
      files: [tsFiles, jsFiles],
      plugins: ["typescript"],
      rules: {
        "typescript/ban-types": "off",

        // Rules that will be enabled in the future, but are currently disabled to avoid noise
        "typescript/explicit-function-return-type": "off",
        "typescript/explicit-member-accessibility": [
          "error",
          { accessibility: "no-public" },
        ],
        "typescript/explicit-module-boundary-types": "off",
        "typescript/consistent-type-imports": "off",
        "typescript/method-signature-style": "off",
        "typescript/no-import-type-side-effects": "off",
        "typescript/no-empty-interface": "off",
        "typescript/strict-boolean-expressions": "off",

        // Type-aware rules that are disabled for now, but will be enabled in the future
        "typescript/prefer-readonly-parameter-types": "off",
        "typescript/strict-void-return": "off",
        "typescript/promise-function-async": "off",
        "typescript/no-unsafe-type-assertion": "off",
        "typescript/prefer-readonly": "off",
        "typescript/return-await": "off",
        "typescript/consistent-return": "off",
        "typescript/switch-exhaustiveness-check": "off",
        "typescript/require-array-sort-compare": "off",
        "typescript/consistent-type-exports": "off",
        "typescript/no-extraneous-class": "off",
        "typescript/require-await": "off",
      },
      env: {
        ...globals.node,
        ...globals.es2024,
      },
    },
  ],
});
