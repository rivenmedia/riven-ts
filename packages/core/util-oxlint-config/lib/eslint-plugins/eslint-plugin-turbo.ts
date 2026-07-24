import turbo from "eslint-plugin-turbo";
import { defineConfig } from "oxlint";

import { jsFiles, tsFiles } from "../internal/file-types.ts";

import type { DummyRule } from "oxlint";

// oxlint-disable-next-line typescript/no-unsafe-type-assertion
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
