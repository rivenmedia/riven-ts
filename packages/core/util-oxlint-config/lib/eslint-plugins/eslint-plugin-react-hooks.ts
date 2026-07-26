import reactHooks from "eslint-plugin-react-hooks";
import { defineConfig } from "oxlint";

import { jsxFiles, playwrightTestFiles } from "../internal/file-types.ts";

export const eslintPluginEslintPluginReactHooksConfig = defineConfig({
  overrides: [
    {
      files: [jsxFiles],
      excludeFiles: [...playwrightTestFiles],
      jsPlugins: [
        {
          name: "react-hooks",
          specifier: import.meta.resolve("eslint-plugin-react-hooks"),
        },
      ],
      rules: reactHooks.configs?.["flat/recommended"]?.rules ?? {},
    },
  ],
});
