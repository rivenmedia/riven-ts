// import storybook from "eslint-plugin-storybook";
import { defineConfig } from "oxlint";

import { storybookFiles } from "../internal/file-types.ts";

export const eslintPluginEslintPluginStorybookConfig = defineConfig({
  overrides: [
    {
      files: [storybookFiles],
      plugins: ["react"],
      jsPlugins: [
        {
          name: "storybook",
          specifier: import.meta.resolve("eslint-plugin-storybook"),
        },
      ],
      rules: {
        "react/jsx-props-no-spreading": "allow",
        "typescript/strict-void-return": ["allow", { allowReturnAny: true }],
      },
      // rules: storybook.configs["flat/recommended"][0]?.rules,
    },
  ],
});
