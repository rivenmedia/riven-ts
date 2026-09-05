import { defineConfig } from "oxlint";

import { jsFiles, tsFiles } from "../internal/file-types.ts";

export const oxlintPluginNextJSConfig = defineConfig({
  plugins: ["nextjs"],
  overrides: [
    {
      files: [tsFiles, jsFiles],
      plugins: ["nextjs"],
    },
    {
      files: [
        "app/**/{page,layout,loading,error,skeleton,global-error,not-found}.tsx",
      ],
      plugins: ["typescript", "import"],
      rules: {
        "typescript/require-await": "allow",
        "import/no-default-export": "allow",
        "import/prefer-default-export": "deny",
      },
    },
  ],
});
