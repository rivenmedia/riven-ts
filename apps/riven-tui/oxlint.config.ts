import { baseOxlintConfig } from "@repo/core-util-oxlint-config";

import { defineConfig } from "oxlint";

export default defineConfig({
  extends: [baseOxlintConfig],
  overrides: [
    {
      files: ["graphql.config.ts"],
      plugins: ["import"],
      rules: {
        "no-template-curly-in-string": "off",
      },
    },
  ],
});
