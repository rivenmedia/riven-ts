// import storybook from "eslint-plugin-storybook";
import { defineConfig } from "oxlint";

import { jsxFiles } from "../internal/file-types.ts";

export const eslintPluginEslintPluginStorybookConfig = defineConfig({
  overrides: [
    {
      files: [jsxFiles],
      jsPlugins: [
        {
          name: "storybook",
          specifier: import.meta.resolve("eslint-plugin-storybook"),
        },
      ],
      // rules: storybook.configs["flat/recommended"][0]?.rules,
    },
  ],
});
