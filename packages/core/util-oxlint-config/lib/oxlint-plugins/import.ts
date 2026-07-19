import { defineConfig } from "oxlint";

import { configFiles, jsFiles, tsFiles } from "../internal/file-types.ts";

export const oxlintPluginImportConfig = defineConfig({
  overrides: [
    {
      files: [tsFiles, jsFiles],
      plugins: ["import"],
      rules: {
        "import/prefer-default-export": "off",
        "import/no-named-export": "off",
        "import/max-dependencies": "off",
        "import/no-relative-parent-imports": "off",
        "import/group-exports": "off",
        "import/no-nodejs-modules": "off",
        "import/no-cycle": ["error", { maxDepth: 3 }],

        // Rules that will be enabled in the future, but are currently disabled to avoid noise
        "import/no-mutable-exports": "off",
        "import/exports-last": "off",
        "import/no-namespace": "off",
        "import/no-unassigned-import": "off",
        "import/no-anonymous-default-export": "off",
        "import/no-default-export": "off",
      },
    },
    {
      files: [configFiles],
      plugins: ["import"],
      rules: {
        "import/no-default-export": "off", // Config files tend to require default exports
      },
    },
  ],
});
