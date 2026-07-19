import { defineConfig } from "oxlint";

import { jsFiles, tsFiles } from "../internal/file-types.ts";

export const oxlintPluginEslintConfig = defineConfig({
  overrides: [
    {
      files: [tsFiles, jsFiles],
      rules: {
        eqeqeq: ["error", "smart"],
        "id-length": [
          "warn",
          {
            exceptions: ["z"],
          },
        ],
        "sort-imports": "off",
        "sort-keys": "off",
        "no-inline-comments": "off",
      },
    },
  ],
});
