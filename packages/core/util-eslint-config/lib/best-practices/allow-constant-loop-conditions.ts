import { defineConfig } from "eslint/config";

import { jsFiles, svelteFiles, tsFiles } from "../internal/file-types.ts";

export const allowConstantLoopConditions = defineConfig({
  name: "riven:allow-constant-loop-conditions",
  files: [tsFiles, jsFiles, svelteFiles],
  rules: {
    "@typescript-eslint/no-unnecessary-condition": [
      "error",
      {
        allowConstantLoopConditions: "only-allowed-literals",
      },
    ],
  },
});
