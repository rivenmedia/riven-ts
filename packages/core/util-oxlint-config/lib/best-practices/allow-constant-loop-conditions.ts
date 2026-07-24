import { defineConfig } from "oxlint";

import { jsFiles, tsFiles } from "../internal/file-types.ts";

export const allowConstantLoopConditions = defineConfig({
  overrides: [
    {
      files: [tsFiles, jsFiles],
      plugins: ["typescript"],
      rules: {
        "typescript/no-unnecessary-condition": [
          "error",
          { allowConstantLoopConditions: "only-allowed-literals" },
        ],
      },
    },
  ],
});
