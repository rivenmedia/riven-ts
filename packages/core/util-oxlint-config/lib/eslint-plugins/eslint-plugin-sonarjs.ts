import sonarjs from "eslint-plugin-sonarjs";
import { defineConfig } from "oxlint";

import { tsFiles, jsFiles } from "../internal/file-types.ts";

import type { DummyRuleMap } from "oxlint";

export const eslintPluginEslintPluginSonarjsConfig = defineConfig({
  overrides: [
    {
      files: [tsFiles, jsFiles],
      jsPlugins: [
        {
          name: "sonarjs",
          specifier: import.meta.resolve("eslint-plugin-sonarjs"),
        },
      ],
      rules: sonarjs.configs.recommended.rules as DummyRuleMap,
    },
  ],
});
