import { baseOxlintConfig } from "@repo/core-util-oxlint-config";

import { defineConfig } from "oxlint";

export default defineConfig({
  extends: [baseOxlintConfig],
  overrides: [
    {
      files: ["components/_ui/**/*.tsx"],
      plugins: ["react", "typescript"],
      rules: {
        "typescript/promise-function-async": "allow",
      },
    },
    {
      files: [".storybook/main.ts", ".storybook/preview.tsx"],
      plugins: ["import"],
      rules: {
        "import/no-default-export": "off",
      },
    },
  ],
});
