import { baseOxlintConfig } from "@repo/core-util-oxlint-config";

import { defineConfig } from "oxlint";

export default defineConfig({
  extends: [baseOxlintConfig],
  overrides: [
    {
      files: ["graphql-codegen.ts"],
      plugins: ["import"],
      rules: {
        "import/no-default-export": "off",
        "no-template-curly-in-string": "off",
      },
    },
  ],
});
