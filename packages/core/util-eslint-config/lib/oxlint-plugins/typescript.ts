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
      },
      env: {
        ...globals.node,
        ...globals.es2024,
      },
    },
  ],
});
