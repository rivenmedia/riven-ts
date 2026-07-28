import { baseOxlintConfig } from "@repo/core-util-oxlint-config";

import { defineConfig } from "oxlint";

export default defineConfig({
  extends: [baseOxlintConfig],
  overrides: [
    {
      files: ["components/ui/**/*.tsx"],
      plugins: ["react", "typescript"],
      rules: {
        "typescript/promise-function-async": "allow",
      },
    },
  ],
});
