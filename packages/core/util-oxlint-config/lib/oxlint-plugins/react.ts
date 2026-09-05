import { defineConfig } from "oxlint";

import { jsxFiles, playwrightTestFiles } from "../internal/file-types.ts";

export const oxlintPluginReactConfig = defineConfig({
  overrides: [
    {
      files: [jsxFiles],
      excludeFiles: [...playwrightTestFiles],
      plugins: ["react"],
      rules: {
        "react/react-in-jsx-scope": "off", // Not needed with React 17+
        "react/jsx-filename-extension": ["error", { extensions: [".tsx"] }],
        "react/jsx-pascal-case": ["deny", { allowAllCaps: true }],
        "react/jsx-props-no-spreading": "allow", // ShadCN mimics native HTML elements and allows props such as aria-*

        // Rules that will be enabled in the future, but are currently disabled to avoid noise
        "react/forbid-component-props": "off",
        "react/jsx-max-depth": "off",
        "react/jsx-no-literals": "off",
        "react/no-multi-comp": "off",
        "react/only-export-components": "off",
      },
    },
  ],
});
