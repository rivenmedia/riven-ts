import { defineConfig } from "oxlint";

import { jsxFiles } from "../internal/file-types.ts";

export const oxlintPluginReactConfig = defineConfig({
  overrides: [
    {
      files: [jsxFiles],
      plugins: ["react"],
      rules: {
        "react/react-in-jsx-scope": "off", // Not needed with React 17+
        "react/jsx-filename-extension": ["error", { extensions: [".tsx"] }],

        // Rules that will be enabled in the future, but are currently disabled to avoid noise
        "react/button-has-type": "off",
        "react/forbid-component-props": "off",
        "react/jsx-curly-brace-presence": "off",
        "react/jsx-max-depth": "off",
        "react/jsx-no-literals": "off",
        "react/jsx-pascal-case": "off",
        "react/no-danger": "off",
        "react/no-multi-comp": "off",
        "react/only-export-components": "off",
      },
    },
  ],
});
