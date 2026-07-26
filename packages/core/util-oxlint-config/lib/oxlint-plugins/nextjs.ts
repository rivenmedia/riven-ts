import { defineConfig } from "oxlint";

import { jsFiles, jsxFiles, tsFiles } from "../internal/file-types.ts";

export const oxlintPluginNextJSConfig = defineConfig({
  plugins: ["nextjs"],
  overrides: [
    {
      files: [tsFiles, jsFiles, jsxFiles],
      plugins: ["nextjs"],
    },
    {
      files: ["app/**/{page,layout,loading,error,skeleton}.tsx"],
      rules: {
        "typescript/require-await": "allow",
      },
    },
  ],
});
