import playwright from "eslint-plugin-playwright";
import { defineConfig } from "oxlint";

import { jsFiles, tsFiles } from "../internal/file-types.ts";

export const eslintPluginEslintPluginPlaywrightConfig = defineConfig({
  overrides: [
    {
      files: [tsFiles, jsFiles],
      jsPlugins: [
        {
          name: "playwright",
          specifier: import.meta.resolve("eslint-plugin-playwright"),
        },
      ],
      rules: playwright.configs?.["flat/recommended"]?.rules ?? {},
    },
  ],
});
