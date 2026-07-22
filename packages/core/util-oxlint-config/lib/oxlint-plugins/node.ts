import { defineConfig } from "oxlint";

import { jsFiles, testFiles, tsFiles } from "../internal/file-types.ts";

export const oxlintPluginNodeConfig = defineConfig({
  overrides: [
    {
      files: [tsFiles, jsFiles],
      plugins: ["node"],
      rules: {
        "node/no-process-env": "allow",
      },
    },
    {
      files: [...testFiles],
      plugins: ["node"],
      rules: {
        "node/no-sync": "off", // Allow synchronous operations in test files
      },
    },
  ],
});
