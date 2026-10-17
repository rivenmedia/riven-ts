import { baseOxlintConfig } from "@repo/core-util-oxlint-config";

import { defineConfig } from "oxlint";

export default defineConfig({
  extends: [baseOxlintConfig],
  ignorePatterns: ["lib/components/_ui"],
  overrides: [
    {
      files: ["lib/components/_ui/**/*.tsx"],
      plugins: ["react", "typescript"],
      rules: {
        "typescript/promise-function-async": "allow",
      },
    },
    {
      files: ["*.tsx"],
      plugins: ["react"],
      rules: {
        "react/no-unknown-property": ["deny", { ignore: ["jsx", "global"] }], // Allow jsx/global attributes https://nextjs.org/blog/styling-next-with-styled-jsx
      },
    },
  ],
});
