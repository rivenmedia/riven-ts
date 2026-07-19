import turbo from "eslint-plugin-turbo";
import { defineConfig, type DummyRule } from "oxlint";

import { jsFiles, tsFiles } from "../internal/file-types.ts";

const turboRecommendedConfig = turbo.configs?.["flat/recommended"] as {
  rules: Record<string, DummyRule>;
};

export const eslintPluginEslintConfigTurboConfig = defineConfig({
  overrides: [
    {
      files: [tsFiles, jsFiles],
      jsPlugins: [
        {
          name: "turbo",
          specifier: import.meta.resolve("eslint-plugin-turbo"),
        },
      ],
      rules: turboRecommendedConfig.rules,
    },
  ],
});
