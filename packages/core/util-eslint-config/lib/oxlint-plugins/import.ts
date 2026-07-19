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
        "import/consistent-type-specifier-style": "off",
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
