import json from "@eslint/json";
import { defineConfig } from "oxlint";

import { jsonFiles } from "../../internal/file-types.ts";

export const eslintPluginEslintJsonConfig = defineConfig({
  overrides: [
    {
      files: [jsonFiles],
      jsPlugins: [
        {
          name: "json",
          specifier: import.meta.resolve("@eslint/json"),
        },
      ],
      rules: json.configs.recommended.rules,
    },
  ],
});
