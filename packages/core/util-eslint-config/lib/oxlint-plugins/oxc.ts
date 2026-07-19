import { defineConfig } from "oxlint";

import { jsFiles, tsFiles } from "../internal/file-types.ts";

export const oxlintPluginOxcConfig = defineConfig({
  overrides: [
    {
      files: [tsFiles, jsFiles],
      plugins: ["oxc"],
      rules: {
        "oxc/no-rest-spread-properties": "off",
        "oxc/no-optional-chaining": "off",
        "oxc/no-async-await": "off",
      },
    },
  ],
});
