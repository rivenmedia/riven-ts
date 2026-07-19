import globals from "globals";
import { defineConfig } from "oxlint";

import { jsFiles, tsFiles } from "../internal/file-types.ts";

export const oxlintPluginTypescriptConfig = defineConfig({
  overrides: [
    {
      files: [tsFiles, jsFiles],
      plugins: ["typescript"],
      rules: {
        "typescript/prefer-readonly-parameter-types": "off", // Creates a lot of noise
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
      },
      env: {
        ...globals.node,
        ...globals.es2024,
      },
    },
  ],
});
