import { defineConfig } from "oxlint";

import { jsxFiles, playwrightTestFiles } from "../internal/file-types.ts";

export const oxlintPluginJsxA11yConfig = defineConfig({
  overrides: [
    {
      files: [jsxFiles],
      excludeFiles: [...playwrightTestFiles],
      plugins: ["jsx-a11y"],
      rules: {},
    },
  ],
});
