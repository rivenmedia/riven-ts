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
        "typescript/strict-void-return": ["allow", { allowReturnAny: true }],
        "react/rules-of-hooks": "allow", // Allow hooks in anonymous render functions
        "react/no-array-index-key": "allow",
      },
    },
  ],
});
