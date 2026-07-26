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
      files: ["app/**/{page,layout,loading,error,skeleton}.tsx"],
      rules: {
        "typescript/require-await": "allow",
      },
    },
  ],
});
