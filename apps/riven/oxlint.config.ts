import { baseOxlintConfig } from "@repo/core-util-oxlint-config";

import { defineConfig } from "oxlint";

export default defineConfig({
  extends: [baseOxlintConfig],
  overrides: [
    {
      files: ["**/sandboxed-jobs/**/*.processor.ts", "graphql-codegen.ts"],
      plugins: ["import"],
      rules: {
        "import/no-default-export": "off",
      },
    },
    {
      files: ["graphql-codegen.ts"],
      rules: {
        "no-template-curly-in-string": "off",
      },
    },
  ],
});
